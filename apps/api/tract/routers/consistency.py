"""`GET /landstack/consistency` — cross-department findings computed in SQL (parcels vs RoR vs deeds)."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from landstack.auth import Principal, require_admin
from landstack.db import DBLike, get_db
from landstack.services.consistency import AREA_TOLERANCE, OWNER_THRESHOLD, name_score

router = APIRouter(prefix="/landstack", tags=["consistency"])

SQL = """
SELECT p.ulpin, p.survey_no, p.village, p.land_use,
       COALESCE(p.area_sqm, ST_Area(p.geom::geography)) AS parcel_area_sqm,
       r.khata_no, r.owner_name AS ror_owner, r.extent_sqm AS ror_extent_sqm,
       d.doc_no, d.claimant AS deed_claimant, d.registered_on, d.extent_sqm AS deed_extent_sqm,
       (SELECT count(*) FROM dept_registration.deeds dd WHERE dd.ulpin = p.ulpin) AS deed_count,
       (SELECT count(*) FROM dept_revenue.ror rr WHERE rr.ulpin = p.ulpin) AS ror_count
FROM landstack.parcels p
LEFT JOIN LATERAL (SELECT * FROM dept_revenue.ror rr WHERE rr.ulpin = p.ulpin ORDER BY updated_at DESC NULLS LAST LIMIT 1) r ON TRUE
LEFT JOIN LATERAL (SELECT * FROM dept_registration.deeds dd WHERE dd.ulpin = p.ulpin ORDER BY registered_on DESC LIMIT 1) d ON TRUE
ORDER BY p.survey_no
LIMIT :limit
"""


def findings_from_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Pure evaluation of the SQL rows into findings (unit-testable without a DB)."""
    out: list[dict[str, Any]] = []
    for r in rows:
        base = {"ulpin": r["ulpin"], "survey_no": r.get("survey_no"), "village": r.get("village")}
        ror_extent, parcel_area = r.get("ror_extent_sqm"), r.get("parcel_area_sqm")
        deed_extent = r.get("deed_extent_sqm")
        reference = deed_extent or parcel_area  # deed extent when the deed carries one (story parcel 127/1)
        if ror_extent and reference and abs(float(ror_extent) - float(reference)) / float(reference) > AREA_TOLERANCE:
            out.append(
                {
                    **base,
                    "issue": "area_mismatch",
                    "severity": "medium",
                    "revenue": float(ror_extent),
                    "registration": float(deed_extent) if deed_extent else None,
                    "parcel": round(float(parcel_area), 2) if parcel_area else None,
                    "delta_pct": round((float(ror_extent) - float(reference)) / float(reference) * 100, 1),
                }
            )
        owner, claimant = r.get("ror_owner"), r.get("deed_claimant")
        if owner and claimant:
            score = name_score(owner, claimant)
            if score < OWNER_THRESHOLD:
                out.append(
                    {
                        **base,
                        "issue": "owner_mismatch",
                        "severity": "high",
                        "revenue": owner,
                        "registration": claimant,
                        "score": round(score, 1),
                        "doc_no": r.get("doc_no"),
                    }
                )
        if not r.get("ror_count"):
            out.append({**base, "issue": "missing_ror", "severity": "low", "note": "no Record of Rights for parcel"})
        if int(r.get("ror_count") or 0) > 1:
            out.append({**base, "issue": "duplicate_ror", "severity": "medium", "count": int(r["ror_count"])})
    # UI shape (web ConsistencyFinding): `field` mirrors `issue`, `values` holds the compared values.
    for f in out:
        f.setdefault("field", f["issue"])
        f.setdefault(
            "values",
            {
                k: v
                for k, v in f.items()
                if k not in ("ulpin", "survey_no", "village", "issue", "field", "severity", "values") and v is not None
            },
        )
    return out


@router.get("/consistency")
async def consistency(
    limit: int = Query(2000, ge=1, le=10000),
    issue: str | None = None,
    principal: Principal = Depends(require_admin),
    db: DBLike = Depends(get_db),
) -> dict[str, Any]:
    rows = await db.fetch(SQL, limit=limit)
    findings = findings_from_rows(rows)
    if issue:
        findings = [f for f in findings if f["issue"] == issue]
    summary: dict[str, int] = {}
    for f in findings:
        summary[f["issue"]] = summary.get(f["issue"], 0) + 1
    return {"parcels_checked": len(rows), "summary": summary, "items": findings}
