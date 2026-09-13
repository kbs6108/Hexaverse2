"""Admin actions: simulate an upstream deed registration and reset the demo dataset."""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from landstack.adapters import client
from landstack.auth import Principal, require_admin
from landstack.config import Settings, get_settings
from landstack.db import DBLike, get_db
from landstack.errors import AppError
from landstack.services import aggregator, audit

router = APIRouter(prefix="/landstack/admin", tags=["admin"])

REPO_ROOT = next((p for p in Path(__file__).resolve().parents if (p / "tools" / "demo_reset.py").exists()), Path(__file__).resolve().parents[3])
DEMO_RESET = REPO_ROOT / "tools" / "demo_reset.py"


class SimulateDeed(BaseModel):
    ulpin: str
    claimant: str
    deed_type: str = "sale"
    executant: str | None = None
    consideration: float | None = None


@router.post("/simulate/deed", status_code=201)
async def simulate_deed(
    body: SimulateDeed, principal: Principal = Depends(require_admin), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    """Calls the registration department's `POST /registration/deeds`, which emits the deed event back to us."""
    executant = body.executant or await db.fetchval(
        "SELECT owner_name FROM dept_revenue.ror WHERE ulpin = :u LIMIT 1", u=body.ulpin
    )
    try:
        result = await client.post_json(
            "/registration/deeds",
            {
                "ulpin": body.ulpin,
                "deed_type": body.deed_type,
                "executant": executant or "Unknown",
                "claimant": body.claimant,
                "consideration": body.consideration,
            },
            headers={"X-Dev-User": "admin"},
            timeout=10.0,
        )
    except client.UpstreamError as exc:
        raise AppError(502, "upstream_error", f"registration service: {exc}") from exc
    aggregator.invalidate(body.ulpin)
    await audit.record(db, principal, "admin.simulate_deed", "parcel", body.ulpin, body.ulpin, None, result)
    return result


@router.post("/demo-reset")
async def demo_reset(
    principal: Principal = Depends(require_admin), settings: Settings = Depends(get_settings)
) -> dict[str, Any]:
    """Runs `tools/demo_reset.py` (data lane) in a subprocess with the API's DATABASE_URL."""
    if not DEMO_RESET.exists():
        raise AppError(503, "demo_reset_unavailable", f"{DEMO_RESET} not found")
    env = {**os.environ, "DATABASE_URL": settings.database_url}
    proc = await asyncio.create_subprocess_exec(
        sys.executable,
        str(DEMO_RESET),
        cwd=str(REPO_ROOT),
        env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )
    try:
        out, _ = await asyncio.wait_for(proc.communicate(), timeout=600)
    except TimeoutError as exc:
        proc.kill()
        raise AppError(504, "demo_reset_timeout", "demo reset exceeded 10 minutes") from exc
    aggregator.invalidate()
    text = out.decode(errors="replace")
    if proc.returncode != 0:
        raise AppError(
            500, "demo_reset_failed", "demo reset failed", {"exit_code": proc.returncode, "output": text[-4000:]}
        )
    return {"ok": True, "output": text[-4000:]}


@router.post("/cache/invalidate")
async def invalidate_cache(ulpin: str | None = None, principal: Principal = Depends(require_admin)) -> dict[str, Any]:
    aggregator.invalidate(ulpin)
    return {"ok": True, "cache": aggregator.cache_stats()}
