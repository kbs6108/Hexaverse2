"""Test that land transfer updates all dimensions of the parcel (RoR, units, deeds, permissions, alerts)."""

from unittest.mock import AsyncMock, patch

import pytest

from landstack.auth import Principal
from landstack.services.workflow import run_side_effects

TAHSILDAR = Principal(uid="o1", name="Anitha", role="officer", department="revenue", designation="tahsildar")

@pytest.mark.asyncio
async def test_full_land_transfer_side_effects() -> None:
    executed_statements = []

    class MockDB:
        async def fetchval(self, sql, **params):
            if "SELECT owner_name FROM dept_revenue.ror" in sql:
                return "Muthu"
            if "SELECT doc_no FROM dept_registration.deeds" in sql:
                return None
            if "SELECT count(*) + 1 FROM dept_registration.deeds" in sql:
                return 42
            if "SELECT guideline_value_per_sqm" in sql:
                return 5000.0
            return None

        async def fetchrow(self, sql, **params):
            if "SELECT area_sqm" in sql:
                return {"area_sqm": 874.3, "district": "Guntur", "taluk": "Mangalagiri"}
            return None

        async def execute(self, sql, **params):
            executed_statements.append((sql.strip(), params))
            return "UPDATE 1"

    app = {
        "id": "APP-2026-000099",
        "ulpin": "TFCM91641E6C82",
        "type": "mutation",
        "applicant_name": "Ravi Kumar",
        "payload": {
            "to_owner": "Ravi Kumar",
            "father_name": "Venkateswarlu",
            "reason": "sale",
            "nominees": [{"name": "Lakshmi", "relation": "spouse", "share": 1.0}],
        },
    }

    mock_db = MockDB()
    with patch("landstack.adapters.client.post_json", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = {"ok": True, "item": {"id": 1}}
        with patch("landstack.services.audit.record", new_callable=AsyncMock):
            res = await run_side_effects(mock_db, app, TAHSILDAR)

    assert res is not None
    assert res.get("ok") is True
    assert res.get("to_owner") == "Ravi Kumar"

    # Check 1: Revenue & Utilities calls were dispatched
    assert mock_post.call_count == 2
    called_paths = [c[0][0] for c in mock_post.call_args_list]
    assert "/revenue/mutations" in called_paths
    assert "/utilities/modify" in called_paths

    body = [c[0][1] for c in mock_post.call_args_list if c[0][0] == "/revenue/mutations"][0]
    assert body["to_owner"] == "Ravi Kumar"
    assert body["father_name"] == "Venkateswarlu"
    assert body["nominees"] == [{"name": "Lakshmi", "relation": "spouse", "share": 1.0}]

    u_body = [c[0][1] for c in mock_post.call_args_list if c[0][0] == "/utilities/modify"][0]
    assert u_body["action"] == "name_transfer"
    assert u_body["consumer_name"] == "Ravi Kumar"

    # Check 2: Building units updated
    assert any("UPDATE landstack.units" in sql and params.get("to_owner") == "Ravi Kumar" for sql, params in executed_statements)

    # Check 3: Registered deed created for claimant = Ravi Kumar
    assert any("INSERT INTO dept_registration.deeds" in sql and params.get("cl") == "Ravi Kumar" for sql, params in executed_statements)

    # Check 4: Building permissions endorsed
    assert any("UPDATE dept_planning.building_permissions" in sql and params.get("to_owner") == "Ravi Kumar" for sql, params in executed_statements)

    # Check 5: Pending mutation alerts resolved
    assert any("UPDATE landstack.alerts" in sql and params.get("u") == "TFCM91641E6C82" for sql, params in executed_statements)

    # Check 6: Pending mutation on parcels cleared
    assert any("UPDATE landstack.parcels SET pending_mutation = false" in sql for sql, params in executed_statements)

    # Check 7: Consents cleared and privacy reset
    assert any("DELETE FROM landstack.consents" in sql for sql, params in executed_statements)
    assert any("INSERT INTO landstack.parcel_privacy" in sql for sql, params in executed_statements)
