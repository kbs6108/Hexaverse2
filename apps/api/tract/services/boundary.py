"""Bounded parcel-boundary editing: validation rules + assistive geometry (CONTRACTS §6, §8).

A proposed geometry must pass every check before it can become a `boundary_correction`
application, and is re-validated at approval time before it is applied:

  valid_geometry   ST_IsValid and a single Polygon/MultiPolygon
  vertex_count     4–200 exterior vertices (sane survey shape)
  area_cap         |Δ area| ≤ AREA_CAP_PCT of the current parcel area
  no_overlap       intersection with any other parcel ≤ OVERLAP_TOL_SQM
  within_village   covered by the (buffered) village boundary of the parcel's region

The "AI assist" is a deterministic geometry engine: it snaps the proposal to the
neighbouring parcels' edges and subtracts residual overlaps, returning a suggested
geometry when that produces a cleaner shape — explainable, reproducible help rather
than a black box.
"""

from __future__ import annotations

import json
from typing import Any

from landstack.db import DBLike
from landstack.errors import AppError, not_found

AREA_CAP_PCT = 15.0
OVERLAP_TOL_SQM = 1.0
SNAP_TOL_DEG = 0.00002  # ≈ 2 m at these latitudes
VILLAGE_TOL_DEG = 0.0001  # ≈ 10 m containment tolerance
MAX_VERTICES = 200


def _geom_sql(param: str = "g") -> str:
    """SRID-4326 geometry from a GeoJSON text bind param (explicit cast for asyncpg)."""
    return f"ST_SetSRID(ST_GeomFromGeoJSON((:{param})::text), 4326)"


def geometry_json(geometry: dict[str, Any]) -> str:
    if not isinstance(geometry, dict) or geometry.get("type") not in ("Polygon", "MultiPolygon"):
        raise AppError(422, "invalid_geometry", "geometry must be a GeoJSON Polygon or MultiPolygon")
    return json.dumps(geometry)


