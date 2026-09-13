"""ULPIN helpers shared by the gateway and `tools/seed.py`.

* `ulpin_style(geom)` → 14 chars: 7-char geohash (uppercase) of the geometry centroid + 7 hex chars
  of a SHA-1 over the normalised coordinates, so ids are deterministic and spatially prefixed.
* `ulpin_3d(ulpin, floor, unit)` → `'<ULPIN>-F<floor:02>-U<unit:02>'` (CONTRACTS §4); `split_ulpin_3d` inverts it.

Geometries may be shapely objects, GeoJSON dicts or WKT strings (shapely is used only when present).
"""

from __future__ import annotations

import hashlib
import json
import re
from typing import Any

_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
ULPIN_RE = re.compile(r"^[0-9A-Z]{14}$")
ULPIN_3D_RE = re.compile(r"^(?P<ulpin>[0-9A-Z]{6,20})-F(?P<floor>\d{2,3})-U(?P<unit>\d{2,4})$")


def geohash_encode(lat: float, lon: float, precision: int = 7) -> str:
    """Standard geohash (base32) of a lat/lon pair."""
    lat_lo, lat_hi, lon_lo, lon_hi = -90.0, 90.0, -180.0, 180.0
    bits, ch, even = 0, 0, True
    out: list[str] = []
    while len(out) < precision:
        if even:
            mid = (lon_lo + lon_hi) / 2
            if lon >= mid:
                ch = (ch << 1) | 1
                lon_lo = mid
            else:
                ch <<= 1
                lon_hi = mid
        else:
            mid = (lat_lo + lat_hi) / 2
            if lat >= mid:
                ch = (ch << 1) | 1
                lat_lo = mid
            else:
                ch <<= 1
                lat_hi = mid
        even = not even
        bits += 1
        if bits == 5:
            out.append(_BASE32[ch])
            bits, ch = 0, 0
    return "".join(out)


def _coords(geom: Any) -> list[tuple[float, float]]:
    """Flatten any supported geometry into a list of (lon, lat) tuples."""
    if hasattr(geom, "__geo_interface__"):
        geom = geom.__geo_interface__
    if isinstance(geom, str):
        try:
            from shapely import wkt

            geom = wkt.loads(geom).__geo_interface__
        except Exception as exc:
            raise ValueError("unsupported geometry string (expected WKT with shapely installed)") from exc
    if not isinstance(geom, dict):
        raise ValueError(f"unsupported geometry type {type(geom).__name__}")
    pts: list[tuple[float, float]] = []

    def walk(c: Any) -> None:
        if isinstance(c, list | tuple) and c and isinstance(c[0], int | float):
            pts.append((float(c[0]), float(c[1])))
        elif isinstance(c, list | tuple):
            for item in c:
                walk(item)

    if geom.get("type") == "GeometryCollection":
        for g in geom.get("geometries", []):
            walk(g.get("coordinates"))
    else:
        walk(geom.get("coordinates"))
    if not pts:
        raise ValueError("geometry has no coordinates")
    return pts


def _centroid(geom: Any, pts: list[tuple[float, float]]) -> tuple[float, float]:
    c = getattr(geom, "centroid", None)
    if c is not None and hasattr(c, "x"):
        return float(c.x), float(c.y)
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2


def ulpin_style(geom: Any, length: int = 14) -> str:
    """Deterministic ULPIN-style id: GEOHASH7 + 7 hex chars of a coordinate hash (uppercase)."""
    pts = _coords(geom)
    lon, lat = _centroid(geom, pts)
    payload = json.dumps([[round(x, 7), round(y, 7)] for x, y in pts], separators=(",", ":"))
    digest = hashlib.sha1(payload.encode()).hexdigest().upper()
    prefix = geohash_encode(lat, lon, 7).upper()
    return (prefix + digest)[:length]


def ulpin_3d(ulpin: str, floor: int, unit: int | str) -> str:
    """'<ULPIN>-F<floor:02>-U<unit:02>'. Floors start at 0 (ground), units at 1."""
    floor_i, unit_i = int(floor), int(str(unit).strip())
    if floor_i < 0 or unit_i < 1:
        raise ValueError("floor must be >= 0 and unit >= 1")
    return f"{ulpin}-F{floor_i:02d}-U{unit_i:02d}"


def split_ulpin_3d(value: str) -> tuple[str, int, int]:
    """Inverse of `ulpin_3d`; raises ValueError for anything else."""
    m = ULPIN_3D_RE.match(value or "")
    if not m:
        raise ValueError(f"not a 3D ULPIN: {value!r}")
    return m.group("ulpin"), int(m.group("floor")), int(m.group("unit"))


def is_ulpin_3d(value: str) -> bool:
    return bool(ULPIN_3D_RE.match(value or ""))
