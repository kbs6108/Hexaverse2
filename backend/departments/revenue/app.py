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


@app.get("/ror", dependencies=[Depends(chaos)])
async def ror_by_ulpin(ulpin: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    rows = await db.fetch(
        "SELECT * FROM dept_revenue.ror WHERE ulpin = :u ORDER BY updated_at DESC NULLS LAST", u=ulpin
    )
    return envelope(SOURCE, count=len(rows), items=rows)


@app.get("/ror/{khata_no}", dependencies=[Depends(chaos)])
async def ror_by_khata(khata_no: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    row = require_found(
        await db.fetchrow("SELECT * FROM dept_revenue.ror WHERE khata_no = :k", k=khata_no), "khata", khata_no
    )
    return envelope(SOURCE, item=row)


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
