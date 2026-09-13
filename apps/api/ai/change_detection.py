"""Sentinel-2 land-use change detection by NDVI/NDBI index differencing.

Two modes, chosen by ``settings`` (``s2_offline`` / ``S2_OFFLINE``, ``s2_data_dir`` / ``S2_DATA_DIR``):

* **offline** (default, ``S2_OFFLINE=1`` or rasters missing) — read the pre-computed per-parcel
  indices from ``gis.s2_change`` (written by ``tools/seed.py`` or ``tools/fetch_s2.py --compute``).
* **online** — compute zonal means of NDVI/NDBI for the parcel from local Cloud-Optimised GeoTIFFs
  under ``S2_DATA_DIR`` (``manifest.json`` produced by ``tools/fetch_s2.py``). Requires ``rasterio``.

Classification (:func:`classify`) is a pure function shared by both modes and by the seed:

    ΔNDVI < -0.20 and ΔNDBI > +0.10  → vegetation_to_builtup
    ΔNDVI < -0.20                    → vegetation_loss
    ΔNDBI > +0.15                    → new_construction
    otherwise                        → no_significant_change

Database access is injected: ``db`` must expose ``await db.fetchrow(sql, **params)`` and
``await db.fetch(sql, **params)`` where ``sql`` uses ``:name`` bound parameters (the gateway's
``landstack.db`` module provides exactly that). Rows may be any mapping-like object.
"""

from __future__ import annotations

import json
import math
import os
from collections.abc import Mapping
from datetime import date
from pathlib import Path
from typing import Any, Protocol

__all__ = [
    "LABELS",
    "THRESHOLDS",
    "ChangeDetectionError",
    "classify",
    "detect",
    "recommendation_for",
]

THRESHOLDS: dict[str, float] = {
    "d_ndvi_loss": -0.20,  # ΔNDVI below this = vegetation loss
    "d_ndbi_builtup": 0.10,  # ΔNDBI above this (with NDVI loss) = conversion to built-up
    "d_ndbi_new": 0.15,  # ΔNDBI above this alone = new construction
}

LABELS: tuple[str, ...] = (
    "vegetation_to_builtup",
    "vegetation_loss",
    "new_construction",
    "no_significant_change",
)

_RECOMMENDATIONS: dict[str, str] = {
    "vegetation_to_builtup": (
        "Likely unrecorded conversion to built-up use. Schedule a field verification, "
        "check dept_planning for a building permission and dept_revenue for a land-use conversion order."
    ),
    "vegetation_loss": (
        "Vegetation cover dropped without a matching rise in built-up index. Could be harvest, "
        "fallowing or land clearing; re-check with a later image before acting."
    ),
    "new_construction": (
        "Built-up index rose on a parcel that was not clearly vegetated. Cross-check with "
        "building permissions and property-tax assessment."
    ),
    "no_significant_change": "No action needed; indices are within seasonal variation.",
}


class ChangeDetectionError(RuntimeError):
    """Raised when detection cannot run (missing baseline row, missing rasters, bad input)."""


class _DB(Protocol):
    async def fetchrow(self, sql: str, **params: Any) -> Any: ...
    async def fetch(self, sql: str, **params: Any) -> Any: ...


