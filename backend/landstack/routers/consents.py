"""Consent tokens: citizens request, admins grant (rows in `landstack.consents`)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from landstack.auth import Principal, require_admin, require_user
from landstack.db import DBLike, get_db
from landstack.services import audit

router = APIRouter(prefix="/landstack/consents", tags=["consents"])


class RequestBody(BaseModel):
    ulpin: str
    purpose: str | None = None


class GrantBody(BaseModel):
    ulpin: str
    uid: str
    hours: int = Field(24, ge=1, le=24 * 365)


@router.post("/request", status_code=202)
async def request_consent(
    body: RequestBody, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict:
    """Records the request (audit + alert-free); an admin grants it via `/consents/grant`."""
    await audit.record(
        db,
        principal,
        "consent.requested",
        "consent",
        None,
        body.ulpin,
        None,
        {"uid": principal.uid, "name": principal.name, "purpose": body.purpose},
    )
    return {"status": "requested", "ulpin": body.ulpin, "uid": principal.uid}


@router.post("/grant", status_code=201)
async def grant_consent(
    body: GrantBody, principal: Principal = Depends(require_admin), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    row = await db.fetchrow(
        """
        INSERT INTO landstack.consents (ulpin, granted_to_uid, granted_by, expires_at)
        VALUES (:ulpin, :uid, :by, now() + make_interval(hours => :hours)) RETURNING id, ulpin, granted_to_uid, expires_at
        """,
        ulpin=body.ulpin,
        uid=body.uid,
        by=principal.uid,
        hours=body.hours,
    )
    await audit.record(db, principal, "consent.granted", "consent", str((row or {}).get("id")), body.ulpin, None, row)
    return row or {"ulpin": body.ulpin, "granted_to_uid": body.uid}


@router.get("")
async def my_consents(principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)) -> dict[str, Any]:
    rows = await db.fetch(
        "SELECT id, ulpin, granted_by, expires_at FROM landstack.consents WHERE granted_to_uid = :uid "
        "AND (expires_at IS NULL OR expires_at > now()) ORDER BY expires_at DESC",
        uid=principal.uid,
    )
    return {"items": rows}
