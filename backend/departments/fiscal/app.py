"""Fiscal department (municipal property tax & guideline valuation). Schema: `dept_fiscal`.

GET /tax?ulpin= · GET /valuation?ulpin=
"""

from __future__ import annotations

from typing import Any

from fastapi import Depends

from departments.common import chaos, envelope, make_dept_app
from landstack.db import DBLike, get_db

SOURCE = "AP CDMA Property Tax (mock)"
app = make_dept_app(
    "fiscal",
    "Fiscal — Property Tax & Valuation",
    "Assessment register (annual demand, arrears) and guideline (circle) values per sqm.",
    SOURCE,
)


@app.get("/tax", dependencies=[Depends(chaos)])
async def tax(ulpin: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    row = await db.fetchrow(
        "SELECT * FROM dept_fiscal.property_tax WHERE ulpin = :u ORDER BY assessment_no LIMIT 1", u=ulpin
    )
    return envelope(SOURCE, item=row)


@app.get("/valuation", dependencies=[Depends(chaos)])
async def valuation(ulpin: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    row = await db.fetchrow("SELECT * FROM dept_fiscal.valuation WHERE ulpin = :u", u=ulpin)
    return envelope(SOURCE, item=row)
