"""Registration department (IGRS/CARD-style deeds & encumbrances). Schema: `dept_registration`.

GET /deeds?ulpin= · GET /encumbrances?ulpin=&active=1 · POST /deeds → inserts deed, writes outbox,
POSTs `registration.deed_registered` to the gateway (`/landstack/events`) and marks the outbox delivered.
"""

from __future__ import annotations

import datetime as dt
import logging
from typing import Any

from fastapi import Depends
from pydantic import BaseModel

from departments.common import chaos, envelope, make_dept_app, now_iso
from landstack.adapters import client
from landstack.config import Settings, get_settings
from landstack.db import DBLike, get_db, json_dumps

log = logging.getLogger("departments.registration")
SOURCE = "AP IGRS / CARD (mock)"
app = make_dept_app(
    "registration",
    "Registration Department — Deeds & Encumbrances",
    "Sub-registrar office records: registered documents (doc_no, executant, claimant) and encumbrances.",
    SOURCE,
)


class DeedIn(BaseModel):
    ulpin: str
    deed_type: str = "sale"
    executant: str
    claimant: str
    consideration: float | None = None
    sro_code: str | None = None


@app.get("/deeds", dependencies=[Depends(chaos)])
async def deeds(ulpin: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    rows = await db.fetch(
        "SELECT * FROM dept_registration.deeds WHERE ulpin = :u ORDER BY registered_on DESC, doc_no DESC", u=ulpin
    )
    return envelope(SOURCE, count=len(rows), items=rows)


@app.get("/encumbrances", dependencies=[Depends(chaos)])
async def encumbrances(ulpin: str, active: int | None = None, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    sql = "SELECT * FROM dept_registration.encumbrances WHERE ulpin = :u"
    if active:
        sql += " AND active IS TRUE"
    rows = await db.fetch(sql + " ORDER BY from_date DESC NULLS LAST", u=ulpin)
    return envelope(SOURCE, count=len(rows), items=rows)


async def deliver_event(db: DBLike, outbox_id: int, event: dict[str, Any], settings: Settings) -> bool:
    """POST the event to the gateway; mark `delivered_at` on success. Failures leave the outbox row undelivered."""
    try:
        await client.post_json(
            "/landstack/events", event, headers={"X-Events-Secret": settings.events_shared_secret}, timeout=10.0
        )
    except Exception as exc:
        log.warning("event delivery failed for outbox %s: %s", outbox_id, exc)
        return False
    await db.execute("UPDATE dept_registration.outbox SET delivered_at = now() WHERE id = :id", id=outbox_id)
    return True


@app.post("/deeds", status_code=201)
async def register_deed(
    body: DeedIn, db: DBLike = Depends(get_db), settings: Settings = Depends(get_settings)
) -> dict[str, Any]:
    year = dt.date.today().year
    async with db.transaction():
        await db.execute("SELECT pg_advisory_xact_lock(hashtext('dept_registration.deeds.doc_no'))")
        seq = await db.fetchval(
            "SELECT count(*) + 1 FROM dept_registration.deeds WHERE doc_no LIKE :p", p=f"DOC-{year}-%"
        )
        doc_no = f"DOC-{year}-{int(seq or 1):05d}"
        deed = await db.fetchrow(
            """
            INSERT INTO dept_registration.deeds (doc_no, ulpin, deed_type, executant, claimant, consideration, registered_on, sro_code)
            VALUES (:doc, :u, :t, :e, :c, :cons, CURRENT_DATE, :sro) RETURNING *
            """,
            doc=doc_no,
            u=body.ulpin,
            t=body.deed_type,
            e=body.executant,
            c=body.claimant,
            cons=body.consideration,
            sro=body.sro_code or "GNT-02",
        )
        event = {
            "event": "registration.deed_registered",
            "ulpin": body.ulpin,
            "source": SOURCE,
            "occurred_at": now_iso(),
            "payload": {
                "doc_no": doc_no,
                "deed_type": body.deed_type,
                "executant": body.executant,
                "claimant": body.claimant,
                "consideration": body.consideration,
            },
        }
        outbox_id = await db.fetchval(
            "INSERT INTO dept_registration.outbox (event, ulpin, payload, created_at) VALUES (:e, :u, CAST(:p AS jsonb), now()) RETURNING id",
            e=event["event"],
            u=body.ulpin,
            p=json_dumps(event["payload"]),
        )
    delivered = await deliver_event(db, int(outbox_id), event, settings)
    return envelope(SOURCE, item=deed, event=event["event"], outbox_id=outbox_id, delivered=delivered)


@app.get("/outbox")
async def outbox(undelivered: int = 0, limit: int = 50, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    sql = (
        "SELECT * FROM dept_registration.outbox"
        + (" WHERE delivered_at IS NULL" if undelivered else "")
        + " ORDER BY created_at DESC LIMIT :l"
    )
    rows = await db.fetch(sql, l=limit)
    return envelope(SOURCE, count=len(rows), items=rows)
