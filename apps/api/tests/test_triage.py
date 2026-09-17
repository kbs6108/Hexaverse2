"""Pre-submission triage (ai_assist.triage) — pure rules on a CDM dict, no DB."""

from __future__ import annotations

from landstack.services.ai_assist import triage

CLEAN = {"status": {}, "consistency": {}, "rights": {"registration": {"status": "registered"}}}


def _cdm(status: dict | None = None, consistency: dict | None = None, registration: str = "registered") -> dict:
    return {
        "status": status or {},
        "consistency": consistency or {},
        "rights": {"registration": {"status": registration}},
    }


def test_clean_parcel_is_ok_for_every_type() -> None:
    for t in ("mutation", "record_correction", "building_permission", "land_complaint"):
        out = triage(_cdm(), t)
        assert out["ok_to_submit"] is True
        assert out["blockers"] == []
        assert out["engine"] == "rules"


def test_dispute_blocks_transfer_but_not_complaint() -> None:
    cdm = _cdm(status={"has_dispute": True})
    assert triage(cdm, "mutation")["ok_to_submit"] is False
    assert triage(cdm, "record_correction")["ok_to_submit"] is False
    out = triage(cdm, "land_complaint")
    assert out["ok_to_submit"] is True
    assert any("court case" in n["text"] for n in out["notes"])


def test_pending_mutation_blocks_second_mutation_only() -> None:
    cdm = _cdm(status={"pending_mutation": True})
    assert triage(cdm, "mutation")["ok_to_submit"] is False
    out = triage(cdm, "record_correction")
    assert out["ok_to_submit"] is True
    assert out["warnings"]


def test_mortgage_arrears_unregistered_are_warnings_not_blockers() -> None:
    cdm = _cdm(status={"has_mortgage": True, "tax_arrears": 4200}, registration="unregistered")
    out = triage(cdm, "mutation")
    assert out["ok_to_submit"] is True
    texts = " ".join(w["text"] for w in out["warnings"])
    assert "mortgage" in texts and "arrears" in texts and "deed" in texts


def test_area_mismatch_supports_a_correction() -> None:
    out = triage(_cdm(consistency={"area_match": False}), "record_correction")
    assert out["ok_to_submit"] is True
    assert any("extent already differs" in n["text"] for n in out["notes"])


def test_change_alert_warns_building_permission() -> None:
    out = triage(_cdm(status={"change_alert": True}), "building_permission")
    assert any("Satellite" in w["text"] for w in out["warnings"])
