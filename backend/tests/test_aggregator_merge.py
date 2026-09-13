"""Fragment merge, provenance on failure/timeout, derived status, consistency and masking — with fake adapters."""

from __future__ import annotations

import asyncio

from landstack.adapters.base import AdapterResult
from landstack.auth import Principal
from landstack.cdm import ParcelCDM
from landstack.services import aggregator
from landstack.services.masking import mask_cdm

BASE_ROW = {
    "ulpin": "TDR1K3M9A2F7C1",
    "state": "AP",
    "district": "Guntur",
    "taluk": "Mangalagiri",
    "village": "Mangalagiri (R)",
    "survey_no": "127/1",
    "sub_division": None,
    "land_use": "residential",
    "zone_code": "R1",
    "status_flags": {},
    "updated_at": None,
    "area_sqm": 2400.0,
    "cx": 80.556,
    "cy": 16.442,
    "xmin": 80.55,
    "ymin": 16.44,
    "xmax": 80.56,
    "ymax": 16.45,
    "has_dispute": False,
    "has_mortgage": False,
    "tax_arrears": 0,
    "pending_mutation": False,
    "registered": True,
    "permission_status": None,
    "change_alert": False,
}


class FakeAdapter:
    def __init__(self, name: str, fragment=None, *, delay: float = 0, error: Exception | None = None) -> None:
        self.name, self.source, self.fragment, self.delay, self.error = (
            name,
            f"{name} (fake)",
            fragment or {},
            delay,
            error,
        )

    async def fetch(self, ulpin: str) -> AdapterResult:
        if self.delay:
            await asyncio.sleep(self.delay)
        if self.error:
            raise self.error
        return AdapterResult(
            self.fragment, {"ok": True, "ms": 5, "as_of": "2026-09-13T08:12:00Z", "source": self.source, "error": None}
        )


def _adapters(owner: str = "Ravi Kumar", claimant: str = "Ravi Kumar", extent: float = 2400.0):
    return [
        FakeAdapter(
            "revenue",
            {
                "identifiers": {"khata_no": "K-0421"},
                "party": {"owners": [{"name": owner, "father_name": "Suresh", "type": "patta"}]},
                "rights": {"ror": {"khata_no": "K-0421", "extent_sqm": extent, "classification": "dry"}},
            },
        ),
        FakeAdapter(
            "registration",
            {
                "rights": {
                    "registration": {
                        "status": "registered",
                        "doc_no": "DOC-2026-00042",
                        "deed_type": "sale",
                        "claimant": claimant,
                    }
                },
                "restrictions": {
                    "encumbrances": [{"kind": "mortgage", "holder": "SBI", "amount": 1.2e6, "active": True}]
                },
            },
        ),
        FakeAdapter(
            "planning",
            {
                "planning": {
                    "zone_code": "R1",
                    "zone_name": "Residential",
                    "building_permission": {"status": "approved", "floors": 2},
                }
            },
        ),
        FakeAdapter(
            "fiscal", {"fiscal": {"tax": {"annual_demand": 12500, "arrears": 3400}, "guideline_value_per_sqm": 18000}}
        ),
        FakeAdapter("legal", {"restrictions": {"disputes": []}}, delay=5),  # times out
        FakeAdapter("utilities", error=RuntimeError("boom")),
    ]


async def _build(adapters):
    cdm = aggregator.build_base_cdm(
        BASE_ROW,
        [
            {
                "id": 1,
                "floors": 3,
                "height_m": 9.5,
                "units": [
                    {"ulpin_3d": "TDR1K3M9A2F7C1-F01-U01", "floor": 1, "unit_no": "101", "owner_name": "Lakshmi Devi"}
                ],
            }
        ],
        [{"id": 7, "kind": "change_detected", "severity": "high", "title": "Built-up 2025", "status": "open"}],
        [{"kind": "flood", "name": "Krishna floodplain"}],
    )
    results = await aggregator.collect_fragments(adapters, BASE_ROW["ulpin"], timeout_s=0.05)
    aggregator.merge_results(cdm, results)
    aggregator.finalise(cdm)
    return ParcelCDM.model_validate(cdm).model_dump()