async def validate(db: DBLike, ulpin: str, geometry: dict[str, Any]) -> dict[str, Any]:
    """Run every rule; returns {valid, checks[], metrics{}, suggestion?}. Never raises for rule failures."""
    gj = geometry_json(geometry)

    base = await db.fetchrow(
        f"""
        SELECT p.ulpin,
               p.area_sqm::float                                            AS old_area,
               ST_IsValid({_geom_sql()})                                    AS is_valid,
               GeometryType({_geom_sql()})                                  AS gtype,
               ST_NPoints({_geom_sql()})                                    AS npoints,
               round(ST_Area({_geom_sql()}::geography)::numeric, 2)::float  AS new_area
        FROM landstack.parcels p WHERE p.ulpin = :u
        """,
        u=ulpin,
        g=gj,
    )
    if base is None:
        raise not_found("parcel", ulpin)

    checks: list[dict[str, Any]] = []
    old_area, new_area = float(base["old_area"]), float(base["new_area"] or 0)
    delta_pct = round((new_area - old_area) / old_area * 100, 2) if old_area else 0.0

    ok_valid = bool(base["is_valid"]) and str(base["gtype"]).upper() in ("POLYGON", "MULTIPOLYGON")
    checks.append({"name": "valid_geometry", "ok": ok_valid, "detail": f"{base['gtype']}, ST_IsValid={bool(base['is_valid'])}"})

    npoints = int(base["npoints"] or 0)
    ok_vertices = 4 <= npoints <= MAX_VERTICES
    checks.append({"name": "vertex_count", "ok": ok_vertices, "detail": f"{npoints} vertices (allowed 4–{MAX_VERTICES})"})

    ok_area = abs(delta_pct) <= AREA_CAP_PCT
    checks.append(
        {"name": "area_cap", "ok": ok_area,
         "detail": f"{old_area:.0f} → {new_area:.0f} m² ({delta_pct:+.1f}%, cap ±{AREA_CAP_PCT:.0f}%)"}
    )

    overlaps: list[dict[str, Any]] = []
    ok_overlap = True
    if ok_valid:
        overlaps = await db.fetch(
            f"""
            SELECT q.ulpin, q.survey_no,
                   round(ST_Area(ST_Intersection(q.geom, {_geom_sql()})::geography)::numeric, 2)::float AS overlap_sqm
            FROM landstack.parcels q
            WHERE q.ulpin <> :u AND ST_Intersects(q.geom, {_geom_sql()})
              AND ST_Area(ST_Intersection(q.geom, {_geom_sql()})::geography) > (:tol)::float
            ORDER BY 3 DESC LIMIT 8
            """,
            u=ulpin,
            g=gj,
            tol=OVERLAP_TOL_SQM,
        )
        ok_overlap = len(overlaps) == 0
    checks.append(
        {"name": "no_overlap", "ok": ok_overlap,
         "detail": "no neighbouring parcel overlapped" if ok_overlap
         else f"overlaps {len(overlaps)} parcel(s), worst {overlaps[0]['overlap_sqm']:.1f} m²"}
    )

    ok_village = False
    if ok_valid:
        ok_village = bool(
            await db.fetchval(
                f"""
                SELECT ST_Covers(ST_Buffer(vb.geom, (:vtol)::float), {_geom_sql()})
                FROM gis.village_boundary vb
                JOIN landstack.parcels p ON p.ulpin = :u
                ORDER BY vb.geom <-> p.geom LIMIT 1
                """,
                u=ulpin,
                g=gj,
                vtol=VILLAGE_TOL_DEG,
            )
        )
    checks.append(
        {"name": "within_village", "ok": ok_village,
         "detail": "inside the village boundary" if ok_village else "extends outside the village boundary"}
    )

    result: dict[str, Any] = {
        "valid": all(c["ok"] for c in checks),
        "checks": checks,
        "metrics": {
            "old_area_sqm": old_area,
            "new_area_sqm": new_area,
            "delta_pct": delta_pct,
            "overlaps": [dict(o) for o in overlaps],
        },
    }

    # Assistive geometry: snap to neighbours, subtract residual overlap.
    if ok_valid and not ok_overlap:
        fixed = await db.fetchrow(
            f"""
            WITH nb AS (
                SELECT ST_Collect(q.geom) AS geoms, ST_Union(q.geom) AS merged
                FROM landstack.parcels q
                WHERE q.ulpin <> :u AND ST_DWithin(q.geom, {_geom_sql()}, 0.001)
            )
            SELECT ST_AsGeoJSON(
                       ST_Multi(ST_CollectionExtract(ST_MakeValid(
                           ST_Difference(ST_Snap({_geom_sql()}, nb.geoms, (:snap)::float), nb.merged)
                       ), 3))
                   ) AS geojson,
                   round(ST_Area(ST_Difference(ST_Snap({_geom_sql()}, nb.geoms, (:snap)::float), nb.merged)::geography)::numeric, 2)::float AS area
            FROM nb
            """,
            u=ulpin,
            g=gj,
            snap=SNAP_TOL_DEG,
        )
        if fixed and fixed.get("geojson"):
            raw = fixed["geojson"]
            # the DB facade auto-parses json-shaped strings; accept either form
            suggested = raw if isinstance(raw, dict) else json.loads(raw)
            if suggested.get("coordinates"):
                result["suggestion"] = {
                    "geometry": suggested,
                    "area_sqm": float(fixed["area"] or 0),
                    "reason": "Snapped to neighbouring boundaries and removed the overlapping slivers.",
                }
    return result


async def apply_geometry(db: DBLike, ulpin: str, geometry: dict[str, Any]) -> dict[str, Any]:
    """Write the approved geometry to landstack.parcels; returns before/after areas."""
    gj = geometry_json(geometry)
    row = await db.fetchrow(
        f"""
        UPDATE landstack.parcels
        SET geom = ST_Multi({_geom_sql()}),
            area_sqm = round(ST_Area({_geom_sql()}::geography)::numeric, 2),
            updated_at = now()
        WHERE ulpin = :u
        RETURNING ulpin, area_sqm::float AS new_area
        """,
        u=ulpin,
        g=gj,
    )
    if row is None:
        raise not_found("parcel", ulpin)
    return dict(row)
