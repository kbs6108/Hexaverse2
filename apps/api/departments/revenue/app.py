"""Revenue department (Meebhoomi-style Record of Rights). Schema: `dept_revenue`.

GET /ror?ulpin= · GET /ror/{khata_no} · POST /mutations {ulpin, to_owner, reason, application_id}
"""

from __future__ import annotations

import datetime as dt
import re
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
    father_name: str | None = None
    nominees: list[dict[str, Any]] | None = None
    doc_no: str | None = None


class ExtentIn(BaseModel):
    ulpin: str
    extent_sqm: float
    application_id: str | None = None


class CorrectionIn(BaseModel):
    ulpin: str
    field: str
    corrected_value: str
    description: str | None = None
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
                    "doc_no": body.doc_no,
                }
            )
            # Nominees: reset to empty list for new owner unless explicit new nominees provided
            new_nominees = json_dumps(body.nominees if body.nominees is not None else [])
            await db.execute(
                """
                UPDATE dept_revenue.ror
                SET owner_name = :t,
                    father_name = :fn,
                    nominees = CAST(:nom AS jsonb),
                    mutation_history = CAST(:h AS jsonb),
                    updated_at = now()
                WHERE khata_no = :k
                """,
                t=body.to_owner,
                fn=body.father_name,
                nom=new_nominees,
                h=json_dumps(history),
                k=ror["khata_no"],
            )
    return envelope(SOURCE, item=mutation, ror_updated=bool(ror), from_owner=from_owner)


