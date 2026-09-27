"""Integration console: connector health (`/connectors`) and adapter mappings (`/adapters`)."""

from __future__ import annotations

import asyncio
import datetime as dt
from typing import Any

from fastapi import APIRouter, Depends

from landstack.adapters.mapping import available_mappings, load_mapping, mapping_table
from landstack.adapters.registry import DEPARTMENTS, get_adapter
from landstack.auth import Principal, require_admin
from landstack.config import Settings, get_settings
from landstack.db import DBLike, get_db

router = APIRouter(prefix="/landstack", tags=["connectors"])


@router.get("/connectors")
async def connectors(
    principal: Principal = Depends(require_admin),
    db: DBLike = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    adapters = [get_adapter(d) for d in DEPARTMENTS]
    healths = await asyncio.gather(*(a.health() for a in adapters))
    items = []
    for adapter, h in zip(adapters, healths, strict=True):
        try:
            await db.execute(
                """
                INSERT INTO landstack.connector_status (name, ok, latency_ms, last_sync, note)
                VALUES (:name, :ok, :latency_ms, now(), :note)
                ON CONFLICT (name) DO UPDATE SET ok = EXCLUDED.ok, latency_ms = EXCLUDED.latency_ms,
                    last_sync = EXCLUDED.last_sync, note = EXCLUDED.note
                """,
                name=adapter.name,
                ok=h["ok"],
                latency_ms=h["latency_ms"],
                note=str(h.get("note") or "")[:200],
            )
        except Exception:
            pass
        items.append(
            {
                "name": adapter.name,
                "source": adapter.source,
                "mapping": adapter.mapping_name,
                "base_url": settings.dept_base_url or "in-process",
                "docs": f"/{adapter.name}/docs",
                "last_sync": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                **h,
            }
        )
    try:
        persisted = await db.fetch(
            "SELECT name, ok, latency_ms, last_sync, note FROM landstack.connector_status ORDER BY name"
        )
    except Exception:
        persisted = []
    return {"items": items, "persisted": persisted, "timeout_s": settings.dept_timeout_s}


@router.get("/adapters")
async def adapters(principal: Principal = Depends(require_admin)) -> dict[str, Any]:
    return {"items": [mapping_table(load_mapping(name)) for name in available_mappings()]}
