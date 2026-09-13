"""Utilities (water / electricity / sewer / road access). Schema: `dept_utilities`.  GET /connections?ulpin="""

from __future__ import annotations

from typing import Any

from fastapi import Depends

from departments.common import chaos, envelope, make_dept_app
from landstack.db import DBLike, get_db

SOURCE = "ULB Utilities (mock)"
app = make_dept_app(
    "utilities", "Utilities — Connections & Access", "Service connections and road access per parcel.", SOURCE
)


@app.get("/connections", dependencies=[Depends(chaos)])
async def connections(ulpin: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    row = await db.fetchrow("SELECT * FROM dept_utilities.connections WHERE ulpin = :u", u=ulpin)
    return envelope(SOURCE, item=row)