@app.post("/correction", status_code=200)
async def apply_correction(body: CorrectionIn, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    """Record correction hook: apply approved rectification to RoR (owner_name, extent,
    classification, khata_no, father_name, survey_no), recording the change in mutation_history."""
    async with db.transaction():
        ror = await db.fetchrow(
            "SELECT * FROM dept_revenue.ror WHERE ulpin = :u ORDER BY updated_at DESC NULLS LAST LIMIT 1 FOR UPDATE",
            u=body.ulpin,
        )
        if ror is None:
            return envelope(SOURCE, updated=False, reason="no RoR for parcel")

        history = list(ror.get("mutation_history") or [])
        today_str = str(dt.date.today())
        field = body.field.lower().strip()
        val: Any = body.corrected_value.strip()
        from_val: Any = None
        mutation_row = None

        if field in ("owner_name", "name", "pattadar_name"):
            from_val = ror["owner_name"]
            mutation_row = await db.fetchrow(
                """
                INSERT INTO dept_revenue.mutations (ulpin, from_owner, to_owner, reason, application_id, created_at)
                VALUES (:u, :f, :t, :r, :a, now()) RETURNING *
                """,
                u=body.ulpin,
                f=from_val,
                t=val,
                r=body.description or f"Record correction: owner name rectified from {from_val} to {val}",
                a=body.application_id,
            )
            history.append(
                {
                    "date": today_str,
                    "type": "record_correction",
                    "field": "owner_name",
                    "from": from_val,
                    "to": val,
                    "reason": body.description or "Rectification of name in Record of Rights",
                    "application_id": body.application_id,
                }
            )
            await db.execute(
                """
                UPDATE dept_revenue.ror
                SET owner_name = :val,
                    mutation_history = CAST(:h AS jsonb),
                    updated_at = now()
                WHERE khata_no = :k
                """,
                val=val,
                h=json_dumps(history),
                k=ror["khata_no"],
            )
        elif field in ("extent", "extent_sqm", "area"):
            from_val = float(ror["extent_sqm"])
            val_num = from_val
            try:
                cleaned = re.sub(r"[^\d.]", "", str(val))
                if "acre" in str(val).lower():
                    val_num = round(float(cleaned) * 4046.8564224, 2)
                elif "cent" in str(val).lower():
                    val_num = round(float(cleaned) * 40.468564224, 2)
                else:
                    val_num = round(float(cleaned), 2)
            except Exception:
                val_num = from_val

            history.append(
                {
                    "date": today_str,
                    "type": "record_correction",
                    "field": "extent_sqm",
                    "from": from_val,
                    "to": val_num,
                    "reason": body.description or "Rectification of extent in Record of Rights",
                    "application_id": body.application_id,
                }
            )
            await db.execute(
                """
                UPDATE dept_revenue.ror
                SET extent_sqm = :val,
                    mutation_history = CAST(:h AS jsonb),
                    updated_at = now()
                WHERE khata_no = :k
                """,
                val=val_num,
                h=json_dumps(history),
                k=ror["khata_no"],
            )
            val = val_num
        elif field in ("classification", "land_class", "land_classification"):
            from_val = ror["classification"]
            c_norm = str(val).lower().replace(" ", "_")
            if "wet" in c_norm:
                c_norm = "wet"
            elif "gram" in c_norm:
                c_norm = "gramakantam"
            elif "govt" in c_norm or "poramboke" in c_norm:
                c_norm = "govt_poramboke"
            else:
                c_norm = "dry"

            history.append(
                {
                    "date": today_str,
                    "type": "record_correction",
                    "field": "classification",
                    "from": from_val,
                    "to": c_norm,
                    "reason": body.description or "Rectification of land classification",
                    "application_id": body.application_id,
                }
            )
            await db.execute(
                """
                UPDATE dept_revenue.ror
                SET classification = :val,
                    mutation_history = CAST(:h AS jsonb),
                    updated_at = now()
                WHERE khata_no = :k
                """,
                val=c_norm,
                h=json_dumps(history),
                k=ror["khata_no"],
            )
            val = c_norm
        elif field in ("khata_no", "patta_no", "ppb_no"):
            from_val = ror["khata_no"]
            history.append(
                {
                    "date": today_str,
                    "type": "record_correction",
                    "field": "khata_no",
                    "from": from_val,
                    "to": val,
                    "reason": body.description or "Rectification of Khata number",
                    "application_id": body.application_id,
                }
            )
            await db.execute(
                """
                UPDATE dept_revenue.ror
                SET khata_no = :val,
                    mutation_history = CAST(:h AS jsonb),
                    updated_at = now()
                WHERE khata_no = :k
                """,
                val=val,
                h=json_dumps(history),
                k=ror["khata_no"],
            )
        elif field in ("father_name", "relation_name", "father_husband_name"):
            from_val = ror["father_name"]
            history.append(
                {
                    "date": today_str,
                    "type": "record_correction",
                    "field": "father_name",
                    "from": from_val,
                    "to": val,
                    "reason": body.description or "Rectification of parent/spouse name",
                    "application_id": body.application_id,
                }
            )
            await db.execute(
                """
                UPDATE dept_revenue.ror
                SET father_name = :val,
                    mutation_history = CAST(:h AS jsonb),
                    updated_at = now()
                WHERE khata_no = :k
                """,
                val=val,
                h=json_dumps(history),
                k=ror["khata_no"],
            )
        elif field in ("survey_no", "sy_no"):
            from_val = ror["survey_no"]
            history.append(
                {
                    "date": today_str,
                    "type": "record_correction",
                    "field": "survey_no",
                    "from": from_val,
                    "to": val,
                    "reason": body.description or "Rectification of Survey number",
                    "application_id": body.application_id,
                }
            )
            await db.execute(
                """
                UPDATE dept_revenue.ror
                SET survey_no = :val,
                    mutation_history = CAST(:h AS jsonb),
                    updated_at = now()
                WHERE khata_no = :k
                """,
                val=val,
                h=json_dumps(history),
                k=ror["khata_no"],
            )
        else:
            history.append(
                {
                    "date": today_str,
                    "type": "record_correction",
                    "field": field,
                    "from": None,
                    "to": val,
                    "reason": body.description or "Rectification of record details",
                    "application_id": body.application_id,
                }
            )
            await db.execute(
                """
                UPDATE dept_revenue.ror
                SET mutation_history = CAST(:h AS jsonb),
                    updated_at = now()
                WHERE khata_no = :k
                """,
                h=json_dumps(history),
                k=ror["khata_no"],
            )

    return envelope(
        SOURCE,
        updated=True,
        field=field,
        from_value=from_val,
        to_value=val,
        ulpin=body.ulpin,
        mutation_item=mutation_row,
    )
