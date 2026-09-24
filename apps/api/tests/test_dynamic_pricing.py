from landstack.services.aggregator import finalise


def test_finalise_derives_dynamic_valuation():
    cdm = {
        "spatial": {"area_sqm": 1200.0},
        "fiscal": {
            "guideline_value_per_sqm": 24500.0,
            "market_value_per_sqm": 34300.0,
            "base_rate_per_sqm": 26000.0,
            "road_factor": 1.28,
            "infra_factor": 1.15,
            "zone_factor": 1.40,
            "location_tier": "State Highway Growth Corridor",
        },
    }
    result = finalise(cdm)
    f = result["fiscal"]
    assert f["estimated_value"] == 24500.0 * 1200.0
    assert f["estimated_market_value"] == 34300.0 * 1200.0
    assert f["location_tier"] == "State Highway Growth Corridor"
    assert f["road_factor"] == 1.28


def test_finalise_fallback_market_valuation():
    cdm = {
        "spatial": {"area_sqm": 500.0},
        "fiscal": {
            "guideline_value_per_sqm": 16000.0,
        },
    }
    result = finalise(cdm)
    f = result["fiscal"]
    assert f["estimated_value"] == 16000.0 * 500.0
    assert f["market_value_per_sqm"] == 16000.0 * 1.35
    assert f["estimated_market_value"] == 16000.0 * 1.35 * 500.0
