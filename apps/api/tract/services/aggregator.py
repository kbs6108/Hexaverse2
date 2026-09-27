"""Builds the per-parcel CDM: PostGIS base row + parallel department adapters + merge + checks.

Pipeline for `get_parcel_cdm(db, ulpin, principal)`:
1. TTL cache lookup (unmasked CDM, keyed by ULPIN);
2. base facts from `landstack.parcels` ⋈ `landstack.parcel_status`, buildings/units, alerts and
   intersecting `gis.restriction_zones`;
3. `asyncio.gather` over the department adapters with a per-adapter timeout (`DEPT_TIMEOUT_S`);
   failures/timeouts become `provenance[dept].ok = false`;
4. deep-merge fragments, derive `fiscal.estimated_value`, `status`, run `consistency.check`;
5. cache; then mask for citizens without consent.
"""

from __future__ import annotations

import asyncio
import copy
import datetime as dt
import json
import logging
from typing import Any

from landstack.adapters.base import AdapterResult, DepartmentAdapter
from landstack.adapters.registry import get_adapters
from landstack.auth import Principal, has_consent
from landstack.cdm import ParcelCDM, empty_cdm
from landstack.config import get_settings
from landstack.db import DBLike
from landstack.errors import not_found
from landstack.services import consistency
from landstack.services.cache import TTLCache
from landstack.services.masking import is_parcel_owner, mask_cdm, should_mask

log = logging.getLogger("landstack.aggregator")

_cache: TTLCache[dict[str, Any]] = TTLCache(ttl_s=60.0)


def invalidate(ulpin: str | None = None) -> None:
    """Drop the cached CDM for one parcel (or all)."""
    _cache.invalidate(ulpin)


def cache_stats() -> dict[str, Any]:
    return _cache.stats()


def deep_merge(base: dict[str, Any], fragment: dict[str, Any]) -> dict[str, Any]:
    """Recursive dict merge; lists and scalars from the fragment replace, None never overwrites."""
    for key, value in fragment.items():
        if value is None:
            continue
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            deep_merge(base[key], value)
        elif isinstance(value, list) and isinstance(base.get(key), list) and value and isinstance(value[0], dict):
            merged = list(base[key])
            for i, item in enumerate(value):
                if i < len(merged) and isinstance(merged[i], dict) and isinstance(item, dict):
                    deep_merge(merged[i], item)
                else:
                    merged.append(item)
            base[key] = merged
        else:
            base[key] = value
    return base


def _iso(value: Any) -> Any:
    if isinstance(value, dt.datetime | dt.date):
        return value.isoformat()
    return value


def _now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


async def _base(db: DBLike, ulpin: str) -> dict[str, Any]:
    row = await db.fetchrow(
        """
        SELECT p.ulpin, p.state, p.district, p.taluk, p.village, p.survey_no, p.sub_division,
               p.land_use, p.zone_code, p.status_flags, p.updated_at,
               COALESCE(p.area_sqm, ST_Area(p.geom::geography)) AS area_sqm,
               ST_X(ST_PointOnSurface(p.geom)) AS cx, ST_Y(ST_PointOnSurface(p.geom)) AS cy,
               ST_XMin(p.geom) AS xmin, ST_YMin(p.geom) AS ymin, ST_XMax(p.geom) AS xmax, ST_YMax(p.geom) AS ymax,
               s.has_dispute, s.has_mortgage, s.tax_arrears, s.pending_mutation, s.registered,
               s.permission_status, s.change_alert
        FROM landstack.parcels p
        LEFT JOIN landstack.parcel_status s ON s.ulpin = p.ulpin
        WHERE p.ulpin = :ulpin
        """,
        ulpin=ulpin,
    )
    if row is None:
        raise not_found("parcel", ulpin)
    return row


