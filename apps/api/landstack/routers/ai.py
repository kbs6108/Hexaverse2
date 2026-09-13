"""AI endpoints: Sentinel-2 change detection (data lane module) and Gemini document extraction (optional)."""

from __future__ import annotations

import inspect
from typing import Any

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel, model_validator

from landstack.auth import Principal, require_officer
from landstack.config import get_settings
from landstack.db import DBLike, get_db
from landstack.errors import AppError
from landstack.services import audit

router = APIRouter(prefix="/landstack/ai", tags=["ai"])


class ChangeDetectionBody(BaseModel):
    ulpin: str | None = None
    bbox: list[float] | None = None
    date_a: str | None = None
    date_b: str | None = None

    @model_validator(mode="after")
    def _one_of(self) -> ChangeDetectionBody:
        if not self.ulpin and not self.bbox:
            raise ValueError("ulpin or bbox is required")
        if self.bbox and len(self.bbox) != 4:
            raise ValueError("bbox must have 4 numbers")
        return self


@router.post("/change-detection")
async def change_detection(
    body: ChangeDetectionBody, principal: Principal = Depends(require_officer), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    try:
        from ai import change_detection as cd  # written by the data lane; imported lazily
    except ImportError as exc:
        raise AppError(503, "ai_unavailable", f"change detection module unavailable: {exc}") from exc
    detect = getattr(cd, "detect", None)
    if detect is None:
        raise AppError(503, "ai_unavailable", "ai.change_detection.detect not found")
    params = inspect.signature(detect).parameters
    candidates: dict[str, Any] = {
        "ulpin": body.ulpin,
        "bbox": body.bbox,
        "date_a": body.date_a,
        "date_b": body.date_b,
        "db": db,
        "settings": get_settings(),
    }
    kwargs = {k: v for k, v in candidates.items() if k in params}
    try:
        result = detect(**kwargs)
        if inspect.isawaitable(result):
            result = await result
    except Exception as exc:
        if type(exc).__name__ == "ChangeDetectionError":
            raise AppError(422, "change_detection_failed", str(exc)) from exc
        raise
    await audit.record(
        db,
        principal,
        "ai.change_detection",
        "parcel",
        body.ulpin,
        body.ulpin,
        None,
        {"bbox": body.bbox, "label": (result or {}).get("label") if isinstance(result, dict) else None},
    )
    return result if isinstance(result, dict) else {"result": result}


@router.post("/extract-document")
async def extract_document(
    file: UploadFile = File(...), principal: Principal = Depends(require_officer), db: DBLike = Depends(get_db)
) -> dict[str, Any]:
    from ai.extract import NotConfigured, extract_ror

    data = await file.read()
    if not data:
        raise AppError(422, "empty_file", "uploaded file is empty")
    try:
        result = await extract_ror(data, file.content_type or "application/octet-stream", filename=file.filename)
    except NotConfigured as exc:
        raise AppError(503, "ai_not_configured", str(exc)) from exc
    await audit.record(
        db,
        principal,
        "ai.extract_document",
        "document",
        file.filename,
        None,
        None,
        {"fields": sorted((result.get("fields") or {}).keys())},
    )
    return result
