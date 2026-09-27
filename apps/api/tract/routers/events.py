"""`POST /landstack/events` — department webhooks authenticated with `X-Events-Secret`."""

from __future__ import annotations

import hmac
from typing import Any

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, Field

from landstack.config import Settings, get_settings
from landstack.db import DBLike, get_db
from landstack.errors import unauthorized
from landstack.services.events import handle_event

router = APIRouter(prefix="/landstack", tags=["events"])


class EventBody(BaseModel):
    event: str
    ulpin: str
    source: str | None = None
    occurred_at: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


@router.post("/events", status_code=202)
async def receive_event(
    body: EventBody,
    x_events_secret: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
    db: DBLike = Depends(get_db),
) -> dict[str, Any]:
    if not x_events_secret or not hmac.compare_digest(x_events_secret, settings.events_shared_secret):
        raise unauthorized("invalid X-Events-Secret")
    return await handle_event(db, body.model_dump())