async def _buildings(db: DBLike, ulpin: str) -> list[dict[str, Any]]:
    rows = await db.fetch(
        """
        SELECT b.id, b.name, b.floors, b.height_m, b.width_m, b.depth_m, b.basement_floors,
               u.id AS unit_id, u.ulpin_3d, u.floor, u.unit_no, u.owner_name, u.base_m, u.height_m AS unit_height_m,
               round(ST_Area(u.geom::geography)::numeric, 1) AS unit_area_sqm
        FROM landstack.buildings b
        LEFT JOIN landstack.units u ON u.building_id = b.id
        WHERE b.ulpin = :ulpin
        ORDER BY b.id, u.floor, u.unit_no
        """,
        ulpin=ulpin,
    )
    out: dict[int, dict[str, Any]] = {}
    for r in rows:
        b = out.setdefault(
            r["id"],
            {
                "id": r["id"],
                "name": r.get("name"),
                "floors": r.get("floors"),
                "height_m": r.get("height_m"),
                "width_m": r.get("width_m"),
                "depth_m": r.get("depth_m"),
                "basement_floors": r.get("basement_floors"),
                "units": [],
            },
        )
        if r.get("unit_id") is not None:
            b["units"].append(
                {
                    "id": r["unit_id"],
                    "ulpin_3d": r.get("ulpin_3d"),
                    "floor": r.get("floor"),
                    "unit_no": r.get("unit_no"),
                    "owner_name": r.get("owner_name"),
                    "base_m": r.get("base_m"),
                    "height_m": r.get("unit_height_m"),
                    "area_sqm": r.get("unit_area_sqm"),
                }
            )
    return list(out.values())


async def _alerts(db: DBLike, ulpin: str) -> list[dict[str, Any]]:
    rows = await db.fetch(
        """
        SELECT id, kind, severity, title, detail, status, created_at
        FROM landstack.alerts WHERE ulpin = :ulpin AND status <> 'resolved' ORDER BY created_at DESC
        """,
        ulpin=ulpin,
    )
    return [{**r, "created_at": _iso(r.get("created_at"))} for r in rows]


async def _restriction_zones(db: DBLike, ulpin: str) -> list[dict[str, Any]]:
    return await db.fetch(
        """
        SELECT z.id, z.kind, z.name FROM gis.restriction_zones z
        JOIN landstack.parcels p ON ST_Intersects(z.geom, p.geom) WHERE p.ulpin = :ulpin
        """,
        ulpin=ulpin,
    )


async def _acquisitions(db: DBLike, ulpin: str) -> list[dict[str, Any]]:
    rows = await db.fetch(
        """
        SELECT i.project_id, prj.name as project_name, prj.kind, prj.executing_agency,
               prj.statutory_act, prj.notification_section, prj.gazette_no,
               prj.gazette_date::text as gazette_date,
               prj.objection_deadline::text as objection_deadline,
               GREATEST(0, (prj.objection_deadline - CURRENT_DATE)) as days_left,
               i.impact_type, i.total_area_sqm, i.affected_area_sqm, i.residual_area_sqm,
               i.impact_pct, i.guideline_rate_per_sqm, i.base_land_value, i.solatium_amount,
               i.structural_damage_estimate, i.total_compensation_offer, i.consent_settlement_total,
               i.tdr_units_offered_sqm, i.severance_risk, i.status,
               i.hearing_date::text as hearing_date, prj.description,
               ST_AsGeoJSON(i.affected_geom) as affected_geojson_str
        FROM gis.project_parcel_impacts i
        JOIN gis.projects prj ON prj.id = i.project_id
        WHERE i.ulpin = :ulpin
        ORDER BY i.impact_pct DESC
        """,
        ulpin=ulpin,
    )
    result = []
    for r in rows:
        geo = None
        raw_geo = r.get("affected_geojson_str")
        if isinstance(raw_geo, dict):
            geo = raw_geo
        elif isinstance(raw_geo, str):
            try:
                geo = json.loads(raw_geo)
            except Exception:
                geo = None
        result.append(
            {
                "project_id": r["project_id"],
                "project_name": r["project_name"],
                "kind": r["kind"],
                "executing_agency": r.get("executing_agency"),
                "statutory_act": r.get("statutory_act"),
                "notification_section": r.get("notification_section"),
                "gazette_no": r.get("gazette_no"),
                "gazette_date": r.get("gazette_date"),
                "objection_deadline": r.get("objection_deadline"),
                "days_left": int(r["days_left"]) if r.get("days_left") is not None else None,
                "impact_type": r.get("impact_type") or "partial_road_widening",
                "total_area_sqm": float(r["total_area_sqm"]) if r.get("total_area_sqm") is not None else 0.0,
                "affected_area_sqm": float(r["affected_area_sqm"]) if r.get("affected_area_sqm") is not None else 0.0,
                "residual_area_sqm": float(r["residual_area_sqm"]) if r.get("residual_area_sqm") is not None else 0.0,
                "impact_pct": float(r["impact_pct"]) if r.get("impact_pct") is not None else 0.0,
                "guideline_rate_per_sqm": float(r["guideline_rate_per_sqm"]) if r.get("guideline_rate_per_sqm") is not None else 0.0,
                "base_land_value": float(r["base_land_value"]) if r.get("base_land_value") is not None else 0.0,
                "solatium_amount": float(r["solatium_amount"]) if r.get("solatium_amount") is not None else 0.0,
                "structural_damage_estimate": float(r["structural_damage_estimate"]) if r.get("structural_damage_estimate") is not None else 0.0,
                "total_compensation_offer": float(r["total_compensation_offer"]) if r.get("total_compensation_offer") is not None else 0.0,
                "consent_settlement_total": float(r["consent_settlement_total"]) if r.get("consent_settlement_total") is not None else 0.0,
                "tdr_units_offered_sqm": float(r["tdr_units_offered_sqm"]) if r.get("tdr_units_offered_sqm") is not None else 0.0,
                "severance_risk": bool(r.get("severance_risk")),
                "status": r.get("status") or "notice_published",
                "hearing_date": r.get("hearing_date"),
                "description": r.get("description"),
                "affected_geojson": geo,
            }
        )
    return result


