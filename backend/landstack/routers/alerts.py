"""Alerts (change detection, inconsistencies, pending mutations): list / assign / resolve."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from landstack.auth import Principal, require_officer
from landstack.db import DBLike, get_db, json_dumps
from landstack.errors import not_found
from landstack.services import aggregator, audit

router = APIRouter(prefix="/landstack/alerts", tags=["alerts"])


class AssignBody(BaseModel):
    assignee: str | None = None
    department: str | None = None
    remark: str | None = None


class ResolveBody(BaseModel):
    remark: str | None = None
    outcome: str | None = None


@router.get("")
async def list_alerts(
    status: str | None = Query(None),
    kind: str | None = None,
    ulpin: str | None = None,
    limit: int = Query(200, ge=1, le=1000),
    principal: Principal = Depends(require_officer),
    db: DBLike = Depends(get_db),
) -> dict[str, Any]:
    clauses, params = ["TRUE"], {"limit": limit}
    for col, val in (("status", status), ("kind", kind), ("ulpin", ulpin)):
        if val:
            clauses.append(f"a.{col} = :{col}")
            params[col] = val
    rows = await db.fetch(
        f"SELECT a.*, p.survey_no, p.village FROM landstack.alerts a LEFT JOIN landstack.parcels p ON p.ulpin = a.ulpin "
        f"WHERE {' AND '.join(clauses)} ORDER BY a.created_at DESC LIMIT :limit",
        **params,
    )
    return {"items": rows, "count": len(rows)}


async def _update(
    db: DBLike, alert_id: int, status: str, extra: dict[str, Any], principal: Principal, action: str
) -> dict:
    before = await db.fetchrow("SELECT * FROM landstack.alerts WHERE id = :id", id=alert_id)
    if before is None:
        raise not_found("alert", str(alert_id))
    detail = {**(before.get("detail") or {}), **extra}
    after = await db.fetchrow(
        """
        UPDATE landstack.alerts
           SET status = :status,
               detail = CAST(:detail AS jsonb),
               assigned_to_uid = CASE WHEN :status = 'assigned' THEN :uid ELSE assigned_to_uid END,
               resolved_at = CASE WHEN :status = 'resolved' THEN now() ELSE resolved_at END
         WHERE id = :id
        RETURNING *
        """,
        status=status,
        detail=json_dumps(detail),
        uid=principal.uid,
        id=alert_id,
    )
    if after is not None:
        # lift the fields the UI reads to the top level
        det = after.get("detail") or {}
        after = {**after, "assigned_to": det.get("assigned_to"), "resolved_by": det.get("resolved_by")}
    await audit.record(
        db,
        principal,
        action,
        "alert",
        str(alert_id),
        before.get("ulpin"),
        {"status": before["status"]},
        {"status": status, **extra},
    )
    if before.get("ulpin"):
        aggregator.invalidate(before["ulpin"])
    return after or before


@router.post("/{alert_id}/assign")
async def assign(
    alert_id: int, body: AssignBody, principal: Principal = Depends(require_officer), db: DBLike = Depends(get_db)
) -> dict:
    extra = {
        "assigned_to": body.assignee or principal.name,
        "assigned_department": body.department or principal.department,
        "assigned_by": principal.name,
        "assign_remark": body.remark,
    }
    return await _update(db, alert_id, "assigned", extra, principal, "alert.assigned")


@router.post("/{alert_id}/resolve")
async def resolve(
    alert_id: int, body: ResolveBody, principal: Principal = Depends(require_officer), db: DBLike = Depends(get_db)
) -> dict:
    extra = {"resolved_by": principal.name, "resolution": body.remark, "outcome": body.outcome}
    return await _update(db, alert_id, "resolved", extra, principal, "alert.resolved")
