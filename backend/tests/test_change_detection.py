"""Unit tests for ai.change_detection (no DB, no rasters, no network)."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace

import pytest

from ai.change_detection import THRESHOLDS, ChangeDetectionError, classify, detect


@pytest.mark.parametrize(
    ("d_ndvi", "d_ndbi", "label"),
    [
        (-0.31, 0.18, "vegetation_to_builtup"),  # story parcel 124
        (-0.21, 0.11, "vegetation_to_builtup"),  # just past both thresholds
        (-0.25, 0.05, "vegetation_loss"),
        (-0.25, 0.10, "vegetation_loss"),  # ΔNDBI equal to threshold is not "greater"
        (-0.05, 0.16, "new_construction"),
        (-0.20, 0.15, "no_significant_change"),  # exactly on thresholds → no change
        (0.02, -0.01, "no_significant_change"),
        (0.30, -0.20, "no_significant_change"),
    ],
)
def test_classify_labels(d_ndvi: float, d_ndbi: float, label: str) -> None:
    got, conf = classify(d_ndvi, d_ndbi)
    assert got == label
    assert 0.5 <= conf <= 0.98


def test_confidence_grows_with_magnitude() -> None:
    _, weak = classify(-0.21, 0.11)
    _, strong = classify(-0.45, 0.30)
    assert strong > weak
    _, calm = classify(0.0, 0.0)
    _, edgy = classify(-0.19, 0.14)
    assert calm > edgy


def test_classify_rejects_nan() -> None:
    with pytest.raises(ValueError):
        classify(float("nan"), 0.0)


def test_thresholds_contract() -> None:
    assert THRESHOLDS == {"d_ndvi_loss": -0.20, "d_ndbi_builtup": 0.10, "d_ndbi_new": 0.15}


class _FakeDB:
    """Minimal stand-in for landstack.db exposing fetchrow/fetch with :name params."""

    def __init__(self, rows: dict[str, dict]) -> None:
        self.rows = rows
        self.calls: list[tuple[str, dict]] = []

    async def fetchrow(self, sql: str, **params):
        self.calls.append((sql, params))
        return self.rows.get(params.get("ulpin"))

    async def fetch(self, sql: str, **params):
        self.calls.append((sql, params))
        return list(self.rows.values())


_ROW_124 = {
    "ulpin": "TFCM91500000AB",
    "date_a": "2019-02-14",
    "date_b": "2025-02-09",
    "ndvi_a": 0.58,
    "ndvi_b": 0.27,
    "ndbi_a": -0.12,
    "ndbi_b": 0.06,
    "d_ndvi": -0.31,
    "d_ndbi": 0.18,
    "label": "vegetation_to_builtup",
    "confidence": 0.91,
}
_ROW_QUIET = {
    "ulpin": "TFCM91500000CD",
    "date_a": "2019-02-14",
    "date_b": "2025-02-09",
    "ndvi_a": 0.20,
    "ndvi_b": 0.19,
    "ndbi_a": 0.10,
    "ndbi_b": 0.11,
    "d_ndvi": -0.01,
    "d_ndbi": 0.01,
    "label": "no_significant_change",
    "confidence": 0.9,
}


def test_detect_offline_single_parcel() -> None:
    db = _FakeDB({_ROW_124["ulpin"]: _ROW_124})
    settings = SimpleNamespace(s2_offline=True, s2_data_dir="/nonexistent")
    res = asyncio.run(detect(ulpin=_ROW_124["ulpin"], db=db, settings=settings))
    assert res["label"] == "vegetation_to_builtup"
    assert res["confidence"] == 0.91  # stored confidence kept when label agrees
    assert res["ndvi"] == {"a": 0.58, "b": 0.27, "delta": -0.31}
    assert res["ndbi"]["delta"] == 0.18
    assert res["method"] == "index_difference"
    assert res["imagery"] == {"a": None, "b": None}
    assert res["thresholds"] == THRESHOLDS
    assert "field verification" in res["recommendation"].lower()
    assert res["source"] == "gis.s2_change"
    assert db.calls[0][1] == {"ulpin": _ROW_124["ulpin"]}


def test_detect_offline_bbox() -> None:
    db = _FakeDB({_ROW_124["ulpin"]: _ROW_124, _ROW_QUIET["ulpin"]: _ROW_QUIET})
    settings = SimpleNamespace(S2_OFFLINE="1", S2_DATA_DIR="/nonexistent")
    res = asyncio.run(detect(bbox=[80.545, 16.434, 80.567, 16.452], db=db, settings=settings))
    assert res["count"] == 2 and res["changed"] == 1
    assert {p["label"] for p in res["parcels"]} == {"vegetation_to_builtup", "no_significant_change"}
    assert res["date_a"] == "2019-02-14"


def test_detect_missing_row_raises() -> None:
    db = _FakeDB({})
    with pytest.raises(ChangeDetectionError):
        asyncio.run(detect(ulpin="NOPE", db=db, settings=SimpleNamespace(s2_offline=True)))


def test_detect_requires_target() -> None:
    with pytest.raises(ChangeDetectionError):
        asyncio.run(detect(db=_FakeDB({}), settings=SimpleNamespace(s2_offline=True)))


def test_detect_online_without_manifest_raises(tmp_path) -> None:
    settings = SimpleNamespace(s2_offline=False, s2_data_dir=str(tmp_path))
    with pytest.raises(ChangeDetectionError, match="manifest.json"):
        asyncio.run(detect(ulpin="X", db=_FakeDB({}), settings=settings))
