"""Event handler logic with the fake DB (deed → alert + system mutation application)."""

from __future__ import annotations

from landstack.services import aggregator
from landstack.services.events import handle_event


def _deed(claimant: str) -> dict:
    return {
        "event": "registration.deed_registered",
        "ulpin": "U1",
        "source": "IGRS",
        "occurred_at": "2026-09-13T08:00:00Z",
        "payload": {"doc_no": "DOC-2026-00099", "deed_type": "sale", "claimant": claimant},
    }


def _prime(fake_db, owner: str) -> None:
    fake_db.on("SELECT owner_name FROM dept_revenue.ror", [{"owner_name": owner}])
    fake_db.on("FROM landstack.alerts WHERE ulpin = :u AND kind = 'pending_mutation'", [])
    fake_db.on("FROM landstack.applications WHERE ulpin = :u AND type = 'mutation'", [])
    fake_db.on("SELECT 1 FROM landstack.parcels", [{"?column?": 1}])
    fake_db.on("SELECT max(substring(id from", [{"max": 41}])
    fake_db.on(
        "INSERT INTO landstack.applications",
        lambda p: [
            {
                "id": p["id"],
                "ulpin": p["ulpin"],
                "type": "mutation",
                "status": p["status"],
                "payload": p["payload"],
                "applicant_name": p["name"],
            }
        ],
    )


async def test_deed_with_mismatch_opens_alert_and_application(fake_db) -> None:
    _prime(fake_db, "Ravi Kumar")
    aggregator._cache.set("U1", {"ulpin": "U1"})
    out = await handle_event(fake_db, _deed("Lakshmi Devi"))
    assert out["accepted"] and out["mismatch"] is True and out["score"] < 85
    assert out["application_id"].startswith("APP-") and out["application_id"].endswith("000042")
    assert "alert_created" in out["actions"] and "mutation_application_created" in out["actions"]
    assert fake_db.executed_like("INSERT INTO landstack.alerts")
    assert fake_db.executed_like("INSERT INTO landstack.audit_log")
    assert aggregator._cache.get("U1") is None  # cache invalidated
    app_sql, params = (
        fake_db.queries[-1]
        if "applications" in fake_db.queries[-1][0]
        else next(q for q in fake_db.queries if "INSERT INTO landstack.applications" in q[0])
    )
    assert '"system_initiated": true' in params["payload"] and params["name"] == "Lakshmi Devi"


async def test_deed_matching_owner_is_quiet(fake_db) -> None:
    _prime(fake_db, "Ravi Kumar")
    out = await handle_event(fake_db, _deed("Kumar Ravi"))
    assert out["mismatch"] is False and out["score"] >= 85
    assert not fake_db.executed_like("INSERT INTO landstack.alerts")


async def test_other_and_bad_events(fake_db) -> None:
    out = await handle_event(fake_db, {"event": "revenue.ror_updated", "ulpin": "U1", "payload": {}})
    assert out["actions"] == ["cache_invalidated", "audited"]
    out = await handle_event(fake_db, {"event": "weather.rain", "ulpin": "U1"})
    assert "unknown_event_ignored" in out["actions"]
    assert (await handle_event(fake_db, {"event": "x"}))["accepted"] is False
