"""Append-only audit trail into `landstack.audit_log`."""

from __future__ import annotations

import logging
from typing import Any

from landstack.auth import Principal
from landstack.db import DBLike, json_dumps

log = logging.getLogger("landstack.audit")


async def record(
    db: DBLike,
    principal: Principal | None,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    ulpin: str | None = None,
    before: Any = None,
    after: Any = None,
    source: str = "gateway",
) -> None:
    """Insert one audit row. Failures are logged, never propagated (audit must not break requests)."""
    try:
        await db.execute(
            """
            INSERT INTO landstack.audit_log
                (ts, actor_uid, actor_name, actor_role, action, entity_type, entity_id, ulpin, before, after, source)
            VALUES (now(), :actor_uid, :actor_name, :actor_role, :action, :entity_type, :entity_id, :ulpin,
                    CAST(:before AS jsonb), CAST(:after AS jsonb), :source)
            """,
            actor_uid=principal.uid if principal else "system",
            actor_name=principal.name if principal else "system",
            actor_role=principal.role if principal else "system",
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            ulpin=ulpin,
            before=json_dumps(before) if before is not None else None,
            after=json_dumps(after) if after is not None else None,
            source=source,
        )
    except Exception as exc:
        log.warning("audit insert failed (%s %s): %s", action, entity_id, exc)
