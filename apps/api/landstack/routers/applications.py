"""Applications: create / list / get / transition, the officer queue, and public notices."""

from __future__ import annotations

import datetime as dt
import json
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from landstack.adapters import client
from landstack.auth import Principal, require_officer, require_user
from landstack.db import DBLike, get_db
from landstack.errors import AppError, forbidden
from landstack.services import audit, workflow
from landstack.services.consistency import OWNER_THRESHOLD, name_score

router = APIRouter(prefix="/landstack", tags=["applications"])

# Statutory public-notice window: transfers of rights are published for objections
# while pending, up to NOTICE_DAYS from filing (mirrors the RoR objection period).
NOTICE_TYPES = ("mutation", "succession", "boundary_correction")
NOTICE_DAYS = 15


class CreateApplication(BaseModel):
    ulpin: str
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class TransitionBody(BaseModel):
    action: str
    remark: str | None = None


async def _auto_checks(db: DBLike, body: CreateApplication, principal: Principal) -> dict[str, Any]:
    """Pre-fill payload results: planning check for building permissions, instant ownership verification."""
    payload = dict(body.payload)
    if body.type == "building_permission":
        try:
            payload["planning_check"] = await client.get_json(
                "/planning/check",
                params={
                    "ulpin": body.ulpin,
                    "use": payload.get("use") or payload.get("proposed_use") or "residential",
                    "floors": payload.get("floors") or 1,
                },
            )
        except Exception as exc:
            payload["planning_check"] = {"permissible": None, "reasons": [f"planning check unavailable: {exc}"[:200]]}
    if body.type == "ownership_verification":
        claimed = payload.get("claimed_name") or principal.name
        ror_owner = await db.fetchval("SELECT owner_name FROM dept_revenue.ror WHERE ulpin = :u LIMIT 1", u=body.ulpin)
        deed = await db.fetchval(
            "SELECT claimant FROM dept_registration.deeds WHERE ulpin = :u ORDER BY registered_on DESC LIMIT 1",
            u=body.ulpin,
        )
        best = max(name_score(ror_owner, claimed), name_score(deed, claimed))
        payload["result"] = {"claimed_name": claimed, "match": best >= OWNER_THRESHOLD, "score": round(best, 1)}
    return payload


@router.post("/applications", status_code=201)
async def create(
    body: CreateApplication, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict:
    payload = await _auto_checks(db, body, principal)
    app = await workflow.create_application(db, principal, body.ulpin, body.type, payload)
    rows = await workflow.load_transitions(db)
    app["next_actions"] = workflow.next_actions(rows, app, principal)
    return app


@router.get("/applications")
async def list_applications(
    mine: int = Query(0),
    ulpin: str | None = None,
    status: str | None = None,
    type: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    principal: Principal = Depends(require_user),
    db: DBLike = Depends(get_db),
) -> dict:
    only_mine = bool(mine) or principal.role == "citizen"
    dept = principal.department if (principal.role == "officer" and not only_mine) else None
    items = await workflow.list_applications(
        db,
        applicant_uid=principal.uid if only_mine else None,
        ulpin=ulpin,
        status=status,
        department=dept,
        app_type=type,
        limit=limit,
        offset=offset,
    )
    return {"items": items, "count": len(items)}


@router.get("/applications/{app_id}")
async def get_application(
    app_id: str, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict:
    app = await workflow.get_application(db, app_id)
    if principal.role == "citizen" and app.get("applicant_uid") != principal.uid:
        raise forbidden("not your application")
    rows = await workflow.load_transitions(db)
    app["next_actions"] = workflow.next_actions(rows, app, principal)
    return app


@router.post("/applications/{app_id}/transition")
async def transition(
    app_id: str, body: TransitionBody, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict:
    """Officers drive the workflow; citizens may only `resubmit` a returned application (table-enforced)."""
    return await workflow.transition(db, app_id, body.action, principal, body.remark)


@router.get("/notices")
async def notices(
    village: str | None = None, db: DBLike = Depends(get_db)
) -> dict:
    """Village notice board (public, like the statutory board outside a tahsildar office):
    pending transfer-of-rights applications inside their objection window. No personal data —
    survey number, village, type, days left and objection count only."""
    rows = await db.fetch(
        "SELECT a.id, a.ulpin, a.type, a.status, a.created_at, a.payload, p.survey_no, p.village "
        "FROM landstack.applications a JOIN landstack.parcels p ON p.ulpin = a.ulpin "
        "WHERE a.type = ANY(:types) AND a.created_at > now() - make_interval(days => :days) "
        + ("AND p.village = :village " if village else "")
        + "ORDER BY a.created_at DESC LIMIT 100",
        **({"types": list(NOTICE_TYPES), "days": NOTICE_DAYS} | ({"village": village} if village else {})),
    )
    trows = await workflow.load_transitions(db)
    now = dt.datetime.now(dt.timezone.utc)
    items = []
    for r in rows:
        if workflow.is_terminal(trows, r["type"], r["status"]):
            continue
        created = r["created_at"]
        closes = created + dt.timedelta(days=NOTICE_DAYS)
        items.append({
            "id": r["id"],
            "ulpin": r["ulpin"],
            "type": r["type"],
            "status": r["status"],
            "survey_no": r["survey_no"],
            "village": r["village"],
            "published_on": created.isoformat(),
            "window_closes": closes.isoformat(),
            "days_left": max(0, (closes - now).days),
            "objection_count": len((r.get("payload") or {}).get("objections") or []),
        })
    return {"items": items, "count": len(items), "window_days": NOTICE_DAYS}


class ObjectionBody(BaseModel):
    reason: str = Field(min_length=10, max_length=2000)


@router.post("/applications/{app_id}/objections", status_code=201)
async def file_objection(
    app_id: str, body: ObjectionBody, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict:
    """Any signed-in person may object to a published notice while its window is open.
    Objections land in the application's payload and in front of the deciding officer."""
    app = await workflow.get_application(db, app_id)
    if app["type"] not in NOTICE_TYPES:
        raise AppError(422, "not_a_notice", f"'{app['type']}' applications are not published for objections")
    trows = await workflow.load_transitions(db)
    created = app["created_at"]
    if isinstance(created, str):
        created = dt.datetime.fromisoformat(created.replace("Z", "+00:00"))
    window_open = dt.datetime.now(dt.timezone.utc) < created + dt.timedelta(days=NOTICE_DAYS)
    if workflow.is_terminal(trows, app["type"], app["status"]) or not window_open:
        raise AppError(409, "objection_window_closed", "the objection window for this notice has closed")
    if app.get("applicant_uid") == principal.uid:
        raise AppError(422, "own_application", "you cannot object to your own application")
    payload = dict(app.get("payload") or {})
    objections = list(payload.get("objections") or [])
    objections.append({
        "ts": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "by_uid": principal.uid,
        "by_name": principal.name,
        "reason": body.reason.strip(),
    })
    payload["objections"] = objections
    await db.execute(
        "UPDATE landstack.applications SET payload = CAST(:payload AS jsonb), updated_at = now() WHERE id = :id",
        payload=json.dumps(payload),
        id=app_id,
    )
    await audit.record(
        db, principal, "application.objection", "application", app_id, app["ulpin"], None,
        {"reason": body.reason.strip()[:200], "count": len(objections)},
    )
    return {"ok": True, "objection_count": len(objections)}


@router.get("/queue")
async def queue(
    department: str | None = None, principal: Principal = Depends(require_officer), db: DBLike = Depends(get_db)
) -> dict:
    items = await workflow.list_queue(db, principal, department)
    return {"department": department or principal.department, "items": items, "count": len(items)}
