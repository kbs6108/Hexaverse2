"""YAML mapping engine: unit conversion, path get/set, shipped mapping files validate against the CDM."""

from __future__ import annotations

import pytest

from landstack.adapters.mapping import (
    apply_mapping,
    available_mappings,
    convert_to_sqm,
    get_path,
    load_mapping,
    mapping_table,
    set_path,
)
from landstack.adapters.registry import DEPARTMENTS, get_adapter, mapping_name_for
from landstack.cdm import ParcelCDM


def test_unit_conversions() -> None:
    assert convert_to_sqm(1, "hectare") == 10000
    assert convert_to_sqm(1, "acre") == pytest.approx(4046.86, abs=0.01)
    assert convert_to_sqm(2.5, "cents") == pytest.approx(101.17, abs=0.01)
    assert convert_to_sqm(None, "acre") is None
    with pytest.raises(ValueError):
        convert_to_sqm(1, "furlong")


def test_paths() -> None:
    doc = {"ror": {"items": [{"a": 1}, {"a": 2}]}}
    assert get_path(doc, "ror.items[0].a") == 1 and get_path(doc, "ror.items[-1].a") == 2
    assert get_path(doc, "ror.items[5].a") is None and get_path(doc, "nope.x") is None
    out: dict = {}
    set_path(out, "party.owners[0].name", "Ravi")
    set_path(out, "party.owners[1].name", "Lakshmi")
    set_path(out, "planning.zone_code", "R1")
    assert out == {"party": {"owners": [{"name": "Ravi"}, {"name": "Lakshmi"}]}, "planning": {"zone_code": "R1"}}


def test_revenue_tn_converts_hectares() -> None:
    m = load_mapping("revenue_tn")
    doc = {
        "ror": {
            "as_of": "2026-09-13T00:00:00Z",
            "items": [
                {
                    "patta_no": "P-77",
                    "pattadar_name": "Murugan S",
                    "relation_name": "Selvam",
                    "tenure": "patta",
                    "extent_hectares": 0.0223,
                    "land_class": "nanjai",
                    "survey_no": "45/2",
                }
            ],
        }
    }
    frag = get_adapter("revenue", "TN").translate(doc)
    assert frag["rights"]["ror"]["extent_sqm"] == 223.0
    assert frag["party"]["owners"][0] == {"name": "Murugan S", "father_name": "Selvam", "type": "patta", "share": 1.0}
    assert frag["identifiers"]["khata_no"] == "P-77" and frag["rights"]["ror"]["khata_no"] == "P-77"
    assert m["units"]["ror.items[0].extent_hectares"] == "hectare"


def test_registration_lists_and_status() -> None:
    adapter = get_adapter("registration", "AP")
    doc = {
        "deeds": {
            "items": [
                {"doc_no": "D2", "deed_type": "sale", "claimant": "Ravi Kumar", "registered_on": "2026-04-12"},
                {"doc_no": "D1"},
            ]
        },
        "encumbrances": {"items": [{"kind": "mortgage", "holder": "SBI", "amount": 1200000, "active": True}]},
    }
    frag = adapter.translate(doc)
    assert frag["rights"]["registration"]["status"] == "registered" and frag["rights"]["registration"]["doc_no"] == "D2"
    assert frag["restrictions"]["encumbrances"] == [
        {"kind": "mortgage", "holder": "SBI", "amount": 1200000, "active": True}
    ]
    empty = adapter.translate({"deeds": {"items": []}, "encumbrances": {"items": []}})
    assert empty["rights"]["registration"]["status"] == "unregistered" and empty["restrictions"]["encumbrances"] == []


def test_planning_permission_none_when_empty() -> None:
    frag = get_adapter("planning").translate(
        {
            "zone": {"item": {"zone_code": "R1", "name": "Residential", "permissible_uses": ["residential"]}},
            "permissions": {"items": []},
        }
    )
    assert frag["planning"]["zone_code"] == "R1" and frag["planning"]["building_permission"]["status"] == "none"


def test_all_shipped_mappings_target_valid_cdm_paths() -> None:
    names = available_mappings()
    assert {f"{d}_ap" for d in DEPARTMENTS} <= set(names) and "revenue_tn" in names
    for name in names:
        m = load_mapping(name)
        probe: dict = {}
        for targets in (m.get("map") or {}).values():
            for t in targets if isinstance(targets, list) else [targets]:
                set_path(probe, t, None)
        for target, spec in (m.get("lists") or {}).items():
            set_path(probe, target, [dict.fromkeys(spec["map"].values())])
        probe.pop("identifiers", None)
        ParcelCDM.model_validate({"ulpin": "X", **probe})  # raises if a path is structurally wrong
        table = mapping_table(m)
        assert table["fields"] and table["source"]


def test_registry_state_fallback() -> None:
    assert mapping_name_for("revenue", "tn") == "revenue_tn"
    assert mapping_name_for("revenue", "KA") == "revenue_ap"
    assert mapping_name_for("legal", None) == "legal_ap"


def test_apply_mapping_ignores_missing_and_supports_constants() -> None:
    frag = apply_mapping({"map": {"a.b": "x.y"}, "constants": {"x.z": 1}}, {"a": {}})
    assert frag == {"x": {"z": 1}}
