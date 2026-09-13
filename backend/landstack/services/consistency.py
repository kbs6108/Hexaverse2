"""Cross-department consistency checks on a merged CDM.

* area mismatch: |ror.extent_sqm − reference area| / reference > 3 % (reference = deed area if the
  registration fragment carries one, else the PostGIS parcel area);
* owner mismatch: rapidfuzz token_set_ratio(ror owner, latest deed claimant) < 85.
"""

from __future__ import annotations

from typing import Any

from rapidfuzz import fuzz

AREA_TOLERANCE = 0.03
OWNER_THRESHOLD = 85


def name_score(a: str | None, b: str | None) -> float:
    if not a or not b:
        return 0.0
    return float(fuzz.token_set_ratio(str(a).lower().strip(), str(b).lower().strip()))


def names_match(a: str | None, b: str | None, threshold: float = OWNER_THRESHOLD) -> bool:
    return name_score(a, b) >= threshold


def area_mismatch(a: float | None, b: float | None, tolerance: float = AREA_TOLERANCE) -> bool:
    if a is None or b is None or not b:
        return False
    return abs(float(a) - float(b)) / float(b) > tolerance


def check(cdm: dict[str, Any]) -> dict[str, Any]:
    """Return `{area_match, owner_match, issues[]}` for a CDM dict."""
    issues: list[dict[str, Any]] = []
    rights = cdm.get("rights") or {}
    ror = rights.get("ror") or {}
    reg = rights.get("registration") or {}
    spatial = cdm.get("spatial") or {}

    ror_extent = ror.get("extent_sqm")
    deed_area = reg.get("extent_sqm")
    parcel_area = spatial.get("area_sqm")
    reference = deed_area if deed_area else parcel_area
    area_ok = not area_mismatch(ror_extent, reference)
    if not area_ok:
        issues.append(
            {
                "field": "extent_sqm",
                "severity": "medium",
                "revenue": ror_extent,
                "registration": deed_area,
                "parcel": parcel_area,
                "note": f"RoR extent differs from {'deed' if deed_area else 'surveyed'} area by more than 3%",
            }
        )

    owners = (cdm.get("party") or {}).get("owners") or []
    ror_owner = owners[0].get("name") if owners else None
    claimant = reg.get("claimant")
    owner_ok = True
    if ror_owner and claimant:
        score = name_score(ror_owner, claimant)
        owner_ok = score >= OWNER_THRESHOLD
        if not owner_ok:
            issues.append(
                {
                    "field": "owner_name",
                    "severity": "high",
                    "revenue": ror_owner,
                    "registration": claimant,
                    "parcel": None,
                    "note": f"RoR owner and latest deed claimant differ (similarity {score:.0f})",
                }
            )
    return {"area_match": area_ok, "owner_match": owner_ok, "issues": issues}
