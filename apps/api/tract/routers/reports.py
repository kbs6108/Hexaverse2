"""Signed PDF reports: issue, download, verify."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Response

from landstack.auth import Principal, require_user
from landstack.db import DBLike, get_db
from landstack.errors import not_found
from landstack.services import reports
from landstack.services.storage import get_storage

router = APIRouter(tags=["reports"])


@router.post("/landstack/reports/{ulpin}", status_code=201)
async def issue_report(
    ulpin: str, principal: Principal = Depends(require_user), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    return await reports.create_report(db, ulpin, principal)


@router.get("/reports/{report_id}.pdf")
async def download_report(report_id: str, db: DBLike = Depends(get_db)) -> Response:
    row = await reports.get_report_row(db, report_id)
    data = await get_storage().get(row["storage_key"])
    if data is None:
        raise not_found("report file", report_id)
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{report_id}.pdf"', "X-Report-SHA256": row["sha256"]},
    )


@router.get("/verify/{report_id}")
async def verify(report_id: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    return await reports.verify_report(db, report_id)
