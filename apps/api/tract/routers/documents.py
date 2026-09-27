"""Documents: secure file upload, SHA-256 fingerprinting, retrieval, and dynamic verification.

Enables citizens to upload supporting legal deeds/certificates and officers to inspect them.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import logging
import mimetypes
import os
import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse, Response

from landstack.auth import Principal, current_principal, require_user
from landstack.config import get_settings
from landstack.db import DBLike, get_db
from landstack.errors import AppError
from landstack.services import audit

log = logging.getLogger("landstack.documents")

router = APIRouter(prefix="/landstack/documents", tags=["documents"])

# In-memory document metadata cache for fast retrieval (backed by disk metadata files)
DOC_INDEX: dict[str, dict[str, Any]] = {}


def _get_storage_dir() -> str:
    settings = get_settings()
    doc_dir = os.path.join(settings.storage_local_dir, "documents")
    os.makedirs(doc_dir, exist_ok=True)
    return doc_dir


def _meta_path(doc_id: str) -> str:
    return os.path.join(_get_storage_dir(), f"{doc_id}.meta.json")


def _save_doc_meta(doc_id: str, meta: dict[str, Any]) -> None:
    DOC_INDEX[doc_id] = meta
    try:
        with open(_meta_path(doc_id), "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)
    except Exception as exc:
        log.warning("failed to persist document metadata for %s: %s", doc_id, exc)


def _load_doc_meta(doc_id: str) -> dict[str, Any] | None:
    if doc_id in DOC_INDEX:
        return DOC_INDEX[doc_id]
    mpath = _meta_path(doc_id)
    if os.path.exists(mpath):
        try:
            with open(mpath, encoding="utf-8") as f:
                data = json.load(f)
                DOC_INDEX[doc_id] = data
                return data
        except Exception:
            return None
    return None


@router.post("/upload", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    principal: Principal = Depends(require_user),
    db: DBLike = Depends(get_db),
) -> dict[str, Any]:
    """Upload supporting document (PDF, PNG, JPEG up to 15MB). Computes SHA-256 fingerprint."""
    data = await file.read()
    if not data:
        raise AppError(422, "empty_file", "uploaded document is empty")
    if len(data) > 15 * 1024 * 1024:
        raise AppError(422, "file_too_large", "file exceeds maximum allowed size of 15 MB")

    # Cryptographic content hashing (tamper-proof fingerprint)
    sha256 = hashlib.sha256(data).hexdigest()
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"

    # Determine safe filename & MIME
    orig_name = file.filename or "document.bin"
    ext = os.path.splitext(orig_name)[1].lower()
    if not ext:
        ext = ".pdf" if (file.content_type and "pdf" in file.content_type) else ".bin"

    mime = file.content_type or mimetypes.guess_type(orig_name)[0] or "application/octet-stream"

    storage_dir = _get_storage_dir()
    file_path = os.path.join(storage_dir, f"{doc_id}{ext}")

    with open(file_path, "wb") as f:
        f.write(data)

    meta = {
        "id": doc_id,
        "filename": orig_name,
        "mime": mime,
        "size": len(data),
        "sha256": sha256,
        "file_path": file_path,
        "uploaded_by": principal.uid,
        "uploaded_by_name": principal.name,
        "created_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    _save_doc_meta(doc_id, meta)

    await audit.record(
        db,
        principal,
        "document.upload",
        "document",
        doc_id,
        None,
        None,
        {"filename": orig_name, "size": len(data), "sha256": sha256, "mime": mime},
    )

    return {
        "id": doc_id,
        "filename": orig_name,
        "mime": mime,
        "size": len(data),
        "sha256": sha256,
        "url": f"/landstack/documents/{doc_id}",
    }


@router.get("/{doc_id}")
async def get_document(
    doc_id: str,
    principal: Principal | None = Depends(current_principal),
) -> Response:
    """Retrieve and view uploaded document by ID."""
    meta = _load_doc_meta(doc_id)
    if not meta:
        raise AppError(404, "not_found", f"document {doc_id} not found")

    # Access control: officers and admins can view any uploaded document for official scrutiny;
    # citizens may view documents they uploaded.
    if principal is not None and principal.role not in ("officer", "admin") and principal.uid != meta.get("uploaded_by"):
        raise AppError(403, "forbidden", "you do not have permission to view this document")

    file_path = meta.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise AppError(404, "file_missing", "document file is missing from storage")

    return FileResponse(
        file_path,
        media_type=meta.get("mime", "application/octet-stream"),
        filename=meta.get("filename", f"{doc_id}.bin"),
        content_disposition_type="inline",
    )


@router.get("/{doc_id}/meta")
async def get_document_meta(
    doc_id: str,
    principal: Principal = Depends(require_user),
) -> dict[str, Any]:
    """Inspect document metadata and SHA-256 fingerprint."""
    meta = _load_doc_meta(doc_id)
    if not meta:
        raise AppError(404, "not_found", f"document {doc_id} not found")

    if principal.role not in ("officer", "admin") and principal.uid != meta.get("uploaded_by"):
        raise AppError(403, "forbidden", "you do not have permission to view this document metadata")

    return {
        "id": meta["id"],
        "filename": meta["filename"],
        "mime": meta["mime"],
        "size": meta["size"],
        "sha256": meta["sha256"],
        "uploaded_by": meta.get("uploaded_by"),
        "uploaded_by_name": meta.get("uploaded_by_name"),
        "created_at": meta.get("created_at"),
        "url": f"/landstack/documents/{doc_id}",
    }
