"""Parcel CDM, timeline and ownership verification."""

from __future__ import annotations

import datetime as dt
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from landstack.auth import Principal, require, require_officer, require_user
from landstack.db import DBLike, get_db
from landstack.services import aggregator, audit, boundary, workflow
from landstack.services.consistency import OWNER_THRESHOLD, name_score

require_revenue = require("officer", department="revenue")

router = APIRouter(prefix="/landstack", tags=["parcels"])


@router.get("/parcels/{ulpin}")
async def parcel_cdm(
    ulpin: str, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    return await aggregator.get_parcel_cdm(db, ulpin, principal)


@router.get("/citizen/my-parcels")
async def my_parcels(
    principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    """Retrieve owned land parcels linked to the authenticated citizen's profile."""
    name = (principal.name or "").strip()
    if not name:
        return {"items": []}

    sql = """
        SELECT p.ulpin, p.survey_no, p.village, p.state, p.district, p.land_use, p.area_sqm,
               r.khata_no, r.owner_name, r.ownership_type,
               EXISTS(SELECT 1 FROM gis.project_parcel_impacts i WHERE i.ulpin = p.ulpin) AS has_acquisition_notice,
               ST_X(ST_PointOnSurface(p.geom)) AS lon, ST_Y(ST_PointOnSurface(p.geom)) AS lat,
               ST_XMin(p.geom) AS minx, ST_YMin(p.geom) AS miny,
               ST_XMax(p.geom) AS maxx, ST_YMax(p.geom) AS maxy
        FROM dept_revenue.ror r
        JOIN landstack.parcels p ON p.ulpin = r.ulpin
        WHERE r.owner_name ILIKE :like OR similarity(r.owner_name, :name) > 0.5
        ORDER BY r.updated_at DESC
        LIMIT 10
    """
    rows = await db.fetch(sql, like=f"%{name}%", name=name)
    items = []
    for r in rows:
        items.append({
            "ulpin": r["ulpin"],
            "survey_no": r["survey_no"],
            "village": r["village"],
            "state": r["state"],
            "district": r["district"],
            "land_use": r["land_use"],
            "area_sqm": float(r["area_sqm"] or 0),
            "khata_no": r["khata_no"],
            "owner_name": r["owner_name"],
            "ownership_type": r["ownership_type"],
            "has_acquisition_notice": bool(r.get("has_acquisition_notice")),
            "centroid": [r["lon"], r["lat"]],
            "bbox": [r["minx"], r["miny"], r["maxx"], r["maxy"]],
        })
    return {"items": items}



def _iso(v: Any) -> Any:
    return v.isoformat() if isinstance(v, dt.datetime | dt.date) else v


class BoundaryProposal(BaseModel):
    geometry: dict[str, Any]
    reason: str = Field(min_length=3, max_length=500)


class BoundaryGeometry(BaseModel):
    geometry: dict[str, Any]


@router.post("/parcels/{ulpin}/boundary/validate")
async def boundary_validate(
    ulpin: str, body: BoundaryGeometry, principal: Principal = Depends(require_revenue), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    """Bounded-edit validation: area cap, overlap, village containment + an assistive fix suggestion."""
    return await boundary.validate(db, ulpin, body.geometry)


@router.post("/parcels/{ulpin}/boundary", status_code=201)
async def boundary_propose(
    ulpin: str, body: BoundaryProposal, principal: Principal = Depends(require_revenue), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    """File a boundary_correction application. The proposal must pass validation; approval
    re-validates and only then applies the geometry and syncs the RoR extent (CONTRACTS §8)."""
    result = await boundary.validate(db, ulpin, body.geometry)
    if not result["valid"]:
        failed = [c["name"] for c in result["checks"] if not c["ok"]]
        return {"accepted": False, "validation": result, "error": f"validation failed: {', '.join(failed)}"}
    app = await workflow.create_application(
        db,
        principal,
        ulpin,
        "boundary_correction",
        {
            "proposed_geometry": body.geometry,
            "reason": body.reason,
            "validation": {"checks": result["checks"], "metrics": result["metrics"]},
            "area_before_sqm": result["metrics"]["old_area_sqm"],
            "area_after_sqm": result["metrics"]["new_area_sqm"],
        },
    )
    return {"accepted": True, "application": app, "validation": result}


@router.get("/parcels/{ulpin}/due-diligence")
async def due_diligence(
    ulpin: str, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    """Buyer due-diligence checklist over the CDM the caller may see (masking applies first).
    Deterministic 9-point checks enhanced with AI executive summary when configured."""
    from landstack.services import ai_assist

    cdm = await aggregator.get_parcel_cdm(db, ulpin, principal)
    return {"ulpin": ulpin, **(await ai_assist.due_diligence_report(cdm))}


@router.get("/parcels/{ulpin}/timeline")
async def timeline(
    ulpin: str, principal: Principal = Depends(require_officer), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    """Chronological events across departments (deeds, mutations, permissions, applications, alerts, audit)."""
    events: list[dict[str, Any]] = []

    def push(rows: list[dict[str, Any]], kind: str, source: str, ts_key: str, title_fn: Any) -> None:
        for r in rows:
            ts = r.get(ts_key)
            if ts is None:
                continue
            events.append({"ts": _iso(ts), "kind": kind, "source": source, "title": title_fn(r), "detail": r})

    push(
        await db.fetch("SELECT * FROM dept_registration.deeds WHERE ulpin = :u", u=ulpin),
        "deed",
        "registration",
        "registered_on",
        lambda r: f"{r.get('deed_type', 'deed').title()} deed {r.get('doc_no')} → {r.get('claimant')}",
    )
    push(
        await db.fetch("SELECT * FROM dept_revenue.mutations WHERE ulpin = :u", u=ulpin),
        "mutation",
        "revenue",
        "created_at",
        lambda r: f"Mutation {r.get('from_owner')} → {r.get('to_owner')}",
    )
    push(
        await db.fetch("SELECT * FROM dept_planning.building_permissions WHERE ulpin = :u", u=ulpin),
        "permission",
        "planning",
        "applied_on",
        lambda r: f"Building permission {r.get('permit_no')} ({r.get('status')})",
    )
    push(
        await db.fetch("SELECT * FROM dept_legal.disputes WHERE ulpin = :u", u=ulpin),
        "dispute",
        "legal",
        "filed_on",
        lambda r: f"Case {r.get('case_no')} filed at {r.get('court')}",
    )
    push(
        await db.fetch("SELECT * FROM dept_registration.encumbrances WHERE ulpin = :u", u=ulpin),
        "encumbrance",
        "registration",
        "from_date",
        lambda r: f"{str(r.get('kind', '')).title()} in favour of {r.get('holder')}",
    )
    push(
        await db.fetch(
            "SELECT id, type, status, applicant_name, created_at FROM landstack.applications WHERE ulpin = :u", u=ulpin
        ),
        "application",
        "gateway",
        "created_at",
        lambda r: f"{r.get('type')} application {r.get('id')} ({r.get('status')})",
    )
    push(
        await db.fetch(
            "SELECT id, kind, severity, title, status, created_at FROM landstack.alerts WHERE ulpin = :u", u=ulpin
        ),
        "alert",
        "gateway",
        "created_at",
        lambda r: r.get("title") or r.get("kind"),
    )
    push(
        await db.fetch(
            "SELECT ts, action, actor_name, actor_role, source FROM landstack.audit_log WHERE ulpin = :u "
            "ORDER BY ts DESC LIMIT 50",
            u=ulpin,
        ),
        "audit",
        "gateway",
        "ts",
        lambda r: f"{r.get('action')} by {r.get('actor_name')}",
    )
    ror = await db.fetchrow("SELECT mutation_history FROM dept_revenue.ror WHERE ulpin = :u LIMIT 1", u=ulpin)
    for h in (ror or {}).get("mutation_history") or []:
        if isinstance(h, dict) and (h.get("date") or h.get("on")):
            events.append(
                {
                    "ts": h.get("date") or h.get("on"),
                    "kind": "mutation",
                    "source": "revenue",
                    "title": f"RoR mutation: {h.get('from', '?')} → {h.get('to', '?')}",
                    "detail": h,
                }
            )
    events.sort(key=lambda e: str(e["ts"]), reverse=True)
    return {"ulpin": ulpin, "events": events}


class VerifyBody(BaseModel):
    ulpin: str
    claimed_name: str = Field(min_length=1, max_length=120)


@router.post("/verify-ownership")
async def verify_ownership(
    body: VerifyBody, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    """Fuzzy-compare a claimed name against the RoR owner and the latest deed claimant."""
    ror_owner = await db.fetchval("SELECT owner_name FROM dept_revenue.ror WHERE ulpin = :u LIMIT 1", u=body.ulpin)
    deed_claimant = await db.fetchval(
        "SELECT claimant FROM dept_registration.deeds WHERE ulpin = :u ORDER BY registered_on DESC LIMIT 1",
        u=body.ulpin,
    )
    scores = {
        "ror": name_score(ror_owner, body.claimed_name),
        "latest_deed": name_score(deed_claimant, body.claimed_name),
    }
    best = max(scores.values()) if scores else 0.0
    result = {
        "ulpin": body.ulpin,
        "match": best >= OWNER_THRESHOLD,
        "score": round(best, 1),
        "compared": [k for k, v in (("ror", ror_owner), ("latest_deed", deed_claimant)) if v],
        "scores": scores,
    }
    await audit.record(
        db,
        principal,
        "ownership.verified",
        "parcel",
        body.ulpin,
        body.ulpin,
        None,
        {"claimed_name": body.claimed_name, "match": result["match"], "score": result["score"]},
    )
    return result


class UpdatePrivacyBody(BaseModel):
    public_owner_name: bool = False
    public_nominees: bool = False
    public_deed_details: bool = False
    public_building_units: bool = True
    public_utilities: bool = True


@router.get("/parcels/{ulpin}/privacy")
async def get_privacy(
    ulpin: str, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    exists = await db.fetchval("SELECT 1 FROM landstack.parcels WHERE ulpin = :u", u=ulpin)
    if not exists:
        from landstack.errors import not_found
        raise not_found("parcel", ulpin)
    prefs = await aggregator.get_privacy_preferences(db, ulpin)
    return {"ulpin": ulpin, "preferences": prefs}


@router.put("/parcels/{ulpin}/privacy")
async def update_privacy(
    ulpin: str, body: UpdatePrivacyBody, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    exists = await db.fetchval("SELECT 1 FROM landstack.parcels WHERE ulpin = :u", u=ulpin)
    if not exists:
        from landstack.errors import not_found
        raise not_found("parcel", ulpin)

    # Permission check: must be admin or the verified owner of the parcel
    if not principal.is_admin:
        ror_owner = await db.fetchval("SELECT owner_name FROM dept_revenue.ror WHERE ulpin = :u LIMIT 1", u=ulpin)
        p_name = (principal.name or "").strip().lower()
        o_name = (ror_owner or "").strip().lower()
        is_owner = (p_name == o_name) or (p_name in o_name) or (o_name in p_name)
        if not is_owner and ror_owner:
            is_owner = name_score(ror_owner, principal.name or "") >= 60
        if not is_owner:
            from landstack.errors import forbidden
            raise forbidden("Only the verified title owner or an administrator can update public disclosure preferences.")

    await db.execute(
        """
        INSERT INTO landstack.parcel_privacy (
            ulpin, owner_uid, public_owner_name, public_nominees, public_deed_details,
            public_building_units, public_utilities, updated_at
        ) VALUES (
            :ulpin, :uid, :public_owner_name, :public_nominees, :public_deed_details,
            :public_building_units, :public_utilities, now()
        )
        ON CONFLICT (ulpin) DO UPDATE SET
            public_owner_name = EXCLUDED.public_owner_name,
            public_nominees = EXCLUDED.public_nominees,
            public_deed_details = EXCLUDED.public_deed_details,
            public_building_units = EXCLUDED.public_building_units,
            public_utilities = EXCLUDED.public_utilities,
            updated_at = now()
        """,
        ulpin=ulpin,
        uid=principal.uid,
        public_owner_name=False,  # Enforced DPDP masking; non-toggleable
        public_nominees=False,    # Strictly confidential family data; non-toggleable
        public_deed_details=False, # Masked to prevent unauthorized deed harvesting
        public_building_units=body.public_building_units,
        public_utilities=body.public_utilities,
    )

    aggregator.invalidate(ulpin)
    enforced_prefs = {
        **body.model_dump(),
        "public_owner_name": False,
        "public_nominees": False,
        "public_deed_details": False,
    }
    await audit.record(
        db,
        principal,
        "parcel.privacy_updated",
        "parcel",
        ulpin,
        ulpin,
        None,
        enforced_prefs,
    )
    return {"ulpin": ulpin, "preferences": enforced_prefs, "status": "updated"}
