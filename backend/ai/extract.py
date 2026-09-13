"""Extract Record-of-Rights fields from a scanned document with Gemini (google-genai, optional extra `ai`).

`extract_ror(data, mime)` returns `{fields: {...}, confidence, model, raw}`; raises `NotConfigured` when no
GEMINI_API_KEY is set or the SDK is missing so the router can answer 503.
"""

from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from landstack.config import get_settings

FIELDS = [
    "survey_no",
    "sub_division",
    "khata_no",
    "owner_name",
    "father_name",
    "extent",
    "extent_unit",
    "classification",
    "village",
    "district",
    "state",
    "document_type",
    "document_no",
    "date",
]

PROMPT = (
    "You are extracting fields from an Indian land record (Record of Rights / patta / pahani / sale deed). "
    "Return ONLY a JSON object with the keys: " + ", ".join(FIELDS) + ". Use null when a field is not present. "
    "Extent must be a number and extent_unit one of sqm, hectare, acre, cent, sqft, sqyd, gunta. "
    "Add a key 'confidence' between 0 and 1 for the overall extraction."
)


class NotConfigured(Exception):
    """Raised when Gemini extraction cannot run in this deployment."""


def parse_model_json(text: str) -> dict[str, Any]:
    """Tolerant JSON parse (handles ```json fences and leading prose)."""
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        raise ValueError("no JSON object in model output")
    return json.loads(match.group(0))


async def extract_ror(
    data: bytes, mime: str, filename: str | None = None, model: str = "gemini-2.0-flash"
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise NotConfigured("GEMINI_API_KEY is not set; document extraction is disabled")
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise NotConfigured("google-genai is not installed (pip install 'landstack-api[ai]')") from exc

    def _call() -> str:
        client = genai.Client(api_key=settings.gemini_api_key)
        part = types.Part.from_bytes(data=data, mime_type=mime if mime != "application/octet-stream" else "image/jpeg")
        resp = client.models.generate_content(model=model, contents=[PROMPT, part])
        return resp.text or ""

    raw = await asyncio.to_thread(_call)
    parsed = parse_model_json(raw)
    confidence = parsed.pop("confidence", None)
    fields = {k: parsed.get(k) for k in FIELDS}
    return {"filename": filename, "model": model, "confidence": confidence, "fields": fields, "raw": raw[:4000]}
