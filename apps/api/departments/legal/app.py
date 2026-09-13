"""Legal (court disputes). Schema: `dept_legal`.  GET /disputes?ulpin="""

from __future__ import annotations

from typing import Any

from fastapi import Depends

from departments.common import chaos, envelope, make_dept_app
from landstack.db import DBLike, get_db

SOURCE = "eCourts / NJDG (mock)"
app = make_dept_app("legal", "Legal — Court Disputes", "Pending and disposed civil cases touching a parcel.", SOURCE)


@app.get("/disputes", dependencies=[Depends(chaos)])
async def disputes(ulpin: str, status: str | None = None, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    sql = "SELECT * FROM dept_legal.disputes WHERE ulpin = :u"
    params: dict[str, Any] = {"u": ulpin}
    if status:
        sql += " AND status = :s"
        params["s"] = status
    rows = await db.fetch(sql + " ORDER BY filed_on DESC NULLS LAST", **params)
    return envelope(SOURCE, count=len(rows), items=rows)
