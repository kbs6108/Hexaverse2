"""Unit tests for landstack.services.ulpin."""

from __future__ import annotations

import pytest
from shapely.geometry import Polygon

from landstack.services.ulpin import ULPIN_RE, geohash_encode, split_ulpin_3d, ulpin_3d, ulpin_style


def test_geohash_known_value() -> None:
    # Reference value from the public geohash algorithm (Mangalagiri fringe).
    assert geohash_encode(16.442, 80.556, 7) == "tfcm915"
    assert geohash_encode(57.64911, 10.40744, 11) == "u4pruydqqvj"


def test_ulpin_shape_and_determinism() -> None:
    p = Polygon([(80.556, 16.442), (80.5565, 16.442), (80.5565, 16.4425), (80.556, 16.4425)])
    a, b = ulpin_style(p), ulpin_style(Polygon(p.exterior.coords))
    assert a == b and len(a) == 14 and ULPIN_RE.match(a)
    assert a.startswith("TFCM915")


def test_ulpin_changes_with_geometry() -> None:
    p = Polygon([(80.556, 16.442), (80.5565, 16.442), (80.5565, 16.4425), (80.556, 16.4425)])
    q = Polygon([(80.556, 16.442), (80.5566, 16.442), (80.5566, 16.4425), (80.556, 16.4425)])
    assert ulpin_style(p) != ulpin_style(q)


def test_ulpin_3d_roundtrip() -> None:
    u = "TFCM915DA616B9"
    assert ulpin_3d(u, 1, 1) == "TFCM915DA616B9-F01-U01"
    assert ulpin_3d(u, 12, 3) == "TFCM915DA616B9-F12-U03"
    assert split_ulpin_3d("TFCM915DA616B9-F12-U03") == (u, 12, 3)
    with pytest.raises(ValueError):
        split_ulpin_3d("garbage")
    with pytest.raises(ValueError):
        ulpin_3d(u, 1, 0)
