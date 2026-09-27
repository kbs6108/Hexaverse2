"""`GET /landstack/stats` — officer KPIs: counts, land-use/status breakdowns, applications, alerts."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Depends

from landstack.auth import Principal, require_officer
from landstack.db import DBLike, get_db

router = APIRouter(prefix="/landstack", tags=["stats"])


@router.get("/stats")
async def stats(principal: Principal = Depends(require_officer), db: DBLike = Depends(get_db)) -> dict[str, Any]:
    totals, land_use, status, apps, alerts, per_dept = await asyncio.gather(
        db.fetchrow(
            "SELECT (SELECT count(*) FROM landstack.parcels) AS parcels, "
            "(SELECT COALESCE(sum(area_sqm), 0) FROM landstack.parcels) AS total_area_sqm, "
            "(SELECT count(*) FROM landstack.buildings) AS buildings, (SELECT count(*) FROM landstack.units) AS units, "
            "(SELECT count(*) FROM landstack.applications) AS applications, "
            "(SELECT count(*) FROM landstack.alerts WHERE status <> 'resolved') AS open_alerts"
        ),
        db.fetch(
            "SELECT COALESCE(land_use, 'unknown') AS land_use, count(*) AS count, COALESCE(sum(area_sqm), 0) AS area_sqm "
            "FROM landstack.parcels GROUP BY 1 ORDER BY 2 DESC"
        ),
        db.fetchrow(
            "SELECT count(*) FILTER (WHERE registered) AS registered, count(*) FILTER (WHERE NOT COALESCE(registered, false)) AS unregistered, "
            "count(*) FILTER (WHERE has_dispute) AS disputed, count(*) FILTER (WHERE has_mortgage) AS mortgaged, "
            "count(*) FILTER (WHERE COALESCE(tax_arrears, 0) > 0) AS tax_arrears, "
            "count(*) FILTER (WHERE pending_mutation) AS pending_mutation, count(*) FILTER (WHERE change_alert) AS change_alert, "
            "COALESCE(sum(tax_arrears), 0) AS total_arrears FROM landstack.parcel_status"
        ),
        db.fetch("SELECT type, status, count(*) AS count FROM landstack.applications GROUP BY 1, 2 ORDER BY 1, 2"),
        db.fetch("SELECT kind, status, count(*) AS count FROM landstack.alerts GROUP BY 1, 2 ORDER BY 1, 2"),
        db.fetch(
            "SELECT COALESCE(assigned_department, 'unassigned') AS department, count(*) AS count FROM landstack.applications "
            "WHERE status NOT IN ('approved', 'rejected', 'resolved', 'completed') GROUP BY 1 ORDER BY 1"
        ),
    )
    by_status: dict[str, int] = {}
    for r in apps:
        by_status[r["status"]] = by_status.get(r["status"], 0) + int(r["count"])
    by_kind: dict[str, int] = {}
    for r in alerts:
        by_kind[r["kind"]] = by_kind.get(r["kind"], 0) + int(r["count"])
    totals = totals or {}
    status = status or {}
    parcels_n = int(totals.get("parcels") or 0)
    return {
        "totals": totals,
        "land_use": {r["land_use"]: int(r["count"]) for r in land_use},  # web reads Record<land_use, count>
        "land_use_rows": land_use,  # [{land_use, count, area_sqm}]
        "status": status,
        "applications": {"by_status": by_status, "by_type_status": apps, "open_by_department": per_dept},
        "alerts": {"by_kind": by_kind, "by_kind_status": alerts},
        # Flat KPI view consumed by apps/web (Stats in src/lib/cdm.ts).
        "total_parcels": parcels_n,
        "registered_pct": round(int(status.get("registered") or 0) / parcels_n * 100, 1) if parcels_n else 0.0,
        "disputed": int(status.get("disputed") or 0),
        "mortgaged": int(status.get("mortgaged") or 0),
        "tax_arrears": int(status.get("tax_arrears") or 0),
        "pending_applications": sum(int(r["count"]) for r in per_dept),
        "open_alerts": int(totals.get("open_alerts") or 0),
        "applications_by_status": by_status,
        "alerts_by_kind": by_kind,
    }
