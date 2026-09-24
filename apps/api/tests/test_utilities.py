"""Test comprehensive utility connections, modifications, and citizen workflows."""

from unittest.mock import AsyncMock, patch
import pytest

from landstack.auth import Principal
from landstack.services.ai_assist import triage
from landstack.services.workflow import run_side_effects

TAHSILDAR = Principal(uid="o1", name="Anitha", role="officer", department="revenue", designation="tahsildar")


def test_utility_request_triage() -> None:
    cdm = {
        "status": {"tax_arrears": 1200},
        "utilities": {
            "road_access_m": 12.5,
            "electricity": True,
            "water": True,
        },
    }
    res = triage(cdm, "utility_request")
    assert res["ok_to_submit"] is True
    # Tax arrears triggers warning for utility NOC
    assert any("tax arrears" in w["text"].lower() for w in res["warnings"])


@pytest.mark.asyncio
async def test_utility_request_side_effects() -> None:
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
        "id": "APP-2026-000099",
        "ulpin": "TFCM916196F0FE",
        "type": "utility_request",
        "applicant_uid": "dev-jatin-baral",
        "applicant_name": "Jatin barali",
        "payload": {
            "action": "load_enhancement",
            "utility_type": "electricity",
            "consumer_name": "Jatin barali",
            "sanctioned_load_kw": 12.0,
            "tariff_category": "LT-II Commercial",
            "phase": "3-Phase",
            "remarks": "Load enhancement approved after site inspection",
        },
    }

    mock_db = MockDB()
    with patch("landstack.adapters.client.post_json", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = {
            "source": "ULB Utilities (mock)",
            "item": {"ulpin": "TFCM916196F0FE", "electricity": True},
        }
        with patch("landstack.services.audit.record", new_callable=AsyncMock):
            res = await run_side_effects(mock_db, app, TAHSILDAR)

    assert res is not None
    assert res.get("ok") is True
    assert res.get("department") == "utilities"

    # Utility modify endpoint called with proper payload
    mock_post.assert_called_once()
    path, body = mock_post.call_args[0][:2]
    assert path == "/utilities/modify"
    assert body["action"] == "load_enhancement"
    assert body["utility_type"] == "electricity"
    assert body["sanctioned_load_kw"] == 12.0
    assert body["tariff_category"] == "LT-II Commercial"
    assert body["consumer_name"] == "Jatin barali"


@pytest.mark.asyncio
async def test_record_correction_syncs_utilities() -> None:
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

    # Check both /revenue/correction and /utilities/modify were invoked
    called_paths = [call[0][0] for call in mock_post.call_args_list]
    assert "/revenue/correction" in called_paths
    assert "/utilities/modify" in called_paths

    util_call = [call[0][1] for call in mock_post.call_args_list if call[0][0] == "/utilities/modify"][0]
    assert util_call["action"] == "name_transfer"
    assert util_call["consumer_name"] == "Jatin barali"
