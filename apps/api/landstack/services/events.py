"""Department → gateway event handling (`POST /landstack/events`).

* `registration.deed_registered`: invalidate the CDM cache, audit, compare the deed claimant with the
  RoR owner; on mismatch raise a `pending_mutation` alert and open a system-initiated mutation application.
* `revenue.ror_updated`, `planning.permission_issued`: invalidate + audit.
"""

from __future__ import annotations

import logging
from typing import Any

from landstack.auth import Principal
from landstack.db import DBLike, json_dumps
from landstack.services import audit, workflow
from landstack.services.consistency import name_score

log = logging.getLogger("landstack.events")

KNOWN_EVENTS = ("registration.deed_registered", "revenue.ror_updated", "planning.permission_issued")
SYSTEM = Principal(uid="system", name="Land Stack events", role="admin")


def _invalidate(ulpin: str) -> None:
    from landstack.services import aggregator

    aggregator.invalidate(ulpin)


async def handle_event(db: DBLike, event: dict[str, Any]) -> dict[str, Any]:
    """Dispatch one event body `{event, ulpin, source, occurred_at, payload}`; returns a summary."""
    name = event.get("event")
    ulpin = event.get("ulpin")
    payload = event.get("payload") or {}
    if not name or not ulpin:
        return {"accepted": False, "reason": "event and ulpin are required"}
    _invalidate(ulpin)
    await audit.record(
        db, SYSTEM, f"event.{name}", "parcel", ulpin, ulpin, None, event, source=event.get("source") or "event"
    )
    summary: dict[str, Any] = {
        "accepted": True,
        "event": name,
        "ulpin": ulpin,
        "actions": ["cache_invalidated", "audited"],
    }
    if name == "registration.deed_registered":
        summary.update(await _on_deed_registered(db, ulpin, payload))
    elif name not in KNOWN_EVENTS:
        summary["actions"].append("unknown_event_ignored")
    return summary


async def _on_deed_registered(db: DBLike, ulpin: str, payload: dict[str, Any]) -> dict[str, Any]:
    claimant = payload.get("claimant")
    if not claimant:
        return {"claimant_checked": False}
    owner = await db.fetchval(
        "SELECT owner_name FROM dept_revenue.ror WHERE ulpin = :u ORDER BY updated_at DESC NULLS LAST LIMIT 1", u=ulpin
    )
    score = name_score(owner, claimant)
    if owner and score >= 85:
        return {"claimant_checked": True, "ror_owner": owner, "score": score, "mismatch": False}
    detail = {
        "ror_owner": owner,
        "claimant": claimant,
        "score": score,
        "doc_no": payload.get("doc_no"),
        "deed_type": payload.get("deed_type"),
    }
    open_app = await db.fetchval(
        "SELECT id FROM landstack.applications WHERE ulpin = :u AND type = 'mutation' "
        "AND status NOT IN ('approved','rejected') LIMIT 1",
        u=ulpin,
    )
    app_id = open_app
    actions = []
    if not open_app:
        app = await workflow.create_application(
            db,
            SYSTEM,
            ulpin,
            "mutation",
            {"from_owner": owner, "to_owner": claimant, "reason": "deed registered", "doc_no": payload.get("doc_no")},
            applicant_name=claimant,
            system_initiated=True,
        )
        app_id = app.get("id")
        actions.append("mutation_application_created")
    detail["application_id"] = app_id
    existing = await db.fetchval(
        "SELECT id FROM landstack.alerts WHERE ulpin = :u AND kind = 'pending_mutation' AND status <> 'resolved' LIMIT 1",
        u=ulpin,
    )
    if not existing:
        await db.execute(
            """
            INSERT INTO landstack.alerts (ulpin, kind, severity, title, detail, status, created_at)
            VALUES (:u, 'pending_mutation', 'medium', :title, CAST(:detail AS jsonb), 'open', now())
            """,
            u=ulpin,
            title=f"Deed registered to {claimant}; RoR still shows {owner or 'no owner'}",
            detail=json_dumps(detail),
        )
        actions.append("alert_created")
    return {
        "claimant_checked": True,
        "ror_owner": owner,
        "score": score,
        "mismatch": True,
        "application_id": app_id,
        "actions": ["cache_invalidated", "audited", *actions],
    }