async def test_merge_provenance_and_derivations() -> None:
    cdm = await _build(_adapters())
    prov = cdm["provenance"]
    assert prov["revenue"]["ok"] and prov["revenue"]["as_of"] == "2026-09-13T08:12:00Z"
    assert prov["legal"] == {**prov["legal"], "ok": False, "error": "timeout"}
    assert prov["utilities"]["ok"] is False and "boom" in prov["utilities"]["error"]
    assert cdm["identifiers"]["khata_no"] == "K-0421" and cdm["identifiers"]["survey_no"] == "127/1"
    assert cdm["party"]["owners"][0]["name"] == "Ravi Kumar" and cdm["party"]["masked"] is False
    assert cdm["fiscal"]["estimated_value"] == 18000 * 2400.0
    assert cdm["status"]["has_mortgage"] is True and cdm["status"]["tax_arrears"] == 3400
    assert cdm["status"]["change_alert"] is True and cdm["status"]["permission_status"] == "approved"
    assert cdm["restrictions"]["restriction_zones"] == [{"kind": "flood", "name": "Krishna floodplain"}]
    assert cdm["consistency"] == {"area_match": True, "owner_match": True, "issues": []}
    assert cdm["spatial"]["geometry_ref"].endswith("/parcels/items/TDR1K3M9A2F7C1")


async def test_consistency_flags_area_and_owner_mismatch() -> None:
    cdm = await _build(_adapters(owner="Ravi Kumar", claimant="Lakshmi Devi", extent=2800))
    c = cdm["consistency"]
    assert c["area_match"] is False and c["owner_match"] is False
    fields = {i["field"]: i for i in c["issues"]}
    assert fields["extent_sqm"]["revenue"] == 2800 and fields["extent_sqm"]["parcel"] == 2400.0
    assert fields["owner_name"]["registration"] == "Lakshmi Devi"
    # 3% tolerance: 2460 vs 2400 = 2.5% → ok
    ok = await _build(_adapters(extent=2460))
    assert ok["consistency"]["area_match"] is True


async def test_masked_view_for_citizen() -> None:
    cdm = mask_cdm(await _build(_adapters()))
    assert cdm["party"]["masked"] and cdm["party"]["owners"][0]["name"] == "R*** K***"
    assert "father_name" not in cdm["party"]["owners"][0]
    assert cdm["rights"]["registration"]["doc_no"] == "****0042"
    assert cdm["buildings"][0]["units"][0]["owner_name"] == "L*** D***"


def test_deep_merge_semantics() -> None:
    base = {"a": {"x": 1, "y": None}, "list": [{"k": 1}], "s": "keep"}
    aggregator.deep_merge(base, {"a": {"y": 2, "z": None}, "list": [{"v": 9}, {"k": 2}], "s": None})
    assert base == {"a": {"x": 1, "y": 2}, "list": [{"k": 1, "v": 9}, {"k": 2}], "s": "keep"}


async def test_cache_roundtrip_and_invalidate(fake_db, monkeypatch) -> None:
    calls = {"n": 0}

    async def fake_build(db, ulpin, adapters=None, timeout_s=None):
        calls["n"] += 1
        return {"ulpin": ulpin, "party": {"owners": [{"name": "Ravi Kumar"}]}, "rights": {"registration": {}}}

    monkeypatch.setattr(aggregator, "build_parcel_cdm", fake_build)
    aggregator.invalidate()
    officer = Principal(uid="o", role="officer", department="revenue")
    citizen = Principal(uid="c", role="citizen")
    a = await aggregator.get_parcel_cdm(fake_db, "U1", officer)
    b = await aggregator.get_parcel_cdm(fake_db, "U1", citizen)
    assert calls["n"] == 1 and a["party"]["owners"][0]["name"] == "Ravi Kumar" and b["party"]["masked"] is True
    aggregator.invalidate("U1")
    await aggregator.get_parcel_cdm(fake_db, "U1", officer)
    assert calls["n"] == 2
