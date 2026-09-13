#!/usr/bin/env python3
"""Fetch Sentinel-2 L2A imagery for the demo AOI from Microsoft Planetary Computer and (optionally)
compute per-parcel NDVI/NDBI change into ``gis.s2_change`` + ``landstack.alerts``.

Run this on a machine with internet access; the sandbox that generated the seed cannot reach
Planetary Computer. Two windows are searched (dry-season, low cloud):

    A: 2019-01-01 / 2019-03-31      B: 2025-01-01 / 2025-03-31      (eo:cloud_cover < 10)

The least cloudy item per window is loaded (B04 red, B08 NIR, B11 SWIR-1 at 10 m) clipped to the
AOI bbox and written as Cloud-Optimised GeoTIFFs::

    data/s2/<date>_B04.tif  <date>_B08.tif  <date>_B11.tif  <date>_NDVI.tif  <date>_NDBI.tif
    data/s2/manifest.json   → {"windows": [{"date", "item_id", "cloud_cover", "bands", "indices", "preview_url"}]}

``--compute`` then reads parcels (DATABASE_URL, or ``data/samples/parcels.geojson`` with
``--parcels``), computes zonal means of both indices per parcel for both dates, classifies the
difference with :func:`ai.change_detection.classify` and upserts ``gis.s2_change``; parcels whose
label is not ``no_significant_change`` get an open ``change_detected`` alert unless one exists.

Requirements (not part of the API image)::

    pip install pystac-client planetary-computer odc-stac rioxarray rasterio numpy pyproj shapely psycopg[binary]

Usage::

    python tools/fetch_s2.py                       # download → data/s2/
    python tools/fetch_s2.py --compute             # also fill gis.s2_change + alerts from the DB parcels
    python tools/fetch_s2.py --compute --parcels data/samples/parcels.geojson --out-json data/s2/s2_change.json
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import date
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from ai.change_detection import classify  # noqa: E402

AOI_BBOX = (80.545, 16.434, 80.567, 16.452)
WINDOWS = {"a": ("2019-01-01", "2019-03-31"), "b": ("2025-01-01", "2025-03-31")}
BANDS = ("B04", "B08", "B11")
COLLECTION = "sentinel-2-l2a"
MAX_CLOUD = 10
DEFAULT_OUT = REPO_ROOT / "data" / "s2"


def _require(module: str, pip_name: str | None = None) -> Any:
    try:
        return __import__(module)
    except ImportError as exc:
        raise SystemExit(f"missing dependency '{module}': pip install {pip_name or module}") from exc


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------
def search_least_cloudy(catalog: Any, window: tuple[str, str]) -> Any:
    items = list(catalog.search(collections=[COLLECTION], bbox=AOI_BBOX, datetime="/".join(window),
                                query={"eo:cloud_cover": {"lt": MAX_CLOUD}}).items())
    if not items:
        raise SystemExit(f"no {COLLECTION} items with cloud cover < {MAX_CLOUD}% for {window}; widen the window")
    items.sort(key=lambda it: (it.properties.get("eo:cloud_cover", 100), it.datetime))
    return items[0]


def load_and_write(item: Any, out_dir: Path) -> dict[str, Any]:
    """Load B04/B08/B11 at 10 m clipped to the AOI, write band + index COGs, return a manifest entry."""
    pc = _require("planetary_computer", "planetary-computer")
    odc_stac = _require("odc.stac", "odc-stac")
    np = _require("numpy")
    _require("rioxarray")  # registers .rio accessor

    signed = pc.sign(item)
    ds = odc_stac.load([signed], bands=list(BANDS), bbox=AOI_BBOX, resolution=10, crs="EPSG:32644",
                       resampling="bilinear", chunks=None).isel(time=0)
    day = item.datetime.date().isoformat()
    entry: dict[str, Any] = {
        "date": day, "item_id": item.id, "cloud_cover": item.properties.get("eo:cloud_cover"),
        "bands": {}, "indices": {}, "crs": "EPSG:32644",
        "preview_url": (item.assets.get("rendered_preview").href if "rendered_preview" in item.assets else None),
    }
    cog = {"driver": "COG", "compress": "deflate"}
    for band in BANDS:
        arr = ds[band].astype("float32")
        arr.rio.write_nodata(np.nan, inplace=True)
        path = out_dir / f"{day}_{band}.tif"
        arr.rio.to_raster(path, **cog)
        entry["bands"][band] = path.name
    b04, b08, b11 = (ds[b].astype("float32") for b in BANDS)
    with np.errstate(divide="ignore", invalid="ignore"):
        ndvi = ((b08 - b04) / (b08 + b04)).clip(-1, 1)
        ndbi = ((b11 - b08) / (b11 + b08)).clip(-1, 1)
    for name, arr in (("NDVI", ndvi), ("NDBI", ndbi)):
        arr = arr.rio.write_crs(ds.rio.crs)
        arr.rio.write_nodata(np.nan, inplace=True)
        path = out_dir / f"{day}_{name}.tif"
        arr.rio.to_raster(path, **cog)
        entry["indices"][name] = path.name
    return entry


def download(out_dir: Path) -> dict[str, Any]:
    pystac_client = _require("pystac_client", "pystac-client")
    pc = _require("planetary_computer", "planetary-computer")
    out_dir.mkdir(parents=True, exist_ok=True)
    catalog = pystac_client.Client.open("https://planetarycomputer.microsoft.com/api/stac/v1", modifier=pc.sign_inplace)
    windows = []
    for key, window in WINDOWS.items():
        t0 = time.perf_counter()
        item = search_least_cloudy(catalog, window)
        print(f"window {key} {window}: {item.id} (cloud {item.properties.get('eo:cloud_cover'):.1f}%)")
        entry = load_and_write(item, out_dir)
        print(f"  wrote {', '.join(entry['bands'].values())}, {', '.join(entry['indices'].values())} in {time.perf_counter() - t0:.0f}s")
        windows.append(entry)
    manifest = {"collection": COLLECTION, "bbox": list(AOI_BBOX), "generated_on": date.today().isoformat(), "windows": windows}
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"manifest: {out_dir / 'manifest.json'}")
    return manifest


# ---------------------------------------------------------------------------
# Compute per-parcel change
# ---------------------------------------------------------------------------
def load_parcels(parcels_path: Path | None, database_url: str | None) -> list[tuple[str, dict[str, Any]]]:
    """Return ``[(ulpin, geometry_geojson)]`` from a GeoJSON file or from landstack.parcels."""
    if parcels_path:
        fc = json.loads(parcels_path.read_text())
        return [(f["properties"]["ulpin"], f["geometry"]) for f in fc["features"]]
    from dburl import connect, resolve_database_url

    with connect(resolve_database_url(database_url)) as conn, conn.cursor() as cur:
        cur.execute("SELECT ulpin, ST_AsGeoJSON(geom)::text FROM landstack.parcels")
        return [(u, json.loads(g)) for u, g in cur.fetchall()]


def zonal_means(raster_path: Path, geoms: list[dict[str, Any]]) -> list[float]:
    rasterio = _require("rasterio")
    np = _require("numpy")
    from rasterio.mask import mask as rio_mask
    from rasterio.warp import transform_geom

    out: list[float] = []
    with rasterio.open(raster_path) as ds:
        for g in geoms:
            gg = transform_geom("EPSG:4326", ds.crs, g)
            try:
                arr, _ = rio_mask(ds, [gg], crop=True, all_touched=True, filled=False)
                out.append(float(np.nanmean(arr[0].astype("float64"))))
            except ValueError:  # geometry outside raster
                out.append(float("nan"))
    return out


def compute(out_dir: Path, parcels_path: Path | None, database_url: str | None, out_json: Path | None) -> list[dict[str, Any]]:
    manifest_path = out_dir / "manifest.json"
    if not manifest_path.is_file():
        raise SystemExit(f"{manifest_path} not found; run without --compute first")
    manifest = json.loads(manifest_path.read_text())
    windows = sorted(manifest["windows"], key=lambda w: w["date"])
    if len(windows) < 2:
        raise SystemExit("manifest has fewer than two windows")
    win_a, win_b = windows[0], windows[-1]
    for w in (win_a, win_b):
        for name in ("NDVI", "NDBI"):
            if not (out_dir / w["indices"][name]).is_file():
                raise SystemExit(f"missing raster {out_dir / w['indices'][name]}")

    parcels = load_parcels(parcels_path, database_url)
    geoms = [g for _, g in parcels]
    print(f"computing zonal means for {len(parcels)} parcels ...")
    ndvi_a = zonal_means(out_dir / win_a["indices"]["NDVI"], geoms)
    ndbi_a = zonal_means(out_dir / win_a["indices"]["NDBI"], geoms)
    ndvi_b = zonal_means(out_dir / win_b["indices"]["NDVI"], geoms)
    ndbi_b = zonal_means(out_dir / win_b["indices"]["NDBI"], geoms)

    rows: list[dict[str, Any]] = []
    import math

    for i, (ulpin, _) in enumerate(parcels):
        vals = (ndvi_a[i], ndvi_b[i], ndbi_a[i], ndbi_b[i])
        if any(math.isnan(v) for v in vals):
            continue
        d_ndvi, d_ndbi = ndvi_b[i] - ndvi_a[i], ndbi_b[i] - ndbi_a[i]
        label, conf = classify(d_ndvi, d_ndbi)
        rows.append({"ulpin": ulpin, "date_a": win_a["date"], "date_b": win_b["date"],
                     "ndvi_a": round(ndvi_a[i], 4), "ndvi_b": round(ndvi_b[i], 4),
                     "ndbi_a": round(ndbi_a[i], 4), "ndbi_b": round(ndbi_b[i], 4),
                     "d_ndvi": round(d_ndvi, 4), "d_ndbi": round(d_ndbi, 4), "label": label, "confidence": conf})
    changed = [r for r in rows if r["label"] != "no_significant_change"]
    print(f"{len(rows)} parcels scored; {len(changed)} with change labels")

    if out_json:
        out_json.write_text(json.dumps(rows, indent=1))
        print(f"wrote {out_json}")
    if parcels_path is None or database_url:
        write_results(rows, database_url)
    return rows


def write_results(rows: list[dict[str, Any]], database_url: str | None) -> None:
    from dburl import connect, resolve_database_url

    upsert = """
        INSERT INTO gis.s2_change (ulpin, date_a, date_b, ndvi_a, ndvi_b, ndbi_a, ndbi_b, d_ndvi, d_ndbi, label, confidence, computed_at)
        VALUES (%(ulpin)s, %(date_a)s, %(date_b)s, %(ndvi_a)s, %(ndvi_b)s, %(ndbi_a)s, %(ndbi_b)s, %(d_ndvi)s, %(d_ndbi)s, %(label)s, %(confidence)s, now())
        ON CONFLICT (ulpin) DO UPDATE SET
            date_a = EXCLUDED.date_a, date_b = EXCLUDED.date_b,
            ndvi_a = EXCLUDED.ndvi_a, ndvi_b = EXCLUDED.ndvi_b, ndbi_a = EXCLUDED.ndbi_a, ndbi_b = EXCLUDED.ndbi_b,
            d_ndvi = EXCLUDED.d_ndvi, d_ndbi = EXCLUDED.d_ndbi, label = EXCLUDED.label,
            confidence = EXCLUDED.confidence, computed_at = now()
    """
    alert = """
        INSERT INTO landstack.alerts (ulpin, kind, severity, title, detail, status)
        SELECT %(ulpin)s, 'change_detected', 'high', 'Possible unrecorded land-use change', %(detail)s::jsonb, 'open'
        WHERE EXISTS (SELECT 1 FROM landstack.parcels p WHERE p.ulpin = %(ulpin)s)
          AND NOT EXISTS (SELECT 1 FROM landstack.alerts a WHERE a.ulpin = %(ulpin)s AND a.kind = 'change_detected' AND a.status <> 'resolved')
    """
    with connect(resolve_database_url(database_url)) as conn, conn.cursor() as cur:
        cur.executemany(upsert, rows)
        cur.executemany(alert, [{"ulpin": r["ulpin"], "detail": json.dumps({**r, "method": "index_difference"})}
                                for r in rows if r["label"] != "no_significant_change"])
        conn.commit()
    print("gis.s2_change upserted and alerts inserted")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help="output directory (default data/s2)")
    ap.add_argument("--skip-download", action="store_true", help="reuse existing rasters/manifest")
    ap.add_argument("--compute", action="store_true", help="compute per-parcel change and write gis.s2_change")
    ap.add_argument("--parcels", type=Path, help="parcels GeoJSON instead of the database")
    ap.add_argument("--out-json", type=Path, help="also dump computed rows to this JSON file")
    ap.add_argument("--database-url", help="overrides DATABASE_URL")
    args = ap.parse_args(argv)

    if not args.skip_download:
        download(args.out)
    if args.compute:
        compute(args.out, args.parcels, args.database_url, args.out_json)
    return 0


if __name__ == "__main__":
    sys.exit(main())
