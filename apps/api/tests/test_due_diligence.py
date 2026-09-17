"""Buyer due-diligence checklist (ai_assist.due_diligence) — pure rules on a CDM dict, no DB."""

from __future__ import annotations

from landstack.services.ai_assist import due_diligence


def _cdm(**over: object) -> dict:
    base: dict = {
        "status": {},
        "consistency": {"area_match": True, "owner_match": True},
        "restrictions": {"encumbrances": [], "disputes": [], "restriction_zones": []},
        "rights": {"registration": {"status": "registered", "deed_type": "sale", "doc_no": "1234"}},
        "fiscal": {"tax": {"paid_till": "2026-27"}, "estimated_value": 4014000},
        "status_flags": {"resurvey": "completed"},
    }
    base.update(over)
    return base


def test_clean_parcel_is_clear() -> None:
    out = due_diligence(_cdm())
    assert out["verdict"] == "clear"
    assert all(c["status"] == "pass" for c in out["checks"])
    assert out["engine"] == "rules"
    assert out["estimated_value"] == 4014000


def test_dispute_makes_high_risk() -> None:
    out = due_diligence(_cdm(
        status={"has_dispute": True},
        restrictions={"encumbrances": [], "disputes": [{"case_no": "OS 12/2025"}], "restriction_zones": []},
    ))
    assert out["verdict"] == "high_risk"
    row = next(c for c in out["checks"] if c["name"] == "Court disputes")
    assert row["status"] == "fail" and "OS 12/2025" in row["text"]


def test_cautions_without_fail_are_caution() -> None:
    out = due_diligence(_cdm(status={"tax_arrears": 4200, "pending_mutation": True}))
    assert out["verdict"] == "caution"
    assert {c["name"] for c in out["checks"] if c["status"] == "caution"} == {"Property tax", "Pending transfer"}


def test_unregistered_and_zones_and_resurvey_flagged() -> None:
    out = due_diligence(_cdm(
        rights={"registration": {"status": "unregistered"}},
        restrictions={"encumbrances": [], "disputes": [], "restriction_zones": [{"kind": "flood", "name": "Krishna floodplain"}]},
        status_flags={"resurvey": "in_progress"},
    ))
    caution_names = {c["name"] for c in out["checks"] if c["status"] == "caution"}
    assert {"Registered deed", "Restriction zones", "Resurvey"} <= caution_names


def test_checklist_is_complete() -> None:
    out = due_diligence(_cdm())
    assert [c["name"] for c in out["checks"]] == [
        "Registered deed", "Court disputes", "Encumbrances", "Property tax",
        "Pending transfer", "Records agree", "Unrecorded construction",
        "Restriction zones", "Resurvey",
    ]
