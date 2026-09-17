"""Revenue department (Meebhoomi-style Record of Rights). Schema: `dept_revenue`.

GET /ror?ulpin= · GET /ror/{khata_no} · POST /mutations {ulpin, to_owner, reason, application_id}
"""

from __future__ import annotations

from typing import Any

from fastapi import Depends
from pydantic import BaseModel

from departments.common import chaos, envelope, make_dept_app, require_found
from landstack.db import DBLike, get_db, json_dumps

SOURCE = "AP Meebhoomi (mock)"
app = make_dept_app(
    "revenue",
    "Revenue Department — Record of Rights",
    "Khata / pahani records with owner, extent and classification. Vocabulary: khata_no, owner_name, extent_sqm.",
    SOURCE,
)


class MutationIn(BaseModel):
    ulpin: str
    to_owner: str
    reason: str | None = None
    application_id: str | None = None


class ExtentIn(BaseModel):
    ulpin: str
    extent_sqm: float
    application_id: str | None = None


STATE_SOURCE = {"AP": "AP Meebhoomi (mock)", "TN": "TN Patta Chitta (mock)", "TG": "TG Dharani (mock)"}


def _source_for(rows: list[dict[str, Any]] | dict[str, Any] | None) -> str:
    """Label the envelope with the state system the row(s) came from (provenance honesty)."""
    row = rows[0] if isinstance(rows, list) and rows else rows if isinstance(rows, dict) else None
    state = str((row or {}).get("state") or "AP").upper()
    return STATE_SOURCE.get(state, SOURCE)


def _dialect(row: dict[str, Any] | None) -> dict[str, Any] | None:
    """Serve each state's real-world vocabulary (the interoperability story: the gateway's
    per-state adapter mappings translate these dialects back into the CDM).

    AP → Meebhoomi khata/owner/sqm (the table's native columns, unchanged);
    TN → Patta Chitta patta/pattadar/hectares; TG → Dharani passbook/pattadar/acres.
    """
    if row is None:
        return None
    state = str(row.get("state") or "AP").upper()
    if state == "TN":
        return {
            "state": state,
            "patta_no": row["khata_no"],
            "survey_no": row["survey_no"],
            "pattadar_name": row["owner_name"],
            "relation_name": row["father_name"],
            "tenure": row["ownership_type"],
            "extent_hectares": round(float(row["extent_sqm"]) / 10_000.0, 6),
            "land_class": row["classification"],
            "mutation_history": row["mutation_history"],
            "nominees": row.get("nominees"),
            "updated_at": row["updated_at"],
        }
    if state == "TG":
        return {
            "state": state,
            "ppb_no": row["khata_no"],
            "survey_no": row["survey_no"],
            "pattadar_name": row["owner_name"],
            "father_husband_name": row["father_name"],
            "land_nature": row["ownership_type"],
            "extent_acres": round(float(row["extent_sqm"]) / 4046.8564224, 6),
            "land_classification": row["classification"],
            "mutation_history": row["mutation_history"],
            "nominees": row.get("nominees"),
            "updated_at": row["updated_at"],
        }
    return row


@app.get("/ror", dependencies=[Depends(chaos)])
async def ror_by_ulpin(ulpin: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    rows = await db.fetch(
        "SELECT * FROM dept_revenue.ror WHERE ulpin = :u ORDER BY updated_at DESC NULLS LAST", u=ulpin
    )
    return envelope(_source_for(rows), count=len(rows), items=[_dialect(r) for r in rows])


@app.get("/ror/{khata_no}", dependencies=[Depends(chaos)])
async def ror_by_khata(khata_no: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    row = require_found(
        await db.fetchrow("SELECT * FROM dept_revenue.ror WHERE khata_no = :k", k=khata_no), "khata", khata_no
    )
    return envelope(_source_for(row), item=_dialect(row))


@app.post("/extent", status_code=200)
async def sync_extent(body: ExtentIn, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    """Resurvey/boundary-correction hook: update the RoR extent after an approved
    boundary correction, recording the change in mutation_history (CONTRACTS §7)."""
    async with db.transaction():
        ror = await db.fetchrow(
            "SELECT * FROM dept_revenue.ror WHERE ulpin = :u ORDER BY updated_at DESC NULLS LAST LIMIT 1 FOR UPDATE",
            u=body.ulpin,
        )
        if ror is None:
            return envelope(SOURCE, updated=False, reason="no RoR for parcel")
        history = list(ror.get("mutation_history") or [])
        history.append(
            {
                "type": "extent_correction",
                "from_extent_sqm": float(ror["extent_sqm"]),
                "to_extent_sqm": round(body.extent_sqm, 2),
                "application_id": body.application_id,
            }
        )
        await db.execute(
            "UPDATE dept_revenue.ror SET extent_sqm = :e, mutation_history = CAST(:h AS jsonb), updated_at = now() "
            "WHERE khata_no = :k",
            e=round(body.extent_sqm, 2),
            h=json_dumps(history),
            k=ror["khata_no"],
        )
    return envelope(_source_for(dict(ror)), updated=True, khata_no=ror["khata_no"], extent_sqm=round(body.extent_sqm, 2))


@app.post("/mutations", status_code=201)
async def record_mutation(body: MutationIn, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    """Apply a mutation: insert the mutation row and update the RoR owner + mutation_history."""
    async with db.transaction():
        ror = await db.fetchrow(
            "SELECT * FROM dept_revenue.ror WHERE ulpin = :u ORDER BY updated_at DESC NULLS LAST LIMIT 1 FOR UPDATE",
            u=body.ulpin,
        )
        from_owner = ror["owner_name"] if ror else None
        mutation = await db.fetchrow(
            """
            INSERT INTO dept_revenue.mutations (ulpin, from_owner, to_owner, reason, application_id, created_at)
            VALUES (:u, :f, :t, :r, :a, now()) RETURNING *
            """,
            u=body.ulpin,
            f=from_owner,
            t=body.to_owner,
            r=body.reason,
            a=body.application_id,
        )
        if ror:
            history = list(ror.get("mutation_history") or [])
            history.append(
                {
                    "date": str((mutation or {}).get("created_at", ""))[:10],
                    "from": from_owner,
                    "to": body.to_owner,
                    "reason": body.reason,
                    "application_id": body.application_id,
                }
            )
            await db.execute(
                "UPDATE dept_revenue.ror SET owner_name = :t, mutation_history = CAST(:h AS jsonb), updated_at = now() "
                "WHERE khata_no = :k",
                t=body.to_owner,
                h=json_dumps(history),
                k=ror["khata_no"],
            )
    return envelope(SOURCE, item=mutation, ror_updated=bool(ror), from_owner=from_owner)
