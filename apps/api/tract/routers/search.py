"""`GET /landstack/search?q=` — ULPIN / survey no / khata always; owner names for officer+ only."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from landstack.auth import Principal, current_principal
from landstack.db import DBLike, get_db

router = APIRouter(prefix="/landstack", tags=["search"])


@router.get("/search")
async def search(
    q: str = Query(..., min_length=1, max_length=80),
    limit: int = Query(20, ge=1, le=100),
    principal: Principal | None = Depends(current_principal),
    db: DBLike = Depends(get_db),
) -> dict[str, Any]:
    term = q.strip()
    like = f"%{term}%"
    items: list[dict[str, Any]] = []
    seen: set[str] = set()

    def add(rows: list[dict[str, Any]], match_type: str) -> None:
        for r in rows:
            if r["ulpin"] in seen:
                continue
            seen.add(r["ulpin"])
            items.append({**r, "match_type": match_type})

    base_cols = "p.ulpin, p.survey_no, p.village, p.land_use, ST_X(ST_PointOnSurface(p.geom)) AS lon, ST_Y(ST_PointOnSurface(p.geom)) AS lat"
    add(
        await db.fetch(
            f"SELECT {base_cols}, p.ulpin AS label FROM landstack.parcels p WHERE p.ulpin ILIKE :like "
            "ORDER BY p.ulpin LIMIT :limit",
            like=f"{term}%",
            limit=limit,
        ),
        "ulpin",
    )
    add(
        await db.fetch(
            f"SELECT {base_cols}, 'Survey ' || p.survey_no AS label FROM landstack.parcels p "
            "WHERE p.survey_no ILIKE :like ORDER BY similarity(p.survey_no, :term) DESC, p.survey_no LIMIT :limit",
            like=like,
            term=term,
            limit=limit,
        ),
        "survey_no",
    )
    add(
        await db.fetch(
            f"SELECT {base_cols}, 'Khata ' || r.khata_no AS label FROM dept_revenue.ror r "
            "JOIN landstack.parcels p ON p.ulpin = r.ulpin WHERE r.khata_no ILIKE :like LIMIT :limit",
            like=like,
            limit=limit,
        ),
        "khata_no",
    )
    owner_search = bool(principal and principal.is_officer)
    if owner_search:
        add(
            await db.fetch(
                f"SELECT {base_cols}, r.owner_name AS label FROM dept_revenue.ror r "
                "JOIN landstack.parcels p ON p.ulpin = r.ulpin WHERE r.owner_name ILIKE :like "
                "OR similarity(r.owner_name, :term) > 0.3 ORDER BY similarity(r.owner_name, :term) DESC LIMIT :limit",
                like=like,
                term=term,
                limit=limit,
            ),
            "owner_name",
        )
    for it in items:
        it["centroid"] = [it.pop("lon", None), it.pop("lat", None)]
    return {"q": term, "owner_search": owner_search, "items": items[:limit]}