async def _run_adapter(adapter: DepartmentAdapter, ulpin: str, timeout_s: float) -> AdapterResult:
    try:
        return await asyncio.wait_for(adapter.fetch(ulpin), timeout=timeout_s)
    except (TimeoutError, asyncio.TimeoutError):  # noqa: UP041 - py3.10 compat
        return AdapterResult(
            {},
            {
                "ok": False,
                "ms": int(timeout_s * 1000),
                "as_of": None,
                "source": adapter.source,
                "error": "timeout",
                "cached_as_of": None,
            },
        )


async def collect_fragments(
    adapters: list[DepartmentAdapter], ulpin: str, timeout_s: float
) -> dict[str, AdapterResult]:
    """Run all adapters concurrently; every exception becomes a failed provenance entry."""
    results = await asyncio.gather(*(_run_adapter(a, ulpin, timeout_s) for a in adapters), return_exceptions=True)
    out: dict[str, AdapterResult] = {}
    for adapter, res in zip(adapters, results, strict=True):
        if isinstance(res, BaseException):
            out[adapter.name] = AdapterResult(
                {},
                {
                    "ok": False,
                    "ms": None,
                    "as_of": None,
                    "source": adapter.source,
                    "error": f"{type(res).__name__}: {res}"[:200],
                    "cached_as_of": None,
                },
            )
        else:
            out[adapter.name] = res
    return out


def merge_results(cdm: dict[str, Any], results: dict[str, AdapterResult]) -> dict[str, Any]:
    for dept, res in results.items():
        if res.fragment:
            deep_merge(cdm, res.fragment)
        cdm.setdefault("provenance", {})[dept] = res.provenance
    return cdm


def finalise(cdm: dict[str, Any]) -> dict[str, Any]:
    """Derived fields: estimated value, status block, consistency, generated_at."""
    fiscal = cdm.setdefault("fiscal", {})
    gv = fiscal.get("guideline_value_per_sqm")
    mv = fiscal.get("market_value_per_sqm")
    area = (cdm.get("spatial") or {}).get("area_sqm")
    if gv and area:
        fiscal["estimated_value"] = round(float(gv) * float(area), 2)
    if mv and area:
        fiscal["estimated_market_value"] = round(float(mv) * float(area), 2)
    elif gv and area:
        fiscal["market_value_per_sqm"] = round(float(gv) * 1.35, 2)
        fiscal["estimated_market_value"] = round(float(gv) * 1.35 * float(area), 2)
    status = cdm.setdefault("status", {})
    reg_status = (cdm.get("rights") or {}).get("registration", {}).get("status")
    if reg_status:
        status["registered"] = reg_status == "registered"
    restr = cdm.get("restrictions") or {}
    if restr.get("disputes"):
        status["has_dispute"] = any(
            str(d.get("status", "")).lower() not in ("closed", "disposed", "resolved") for d in restr["disputes"]
        )
    if restr.get("encumbrances"):
        status["has_mortgage"] = any(e.get("active") and e.get("kind") == "mortgage" for e in restr["encumbrances"])
    arrears = fiscal.get("tax", {}).get("arrears")
    if arrears is not None:
        status["tax_arrears"] = float(arrears)
    bp = (cdm.get("planning") or {}).get("building_permission") or {}
    if bp.get("status") and bp["status"] != "none":
        status["permission_status"] = bp["status"]
    status["change_alert"] = bool(status.get("change_alert")) or any(
        a.get("kind") == "change_detected" for a in cdm.get("alerts") or []
    )
    status["pending_mutation"] = bool(status.get("pending_mutation")) or any(
        a.get("kind") == "pending_mutation" for a in cdm.get("alerts") or []
    )
    cdm["consistency"] = consistency.check(cdm)
    cdm["generated_at"] = _now_iso()
    return cdm


