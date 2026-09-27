"""`GET /tract/me` — who am I (role, department, consents)."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from tract.auth import Principal, require_user
from tract.config import Settings, get_settings
from tract.db import DBLike, get_db

router = APIRouter(prefix="/tract", tags=["auth"])


@router.get("/me")
async def me(
    principal: Principal = Depends(require_user),
    db: DBLike = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    try:
        rows = await db.fetch(
            "SELECT ulpin FROM tract.consents WHERE granted_to_uid = :uid AND (expires_at IS NULL OR expires_at > now())",
            uid=principal.uid,
        )
        principal.consents.update(r["ulpin"] for r in rows)
    except Exception:
        pass
    return {**principal.model_dump(), "consents": sorted(principal.consents), "auth_mode": settings.auth_mode}
