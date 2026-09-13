"""Planning permissibility rule, SQL-consistency findings, report signing/mini-map, ULPIN helpers."""

from __future__ import annotations

import pytest

from departments.planning.app import evaluate_permissibility
from landstack.routers.consistency import findings_from_rows
from landstack.services.reports import mini_map_svg, render_html, sign, verify_signature
from landstack.services.ulpin import split_ulpin_3d, ulpin_3d, ulpin_style

R1 = {"zone_code": "R1", "name": "Residential", "permissible_uses": ["residential", "mixed"]}
R2 = {**R1, "zone_code": "R2"}


def test_permissibility_rule() -> None:
    assert evaluate_permissibility("residential", 2, R1, []) == (True, [])
    ok, reasons = evaluate_permissibility("industrial", 1, R1, [])
    assert not ok and "not permitted" in reasons[0]
    ok, reasons = evaluate_permissibility("residential", 3, R1, [])
    assert not ok and "2-floor limit" in reasons[0]
    assert evaluate_permissibility("residential", 4, R2, [])[0] is True
    assert evaluate_permissibility("residential", 5, R2, [])[0] is False
    ok, reasons = evaluate_permissibility("residential", 1, R1, [{"kind": "flood", "name": "Krishna floodplain"}])
    assert not ok and "restriction zone" in reasons[0]
    ok, reasons = evaluate_permissibility("residential", None, None, [])
    assert not ok and "not inside any planning zone" in reasons[0]


def test_consistency_findings() -> None:
    rows = [
        {
            "ulpin": "A",
            "survey_no": "127/1",
            "parcel_area_sqm": 2400,
            "ror_extent_sqm": 2800,
            "ror_owner": "Ravi Kumar",
            "deed_claimant": "Ravi Kumar",
            "ror_count": 1,
        },
        {
            "ulpin": "B",
            "survey_no": "128",
            "parcel_area_sqm": 500,
            "ror_extent_sqm": 505,
            "ror_owner": "Ravi Kumar",
            "deed_claimant": "Lakshmi Devi",
            "doc_no": "D9",
            "ror_count": 1,
        },
        {"ulpin": "C", "survey_no": "129", "parcel_area_sqm": 500, "ror_extent_sqm": None, "ror_count": 0},
    ]
    found = findings_from_rows(rows)
    by = {(f["ulpin"], f["issue"]) for f in found}
    assert by == {("A", "area_mismatch"), ("B", "owner_mismatch"), ("C", "missing_ror")}


def test_report_signature_and_svg() -> None:
    sig = sign("LSR-1", "ab" * 32, secret="s3cret")
    assert verify_signature("LSR-1", "ab" * 32, sig, secret="s3cret")
    assert not verify_signature("LSR-1", "ab" * 32, sig, secret="other")
    assert not verify_signature("LSR-2", "ab" * 32, sig, secret="s3cret")
    svg = mini_map_svg(
        {"type": "Polygon", "coordinates": [[[80.55, 16.44], [80.56, 16.44], [80.56, 16.45], [80.55, 16.44]]]}
    )
    assert svg.startswith("<svg") and "<path" in svg and "EPSG:4326" in svg
    assert "<rect" in mini_map_svg(None)


def test_render_html_has_sections() -> None:
    cdm = {
        "ulpin": "U1",
        "identifiers": {"survey_no": "123/4"},
        "party": {"owners": [{"name": "R*** K***"}], "masked": True},
        "provenance": {"revenue": {"ok": True, "source": "AP Meebhoomi (mock)", "ms": 4}},
        "consistency": {"issues": [{"field": "extent_sqm", "note": "differs"}]},
    }
    html = render_html(cdm, "LSR-42", "Ravi Kumar", None, "http://localhost:5173/verify/LSR-42")
    for needle in ("LSR-42", "123/4", "R*** K***", "masked", "AP Meebhoomi", "differs", "<svg"):
        assert needle in html


def test_ulpin_helpers() -> None:
    a = ulpin_style({"type": "Point", "coordinates": [80.5, 16.4]})
    assert len(a) == 14 and a == ulpin_style({"coordinates": [80.5, 16.4], "type": "Point"})
    assert ulpin_3d("TDR1K3M9A2F7C1", 1, 1) == "TDR1K3M9A2F7C1-F01-U01"
    assert ulpin_3d("X", 12, "7") == "X-F12-U07"
    assert split_ulpin_3d("TDR1K3M9A2F7C1-F01-U01") == ("TDR1K3M9A2F7C1", 1, 1)
    with pytest.raises(ValueError):
        split_ulpin_3d("TDR1K3M9A2F7C1")