def build_base_cdm(
    row: dict[str, Any],
    buildings: list[dict[str, Any]],
    alerts: list[dict[str, Any]],
    zones: list[dict[str, Any]],
    acquisitions: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    cdm = empty_cdm(row["ulpin"])
    cdm["identifiers"].update(
        {k: row.get(k) for k in ("state", "district", "taluk", "village", "survey_no", "sub_division")}
    )
    cdm["spatial"].update(
        {
            "area_sqm": round(float(row["area_sqm"]), 2) if row.get("area_sqm") is not None else None,
            "centroid": [row["cx"], row["cy"]] if row.get("cx") is not None else None,
            "bbox": [row["xmin"], row["ymin"], row["xmax"], row["ymax"]] if row.get("xmin") is not None else None,
            "geometry_ref": f"/landstack/collections/parcels/items/{row['ulpin']}",
        }
    )
    cdm["planning"]["land_use"] = row.get("land_use")
    cdm["planning"]["zone_code"] = row.get("zone_code")
    cdm["buildings"] = buildings
    cdm["alerts"] = alerts
    cdm["restrictions"]["restriction_zones"] = [{"kind": z.get("kind"), "name": z.get("name")} for z in zones]
    cdm["acquisition"] = acquisitions or []
    cdm["status"].update(
        {
            "registered": bool(row.get("registered")),
            "has_dispute": bool(row.get("has_dispute")),
            "has_mortgage": bool(row.get("has_mortgage")),
            "tax_arrears": float(row.get("tax_arrears") or 0),
            "pending_mutation": bool(row.get("pending_mutation")),
            "change_alert": bool(row.get("change_alert")),
            "permission_status": row.get("permission_status"),
        }
    )
    cdm["status_flags"] = row.get("status_flags") or {}
    cdm["updated_at"] = _iso(row.get("updated_at"))
    return cdm


async def build_parcel_cdm(
    db: DBLike, ulpin: str, adapters: list[DepartmentAdapter] | None = None, timeout_s: float | None = None
) -> dict[str, Any]:
    """Unmasked, uncached CDM (used by the cached entry point and by reports/tests)."""
    row = await _base(db, ulpin)
    buildings, alerts, zones, acquisitions = await asyncio.gather(
        _buildings(db, ulpin), _alerts(db, ulpin), _restriction_zones(db, ulpin), _acquisitions(db, ulpin)
    )
    cdm = build_base_cdm(row, buildings, alerts, zones, acquisitions)
    adapters = adapters if adapters is not None else get_adapters(row.get("state"))
    timeout = timeout_s if timeout_s is not None else max(get_settings().dept_timeout_s, 0.05)
    results = await collect_fragments(adapters, ulpin, timeout)
    merge_results(cdm, results)
    finalise(cdm)
    return ParcelCDM.model_validate(cdm).model_dump()


async def get_privacy_preferences(db: DBLike, ulpin: str) -> dict[str, Any]:
    try:
        row = await db.fetchrow("SELECT * FROM landstack.parcel_privacy WHERE ulpin = :u", u=ulpin)
        if row:
            return {
                "public_owner_name": bool(row["public_owner_name"]),
                "public_nominees": bool(row["public_nominees"]),
                "public_deed_details": bool(row["public_deed_details"]),
                "public_building_units": bool(row["public_building_units"]),
                "public_utilities": bool(row["public_utilities"]),
            }
    except Exception as exc:
        log.debug("privacy preferences lookup skipped: %s", exc)
    return {
        "public_owner_name": False,
        "public_nominees": False,
        "public_deed_details": False,
        "public_building_units": True,
        "public_utilities": True,
    }


async def get_parcel_cdm(db: DBLike, ulpin: str, principal: Principal | None) -> dict[str, Any]:
    """Cached + masked CDM for the caller."""
    cdm = _cache.get(ulpin)
    if cdm is None:
        cdm = await build_parcel_cdm(db, ulpin)
        _cache.set(ulpin, cdm, get_settings().cdm_cache_ttl_s)
    cdm = copy.deepcopy(cdm)
    if principal is not None and not principal.is_officer:
        await has_consent(db, principal, ulpin)
    prefs = await get_privacy_preferences(db, ulpin)
    cdm["privacy_preferences"] = prefs
    cdm["viewer_is_owner"] = is_parcel_owner(principal, cdm)
    if should_mask(principal, ulpin, cdm):
        cdm = mask_cdm(cdm, prefs)
    return cdm
