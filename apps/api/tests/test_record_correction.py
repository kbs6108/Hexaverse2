"""Test that record corrections and complaints update all dimensions of the parcel and profile."""

import pytest
from unittest.mock import AsyncMock, patch
from landstack.auth import Principal
from landstack.services.workflow import run_side_effects

TAHSILDAR = Principal(uid="o1", name="Anitha", role="officer", department="revenue", designation="tahsildar")


@pytest.mark.asyncio
async def test_record_correction_owner_name_side_effects() -> None:
    executed_statements = []

    class MockDB:
        async def fetchval(self, sql, **params):
            return None

        async def fetchrow(self, sql, **params):
            return None

        async def execute(self, sql, **params):
            executed_statements.append((sql.strip(), params))
            return "UPDATE 1"

    app = {
        "id": "APP-2026-000018",
        "ulpin": "TFCM916196F0FE",
        "type": "record_correction",
        "applicant_uid": "dev-jatin-baral",
        "applicant_name": "Jatin Baral",
        "payload": {
            "field": "owner_name",
            "corrected_value": "Jatin barali",
            "description": "Rectify spelling error in RoR",
        },
    }

    mock_db = MockDB()
    with patch("landstack.adapters.client.post_json", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = {
            "ok": True,
            "field": "owner_name",
            "from_value": "Jatin Baral",
            "to_value": "Jatin barali",
        }
        with patch("landstack.services.audit.record", new_callable=AsyncMock):
            res = await run_side_effects(mock_db, app, TAHSILDAR)

    assert res is not None
    assert res.get("ok") is True
    assert res.get("field") == "owner_name"
    assert res.get("corrected_value") == "Jatin barali"

    # 1. Revenue correction endpoint called
    mock_post.assert_called_once()
    path, body = mock_post.call_args[0][:2]
    assert path == "/revenue/correction"
    assert body["ulpin"] == "TFCM916196F0FE"
    assert body["field"] == "owner_name"
    assert body["corrected_value"] == "Jatin barali"

    # 2. Units updated
    assert any("UPDATE landstack.units" in sql and params.get("new_name") == "Jatin barali" for sql, params in executed_statements)

    # 3. User account updated
    assert any("UPDATE landstack.users SET name = :new_name" in sql and params.get("new_name") == "Jatin barali" for sql, params in executed_statements)

    # 4. Applications updated
    assert any("UPDATE landstack.applications SET applicant_name = :new_name" in sql and params.get("new_name") == "Jatin barali" for sql, params in executed_statements)

    # 5. Deed claimant updated
    assert any("UPDATE dept_registration.deeds SET claimant = :new_name" in sql and params.get("new_name") == "Jatin barali" for sql, params in executed_statements)


@pytest.mark.asyncio
async def test_record_correction_extent_side_effects() -> None:
    executed_statements = []

    class MockDB:
        async def fetchval(self, sql, **params):
            return None

        async def fetchrow(self, sql, **params):
            return None

        async def execute(self, sql, **params):
            executed_statements.append((sql.strip(), params))
            return "UPDATE 1"

    app = {
        "id": "APP-2026-000020",
        "ulpin": "TFCM916196F0FE",
        "type": "record_correction",
        "applicant_uid": "dev-jatin-baral",
        "applicant_name": "Jatin barali",
        "payload": {
            "field": "extent",
            "corrected_value": "600.5",
            "description": "Updated extent as per resurvey",
        },
    }

    mock_db = MockDB()
    with patch("landstack.adapters.client.post_json", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = {"ok": True}
        with patch("landstack.services.audit.record", new_callable=AsyncMock):
            res = await run_side_effects(mock_db, app, TAHSILDAR)

    assert res is not None
    assert res.get("ok") is True

    # Check parcel area updated
    assert any("UPDATE landstack.parcels SET area_sqm = :a" in sql and params.get("a") == 600.5 for sql, params in executed_statements)


@pytest.mark.asyncio
async def test_complaint_and_review_resolution() -> None:
    executed_statements = []

    class MockDB:
        async def execute(self, sql, **params):
            executed_statements.append((sql.strip(), params))
            return "UPDATE 1"

    complaint_app = {
        "id": "APP-2026-000030",
        "ulpin": "TFCM916196F0FE",
        "type": "land_complaint",
        "payload": {},
    }

    mock_db = MockDB()
    with patch("landstack.services.audit.record", new_callable=AsyncMock):
        res = await run_side_effects(mock_db, complaint_app, TAHSILDAR)

    assert res is not None
    assert res.get("ok") is True
    assert any("UPDATE landstack.alerts SET status = 'resolved'" in sql for sql, _ in executed_statements)
    assert any("UPDATE dept_legal.disputes SET status = 'disposed'" in sql for sql, _ in executed_statements)


def test_revenue_correction_endpoint(client, fake_db) -> None:
    fake_db.on(
        "FROM dept_revenue.ror WHERE ulpin",
        [{
            "khata_no": "K-0142",
            "ulpin": "TFCM916196F0FE",
            "survey_no": "126",
            "owner_name": "Jatin Baral",
            "father_name": "Banjeet Baral",
            "extent_sqm": 577.64,
            "classification": "dry",
            "mutation_history": [],
        }],
    )

    resp = client.post(
        "/revenue/correction",
        json={
            "ulpin": "TFCM916196F0FE",
            "field": "owner_name",
            "corrected_value": "Jatin barali",
            "description": "Rectify owner spelling",
            "application_id": "APP-2026-000018",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["updated"] is True
    assert body["field"] == "owner_name"
    assert body["from_value"] == "Jatin Baral"
    assert body["to_value"] == "Jatin barali"

    # Assert executed statements in revenue
    assert any("insert into dept_revenue.mutations" in s.lower() for s, _ in fake_db.queries)
    assert any("update dept_revenue.ror" in s.lower() for s, _ in fake_db.executed)
