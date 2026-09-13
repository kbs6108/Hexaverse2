"""Applications: create / list / get / transition, and the officer queue."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from landstack.adapters import client
from landstack.auth import Principal, require_officer, require_user
from landstack.db import DBLike, get_db
from landstack.errors import forbidden
from landstack.services import workflow
from landstack.services.consistency import OWNER_THRESHOLD, name_score

router = APIRouter(prefix="/landstack", tags=["applications"])


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


@router.get("/queue")
async def queue(
    department: str | None = None, principal: Principal = Depends(require_officer), db: DBLike = Depends(get_db)
) -> dict:
    items = await workflow.list_queue(db, principal, department)
    return {"department": department or principal.department, "items": items, "count": len(items)}
