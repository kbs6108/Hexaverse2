"""Masking rules for citizens without consent (CONTRACTS §5)."""

from __future__ import annotations

from landstack.auth import Principal
from landstack.services.masking import mask_cdm, mask_doc_no, mask_name, should_mask


def test_mask_name_and_doc_no() -> None:
    assert mask_name("Ravi Kumar") == "R*** K***"
    assert mask_name("") == "" and mask_name(None) is None
    assert mask_doc_no("DOC-2026-04521") == "****4521"
    assert mask_doc_no("12") == "****"


def test_should_mask_by_role_and_consent() -> None:
    assert should_mask(None, "U1")
    assert should_mask(Principal(uid="c", role="citizen"), "U1")
    assert not should_mask(Principal(uid="c", role="citizen", consents={"U1"}), "U1")
    assert not should_mask(Principal(uid="o", role="officer", department="revenue"), "U1")
    assert not should_mask(Principal(uid="a", role="admin"), "U1")


def test_mask_cdm_shape() -> None:
    cdm = {
        "ulpin": "U1",
        "party": {"owners": [{"name": "Ravi Kumar", "father_name": "Suresh", "share": 1.0}], "masked": False},
        "rights": {"registration": {"doc_no": "DOC-2026-04521", "claimant": "Ravi Kumar", "executant": "Lakshmi Devi"}},
        "buildings": [{"id": 1, "units": [{"ulpin_3d": "U1-F01-U01", "owner_name": "Lakshmi Devi"}]}],
        "restrictions": {"encumbrances": [{"kind": "mortgage", "holder": "SBI"}]},
    }
    out = mask_cdm(cdm)
    assert out["party"]["masked"] is True
    assert out["party"]["owners"][0] == {"name": "R*** K***", "share": 1.0}
    assert out["rights"]["registration"]["doc_no"] == "****4521"
    assert out["rights"]["registration"]["claimant"] == "R*** K***"
    assert out["buildings"][0]["units"][0]["owner_name"] == "L*** D***"
    assert out["restrictions"]["encumbrances"][0]["holder"] == "SBI"  # institutions stay visible
    assert cdm["party"]["owners"][0]["name"] == "Ravi Kumar"  # input untouched