# ---------------------------------------------------------------------------
# Pure classification
# ---------------------------------------------------------------------------
def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def classify(d_ndvi: float, d_ndbi: float) -> tuple[str, float]:
    """Classify an index change and return ``(label, confidence)``.

    Confidence is a deterministic function of how far the deltas sit past the thresholds
    (0.6–0.98 for change classes; 0.6–0.95 for no change, higher when deltas are near zero).
    """
    if d_ndvi is None or d_ndbi is None or math.isnan(d_ndvi) or math.isnan(d_ndbi):
        raise ValueError("d_ndvi and d_ndbi must be finite numbers")
    loss = THRESHOLDS["d_ndvi_loss"]
    built = THRESHOLDS["d_ndbi_builtup"]
    new = THRESHOLDS["d_ndbi_new"]

    veg_excess = _clamp((loss - d_ndvi) / abs(loss), 0.0, 1.0)  # 1.0 at ΔNDVI = -0.40
    built_excess = _clamp((d_ndbi - built) / 0.15, 0.0, 1.0)  # 1.0 at ΔNDBI = +0.25
    new_excess = _clamp((d_ndbi - new) / 0.15, 0.0, 1.0)  # 1.0 at ΔNDBI = +0.30

    if d_ndvi < loss and d_ndbi > built:
        conf = 0.6 + 0.19 * veg_excess + 0.19 * built_excess
        return "vegetation_to_builtup", round(_clamp(conf, 0.6, 0.98), 2)
    if d_ndvi < loss:
        return "vegetation_loss", round(_clamp(0.6 + 0.3 * veg_excess, 0.6, 0.9), 2)
    if d_ndbi > new:
        return "new_construction", round(_clamp(0.6 + 0.3 * new_excess, 0.6, 0.9), 2)
    margin = _clamp(max(-d_ndvi / abs(loss), d_ndbi / new, 0.0), 0.0, 1.0)
    return "no_significant_change", round(0.95 - 0.35 * margin, 2)


def recommendation_for(label: str) -> str:
    """Officer-facing next step for a label."""
    return _RECOMMENDATIONS.get(label, _RECOMMENDATIONS["no_significant_change"])


def _explain(label: str, d_ndvi: float, d_ndbi: float) -> str:
    t = THRESHOLDS
    return (
        f"ΔNDVI={d_ndvi:+.2f} (threshold {t['d_ndvi_loss']:+.2f}), "
        f"ΔNDBI={d_ndbi:+.2f} (thresholds {t['d_ndbi_builtup']:+.2f} built-up / {t['d_ndbi_new']:+.2f} new) → {label}"
    )


# ---------------------------------------------------------------------------
# Settings / row helpers
# ---------------------------------------------------------------------------
def _setting(settings: Any, name: str, default: Any) -> Any:
    """Read ``name`` from a settings object (lower or UPPER attribute), else the environment."""
    for attr in (name.lower(), name.upper()):
        if settings is not None and hasattr(settings, attr):
            return getattr(settings, attr)
    return os.environ.get(name.upper(), default)


def _truthy(v: Any) -> bool:
    return str(v).strip().lower() in {"1", "true", "yes", "on"}


def _col(row: Any, key: str, default: Any = None) -> Any:
    """Column access that works for dicts, asyncpg Records and SQLAlchemy Rows."""
    if row is None:
        return default
    if isinstance(row, Mapping):
        return row.get(key, default)
    mapping = getattr(row, "_mapping", None)
    if mapping is not None:
        return mapping.get(key, default)
    try:
        return row[key]
    except (KeyError, TypeError, IndexError):
        return getattr(row, key, default)


def _num(v: Any) -> float | None:
    return None if v is None else float(v)


def _iso(v: Any) -> str | None:
    if v is None:
        return None
    return v.isoformat() if isinstance(v, date) else str(v)


def _result(
    *,
    ulpin: str | None,
    date_a: Any,
    date_b: Any,
    ndvi_a: float | None,
    ndvi_b: float | None,
    ndbi_a: float | None,
    ndbi_b: float | None,
    d_ndvi: float,
    d_ndbi: float,
    label: str,
    confidence: float,
    imagery_a: str | None,
    imagery_b: str | None,
    source: str,
) -> dict[str, Any]:
    return {
        "ulpin": ulpin,
        "date_a": _iso(date_a),
        "date_b": _iso(date_b),
        "ndvi": {"a": ndvi_a, "b": ndvi_b, "delta": round(d_ndvi, 4)},
        "ndbi": {"a": ndbi_a, "b": ndbi_b, "delta": round(d_ndbi, 4)},
        "label": label,
        "confidence": confidence,
        "thresholds": dict(THRESHOLDS),
        "method": "index_difference",
        "imagery": {"a": imagery_a, "b": imagery_b},
        "recommendation": recommendation_for(label),
        "explanation": _explain(label, d_ndvi, d_ndbi),
        "source": source,
        # Flat aliases for apps/web (ChangeDetectionResult in src/lib/cdm.ts).
        "ndvi_a": ndvi_a,
        "ndvi_b": ndvi_b,
        "ndbi_a": ndbi_a,
        "ndbi_b": ndbi_b,
        "d_ndvi": round(d_ndvi, 4),
        "d_ndbi": round(d_ndbi, 4),
        "image_a_url": imagery_a,
        "image_b_url": imagery_b,
        "mode": "offline" if source == "gis.s2_change" else "online",
    }


