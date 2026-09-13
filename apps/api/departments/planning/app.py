"""Planning department (DTCP/CRDA-style zoning & building permissions). Schema: `dept_planning`.

GET /zone?ulpin= · GET /permissions?ulpin= · POST /permissions · GET /check?ulpin=&use=&floors=

The zone for a parcel is found spatially (parcel point-on-surface ∩ zone polygon, falling back to
`landstack.parcels.zone_code`); the restriction test intersects `gis.restriction_zones`. Those two
read-only cross-schema lookups are the only data this app touches outside `dept_planning`.
"""

from __future__ import annotations

import datetime as dt
from typing import Any

from fastapi import Depends
from pydantic import BaseModel

from departments.common import chaos, envelope, make_dept_app
from landstack.db import DBLike, get_db

SOURCE = "APCRDA / DTCP (mock)"
app = make_dept_app(
    "planning",
    "Planning Department — Zoning & Building Permissions",
    "Master-plan zones with permissible uses, building permission register and a permissibility check.",
    SOURCE,
)

HIGH_RISE_ZONES = {"R2", "C1"}


class PermissionIn(BaseModel):
    ulpin: str
    floors: int = 1
    built_up_sqm: float | None = None
    application_id: str | None = None
    status: str = "approved"
    conditions: str | None = None


def evaluate_permissibility(
    use: str, floors: int | None, zone: dict[str, Any] | None, restriction_hits: list[dict[str, Any]]
) -> tuple[bool, list[str]]:
    """Pure rule: use ∈ zone.permissible_uses; no restriction zone; floors ≤ 4 (R2/C1) else 2."""
    reasons: list[str] = []
    if zone is None:
        reasons.append("parcel is not inside any planning zone")
    else:
        uses = [str(u).lower() for u in (zone.get("permissible_uses") or [])]
        if use.lower() not in uses:
            reasons.append(
                f"use '{use}' not permitted in zone {zone.get('zone_code')} (allowed: {', '.join(uses) or 'none'})"
            )
    for hit in restriction_hits:
        reasons.append(f"parcel intersects restriction zone '{hit.get('name') or hit.get('kind')}' ({hit.get('kind')})")
    max_floors = 4 if (zone or {}).get("zone_code") in HIGH_RISE_ZONES else 2
    if floors is not None and floors > max_floors:
        reasons.append(
            f"{floors} floors exceed the {max_floors}-floor limit for zone {(zone or {}).get('zone_code') or 'n/a'}"
        )
    return (not reasons, reasons)


async def zone_for(db: DBLike, ulpin: str) -> dict[str, Any] | None:
    row = await db.fetchrow(
        """
        SELECT z.id, z.zone_code, z.name, z.permissible_uses FROM dept_planning.zones z
        JOIN landstack.parcels p ON ST_Intersects(z.geom, ST_PointOnSurface(p.geom)) WHERE p.ulpin = :u LIMIT 1
        """,
        u=ulpin,
    )
    if row is None:
        row = await db.fetchrow(
            "SELECT z.id, z.zone_code, z.name, z.permissible_uses FROM dept_planning.zones z "
            "JOIN landstack.parcels p ON p.zone_code = z.zone_code WHERE p.ulpin = :u LIMIT 1",
            u=ulpin,
        )
    return row


@app.get("/zone", dependencies=[Depends(chaos)])
async def zone(ulpin: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    return envelope(SOURCE, item=await zone_for(db, ulpin))


@app.get("/permissions", dependencies=[Depends(chaos)])
async def permissions(ulpin: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    rows = await db.fetch(
        "SELECT * FROM dept_planning.building_permissions WHERE ulpin = :u "
        "ORDER BY applied_on DESC NULLS LAST, permit_no DESC",
        u=ulpin,
    )
    return envelope(SOURCE, count=len(rows), items=rows)


@app.post("/permissions", status_code=201)
async def issue_permission(body: PermissionIn, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    year = dt.date.today().year
    async with db.transaction():
        await db.execute("SELECT pg_advisory_xact_lock(hashtext('dept_planning.permit_no'))")
        seq = await db.fetchval(
            "SELECT count(*) + 1 FROM dept_planning.building_permissions WHERE permit_no LIKE :p", p=f"BP-{year}-%"
        )
        permit_no = f"BP-{year}-{int(seq or 1):04d}"
        row = await db.fetchrow(
            """
            INSERT INTO dept_planning.building_permissions
                (permit_no, ulpin, status, floors, built_up_sqm, applied_on, approved_on, conditions, application_id)
            VALUES (:p, :u, :s, :f, :b, CURRENT_DATE, CASE WHEN :s = 'approved' THEN CURRENT_DATE END, :c, :app) RETURNING *
            """,
            app=body.application_id,
            p=permit_no,
            u=body.ulpin,
            s=body.status,
            f=body.floors,
            b=body.built_up_sqm,
            c=body.conditions or (f"application {body.application_id}" if body.application_id else None),
        )
    return envelope(SOURCE, item=row)


@app.get("/check", dependencies=[Depends(chaos)])
async def check(
    ulpin: str, use: str = "residential", floors: int | None = None, db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    zone_row = await zone_for(db, ulpin)
    hits = await db.fetch(
        "SELECT r.id, r.kind, r.name FROM gis.restriction_zones r JOIN landstack.parcels p ON ST_Intersects(r.geom, p.geom) "
        "WHERE p.ulpin = :u",
        u=ulpin,
    )
    permissible, reasons = evaluate_permissibility(use, floors, zone_row, hits)
    return envelope(
        SOURCE,
        ulpin=ulpin,
        use=use,
        floors=floors,
        permissible=permissible,
        reasons=reasons,
        zone=zone_row,
        zone_code=(zone_row or {}).get("zone_code"),
        zone_name=(zone_row or {}).get("name"),
        restriction_zones=hits,
    )