# ---------------------------------------------------------------------------
# Offline mode: gis.s2_change
# ---------------------------------------------------------------------------
_S2_COLS = (
    "s.ulpin, s.date_a, s.date_b, s.ndvi_a, s.ndvi_b, s.ndbi_a, s.ndbi_b, s.d_ndvi, s.d_ndbi, s.label, s.confidence"
)

_SQL_ONE = f"SELECT {_S2_COLS} FROM gis.s2_change s WHERE s.ulpin = :ulpin"

_SQL_BBOX = f"""
SELECT {_S2_COLS}
FROM landstack.parcels p
JOIN gis.s2_change s ON s.ulpin = p.ulpin
WHERE p.geom && ST_MakeEnvelope(:minx, :miny, :maxx, :maxy, 4326)
ORDER BY s.label <> 'no_significant_change' DESC, s.confidence DESC NULLS LAST
LIMIT :limit
"""


def _row_result(row: Any, imagery: tuple[str | None, str | None], source: str) -> dict[str, Any]:
    d_ndvi = _num(_col(row, "d_ndvi"))
    d_ndbi = _num(_col(row, "d_ndbi"))
    if d_ndvi is None or d_ndbi is None:
        ndvi_a, ndvi_b = _num(_col(row, "ndvi_a")), _num(_col(row, "ndvi_b"))
        ndbi_a, ndbi_b = _num(_col(row, "ndbi_a")), _num(_col(row, "ndbi_b"))
        if None in (ndvi_a, ndvi_b, ndbi_a, ndbi_b):
            raise ChangeDetectionError(f"gis.s2_change row for {_col(row, 'ulpin')} has no index values")
        d_ndvi, d_ndbi = ndvi_b - ndvi_a, ndbi_b - ndbi_a  # type: ignore[operator]
    label, conf = classify(d_ndvi, d_ndbi)
    stored_label = _col(row, "label")
    stored_conf = _num(_col(row, "confidence"))
    # Prefer the stored label/confidence when it agrees with the thresholds (it may carry
    # analyst-reviewed confidence); fall back to the pure classifier otherwise.
    if stored_label == label and stored_conf is not None:
        conf = stored_conf
    return _result(
        ulpin=_col(row, "ulpin"),
        date_a=_col(row, "date_a"),
        date_b=_col(row, "date_b"),
        ndvi_a=_num(_col(row, "ndvi_a")),
        ndvi_b=_num(_col(row, "ndvi_b")),
        ndbi_a=_num(_col(row, "ndbi_a")),
        ndbi_b=_num(_col(row, "ndbi_b")),
        d_ndvi=d_ndvi,
        d_ndbi=d_ndbi,
        label=label,
        confidence=conf,
        imagery_a=imagery[0],
        imagery_b=imagery[1],
        source=source,
    )


# ---------------------------------------------------------------------------
# Online mode: local COGs listed in manifest.json
# ---------------------------------------------------------------------------
def _load_manifest(data_dir: Path) -> dict[str, Any] | None:
    mf = data_dir / "manifest.json"
    if not mf.is_file():
        return None
    try:
        return json.loads(mf.read_text())
    except json.JSONDecodeError as exc:
        raise ChangeDetectionError(f"{mf} is not valid JSON: {exc}") from exc


def _pick_windows(manifest: dict[str, Any], date_a: str | None, date_b: str | None) -> tuple[dict, dict]:
    windows = sorted(manifest.get("windows", []), key=lambda w: w["date"])
    if len(windows) < 2:
        raise ChangeDetectionError("manifest.json lists fewer than two imagery windows")

    def pick(wanted: str | None, default: dict) -> dict:
        if not wanted:
            return default
        exact = [w for w in windows if w["date"] == wanted]
        if exact:
            return exact[0]
        # nearest by date
        target = date.fromisoformat(wanted)
        return min(windows, key=lambda w: abs((date.fromisoformat(w["date"]) - target).days))

    return pick(date_a, windows[0]), pick(date_b, windows[-1])


def _rasters_present(data_dir: Path, window: dict[str, Any]) -> bool:
    paths = list(window.get("indices", {}).values()) or list(window.get("bands", {}).values())
    return bool(paths) and all((data_dir / p).is_file() for p in paths)


def _zonal_index_means(data_dir: Path, window: dict[str, Any], geom_geojson: dict) -> tuple[float, float]:
    """Mean NDVI and NDBI of a parcel for one window; computes indices from bands if needed."""
    try:
        import numpy as np
        import rasterio
        from rasterio.mask import mask as rio_mask
        from rasterio.warp import transform_geom
    except ImportError as exc:  # pragma: no cover - environment dependent
        raise ChangeDetectionError("online mode needs rasterio and numpy (pip install rasterio)") from exc

    def read(path: str) -> np.ndarray:
        with rasterio.open(data_dir / path) as ds:
            g = (
                transform_geom("EPSG:4326", ds.crs, geom_geojson)
                if ds.crs and ds.crs.to_epsg() != 4326
                else geom_geojson
            )
            arr, _ = rio_mask(ds, [g], crop=True, all_touched=True, filled=False)
            return arr[0].astype("float64")

    indices = window.get("indices", {})
    if "NDVI" in indices and "NDBI" in indices:
        ndvi, ndbi = read(indices["NDVI"]), read(indices["NDBI"])
    else:
        bands = window["bands"]
        b04, b08, b11 = read(bands["B04"]), read(bands["B08"]), read(bands["B11"])
        with np.errstate(divide="ignore", invalid="ignore"):
            ndvi = (b08 - b04) / (b08 + b04)
            ndbi = (b11 - b08) / (b11 + b08)
    ndvi_mean, ndbi_mean = float(np.nanmean(ndvi)), float(np.nanmean(ndbi))
    if math.isnan(ndvi_mean) or math.isnan(ndbi_mean):
        raise ChangeDetectionError("parcel does not overlap the imagery footprint")
    return ndvi_mean, ndbi_mean


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
async def detect(
    ulpin: str | None = None,
    bbox: list[float] | tuple[float, float, float, float] | None = None,
    date_a: str | None = None,
    date_b: str | None = None,
    *,
    db: _DB,
    settings: Any,
    limit: int = 200,
) -> dict[str, Any]:
    """Run change detection for one parcel (``ulpin``) or every parcel intersecting ``bbox``.

    Single-parcel result::

        {ulpin, date_a, date_b, ndvi:{a,b,delta}, ndbi:{a,b,delta}, label, confidence,
         thresholds:{...}, method:"index_difference", imagery:{a,b}, recommendation, explanation, source}

    Bbox result::

        {bbox, date_a, date_b, count, changed, parcels:[<single results>], thresholds, method, source}

    ``source`` is ``"gis.s2_change"`` (offline) or ``"local_cogs"`` (online).
    Raises :class:`ChangeDetectionError` when nothing can be computed.
    """
    if not ulpin and not bbox:
        raise ChangeDetectionError("provide ulpin or bbox")
    if bbox is not None and len(bbox) != 4:
        raise ChangeDetectionError("bbox must be [minx, miny, maxx, maxy] in EPSG:4326")

    offline = _truthy(_setting(settings, "S2_OFFLINE", "1"))
    data_dir = Path(str(_setting(settings, "S2_DATA_DIR", "./data/s2")))
    manifest = None if offline else _load_manifest(data_dir)
    imagery: tuple[str | None, str | None] = (None, None)

    if manifest is not None:
        win_a, win_b = _pick_windows(manifest, date_a, date_b)
        imagery = (win_a.get("preview_url"), win_b.get("preview_url"))
        if not (_rasters_present(data_dir, win_a) and _rasters_present(data_dir, win_b)):
            manifest = None  # rasters missing → degrade to offline table

    if manifest is None and not offline and not (data_dir / "manifest.json").is_file():
        raise ChangeDetectionError(
            f"online mode requested but {data_dir / 'manifest.json'} is missing; "
            "run tools/fetch_s2.py or set S2_OFFLINE=1"
        )

    # ---- offline ---------------------------------------------------------
    if manifest is None:
        if ulpin:
            row = await db.fetchrow(_SQL_ONE, ulpin=ulpin)
            if row is None:
                raise ChangeDetectionError(f"no satellite baseline for parcel {ulpin} in gis.s2_change")
            return _row_result(row, imagery, "gis.s2_change")
        minx, miny, maxx, maxy = (float(v) for v in bbox)  # type: ignore[misc]
        rows = await db.fetch(_SQL_BBOX, minx=minx, miny=miny, maxx=maxx, maxy=maxy, limit=limit)
        results = [_row_result(r, imagery, "gis.s2_change") for r in rows]
        return _bbox_result(bbox, results, "gis.s2_change")  # type: ignore[arg-type]

    # ---- online ----------------------------------------------------------
    if ulpin:
        prow = await db.fetchrow(
            "SELECT ulpin, ST_AsGeoJSON(geom)::text AS gj FROM landstack.parcels WHERE ulpin = :ulpin",
            ulpin=ulpin,
        )
        if prow is None:
            raise ChangeDetectionError(f"unknown parcel {ulpin}")
        parcels = [prow]
    else:
        minx, miny, maxx, maxy = (float(v) for v in bbox)  # type: ignore[misc]
        parcels = list(
            await db.fetch(
                "SELECT ulpin, ST_AsGeoJSON(geom)::text AS gj FROM landstack.parcels "
                "WHERE geom && ST_MakeEnvelope(:minx, :miny, :maxx, :maxy, 4326) LIMIT :limit",
                minx=minx,
                miny=miny,
                maxx=maxx,
                maxy=maxy,
                limit=limit,
            )
        )

    results: list[dict[str, Any]] = []
    for p in parcels:
        gj = json.loads(_col(p, "gj"))
        ndvi_a, ndbi_a = _zonal_index_means(data_dir, win_a, gj)
        ndvi_b, ndbi_b = _zonal_index_means(data_dir, win_b, gj)
        d_ndvi, d_ndbi = ndvi_b - ndvi_a, ndbi_b - ndbi_a
        label, conf = classify(d_ndvi, d_ndbi)
        results.append(
            _result(
                ulpin=_col(p, "ulpin"),
                date_a=win_a["date"],
                date_b=win_b["date"],
                ndvi_a=round(ndvi_a, 4),
                ndvi_b=round(ndvi_b, 4),
                ndbi_a=round(ndbi_a, 4),
                ndbi_b=round(ndbi_b, 4),
                d_ndvi=d_ndvi,
                d_ndbi=d_ndbi,
                label=label,
                confidence=conf,
                imagery_a=imagery[0],
                imagery_b=imagery[1],
                source="local_cogs",
            )
        )
    if ulpin:
        return results[0]
    return _bbox_result(bbox, results, "local_cogs")  # type: ignore[arg-type]


def _bbox_result(bbox: Any, results: list[dict[str, Any]], source: str) -> dict[str, Any]:
    dates = {(r["date_a"], r["date_b"]) for r in results}
    da, dbb = next(iter(dates)) if len(dates) == 1 else (None, None)
    return {
        "bbox": [float(v) for v in bbox],
        "date_a": da,
        "date_b": dbb,
        "count": len(results),
        "changed": sum(1 for r in results if r["label"] != "no_significant_change"),
        "parcels": results,
        "thresholds": dict(THRESHOLDS),
        "method": "index_difference",
        "source": source,
    }
