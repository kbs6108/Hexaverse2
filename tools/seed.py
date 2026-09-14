#!/usr/bin/env python3
"""Synthetic cadastre generator for the Land Stack demo regions (CONTRACTS §10).

Builds a deterministic, believable peri-urban cadastre in each of THREE real bounding boxes —
Mangalagiri (AP, the original demo AOI), Sriperumbudur (TN) and Shamshabad (TG) — to demonstrate
the platform scaling across states. Per region: a road network (synthetic, or OpenStreetMap with
``--osm`` when Overpass is reachable), blocks polygonised from the roads, parcels carved from the
blocks and then THINNED to ~150 whole blocks (staged-digitisation look: clear clusters with gaps),
master-plan zones, restriction zones, projects, water lines, one record per department in that
department's own vocabulary (lightly localized names/courts/projects per state), a few buildings
with per-floor units for the 3D preview, and Sentinel-2 index values with planted change alerts.
Story parcels are guaranteed per region: AP keeps the original six (123/4, 124, 125/2, 126,
127/1, 128 — same ULPINs as before the multi-state refactor); TN adds a disputed parcel (45/2)
and TG a satellite change-alert parcel (77).

Geometry is constructed in EPSG:32644 (UTM 44N, metres) and stored in EPSG:4326 with
coordinates rounded to 7 decimals (≈1 cm) so ULPINs are reproducible.

Usage::

    python tools/seed.py --dry-run --geojson-out data/samples   # no DB needed
    python tools/seed.py                                         # full load into DATABASE_URL
    python tools/seed.py --only-mutable                          # alerts/applications/audit only
    python tools/seed.py --osm                                   # try OSM roads first

Every generator is a plain function over a shared ``Frame`` so ``tools/demo_reset.py`` can reuse it.
"""

from __future__ import annotations

import argparse
import json
import math
import random
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Iterable, Sequence

import numpy as np
import shapely
from shapely import STRtree, affinity, make_valid, wkt
from shapely.geometry import (
    LineString,
    MultiLineString,
    MultiPolygon,
    Point,
    Polygon,
    box,
    mapping,
)
from shapely.geometry.base import BaseGeometry
from shapely.ops import polygonize, transform, unary_union

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from ai.change_detection import classify  # noqa: E402
from landstack.services.ulpin import ulpin_3d, ulpin_style  # noqa: E402

# ---------------------------------------------------------------------------
# Constants (CONTRACTS §10)
# ---------------------------------------------------------------------------
# Legacy single-AOI constants (AP / Mangalagiri). Kept because the AP region must stay
# byte-identical to the original single-region seed so its ULPINs (deep links, docs,
# pitch content) never change. The multi-state configs live in REGIONS below.
AOI_BBOX = (80.545, 16.434, 80.567, 16.452)  # minx, miny, maxx, maxy (EPSG:4326)
DEFAULT_SEED = 42
FLOOR_HEIGHT_M = 3.2
S2_DATE_A, S2_DATE_B = date(2019, 2, 14), date(2025, 2, 9)
TODAY = date(2026, 9, 13)
NOW = datetime(2026, 9, 13, 8, 0, tzinfo=timezone.utc)
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

ROAD_WIDTH_M = {"national": 30.0, "state": 18.0, "district": 12.0, "village": 8.0, "lane": 4.5}
ZONE_NAMES = {
    "R1": "Residential (core)", "R2": "Residential (peri-urban)", "C1": "Commercial",
    "AG": "Agricultural", "IND": "Industrial", "PUB": "Public / semi-public",
}
ZONE_USES = {
    "R1": ["residential", "commercial", "public"], "R2": ["residential", "agricultural", "public"],
    "C1": ["commercial", "residential"], "AG": ["agricultural"],
    "IND": ["industrial", "commercial"], "PUB": ["public"],
}
GUIDELINE_VALUE = {"R1": 18000, "R2": 12000, "C1": 30000, "AG": 1500, "IND": 8000, "PUB": 6000}
TAX_RATE = {"residential": 0.0012, "commercial": 0.0025, "industrial": 0.002, "vacant": 0.0005,
            "agricultural": 0.0001, "public": 0.0}
BANKS = ["State Bank of India", "Union Bank of India", "Canara Bank", "HDFC Bank", "ICICI Bank",
         "Andhra Pradesh Grameena Vikas Bank", "Guntur DCCB", "Indian Bank"]

MUTABLE_TABLES = (
    "landstack.applications", "landstack.audit_log", "landstack.alerts", "landstack.reports",
    "landstack.consents", "dept_revenue.mutations", "dept_registration.outbox",
)
# Department tables the demo itself rewrites through department POSTs (mutations → ror,
# simulate-deed → deeds, approvals → building_permissions); restored by demo reset too.
DEMO_DEPT_TABLES = (
    "dept_revenue.ror", "dept_registration.deeds", "dept_registration.encumbrances",
    "dept_planning.building_permissions",
)
ALL_TABLES = (
    "landstack.units", "landstack.buildings", "landstack.parcels", "landstack.users",
    "dept_planning.zones", "dept_fiscal.property_tax",
    "dept_fiscal.valuation", "dept_legal.disputes", "dept_utilities.connections",
    "gis.roads", "gis.water_lines", "gis.restriction_zones", "gis.projects", "gis.village_boundary",
    "gis.s2_change",
) + DEMO_DEPT_TABLES + MUTABLE_TABLES

# Story-parcel spec: survey_no → (key, land_use, subdivision group size, index of the story
# parcel in the group). Each Region carries its own spec; the department-record and satellite
# generators key on the *key* (e.g. "disputed"), so a spec entry in any region gets the same
# scripted treatment. AP keeps the original six; TN/TG each get one signature parcel.
AP_STORY = {
    "123/4": ("clean_residential", "residential", 5, 3),
    "124": ("change_alert", "agricultural", 1, 0),
    "125/2": ("disputed", "residential", 3, 1),
    "126": ("mortgaged", "residential", 1, 0),
    "127/1": ("tax_arrears_area_mismatch", "agricultural", 2, 0),
    "128": ("pending_mutation", "residential", 1, 0),
}
TN_STORY = {"45/2": ("disputed", "residential", 3, 1)}
TG_STORY = {"77": ("change_alert", "agricultural", 1, 0)}
DEMO_USERS = [
    ("dev-ravi-kumar", "ravi.kumar@example.com", "Ravi Kumar", "citizen", None),
    ("dev-lakshmi-devi", "lakshmi.devi@example.com", "Lakshmi Devi", "citizen", None),
    ("dev-anitha", "anitha@revenue.ap.example", "Anitha", "officer", "revenue"),
    ("dev-suresh", "suresh@igrs.ap.example", "Suresh", "officer", "registration"),
    ("dev-farida", "farida@planning.ap.example", "Farida", "officer", "planning"),
    ("dev-admin", "admin@landstack.example", "Admin", "admin", None),
]


@dataclass(frozen=True)
class Region:
    """One state's demo cluster: geography, story spec, light localization and id bases.

    All three AOIs sit inside UTM zone 44N so the module-level transformers work
    unchanged. ``rng_key=None`` means "seed the RNG exactly like the original
    single-region generator" — required so AP reproduces its historical ULPINs.
    """

    code: str                                   # "AP" | "TN" | "TG" (landstack.parcels.state)
    state_name: str
    district: str
    taluk: str
    village: str
    aoi_name: str
    sro_code: str
    aoi_bbox: tuple[float, float, float, float]
    story: dict[str, tuple[str, str, int, int]]
    male: list[str]
    female: list[str]
    surname: list[str]
    govt_owners: list[str]
    courts: list[str]
    assess_prefix: str
    permit_conditions: str
    restriction_names: tuple[str, str, str]     # flood, heritage, eco_sensitive
    project_names: tuple[tuple[str, str], ...]  # ((road name, 'road'), (corridor name, 'metro'))
    building_names: tuple[str, str, str, str]   # 2 commercial, 2 residential
    target_parcels: int                         # post-thinning cluster size
    khata_base: int
    deed_base: int
    permit_base: int
    case_base: int
    building_base: int
    rng_key: str | None                         # None → Random(seed) (AP legacy stream)


# ---------------------------------------------------------------------------
# Projection helpers
# ---------------------------------------------------------------------------
def _transformers() -> tuple[Callable, Callable]:
    from pyproj import Transformer

    fwd = Transformer.from_crs("EPSG:4326", "EPSG:32644", always_xy=True).transform
    inv = Transformer.from_crs("EPSG:32644", "EPSG:4326", always_xy=True).transform
    return fwd, inv


TO_UTM, TO_WGS = _transformers()


def to_wgs(geom: BaseGeometry) -> BaseGeometry:
    """Project a UTM geometry to WGS84 and snap to 7 decimals (reproducible ULPINs)."""
    g = shapely.transform(transform(TO_WGS, geom), lambda c: np.round(c, 7))
    if g.is_valid:
        return g
    fixed = make_valid(g)
    if isinstance(geom, (Polygon, MultiPolygon)):
        polys = explode_polygons(fixed)
        return polys[0] if len(polys) == 1 and isinstance(geom, Polygon) else MultiPolygon(polys)
    return fixed


def to_utm(geom: BaseGeometry) -> BaseGeometry:
    return transform(TO_UTM, geom)


def as_multipolygon(geom: BaseGeometry) -> MultiPolygon:
    if isinstance(geom, MultiPolygon):
        return geom
    if isinstance(geom, Polygon):
        return MultiPolygon([geom])
    polys = [g for g in getattr(geom, "geoms", []) if isinstance(g, Polygon) and not g.is_empty]
    return MultiPolygon(polys)


def explode_polygons(geom: BaseGeometry) -> list[Polygon]:
    if geom.is_empty:
        return []
    if isinstance(geom, Polygon):
        return [geom]
    return [g for g in getattr(geom, "geoms", []) if isinstance(g, Polygon) and not g.is_empty]


def explode_lines(geom: BaseGeometry) -> list[LineString]:
    if geom.is_empty:
        return []
    if isinstance(geom, LineString):
        return [geom]
    return [g for g in getattr(geom, "geoms", []) if isinstance(g, LineString) and len(g.coords) > 1]


def aoi_polygon_utm(bbox: tuple[float, float, float, float] = AOI_BBOX) -> Polygon:
    """AOI bbox densified along its edges and projected (a slightly rotated quadrilateral in UTM)."""
    minx, miny, maxx, maxy = bbox
    n = 40
    ring: list[tuple[float, float]] = []
    ring += [(minx + (maxx - minx) * i / n, miny) for i in range(n)]
    ring += [(maxx, miny + (maxy - miny) * i / n) for i in range(n)]
    ring += [(maxx - (maxx - minx) * i / n, maxy) for i in range(n)]
    ring += [(minx, maxy - (maxy - miny) * i / n) for i in range(n)]
    return to_utm(Polygon(ring))


# ---------------------------------------------------------------------------
# Data records
# ---------------------------------------------------------------------------
@dataclass
class Road:
    name: str | None
    road_class: str
    width_m: float
    geom_utm: LineString
    source: str = "synthetic"


@dataclass
class Parcel:
    geom_utm: Polygon
    block_id: int
    size_class: str                      # urban | semi | agri
    geom: BaseGeometry = field(init=False)
    ulpin: str = ""
    survey_no: str = ""
    sub_division: str | None = None
    zone_code: str = "AG"
    land_use: str = "agricultural"
    story: str | None = None             # key from the region's story spec
    story_survey: str | None = None

    def __post_init__(self) -> None:
        self.geom = to_wgs(self.geom_utm)

    @property
    def area_sqm(self) -> float:
        return round(self.geom_utm.area, 2)

    @property
    def centroid_utm(self) -> Point:
        return self.geom_utm.centroid


@dataclass
class Frame:
    """Everything one region's seed produces, in insertion-ready Python structures."""

    seed: int
    aoi_utm: Polygon
    region: Region
    roads: list[Road] = field(default_factory=list)
    blocks: list[Polygon] = field(default_factory=list)
    parcels: list[Parcel] = field(default_factory=list)
    zones: list[dict[str, Any]] = field(default_factory=list)
    restriction_zones: list[dict[str, Any]] = field(default_factory=list)
    projects: list[dict[str, Any]] = field(default_factory=list)
    water_lines: list[dict[str, Any]] = field(default_factory=list)
    ror: list[dict[str, Any]] = field(default_factory=list)
    deeds: list[dict[str, Any]] = field(default_factory=list)
    encumbrances: list[dict[str, Any]] = field(default_factory=list)
    permissions: list[dict[str, Any]] = field(default_factory=list)
    property_tax: list[dict[str, Any]] = field(default_factory=list)
    valuation: list[dict[str, Any]] = field(default_factory=list)
    disputes: list[dict[str, Any]] = field(default_factory=list)
    connections: list[dict[str, Any]] = field(default_factory=list)
    buildings: list[dict[str, Any]] = field(default_factory=list)
    units: list[dict[str, Any]] = field(default_factory=list)
    s2_change: list[dict[str, Any]] = field(default_factory=list)
    alerts: list[dict[str, Any]] = field(default_factory=list)
    applications: list[dict[str, Any]] = field(default_factory=list)
    audit_log: list[dict[str, Any]] = field(default_factory=list)
    mutations: list[dict[str, Any]] = field(default_factory=list)
    users: list[dict[str, Any]] = field(default_factory=list)
    story: dict[str, Parcel] = field(default_factory=dict)   # survey_no → parcel

    def parcel_by_ulpin(self) -> dict[str, Parcel]:
        return {p.ulpin: p for p in self.parcels}


# ---------------------------------------------------------------------------
# Roads
# ---------------------------------------------------------------------------
def _wavy_line(p0: tuple[float, float], p1: tuple[float, float], amp: float, rng: random.Random, n: int = 40) -> LineString:
    """Straight line from p0 to p1 with a gentle sinusoidal bend of amplitude ``amp`` metres."""
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0
    length = math.hypot(dx, dy)
    nx, ny = -dy / length, dx / length
    phase = rng.uniform(0, math.pi)
    k = rng.choice([1, 1, 2])
    pts = []
    for i in range(n + 1):
        t = i / n
        off = amp * math.sin(math.pi * k * t + phase) * math.sin(math.pi * t)
        pts.append((x0 + dx * t + nx * off, y0 + dy * t + ny * off))
    return LineString(pts)


def synthetic_roads(aoi: Polygon, rng: random.Random) -> list[Road]:
    """Two arterials, a highway clipping the NE corner, minor roads forming irregular blocks, lanes."""
    minx, miny, maxx, maxy = aoi.bounds
    W, H = maxx - minx, maxy - miny
    fx = lambda f: minx + f * W  # noqa: E731
    fy = lambda f: miny + f * H  # noqa: E731
    roads: list[Road] = []

    def add(name: str | None, cls: str, line: LineString, width: float | None = None) -> None:
        clipped = line.intersection(aoi)
        for part in explode_lines(clipped):
            if part.length > 30:
                roads.append(Road(name, cls, width or ROAD_WIDTH_M[cls], part))

    # Arterials
    add("Mangalagiri – Tadepalli Road", "state", _wavy_line((fx(0.48), miny - 60), (fx(0.50), maxy + 60), 70, rng))
    add("Nidamarru Road", "district", _wavy_line((minx - 60, fy(0.42)), (maxx + 60, fy(0.40)), 55, rng))
    # Highway grazing the north-east corner
    add("NH-16 service corridor", "national", _wavy_line((fx(0.80), maxy + 60), (maxx + 60, fy(0.58)), 25, rng))

    # Minor roads (village class): some span the AOI, some stop at an arterial
    ns_fracs = [0.12, 0.25, 0.36, 0.62, 0.74, 0.88]
    ew_fracs = [0.14, 0.27, 0.57, 0.72, 0.86]
    for i, f in enumerate(ns_fracs):
        f += rng.uniform(-0.025, 0.025)
        y_lo = miny - 60 if rng.random() < 0.6 else fy(rng.choice([0.40, 0.57]))
        y_hi = maxy + 60 if rng.random() < 0.6 else fy(rng.choice([0.42, 0.72]))
        if y_hi - y_lo < 300:
            y_lo, y_hi = miny - 60, maxy + 60
        add(f"Village Road {i + 1}", "village", _wavy_line((fx(f), y_lo), (fx(f + rng.uniform(-0.04, 0.04)), y_hi), rng.uniform(15, 40), rng))
    for j, f in enumerate(ew_fracs):
        f += rng.uniform(-0.02, 0.02)
        x_lo = minx - 60 if rng.random() < 0.6 else fx(rng.choice([0.25, 0.48]))
        x_hi = maxx + 60 if rng.random() < 0.6 else fx(rng.choice([0.50, 0.74]))
        if x_hi - x_lo < 300:
            x_lo, x_hi = minx - 60, maxx + 60
        add(f"Cross Road {j + 1}", "village", _wavy_line((x_lo, fy(f)), (x_hi, fy(f + rng.uniform(-0.03, 0.03))), rng.uniform(15, 40), rng))

    # Denser streets in the town corner (south-west)
    for k, f in enumerate([0.05, 0.18]):
        add(f"{k + 1}st Street" if k == 0 else f"{k + 1}nd Street", "village",
            _wavy_line((fx(f), miny - 20), (fx(f + 0.01), fy(0.30)), 8, rng), 7.0)
    for k, f in enumerate([0.07, 0.20, 0.33]):
        add(f"Main Bazaar Lane {k + 1}", "village", _wavy_line((minx - 20, fy(f)), (fx(0.30), fy(f + 0.01)), 8, rng), 7.0)

    # Dead-end lanes off minor roads
    minor = [r for r in roads if r.road_class == "village"]
    for k in range(7):
        base = rng.choice(minor)
        t = rng.uniform(0.2, 0.8)
        p = base.geom_utm.interpolate(t, normalized=True)
        q = base.geom_utm.interpolate(min(t + 0.01, 1.0), normalized=True)
        ang = math.atan2(q.y - p.y, q.x - p.x) + (math.pi / 2 if rng.random() < 0.5 else -math.pi / 2)
        length = rng.uniform(90, 160)
        end = (p.x + math.cos(ang) * length, p.y + math.sin(ang) * length)
        add(f"Lane {k + 1}", "lane", LineString([(p.x, p.y), end]))
    return roads


def _classify_osm_highway(tag: str) -> tuple[str, float] | None:
    table = {
        "motorway": ("national", 30.0), "trunk": ("national", 30.0), "primary": ("national", 24.0),
        "secondary": ("state", 18.0), "tertiary": ("district", 12.0),
        "residential": ("village", 8.0), "unclassified": ("village", 8.0), "living_street": ("village", 6.0),
        "service": ("lane", 4.5), "track": ("lane", 4.0),
    }
    return table.get(tag.replace("_link", ""))


def osm_roads(aoi: Polygon, bbox: tuple[float, float, float, float] = AOI_BBOX, timeout_s: float = 20.0) -> list[Road] | None:
    """Fetch highway=* ways from Overpass; ``None`` when unreachable or too sparse."""
    minx, miny, maxx, maxy = bbox
    query = f'[out:json][timeout:{int(timeout_s)}];way["highway"]({miny},{minx},{maxy},{maxx});out geom;'
    req = urllib.request.Request(OVERPASS_URL, data=query.encode(), headers={"User-Agent": "landstack-seed/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            payload = json.loads(resp.read().decode())
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
        print(f"  Overpass unavailable ({exc.__class__.__name__}); using synthetic roads")
        return None
    roads: list[Road] = []
    for el in payload.get("elements", []):
        cls = _classify_osm_highway(el.get("tags", {}).get("highway", ""))
        if not cls or len(el.get("geometry", [])) < 2:
            continue
        line = to_utm(LineString([(pt["lon"], pt["lat"]) for pt in el["geometry"]]))
        for part in explode_lines(line.intersection(aoi)):
            if part.length > 20:
                roads.append(Road(el.get("tags", {}).get("name"), cls[0], cls[1], part, source="osm"))
    if len(roads) < 8:
        print(f"  Overpass returned only {len(roads)} usable ways; using synthetic roads")
        return None
    return roads


# ---------------------------------------------------------------------------
# Blocks and parcels
# ---------------------------------------------------------------------------
def make_blocks(aoi: Polygon, roads: Sequence[Road]) -> list[Polygon]:
    """Polygonise the noded road network + AOI boundary, then shave the road corridors."""
    lines = unary_union([aoi.boundary] + [r.geom_utm for r in roads])
    faces = [f for f in polygonize(lines) if f.representative_point().within(aoi)]
    corridor = unary_union([r.geom_utm.buffer(r.width_m / 2 + 1.5, cap_style="flat") for r in roads])
    blocks: list[Polygon] = []
    for f in faces:
        shaved = make_valid(f.difference(corridor))
        blocks += [b for b in explode_polygons(shaved) if b.area > 150]
    return blocks


def _arterial_junction(roads: Sequence[Road]) -> Point | None:
    """Crossing of the two widest non-highway roads (state × district), if they intersect."""
    ranked = sorted((r for r in roads if r.road_class in {"state", "district"}), key=lambda r: -r.width_m)
    for a in ranked:
        for b in ranked:
            if a is b or a.road_class == b.road_class:
                continue
            x = a.geom_utm.intersection(b.geom_utm)
            if not x.is_empty:
                return x.centroid
    return None


class SizeModel:
    """Target parcel size as a function of position: town core, peri-urban ring + hamlet, farmland."""

    def __init__(self, aoi: Polygon, roads: Sequence[Road], rng: random.Random) -> None:
        minx, miny, maxx, maxy = aoi.bounds
        self.town = Point(minx, miny)                                   # SW corner = town side
        cx, cy = (minx + maxx) / 2, (miny + maxy) / 2
        self.centre = Point(cx, cy)
        self.hamlet = Point(cx - 150, cy + 10)                          # hamlet just west of centre
        self.junction = _arterial_junction(roads)                       # commercial node, may be None
        self.rng = rng
        self.r_core, self.r_ring, self.r_hamlet, self.r_junction = 300.0, 560.0, 130.0, 190.0
        self.arterials = unary_union([r.geom_utm for r in roads if r.road_class in {"state", "district"}]) if roads else None

    def size_class(self, pt: Point) -> str:
        d_town = pt.distance(self.town)
        if d_town < self.r_core:
            return "urban"
        if d_town < self.r_ring or pt.distance(self.hamlet) < self.r_hamlet:
            return "semi"
        if self.junction is not None and pt.distance(self.junction) < self.r_junction:
            return "semi"
        # ribbon development: plots fronting an arterial within ~900 m of town or the junction
        if self.arterials is not None and pt.distance(self.arterials) < 45 and (
            d_town < 900 or (self.junction is not None and pt.distance(self.junction) < 600)
        ):
            return "semi"
        return "agri"

    def sample_area(self, cls: str) -> float:
        r = self.rng
        if cls == "urban":
            return r.triangular(100, 320, 180)
        if cls == "semi":
            return r.triangular(400, 1400, 800)
        return r.triangular(5000, 20000, 12000)


def split_polygon(poly: Polygon, rng: random.Random, t: float | None = None) -> list[Polygon]:
    """Cut ``poly`` perpendicular to its long axis at fraction ``t`` (jittered) into two parts."""
    rect = poly.minimum_rotated_rectangle
    if not isinstance(rect, Polygon):
        return []
    c = list(rect.exterior.coords)
    e1 = (c[1][0] - c[0][0], c[1][1] - c[0][1])
    e2 = (c[2][0] - c[1][0], c[2][1] - c[1][1])
    long_edge = e1 if math.hypot(*e1) >= math.hypot(*e2) else e2
    angle = math.degrees(math.atan2(long_edge[1], long_edge[0])) + rng.uniform(-3, 3)
    origin = poly.centroid
    rp = affinity.rotate(poly, -angle, origin=origin)
    minx, miny, maxx, maxy = rp.bounds
    t = rng.uniform(0.40, 0.60) if t is None else t
    x_cut = minx + (maxx - minx) * t
    parts: list[Polygon] = []
    for half in (box(minx - 5, miny - 5, x_cut, maxy + 5), box(x_cut, miny - 5, maxx + 5, maxy + 5)):
        piece = affinity.rotate(rp.intersection(half), angle, origin=origin)
        parts += explode_polygons(make_valid(piece))
    return parts


def subdivide(poly: Polygon, model: SizeModel, rng: random.Random, cls: str | None = None,
              target: float | None = None, depth: int = 0) -> list[tuple[Polygon, str]]:
    """Recursively strip-split ``poly`` until pieces are below ~1.5× their sampled target area."""
    if poly.area < 40:
        return []
    here = model.size_class(poly.centroid)
    if cls != here or target is None:
        cls, target = here, model.sample_area(here)
    if poly.area <= 1.5 * target or depth > 40:
        return [(poly, cls)]
    parts = split_polygon(poly, rng)
    if len(parts) < 2:
        return [(poly, cls)]
    out: list[tuple[Polygon, str]] = []
    for part in parts:
        out += subdivide(part, model, rng, cls, target, depth + 1)
    return out


def split_into(poly: Polygon, n: int, rng: random.Random) -> list[Polygon]:
    """Split a polygon into exactly ``n`` roughly equal parts (used for units on a floor)."""
    if n <= 1:
        return [poly]
    k = n // 2
    parts = split_polygon(poly, rng, t=k / n)
    if len(parts) < 2:
        return [poly]
    parts.sort(key=lambda p: p.area, reverse=True)
    left, right = parts[0], unary_union(parts[1:])
    right_polys = explode_polygons(right) or [left]
    return split_into(left, n - k, rng) + split_into(right_polys[0], k, rng)


def make_parcels(blocks: Sequence[Polygon], model: SizeModel, rng: random.Random) -> list[Parcel]:
    parcels: list[Parcel] = []
    for bid, block in enumerate(blocks):
        for poly, cls in subdivide(block, model, rng):
            poly = make_valid(poly)
            polys = explode_polygons(poly)
            min_area = 45 if cls == "urban" else 120
            if len(polys) != 1 or not polys[0].is_valid or polys[0].area < min_area:
                continue
            parcels.append(Parcel(polys[0], bid, cls))
    return parcels


def assert_no_overlaps(parcels: Sequence[Parcel], tolerance_sqm: float = 1.0) -> int:
    """Raise if any two parcels overlap by more than ``tolerance_sqm``; return pair count checked."""
    geoms = [p.geom_utm for p in parcels]
    tree = STRtree(geoms)
    pairs = tree.query(geoms, predicate="intersects")
    checked = 0
    for i, j in zip(pairs[0], pairs[1]):
        if i >= j:
            continue
        checked += 1
        inter = geoms[i].intersection(geoms[j]).area
        if inter > tolerance_sqm:
            raise AssertionError(f"parcels {i} and {j} overlap by {inter:.2f} m²")
    return checked


# ---------------------------------------------------------------------------
# Zones, land use, story parcels, survey numbers
# ---------------------------------------------------------------------------
def make_zones(aoi: Polygon, roads: Sequence[Road], model: SizeModel) -> list[dict[str, Any]]:
    """Six master-plan zones that partition the AOI (priority order resolves overlaps)."""
    minx, miny, maxx, maxy = aoi.bounds
    W, H = maxx - minx, maxy - miny
    town, hamlet = model.town, model.hamlet
    bazaar = [r.geom_utm for r in roads if r.name and "Bazaar" in r.name] or [r.geom_utm for r in roads][:1]
    arterials = [r.geom_utm for r in roads if r.road_class in {"state", "district"}]
    c1 = unary_union(bazaar).buffer(28).intersection(town.buffer(model.r_ring))
    if model.junction is not None and arterials:
        c1 = c1.union(unary_union(arterials).buffer(50).intersection(model.junction.buffer(model.r_junction)))
    shapes = {
        "PUB": Point(minx + 0.70 * model.r_ring, miny + 0.65 * model.r_ring).buffer(85),
        "IND": box(minx + 0.80 * W, miny + 0.28 * H, minx + 0.97 * W, miny + 0.47 * H),
        "C1": c1,
        "R1": town.buffer(model.r_core),
        "R2": unary_union([town.buffer(model.r_ring), hamlet.buffer(model.r_hamlet)]),
        "AG": aoi,
    }
    zones: list[dict[str, Any]] = []
    taken: BaseGeometry = Polygon()
    for code in ("PUB", "IND", "C1", "R1", "R2", "AG"):
        g = make_valid(shapes[code].intersection(aoi).difference(taken))
        polys = [p for p in explode_polygons(g) if p.area > 500]
        if not polys:
            continue
        geom = MultiPolygon(polys)
        taken = unary_union([taken, geom])
        zones.append({"zone_code": code, "name": ZONE_NAMES[code], "permissible_uses": ZONE_USES[code],
                      "geom_utm": geom, "geom": to_wgs(geom)})
    return zones


def assign_zones_and_land_use(parcels: Sequence[Parcel], zones: Sequence[dict[str, Any]], rng: random.Random) -> None:
    zone_geoms = [z["geom_utm"] for z in zones]
    tree = STRtree(zone_geoms)
    mix = {
        "R1": [("residential", 0.90), ("commercial", 0.07), ("vacant", 0.03)],
        "R2": [("residential", 0.90), ("vacant", 0.06), ("agricultural", 0.04)],
        "C1": [("commercial", 0.90), ("residential", 0.10)],
        "AG": [("agricultural", 0.94), ("residential", 0.02), ("vacant", 0.04)],
        "IND": [("industrial", 0.90), ("vacant", 0.10)],
        "PUB": [("public", 0.90), ("residential", 0.10)],
    }
    for p in parcels:
        c = p.centroid_utm
        hits = tree.query(c, predicate="within")
        p.zone_code = zones[int(hits[0])]["zone_code"] if len(hits) else "AG"
        r, acc = rng.random(), 0.0
        for use, prob in mix[p.zone_code]:
            acc += prob
            if r <= acc:
                p.land_use = use
                break


def pick_story_parcels(parcels: list[Parcel], model: SizeModel, rng: random.Random,
                       story_spec: dict[str, tuple[str, str, int, int]]) -> dict[str, Parcel]:
    """Choose the region's story parcels near the AOI centre.

    The AP spec ("123/4" + "124" present) keeps the original adjacent agri/residential
    pair logic byte-for-byte so the historical ULPINs are preserved; other regions use
    the generic picker below.
    """
    centre = model.centre
    geoms = [p.geom_utm for p in parcels]
    tree = STRtree(geoms)
    near = sorted((i for i in tree.query(centre.buffer(450)) if geoms[i].intersects(centre.buffer(450))),
                  key=lambda i: geoms[i].distance(centre))

    chosen: dict[str, Parcel] = {}
    used: set[int] = set()

    if "123/4" in story_spec and "124" in story_spec:
        best: tuple[float, int, int] | None = None
        for i in near:
            if parcels[i].size_class == "semi" or not (2000 <= geoms[i].area <= 20000):
                continue
            if parcels[i].size_class != "agri":
                continue
            for j in tree.query(geoms[i], predicate="intersects"):
                j = int(j)
                if j == i or parcels[j].size_class != "semi" or not (300 <= geoms[j].area <= 1200):
                    continue
                shared = geoms[i].exterior.intersection(geoms[j].buffer(0.05)).length
                if shared < 8:
                    continue
                score = geoms[i].distance(centre) + geoms[j].distance(centre)
                if best is None or score < best[0]:
                    best = (score, i, j)
        if best is None:
            raise RuntimeError("could not find an adjacent agricultural/residential pair near the AOI centre")
        _, i_agri, j_res = best
        chosen = {"124": parcels[i_agri], "123/4": parcels[j_res]}
        used = {i_agri, j_res}

    remaining = [(survey, "agri" if spec[1] == "agricultural" else "semi")
                 for survey, spec in story_spec.items() if survey not in chosen]
    candidates = [i for i in near if i not in used]
    for survey, want in remaining:
        pool = [i for i in candidates if i not in used and parcels[i].size_class == want
                and (geoms[i].area >= 2000 if want == "agri" else geoms[i].area <= 1200)]
        if not pool:
            pool = [i for i in candidates if i not in used]
        idx = pool[min(len(pool) - 1, rng.randrange(min(len(pool), 12)))]
        used.add(idx)
        chosen[survey] = parcels[idx]

    for survey, parcel in chosen.items():
        key, land_use, _, _ = story_spec[survey]
        parcel.story, parcel.story_survey, parcel.land_use = key, survey, land_use
        if land_use == "residential" and parcel.zone_code == "AG":
            parcel.zone_code = "R2"
        if land_use == "agricultural":
            parcel.zone_code = "AG"
    return chosen


def _sub_labels(n: int, rng: random.Random, allow_letters: bool) -> list[str]:
    if n == 1:
        return [""]
    if allow_letters and n >= 3 and rng.random() < 0.3:
        k = rng.randrange(1, n - 1)
        labels = [f"/{i}" for i in range(1, n)]
        labels[k:k + 1] = [f"/{k + 1}A", f"/{k + 1}B"]
        return labels
    return [f"/{i}" for i in range(1, n + 1)]


def assign_survey_numbers(parcels: list[Parcel], story: dict[str, Parcel], rng: random.Random,
                          story_spec: dict[str, tuple[str, str, int, int]]) -> None:
    """Indian-style survey numbers: base number per holding, '/n' and '/nA' subdivisions."""
    by_block: dict[int, list[Parcel]] = defaultdict(list)
    for p in parcels:
        by_block[p.block_id].append(p)

    def sort_key(p: Parcel) -> tuple[float, float]:
        c = p.centroid_utm
        return (-(c.y // 30), c.x)

    # Blocks ordered north→south in 250 m bands, west→east inside a band.
    block_order = sorted(by_block, key=lambda b: (-(unary_union([p.geom_utm for p in by_block[b]]).centroid.y // 250),
                                                  unary_union([p.geom_utm for p in by_block[b]]).centroid.x))
    grouped: set[int] = set()
    groups: list[tuple[list[Parcel], str | None]] = []   # (members, story survey_no or None)

    # Story groups first: story parcel + nearest siblings in its block
    for survey, sp in story.items():
        _, _, size, _ = story_spec[survey]
        sibs = [q for q in by_block[sp.block_id] if q is not sp and q.story is None and id(q) not in grouped]
        sibs.sort(key=lambda q: q.geom_utm.distance(sp.geom_utm))
        members = [sp] + sibs[: size - 1]
        for m in members:
            grouped.add(id(m))
        groups.append((members, survey))

    ordered_groups: list[tuple[list[Parcel], str | None]] = []
    for b in block_order:
        members_left = [p for p in sorted(by_block[b], key=sort_key) if id(p) not in grouped]
        story_here = [g for g in groups if g[1] is not None and g[0][0].block_id == b]
        ordered_groups += story_here
        i = 0
        while i < len(members_left):
            r = rng.random()
            n = 1 if r < 0.35 else rng.randint(2, 3) if r < 0.70 else rng.randint(4, 6)
            chunk = members_left[i:i + n]
            ordered_groups.append((chunk, None))
            i += n

    # Base numbers: sequential in traversal order, anchored so the lowest story base lands
    # on its survey number (AP: 123/4's group is 123 — identical to the original behaviour).
    story_bases = sorted(int(s.split("/")[0]) for s in story_spec)
    anchor_base = story_bases[0]
    anchor_survey = next(s for s in story_spec if int(s.split("/")[0]) == anchor_base)
    anchor_idx = next(i for i, g in enumerate(ordered_groups) if g[1] == anchor_survey)
    non_story_before = sum(1 for g in ordered_groups[:anchor_idx] if g[1] is None)
    number = max(1, anchor_base - non_story_before)
    reserved = set(story_bases)
    for members, story_survey in ordered_groups:
        if story_survey is not None:
            base = int(story_survey.split("/")[0])
            _, _, size, idx = story_spec[story_survey]
            labels = _sub_labels(len(members), rng, allow_letters=False)
            # put the story parcel at the required subdivision index
            members = list(members)
            sp = members.pop(0)
            members.insert(min(idx, len(members)), sp)
        else:
            while number in reserved:
                number += 1
            base = number
            number += 1
            labels = _sub_labels(len(members), rng, allow_letters=True)
        for p, lab in zip(members, labels):
            p.survey_no = f"{base}{lab}"
            p.sub_division = lab[1:] or None
    for survey, sp in story.items():
        assert sp.survey_no == survey, f"story parcel {survey} got {sp.survey_no}"


def assign_ulpins(parcels: Sequence[Parcel]) -> None:
    seen: set[str] = set()
    for p in parcels:
        p.ulpin = ulpin_style(p.geom)
        if p.ulpin in seen:
            raise AssertionError(f"ULPIN collision {p.ulpin}")
        seen.add(p.ulpin)


def thin_parcels(parcels: list[Parcel], target: int, rng: random.Random) -> list[Parcel]:
    """Reduce a dense cadastre to ~``target`` parcels by keeping whole blocks.

    Runs AFTER survey numbers and ULPINs are assigned, so surviving parcels keep their
    historical ids (deep links stay valid) and the map reads as staged digitisation:
    fully-digitised blocks with visible gaps between them, rather than a wall-to-wall grid.
    Story blocks are always kept.
    """
    by_block: dict[int, list[Parcel]] = defaultdict(list)
    for p in parcels:
        by_block[p.block_id].append(p)
    story_blocks = {p.block_id for p in parcels if p.story is not None}
    keep = set(story_blocks)
    count = sum(len(by_block[b]) for b in keep)
    others = sorted(b for b in by_block if b not in keep)
    rng.shuffle(others)
    for b in others:
        if count >= target:
            break
        keep.add(b)
        count += len(by_block[b])
    return [p for p in parcels if p.block_id in keep]


# ---------------------------------------------------------------------------
# Reference GIS layers
# ---------------------------------------------------------------------------
def make_reference_layers(frame: Frame, rng: random.Random) -> None:
    aoi = frame.aoi_utm
    minx, miny, maxx, maxy = aoi.bounds
    W, H = maxx - minx, maxy - miny
    ns = next(r.geom_utm for r in frame.roads if r.road_class == "state")

    flood = box(minx - 10, maxy - 230, maxx + 10, maxy + 10).intersection(aoi)
    heritage = Point(minx + 190, miny + 260).buffer(150).intersection(aoi)
    eco = Point(minx + 0.72 * W, miny + 0.78 * H).buffer(170).union(
        Point(minx + 0.66 * W, miny + 0.70 * H).buffer(110)).intersection(aoi)
    flood_name, heritage_name, eco_name = frame.region.restriction_names
    frame.restriction_zones = [
        {"kind": "flood", "name": flood_name, "geom_utm": flood},
        {"kind": "heritage", "name": heritage_name, "geom_utm": heritage},
        {"kind": "eco_sensitive", "name": eco_name, "geom_utm": eco},
    ]
    for z in frame.restriction_zones:
        z["geom"] = to_wgs(as_multipolygon(z["geom_utm"]))

    ring_road = _wavy_line((minx + 0.60 * W, miny - 40), (maxx + 40, miny + 0.55 * H), 60, rng).intersection(aoi)
    metro = ns.buffer(22, cap_style="flat").intersection(aoi)
    (road_name, _), (metro_name, _) = frame.region.project_names
    frame.projects = [
        {"name": road_name, "kind": "road", "status": "proposed", "geom": to_wgs(ring_road)},
        {"name": metro_name, "kind": "metro", "status": "proposed", "geom": to_wgs(as_multipolygon(metro))},
    ]

    frame.water_lines = []
    supply_roads = [r for r in frame.roads if r.road_class in {"state", "district", "village"}]
    supply_roads.sort(key=lambda r: r.geom_utm.length, reverse=True)
    for i, r in enumerate(supply_roads[:5]):
        off = r.geom_utm.offset_curve(r.width_m / 2 + 1.0)
        for part in explode_lines(off):
            frame.water_lines.append({"name": f"Supply main {i + 1} ({r.name})", "kind": "supply_main", "geom": to_wgs(part)})


# ---------------------------------------------------------------------------
# Department records
# ---------------------------------------------------------------------------
TELUGU_MALE = ["Venkateswarlu", "Srinivasa Rao", "Nageswara Rao", "Koteswara Rao", "Subba Rao", "Ramesh Babu",
               "Suresh Kumar", "Prasad", "Satyanarayana", "Venkata Ramana", "Hanumantha Rao", "Naga Raju",
               "Siva Kumar", "Bhaskar", "Chandra Sekhar", "Rajendra Prasad", "Anjaneyulu", "Veeraiah", "Mallikarjuna",
               "Pardhasaradhi", "Gopala Krishna", "Ravindra", "Kondaiah", "Peda Babu", "Sambasiva Rao", "Yugandhar"]
TELUGU_FEMALE = ["Lakshmi", "Padmavathi", "Nagamani", "Saraswathi", "Venkata Lakshmi", "Sujatha", "Vijaya",
                 "Aruna Kumari", "Rama Devi", "Annapurna", "Bhavani", "Kamala", "Sarojini", "Swarna Latha",
                 "Nirmala", "Jyothi", "Ratnam", "Anasuya", "Kalyani", "Manjula"]
TELUGU_SURNAME = ["Kandula", "Yarlagadda", "Chalasani", "Gudivada", "Pamidi", "Kolla", "Vemuri", "Bandaru",
                  "Mekala", "Bollineni", "Tenali", "Gorantla", "Nallamothu", "Pothula", "Uppalapati", "Chebrolu",
                  "Kakumanu", "Alapati", "Mannava", "Dasari", "Ganta", "Ravuri", "Boppana", "Nandigam", "Paruchuri"]

TAMIL_MALE = ["Murugan", "Karthik", "Senthil", "Ramasamy", "Palaniappan", "Ganesan", "Subramani", "Velu",
              "Arumugam", "Kannan", "Shanmugam", "Duraisamy", "Manikandan", "Selvam", "Rajendran", "Chandran",
              "Ezhilarasan", "Thirumalai", "Saravanan", "Muthu", "Vetrivel", "Ilango", "Tamilselvan", "Bharathi"]
TAMIL_FEMALE = ["Meenakshi", "Kamala", "Vasanthi", "Selvi", "Thilagam", "Amudha", "Kalaiselvi", "Bhuvaneswari",
                "Dhanalakshmi", "Revathi", "Chitra", "Malliga", "Eswari", "Janaki", "Ponni", "Vennila", "Tamilarasi"]
TAMIL_SURNAME = ["Krishnan", "Subramanian", "Venkatesan", "Natarajan", "Raman", "Srinivasan", "Sundaram",
                 "Annamalai", "Palanisamy", "Chidambaram", "Kandasamy", "Perumal", "Govindarajan", "Sekar",
                 "Rathinam", "Muthusamy", "Ramalingam", "Elumalai", "Varadharajan", "Balakrishnan"]

TG_MALE = TELUGU_MALE + ["Rajanna", "Mallesham", "Komuraiah", "Sailu", "Yadagiri", "Narsimha"]
TG_FEMALE = TELUGU_FEMALE + ["Swaroopa", "Mounika", "Sridevi", "Padma"]
TG_SURNAME = ["Reddy", "Goud", "Chary", "Naik", "Gadwal", "Vanga", "Malla", "Kancharla", "Bandi",
              "Puligilla", "Rachakonda", "Vemula", "Gattu", "Devarakonda", "Mudiraj", "Kethavath",
              "Jadhav", "Pochampally", "Siddipet", "Bhongir"]


class Names:
    """Indian names: 70 % curated regional names, 30 % Faker en_IN, seeded for determinism."""

    def __init__(self, seed: int, male: list[str] | None = None, female: list[str] | None = None,
                 surname: list[str] | None = None) -> None:
        from faker import Faker

        Faker.seed(seed)
        self.f = Faker("en_IN")
        self.f.seed_instance(seed)
        self.male = male or TELUGU_MALE
        self.female = female or TELUGU_FEMALE
        self.surname = surname or TELUGU_SURNAME

    def person(self, rng: random.Random) -> tuple[str, str]:
        """Return ``(owner_name, father_name)`` (father shares the surname, as on pattadar passbooks)."""
        female = rng.random() < 0.35
        if rng.random() < 0.7:
            surname = rng.choice(self.surname)
            first = rng.choice(self.female if female else self.male)
            father = f"{rng.choice(self.male)} {surname}"
            return f"{first} {surname}", father
        first = self.f.first_name_female() if female else self.f.first_name_male()
        last = self.f.last_name()
        father = f"{self.f.first_name_male()} {last}"
        return f"{first} {last}", father


# ---------------------------------------------------------------------------
# The three demo regions (CONTRACTS §10). AP keeps the original constants and the
# legacy RNG stream (rng_key=None) so its historical ULPINs survive the multi-state
# refactor; TN and TG are light-localized: names, courts, projects, restriction
# zones and building names fit the state, everything else shares the AP model.
# ---------------------------------------------------------------------------
REGIONS: list[Region] = [
    Region(
        code="AP", state_name="Andhra Pradesh", district="Guntur", taluk="Mangalagiri",
        village="Mangalagiri (R)", aoi_name="Mangalagiri (R) — demo", sro_code="GNT-02",
        aoi_bbox=(80.545, 16.434, 80.567, 16.452), story=AP_STORY,
        male=TELUGU_MALE, female=TELUGU_FEMALE, surname=TELUGU_SURNAME,
        govt_owners=["Government of Andhra Pradesh", "Mangalagiri Municipality", "Gram Panchayat, Mangalagiri (R)"],
        courts=["Principal Junior Civil Judge, Mangalagiri", "Senior Civil Judge, Guntur",
                "District Court, Guntur", "Revenue Divisional Officer, Guntur"],
        assess_prefix="MGL", permit_conditions="Setbacks as per APBR 2017; rainwater harvesting mandatory.",
        restriction_names=("Krishna floodplain (indicative)", "Temple precinct heritage buffer (indicative)",
                           "Kondaveeti vagu wetland patch (indicative)"),
        project_names=(("Outer Ring Road link (proposed)", "road"),
                       ("Amaravati–Vijayawada metro corridor (indicative)", "metro")),
        building_names=("Sri Lakshmi Complex", "Padmavathi Towers", "Sai Residency", "Gokul Apartments"),
        target_parcels=150, khata_base=0, deed_base=4000, permit_base=5600, case_base=10,
        building_base=0, rng_key=None,
    ),
    Region(
        code="TN", state_name="Tamil Nadu", district="Kancheepuram", taluk="Sriperumbudur",
        village="Sriperumbudur (R)", aoi_name="Sriperumbudur (R) — demo", sro_code="KPM-04",
        aoi_bbox=(79.940, 12.945, 79.962, 12.963), story=TN_STORY,
        male=TAMIL_MALE, female=TAMIL_FEMALE, surname=TAMIL_SURNAME,
        govt_owners=["Government of Tamil Nadu", "Sriperumbudur Town Panchayat", "Gram Panchayat, Sriperumbudur (R)"],
        courts=["District Munsif Court, Sriperumbudur", "Sub Court, Kancheepuram",
                "Principal District Court, Chengalpattu"],
        assess_prefix="SPR", permit_conditions="Setbacks as per TNCDBR 2019; rainwater harvesting mandatory.",
        restriction_names=("Palar river floodplain (indicative)", "Temple tank heritage buffer (indicative)",
                           "Kolavai lake wetland patch (indicative)"),
        project_names=(("Chennai–Bengaluru Expressway link (proposed)", "road"),
                       ("Chennai suburban rail extension (indicative)", "metro")),
        building_names=("Murugan Complex", "Kaveri Towers", "Annai Illam", "Bharathi Flats"),
        target_parcels=150, khata_base=2000, deed_base=14000, permit_base=6600, case_base=2010,
        building_base=100, rng_key="TN",
    ),
    Region(
        code="TG", state_name="Telangana", district="Ranga Reddy", taluk="Shamshabad",
        village="Shamshabad (R)", aoi_name="Shamshabad (R) — demo", sro_code="RR-07",
        aoi_bbox=(78.388, 17.240, 78.410, 17.258), story=TG_STORY,
        male=TG_MALE, female=TG_FEMALE, surname=TG_SURNAME,
        govt_owners=["Government of Telangana", "Shamshabad Municipality", "Gram Panchayat, Shamshabad (R)"],
        courts=["Junior Civil Judge, Rajendranagar", "Senior Civil Judge, Ranga Reddy",
                "City Civil Court, Hyderabad"],
        assess_prefix="SHB", permit_conditions="Setbacks as per TS Building Rules 2012; rainwater harvesting mandatory.",
        restriction_names=("Musi river floodplain (indicative)", "Qutb Shahi heritage buffer (indicative)",
                           "Himayat Sagar catchment patch (indicative)"),
        project_names=(("Regional Ring Road link (proposed)", "road"),
                       ("Hyderabad Airport Metro corridor (indicative)", "metro")),
        building_names=("Charminar Trade Centre", "Golconda Heights", "Nizam Residency", "Deccan Enclave"),
        target_parcels=150, khata_base=4000, deed_base=24000, permit_base=7600, case_base=4010,
        building_base=200, rng_key="TG",
    ),
]


def _drift(name: str, rng: random.Random) -> str:
    """Spelling drift as seen between departments: initials, transliteration, spacing."""
    opts = [
        lambda n: n + " " + rng.choice("BKMNPRSV"),
        lambda n: n.replace("Kumar", "Kumaar").replace("Lakshmi", "Laxmi").replace("Venkata", "Venkat"),
        lambda n: rng.choice("BKMNPRSV") + ". " + n,
        lambda n: n.split(" ")[0] + " " + n.split(" ")[-1][:1] + ".",
    ]
    out = rng.choice(opts)(name)
    return out if out != name else name + " " + rng.choice("BKMNPRSV")


def _fy(d: date) -> str:
    y = d.year if d.month >= 4 else d.year - 1
    return f"{y}-{str(y + 1)[2:]}"


def make_department_records(frame: Frame, rng: random.Random, names: Names) -> None:
    """RoR, deeds, encumbrances, permissions, tax, valuation, disputes, utilities, users."""
    story_by_key = {p.story: p for p in frame.parcels if p.story}
    region = frame.region
    road_geoms = [r.geom_utm for r in frame.roads]
    road_tree = STRtree(road_geoms)
    khata_seq = region.khata_base
    deed_seq = region.deed_base
    permit_seq = region.permit_base
    case_seq = region.case_base
    assess_seq = 0

    for p in frame.parcels:
        khata_seq += 1
        # ---- ownership -------------------------------------------------
        govt = p.land_use == "public" or (p.story is None and rng.random() < 0.03)
        if govt:
            owner, father, otype = rng.choice(region.govt_owners), None, "govt"
            classification = "govt_poramboke"
        else:
            owner, father = names.person(rng)
            otype = "joint" if rng.random() < 0.15 / 0.95 else "patta"
            if p.land_use == "agricultural":
                classification = "wet" if rng.random() < 0.3 else "dry"
            else:
                classification = "gramakantam" if p.zone_code in {"R1", "C1"} else "dry"
        if p.story == "clean_residential":
            owner, father, otype = "Ravi Kumar", "Venkateswarlu", "patta"
        elif p.story == "pending_mutation":
            owner, father, otype = "Venkata Rao Kandula", "Subba Rao", "patta"
        khata = f"K-{khata_seq:04d}"
        if p.story == "clean_residential":
            khata = "K-0421"
        elif khata == "K-0421":
            khata = "K-9421"

        area = p.area_sqm
        anomaly = None
        if p.story is None and not govt and rng.random() < 0.06:
            anomaly = "owner_drift" if rng.random() < 0.5 else "extent_mismatch"
        if p.story == "tax_arrears_area_mismatch":
            anomaly = "extent_mismatch_story"

        frame.ror.append({
            "khata_no": khata, "ulpin": p.ulpin, "survey_no": p.survey_no, "owner_name": owner,
            "father_name": father, "ownership_type": otype, "extent_sqm": area,
            "classification": classification, "mutation_history": [],
            "updated_at": NOW - timedelta(days=rng.randint(30, 900)),
        })

        # ---- valuation & tax --------------------------------------------
        gv = GUIDELINE_VALUE[p.zone_code]
        frame.valuation.append({"ulpin": p.ulpin, "guideline_value_per_sqm": gv, "effective_from": date(2024, 4, 1)})
        if not govt:
            assess_seq += 1
            demand = round(gv * area * TAX_RATE[p.land_use] / 10) * 10
            arrears_flag = p.story == "tax_arrears_area_mismatch" or (p.story is None and rng.random() < 0.07)
            if p.story in {"clean_residential"}:
                arrears_flag = False
            if arrears_flag:
                years_due = 3 if p.story else rng.randint(1, 3)
                paid_till = _fy(TODAY - timedelta(days=365 * years_due))
                arrears = round(demand * years_due * 1.12)
                last_paid = TODAY - timedelta(days=365 * years_due + rng.randint(0, 120))
            else:
                paid_till, arrears = "2026-27", 0
                last_paid = date(2026, rng.randint(4, 8), rng.randint(1, 28))
            frame.property_tax.append({
                "assessment_no": f"{region.assess_prefix}-{assess_seq:06d}", "ulpin": p.ulpin, "annual_demand": demand,
                "paid_till": paid_till, "arrears": arrears, "last_paid_on": last_paid,
            })

        # ---- registration -------------------------------------------------
        registered = not govt and (p.story is not None or rng.random() < 0.85)
        if registered:
            n_deeds = rng.choice([2, 3]) if rng.random() < 0.20 else 1
            if p.story == "pending_mutation":
                n_deeds = 2
            chain = [names.person(rng)[0] for _ in range(n_deeds)] + [owner]
            start = date(rng.randint(2004, 2016), rng.randint(1, 12), rng.randint(1, 28))
            for k in range(n_deeds):
                deed_seq += 1
                reg_on = start + timedelta(days=rng.randint(700, 2200) * k + rng.randint(0, 300))
                reg_on = min(reg_on, date(2026, 6, 30))
                claimant = chain[k + 1]
                extent = area
                if k == n_deeds - 1:
                    if anomaly == "owner_drift":
                        claimant = _drift(owner, rng)
                    elif anomaly == "extent_mismatch":
                        extent = round(area * (1 + rng.choice([-1, 1]) * rng.uniform(0.05, 0.10)), 2)
                    elif anomaly == "extent_mismatch_story":
                        extent = round(area * 1.08, 2)
                    if p.story == "pending_mutation":
                        claimant, reg_on = "Lakshmi Devi", date(2026, 8, 20)
                        chain[k] = owner
                deed_type = rng.choices(["sale", "gift", "partition", "settlement"], [0.8, 0.08, 0.08, 0.04])[0]
                consideration = round(gv * extent * rng.uniform(0.9, 1.4) * (0.6 if reg_on.year < 2015 else 1.0), -3)
                frame.deeds.append({
                    "doc_no": f"{deed_seq}/{reg_on.year}", "ulpin": p.ulpin, "deed_type": deed_type,
                    "executant": chain[k], "claimant": claimant, "consideration": consideration if deed_type == "sale" else None,
                    "extent_sqm": extent, "registered_on": reg_on, "sro_code": region.sro_code,
                })
            if p.story == "mortgaged" or (p.story is None and rng.random() < 0.08):
                from_date = date(rng.randint(2019, 2025), rng.randint(1, 12), rng.randint(1, 28))
                frame.encumbrances.append({
                    "ulpin": p.ulpin, "kind": "mortgage", "holder": rng.choice(BANKS),
                    "amount": round(gv * area * rng.uniform(0.4, 0.7), -4), "from_date": from_date,
                    "to_date": from_date + timedelta(days=365 * rng.randint(5, 20)), "active": True,
                })

        # ---- planning permissions -----------------------------------------
        if p.land_use in {"residential", "commercial"} and p.story != "clean_residential" and rng.random() < 0.35:
            permit_seq += 1
            status = rng.choices(["approved", "pending", "rejected"], [0.7, 0.2, 0.1])[0]
            applied = date(rng.randint(2015, 2026), rng.randint(1, 12), rng.randint(1, 28))
            applied = min(applied, date(2026, 8, 1))
            floors = rng.choices([1, 2, 3, 4], [0.3, 0.45, 0.2, 0.05])[0]
            frame.permissions.append({
                "permit_no": f"BP-{permit_seq:04d}", "ulpin": p.ulpin, "status": status, "floors": floors,
                "built_up_sqm": round(area * rng.uniform(0.45, 0.7) * floors, 1), "applied_on": applied,
                "approved_on": applied + timedelta(days=rng.randint(20, 90)) if status == "approved" else None,
                "conditions": region.permit_conditions if status == "approved" else None,
                "application_id": None,
            })

        # ---- legal ---------------------------------------------------------
        if p.story == "disputed" or (p.story is None and rng.random() < 0.04):
            case_seq += rng.randint(1, 9)
            filed = date(rng.randint(2021, 2025), rng.randint(1, 12), rng.randint(1, 28))
            status = "pending" if p.story else rng.choices(["pending", "stayed", "disposed"], [0.7, 0.15, 0.15])[0]
            frame.disputes.append({
                "case_no": f"OS {case_seq}/{filed.year}", "ulpin": p.ulpin, "court": rng.choice(region.courts),
                "nature": "title" if p.story else rng.choice(["title", "partition", "boundary", "injunction"]),
                "filed_on": filed, "status": status,
                "next_hearing": TODAY + timedelta(days=rng.randint(7, 90)) if status != "disposed" else None,
            })

        # ---- utilities -----------------------------------------------------
        nearest = int(road_tree.nearest(p.geom_utm))
        road = frame.roads[nearest]
        access = max(0.0, round(p.geom_utm.distance(road.geom_utm) - road.width_m / 2, 1))
        pw = {"R1": 0.9, "R2": 0.65, "C1": 0.9, "AG": 0.15, "IND": 0.6, "PUB": 0.85}[p.zone_code]
        if access > 60:
            pw *= 0.5
        water = rng.random() < pw
        electricity = rng.random() < min(0.98, pw + 0.3)
        sewer = rng.random() < {"R1": 0.6, "C1": 0.7, "R2": 0.15, "AG": 0.02, "IND": 0.4, "PUB": 0.5}[p.zone_code]
        if p.story == "clean_residential":
            water, electricity = True, True
        frame.connections.append({
            "ulpin": p.ulpin, "water": water, "electricity": electricity, "sewer": sewer,
            "road_access_m": access, "nearest_road_class": road.road_class,
        })

    # Demo users are global (one set across all regions); attach them to the AP frame only
    # so the merged DB write inserts each uid exactly once.
    if region.code == "AP":
        frame.users = [
            {"uid": uid, "email": email, "name": name, "role": role, "department": dept}
            for uid, email, name, role, dept in DEMO_USERS
        ]
    del story_by_key


# ---------------------------------------------------------------------------
# Buildings & units (3D readiness)
# ---------------------------------------------------------------------------
def make_buildings(frame: Frame, rng: random.Random, names: Names) -> None:
    ror_owner = {r["ulpin"]: r["owner_name"] for r in frame.ror}
    region = frame.region
    c1, c2, r1, r2 = region.building_names
    picks: list[tuple[Parcel, int, int, str]] = []  # parcel, floors, units per floor, name
    clean = frame.story.get("123/4")
    if clean is not None:
        picks.append((clean, 2, 1, "Ravi Kumar residence"))
    commercial = [p for p in frame.parcels if p.land_use == "commercial" and p.story is None and 150 <= p.area_sqm <= 600]
    residential = [p for p in frame.parcels if p.land_use == "residential" and p.story is None
                   and p.zone_code == "R1" and 200 <= p.area_sqm <= 450]
    rng.shuffle(commercial)
    rng.shuffle(residential)
    for p, (floors, upf, nm) in zip(commercial[:2], [(4, 3, c1), (5, 4, c2)]):
        picks.append((p, floors, upf, nm))
    for p, (floors, upf, nm) in zip(residential[:2], [(3, 2, r1), (3, 2, r2)]):
        picks.append((p, floors, upf, nm))

    for bid, (p, floors, upf, name) in enumerate(picks, start=region.building_base + 1):
        fp = p.geom_utm.buffer(-2.5, join_style="mitre")
        if fp.is_empty or fp.area < 40:
            fp = affinity.scale(p.geom_utm, 0.6, 0.6)
        fp = max(explode_polygons(fp), key=lambda g: g.area)
        frame.buildings.append({
            "id": bid, "ulpin": p.ulpin, "footprint": to_wgs(as_multipolygon(fp)), "floors": floors,
            "height_m": round(floors * FLOOR_HEIGHT_M, 2), "name": name,
        })
        for floor in range(1, floors + 1):
            for unit_idx, ug in enumerate(split_into(fp, upf, rng), start=1):
                owner = ror_owner[p.ulpin] if p is clean else names.person(rng)[0]
                frame.units.append({
                    "building_id": bid, "ulpin": p.ulpin, "ulpin_3d": ulpin_3d(p.ulpin, floor, unit_idx),
                    "floor": floor, "unit_no": f"{floor}{unit_idx:02d}", "geom": to_wgs(ug),
                    "base_m": round((floor - 1) * FLOOR_HEIGHT_M, 2), "height_m": round(floor * FLOOR_HEIGHT_M, 2),
                    "owner_name": owner,
                })


# ---------------------------------------------------------------------------
# Sentinel-2 change table
# ---------------------------------------------------------------------------
def make_s2_change(frame: Frame, rng: random.Random) -> None:
    def baseline(land_use: str) -> tuple[float, float]:
        if land_use == "agricultural":
            return rng.uniform(0.50, 0.70), rng.uniform(-0.25, -0.10)
        if land_use == "vacant":
            return rng.uniform(0.25, 0.40), rng.uniform(-0.05, 0.05)
        return rng.uniform(0.10, 0.25), rng.uniform(0.05, 0.20)

    agri = [p for p in frame.parcels if p.land_use == "agricultural" and p.story is None]
    rng.shuffle(agri)
    n_change = max(1, round(0.02 * len(frame.parcels)))
    changed = {p.ulpin: rng.choice(["vegetation_to_builtup", "vegetation_to_builtup", "vegetation_loss", "new_construction"])
               for p in agri[:n_change]}

    for p in frame.parcels:
        ndvi_a, ndbi_a = baseline(p.land_use)
        if p.story == "change_alert":
            ndvi_a, ndbi_a, d_ndvi, d_ndbi = 0.58, -0.12, -0.31, 0.18
        elif p.ulpin in changed:
            kind = changed[p.ulpin]
            if kind == "vegetation_to_builtup":
                d_ndvi, d_ndbi = -rng.uniform(0.25, 0.40), rng.uniform(0.12, 0.25)
            elif kind == "vegetation_loss":
                d_ndvi, d_ndbi = -rng.uniform(0.22, 0.35), rng.uniform(-0.05, 0.08)
            else:
                d_ndvi, d_ndbi = rng.uniform(-0.08, 0.0), rng.uniform(0.16, 0.28)
        else:
            d_ndvi, d_ndbi = rng.gauss(0, 0.035), rng.gauss(0, 0.03)
        label, conf = classify(d_ndvi, d_ndbi)
        if p.story == "change_alert":
            assert label == "vegetation_to_builtup"
            conf = 0.91
        frame.s2_change.append({
            "ulpin": p.ulpin, "date_a": S2_DATE_A, "date_b": S2_DATE_B,
            "ndvi_a": round(ndvi_a, 4), "ndvi_b": round(ndvi_a + d_ndvi, 4),
            "ndbi_a": round(ndbi_a, 4), "ndbi_b": round(ndbi_a + d_ndbi, 4),
            "d_ndvi": round(d_ndvi, 4), "d_ndbi": round(d_ndbi, 4), "label": label, "confidence": conf,
        })


# ---------------------------------------------------------------------------
# Mutable demo state: alerts, applications, audit log, mutations
# ---------------------------------------------------------------------------
def make_mutable(frame: Frame, rng: random.Random) -> None:
    """Alerts, applications, audit rows and mutation history. Safe to regenerate (demo reset)."""
    frame.alerts, frame.applications, frame.audit_log, frame.mutations = [], [], [], []
    ror = {r["ulpin"]: r for r in frame.ror}
    latest_deed: dict[str, dict[str, Any]] = {}
    for d in sorted(frame.deeds, key=lambda d: d["registered_on"]):
        latest_deed[d["ulpin"]] = d

    # Change alerts from the satellite table
    for s in frame.s2_change:
        if s["label"] == "no_significant_change":
            continue
        frame.alerts.append({
            "ulpin": s["ulpin"], "kind": "change_detected", "severity": "high",
            "title": "Possible unrecorded land-use change",
            "detail": {"label": s["label"], "confidence": s["confidence"], "d_ndvi": s["d_ndvi"], "d_ndbi": s["d_ndbi"],
                       "date_a": s["date_a"].isoformat(), "date_b": s["date_b"].isoformat(), "method": "index_difference"},
            "status": "open", "created_at": NOW - timedelta(days=rng.randint(2, 40)),
        })

    # Everything below is the scripted AP demo state (queue, applications, audit trail).
    # TN/TG keep only the generic satellite alerts above plus whatever their story key
    # produced in the department tables (e.g. the TN dispute).
    if frame.region.code != "AP":
        return

    # Inconsistency alert for 127/1
    p127 = frame.story["127/1"]
    d127 = latest_deed[p127.ulpin]
    frame.alerts.append({
        "ulpin": p127.ulpin, "kind": "inconsistency", "severity": "medium",
        "title": "Extent mismatch between RoR and registered deed",
        "detail": {"field": "extent_sqm", "revenue": float(ror[p127.ulpin]["extent_sqm"]),
                   "registration": float(d127["extent_sqm"]), "doc_no": d127["doc_no"],
                   "difference_pct": round((float(d127["extent_sqm"]) / float(ror[p127.ulpin]["extent_sqm"]) - 1) * 100, 1)},
        "status": "open", "created_at": NOW - timedelta(days=12),
    })

    # Applications
    app_seq = 0

    def app(ulpin: str, typ: str, uid: str | None, name: str, status: str, dept: str | None,
            payload: dict[str, Any], created_days_ago: int) -> dict[str, Any]:
        nonlocal app_seq
        app_seq += 1
        created = NOW - timedelta(days=created_days_ago, hours=rng.randint(0, 9))
        row = {"id": f"APP-2026-{app_seq:06d}", "ulpin": ulpin, "type": typ, "applicant_uid": uid,
               "applicant_name": name, "status": status, "payload": payload, "assigned_department": dept,
               "created_at": created, "updated_at": created}
        frame.applications.append(row)
        frame.audit_log.append({"ts": created, "actor_uid": uid, "actor_name": name, "actor_role": "citizen" if uid != "dev-admin" else "admin",
                                "action": "application.created", "entity_type": "application", "entity_id": row["id"],
                                "ulpin": ulpin, "before": None, "after": {"type": typ, "status": "submitted" if typ != "field_review" else "open"},
                                "source": "seed"})
        return row

    def advance(row: dict[str, Any], statuses: Sequence[str], officer: tuple[str, str, str]) -> None:
        uid, name, dept = officer
        prev = row["status"]
        for i, st in enumerate(statuses):
            ts = row["created_at"] + timedelta(days=i + 1)
            frame.audit_log.append({"ts": ts, "actor_uid": uid, "actor_name": name, "actor_role": "officer",
                                    "action": "application.transition", "entity_type": "application", "entity_id": row["id"],
                                    "ulpin": row["ulpin"], "before": {"status": prev}, "after": {"status": st}, "source": "seed"})
            prev = st
            row["status"], row["updated_at"] = st, ts

    p128 = frame.story["128"]
    d128 = latest_deed[p128.ulpin]
    app(p128.ulpin, "mutation", "dev-lakshmi-devi", "Lakshmi Devi", "submitted", "revenue",
        {"system_initiated": False, "reason": "sale", "to_owner": "Lakshmi Devi", "from_owner": ror[p128.ulpin]["owner_name"],
         "doc_no": d128["doc_no"], "registered_on": d128["registered_on"].isoformat()}, 6)

    pool = [p for p in frame.parcels if p.story is None and p.land_use in {"residential", "agricultural"}
            and p.ulpin in latest_deed and ror[p.ulpin]["ownership_type"] != "govt"]
    rng.shuffle(pool)
    anitha, farida = ("dev-anitha", "Anitha", "revenue"), ("dev-farida", "Farida", "planning")

    r1 = app(pool[0].ulpin, "mutation", None, latest_deed[pool[0].ulpin]["claimant"], "submitted", "revenue",
             {"system_initiated": False, "reason": "inheritance", "to_owner": latest_deed[pool[0].ulpin]["claimant"]}, 9)
    advance(r1, ["document_check"], anitha)
    r2 = app(pool[1].ulpin, "mutation", None, latest_deed[pool[1].ulpin]["claimant"], "submitted", "revenue",
             {"system_initiated": False, "reason": "sale", "to_owner": latest_deed[pool[1].ulpin]["claimant"]}, 14)
    advance(r2, ["document_check", "field_verification"], anitha)
    r3 = app(pool[2].ulpin, "mutation", None, latest_deed[pool[2].ulpin]["claimant"], "submitted", "revenue",
             {"system_initiated": True, "reason": "deed_event", "to_owner": latest_deed[pool[2].ulpin]["claimant"],
              "doc_no": latest_deed[pool[2].ulpin]["doc_no"]}, 3)
    del r3

    # A completed mutation (history for the timeline)
    done = pool[3]
    r4 = app(done.ulpin, "mutation", None, latest_deed[done.ulpin]["claimant"], "submitted", "revenue",
             {"system_initiated": False, "reason": "sale", "to_owner": latest_deed[done.ulpin]["claimant"]}, 40)
    advance(r4, ["document_check", "field_verification", "approved"], anitha)
    prev_owner = ror[done.ulpin]["owner_name"]
    ror[done.ulpin]["owner_name"] = latest_deed[done.ulpin]["claimant"]
    ror[done.ulpin]["mutation_history"] = [{"from": prev_owner, "to": ror[done.ulpin]["owner_name"],
                                            "application_id": r4["id"], "on": r4["updated_at"].date().isoformat()}]
    frame.mutations.append({"ulpin": done.ulpin, "from_owner": prev_owner, "to_owner": ror[done.ulpin]["owner_name"],
                            "reason": "sale", "application_id": r4["id"], "created_at": r4["updated_at"]})

    res = [p for p in pool[4:] if p.land_use == "residential"]
    b1 = app(res[0].ulpin, "building_permission", None, ror[res[0].ulpin]["owner_name"], "submitted", "planning",
             {"floors": 2, "built_up_sqm": round(res[0].area_sqm * 0.6 * 2, 1), "use": "residential"}, 5)
    del b1
    b2 = app(res[1].ulpin, "building_permission", None, ror[res[1].ulpin]["owner_name"], "submitted", "planning",
             {"floors": 3, "built_up_sqm": round(res[1].area_sqm * 0.65 * 3, 1), "use": "residential",
              "planning_check": {"permissible": True, "reasons": []}}, 11)
    advance(b2, ["planning_check"], farida)

    p124 = frame.story["124"]
    app(p124.ulpin, "field_review", "dev-admin", "Admin", "open", None,
        {"trigger": "change_detected", "label": "vegetation_to_builtup", "note": "Verify built-up structure on agricultural land"}, 2)

    # Pending-mutation alert for 128 (kind exists in the contract; drives the officer queue badge)
    frame.alerts.append({
        "ulpin": p128.ulpin, "kind": "pending_mutation", "severity": "low",
        "title": "Mutation pending after registered sale",
        "detail": {"application_id": "APP-2026-000001", "claimant": "Lakshmi Devi", "doc_no": d128["doc_no"]},
        "status": "open", "created_at": NOW - timedelta(days=6),
    })


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------
def build_frame(region: Region, seed: int = DEFAULT_SEED, use_osm: bool = False, verbose: bool = True) -> Frame:
    """Generate one region's synthetic cadastre deterministically for ``seed``.

    The dense cadastre is generated exactly as before (so AP's ULPINs never change),
    then thinned to ~``region.target_parcels`` whole blocks — the map reads as staged
    digitisation across three states rather than one wall-to-wall square.
    """
    log = print if verbose else (lambda *a, **k: None)
    t0 = time.perf_counter()
    # rng_key=None → the original single-region stream (AP byte-compatibility).
    rng = random.Random(seed) if region.rng_key is None else random.Random(f"{seed}:{region.rng_key}")
    names = Names(seed if region.rng_key is None else seed + len(region.rng_key),
                  region.male, region.female, region.surname)
    aoi = aoi_polygon_utm(region.aoi_bbox)
    frame = Frame(seed=seed, aoi_utm=aoi, region=region)

    roads = osm_roads(aoi, region.aoi_bbox) if use_osm else None
    frame.roads = roads or synthetic_roads(aoi, rng)
    log(f"[{region.code}] roads          : {len(frame.roads)} ({'osm' if roads else 'synthetic'})")

    model = SizeModel(aoi, frame.roads, rng)
    frame.blocks = make_blocks(aoi, frame.roads)
    log(f"[{region.code}] blocks         : {len(frame.blocks)}")
    frame.parcels = make_parcels(frame.blocks, model, rng)
    pairs = assert_no_overlaps(frame.parcels)
    log(f"[{region.code}] parcels        : {len(frame.parcels)} (no overlaps > 1 m² across {pairs} touching pairs)")
    if not (500 <= len(frame.parcels) <= 1200):
        raise AssertionError(f"[{region.code}] parcel count {len(frame.parcels)} outside 500–1200; adjust SizeModel")

    frame.zones = make_zones(aoi, frame.roads, model)
    assign_zones_and_land_use(frame.parcels, frame.zones, rng)
    frame.story = pick_story_parcels(frame.parcels, model, rng, region.story)
    assign_survey_numbers(frame.parcels, frame.story, rng, region.story)
    assign_ulpins(frame.parcels)

    frame.parcels = thin_parcels(frame.parcels, region.target_parcels, rng)
    if not (0.6 * region.target_parcels <= len(frame.parcels) <= 2.2 * region.target_parcels):
        raise AssertionError(f"[{region.code}] thinned count {len(frame.parcels)} far from target {region.target_parcels}")
    log(f"[{region.code}] thinned        : {len(frame.parcels)} parcels kept (target ~{region.target_parcels})")

    make_reference_layers(frame, rng)
    make_department_records(frame, rng, names)
    make_buildings(frame, rng, names)
    make_s2_change(frame, rng)
    make_mutable(frame, rng)
    log(f"[{region.code}] frame built in {time.perf_counter() - t0:.1f}s")
    return frame


def build_frames(seed: int = DEFAULT_SEED, use_osm: bool = False, verbose: bool = True) -> list[Frame]:
    """Build all three regional frames (AP · TN · TG)."""
    return [build_frame(region, seed=seed, use_osm=use_osm, verbose=verbose) for region in REGIONS]


def summary(frames: list[Frame]) -> str:
    def total(attr: str) -> int:
        return sum(len(getattr(f, attr)) for f in frames)

    counts = [
        ("landstack.parcels", total("parcels")), ("landstack.buildings", total("buildings")),
        ("landstack.units", total("units")), ("landstack.users", total("users")),
        ("landstack.applications", total("applications")), ("landstack.alerts", total("alerts")),
        ("landstack.audit_log", total("audit_log")), ("dept_revenue.ror", total("ror")),
        ("dept_revenue.mutations", total("mutations")), ("dept_registration.deeds", total("deeds")),
        ("dept_registration.encumbrances", total("encumbrances")), ("dept_planning.zones", total("zones")),
        ("dept_planning.building_permissions", total("permissions")), ("dept_fiscal.property_tax", total("property_tax")),
        ("dept_fiscal.valuation", total("valuation")), ("dept_legal.disputes", total("disputes")),
        ("dept_utilities.connections", total("connections")), ("gis.roads", total("roads")),
        ("gis.water_lines", total("water_lines")), ("gis.restriction_zones", total("restriction_zones")),
        ("gis.projects", total("projects")), ("gis.village_boundary", len(frames)), ("gis.s2_change", total("s2_change")),
    ]
    lines = ["", f"{'table':38} rows", "-" * 44]
    lines += [f"{name:38} {n:5d}" for name, n in counts]
    all_parcels = [p for f in frames for p in f.parcels]
    lu = Counter(p.land_use for p in all_parcels)
    zc = Counter(p.zone_code for p in all_parcels)
    areas = sorted(p.area_sqm for p in all_parcels)
    per_region = " · ".join(f"{f.region.code} {len(f.parcels)}" for f in frames)
    changed = sum(1 for f in frames for s in f.s2_change if s["label"] != "no_significant_change")
    lines += ["", f"regions  : {per_region}", f"land_use : {dict(lu)}", f"zones    : {dict(zc)}",
              f"area m²  : min {areas[0]:.0f} · median {areas[len(areas) // 2]:.0f} · max {areas[-1]:.0f}",
              f"changed  : {changed} parcels with S2 change labels",
              "", f"{'st':3} {'story':8} {'ulpin':16} {'land_use':13} {'area':>8}  owner"]
    for f in frames:
        ror = {r["ulpin"]: r for r in f.ror}
        for survey in f.region.story:
            p = f.story[survey]
            lines.append(f"{f.region.code:3} {survey:8} {p.ulpin:16} {p.land_use:13} {p.area_sqm:8.0f}  {ror[p.ulpin]['owner_name']}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Output: GeoJSON samples
# ---------------------------------------------------------------------------
def _feature(geom: BaseGeometry, props: dict[str, Any]) -> dict[str, Any]:
    return {"type": "Feature", "geometry": mapping(geom), "properties": props}


def _fc(features: list[dict[str, Any]]) -> dict[str, Any]:
    return {"type": "FeatureCollection", "features": features}


def write_geojson(frames: list[Frame], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    parcels: list[dict[str, Any]] = []
    roads: list[dict[str, Any]] = []
    zones: list[dict[str, Any]] = []
    villages: list[dict[str, Any]] = []
    story_parcels: list[dict[str, Any]] = []
    users: list[dict[str, Any]] = []
    for frame in frames:
        region = frame.region
        ror = {r["ulpin"]: r for r in frame.ror}
        s2 = {s["ulpin"]: s for s in frame.s2_change}
        parcels += [_feature(p.geom, {
            "ulpin": p.ulpin, "survey_no": p.survey_no, "sub_division": p.sub_division,
            "state": region.code, "village": region.village,
            "land_use": p.land_use, "zone_code": p.zone_code, "area_sqm": p.area_sqm,
            "owner_name": ror[p.ulpin]["owner_name"], "ownership_type": ror[p.ulpin]["ownership_type"],
            "story": p.story, "s2_label": s2[p.ulpin]["label"],
        }) for p in frame.parcels]
        roads += [_feature(to_wgs(r.geom_utm), {"name": r.name, "road_class": r.road_class, "width_m": r.width_m, "source": r.source})
                  for r in frame.roads]
        zones += [_feature(z["geom"], {"zone_code": z["zone_code"], "name": z["name"], "permissible_uses": z["permissible_uses"]})
                  for z in frame.zones]
        villages.append(_feature(to_wgs(as_multipolygon(frame.aoi_utm)), {"name": region.aoi_name, "state": region.code}))
        story_parcels += [{
            "survey_no": survey, "key": region.story[survey][0], "ulpin": p.ulpin,
            "state": region.code, "village": region.village, "land_use": p.land_use,
            "zone_code": p.zone_code, "area_sqm": p.area_sqm, "owner_name": ror[p.ulpin]["owner_name"],
            "khata_no": ror[p.ulpin]["khata_no"],
            "centroid": [round(p.geom.centroid.x, 6), round(p.geom.centroid.y, 6)],
            "bbox": [round(v, 6) for v in p.geom.bounds],
        } for survey, p in ((s, frame.story[s]) for s in region.story)]
        users += [{"uid": u["uid"], "name": u["name"], "role": u["role"], "department": u["department"]} for u in frame.users]
    (out_dir / "parcels.geojson").write_text(json.dumps(_fc(parcels), separators=(",", ":")))
    (out_dir / "roads.geojson").write_text(json.dumps(_fc(roads), separators=(",", ":")))
    (out_dir / "zones.geojson").write_text(json.dumps(_fc(zones), separators=(",", ":")))
    (out_dir / "village.geojson").write_text(json.dumps(_fc(villages), separators=(",", ":")))

    all_bounds = [f.region.aoi_bbox for f in frames]
    overall = [min(b[0] for b in all_bounds), min(b[1] for b in all_bounds),
               max(b[2] for b in all_bounds), max(b[3] for b in all_bounds)]
    story = {
        "seed": frames[0].seed if frames else DEFAULT_SEED,
        "aoi_bbox": overall,
        "regions": [{
            "code": f.region.code, "state": f.region.state_name, "district": f.region.district,
            "village": f.region.village, "bbox": list(f.region.aoi_bbox), "parcel_count": len(f.parcels),
        } for f in frames],
        "parcels": story_parcels,
        "users": users,
    }
    (out_dir / "story_parcels.json").write_text(json.dumps(story, indent=2))
    print(f"wrote parcels/roads/zones/village .geojson + story_parcels.json to {out_dir}")


# ---------------------------------------------------------------------------
# Output: PostgreSQL
# ---------------------------------------------------------------------------
def _wkt(geom: BaseGeometry) -> str:
    return wkt.dumps(geom, rounding_precision=7)


def _j(value: Any) -> str:
    return json.dumps(value, default=str)


def _insert(cur, table: str, columns: Sequence[str], rows: Iterable[Sequence[Any]], geom_cols: dict[str, str] | None = None) -> int:
    """executemany INSERT; ``geom_cols`` maps column → SQL expression template ('%s' placeholder)."""
    rows = list(rows)
    if not rows:
        return 0
    geom_cols = geom_cols or {}
    placeholders = ", ".join(geom_cols.get(c, "%s") for c in columns)
    sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
    cur.executemany(sql, rows)
    return len(rows)


MULTI = "ST_Multi(ST_GeomFromText(%s, 4326))"
GEOM = "ST_GeomFromText(%s, 4326)"
JSONB = "%s::jsonb"


def write_department_demo_tables(cur, frames: list[Frame]) -> dict[str, int]:
    """Reload the department tables that demo actions modify (ror, deeds, encumbrances, permissions)."""
    cur.execute("TRUNCATE " + ", ".join(DEMO_DEPT_TABLES) + " RESTART IDENTITY")
    n: dict[str, int] = {}
    n["dept_revenue.ror"] = _insert(cur, "dept_revenue.ror",
        ["khata_no", "ulpin", "survey_no", "owner_name", "father_name", "ownership_type", "extent_sqm", "classification", "mutation_history", "updated_at"],
        [(r["khata_no"], r["ulpin"], r["survey_no"], r["owner_name"], r["father_name"], r["ownership_type"], r["extent_sqm"],
          r["classification"], _j(r["mutation_history"]), r["updated_at"]) for f in frames for r in f.ror], {"mutation_history": JSONB})
    n["dept_registration.deeds"] = _insert(cur, "dept_registration.deeds",
        ["doc_no", "ulpin", "deed_type", "executant", "claimant", "consideration", "extent_sqm", "registered_on", "sro_code"],
        [(d["doc_no"], d["ulpin"], d["deed_type"], d["executant"], d["claimant"], d["consideration"], d["extent_sqm"], d["registered_on"], d["sro_code"])
         for f in frames for d in f.deeds])
    n["dept_registration.encumbrances"] = _insert(cur, "dept_registration.encumbrances",
        ["ulpin", "kind", "holder", "amount", "from_date", "to_date", "active"],
        [(e["ulpin"], e["kind"], e["holder"], e["amount"], e["from_date"], e["to_date"], e["active"]) for f in frames for e in f.encumbrances])
    n["dept_planning.building_permissions"] = _insert(cur, "dept_planning.building_permissions",
        ["permit_no", "ulpin", "status", "floors", "built_up_sqm", "applied_on", "approved_on", "conditions", "application_id"],
        [(b["permit_no"], b["ulpin"], b["status"], b["floors"], b["built_up_sqm"], b["applied_on"], b["approved_on"], b["conditions"], b["application_id"])
         for f in frames for b in f.permissions])
    return n


def write_mutable(cur, frames: list[Frame]) -> dict[str, int]:
    """Truncate and reload the mutable gateway tables (alerts, applications, audit, mutations, outbox, ...)."""
    cur.execute("TRUNCATE " + ", ".join(MUTABLE_TABLES) + " RESTART IDENTITY")
    n: dict[str, int] = {}
    apps = [a for f in frames for a in f.applications]
    n["landstack.applications"] = _insert(cur, "landstack.applications",
        ["id", "ulpin", "type", "applicant_uid", "applicant_name", "status", "payload", "assigned_department", "created_at", "updated_at"],
        [(a["id"], a["ulpin"], a["type"], a["applicant_uid"], a["applicant_name"], a["status"], _j(a["payload"]),
          a["assigned_department"], a["created_at"], a["updated_at"]) for a in apps], {"payload": JSONB})
    n["landstack.alerts"] = _insert(cur, "landstack.alerts",
        ["ulpin", "kind", "severity", "title", "detail", "status", "created_at"],
        [(a["ulpin"], a["kind"], a["severity"], a["title"], _j(a["detail"]), a["status"], a["created_at"]) for f in frames for a in f.alerts],
        {"detail": JSONB})
    n["landstack.audit_log"] = _insert(cur, "landstack.audit_log",
        ["ts", "actor_uid", "actor_name", "actor_role", "action", "entity_type", "entity_id", "ulpin", "before", "after", "source"],
        [(a["ts"], a["actor_uid"], a["actor_name"], a["actor_role"], a["action"], a["entity_type"], a["entity_id"], a["ulpin"],
          _j(a["before"]) if a["before"] is not None else None, _j(a["after"]) if a["after"] is not None else None, a["source"])
         for f in frames for a in f.audit_log], {"before": JSONB, "after": JSONB})
    n["dept_revenue.mutations"] = _insert(cur, "dept_revenue.mutations",
        ["ulpin", "from_owner", "to_owner", "reason", "application_id", "created_at"],
        [(m["ulpin"], m["from_owner"], m["to_owner"], m["reason"], m["application_id"], m["created_at"]) for f in frames for m in f.mutations])
    # Advance the id sequence past the highest seeded numeric suffix (ids are APP-2026-%06d).
    top = max((int(a["id"].rsplit("-", 1)[-1]) for a in apps), default=1)
    cur.execute("SELECT setval('landstack.application_id_seq', %s, true)", (max(1, top),))
    return n


def write_db(conn, frames: Frame | list[Frame], only_mutable: bool = False) -> dict[str, int]:
    """Load the frames into PostgreSQL inside one transaction. Returns per-table row counts."""
    if isinstance(frames, Frame):
        frames = [frames]
    with conn.cursor() as cur:
        if only_mutable:
            n = write_department_demo_tables(cur, frames)
            n.update(write_mutable(cur, frames))
            conn.commit()
            return n
        cur.execute("TRUNCATE " + ", ".join(ALL_TABLES) + " RESTART IDENTITY CASCADE")
        n: dict[str, int] = {}
        n["landstack.parcels"] = _insert(cur, "landstack.parcels",
            ["ulpin", "state", "district", "taluk", "village", "survey_no", "sub_division", "geom", "area_sqm", "land_use", "zone_code", "status_flags"],
            [(p.ulpin, f.region.code, f.region.district, f.region.taluk, f.region.village, p.survey_no, p.sub_division,
              _wkt(p.geom), p.area_sqm, p.land_use, p.zone_code,
              _j({"story": p.story} if p.story else {})) for f in frames for p in f.parcels], {"geom": MULTI, "status_flags": JSONB})
        buildings = [b for f in frames for b in f.buildings]
        n["landstack.buildings"] = _insert(cur, "landstack.buildings",
            ["id", "ulpin", "footprint", "floors", "height_m", "name"],
            [(b["id"], b["ulpin"], _wkt(b["footprint"]), b["floors"], b["height_m"], b["name"]) for b in buildings], {"footprint": MULTI})
        cur.execute("SELECT setval('landstack.buildings_id_seq', %s, true)", (max([b["id"] for b in buildings], default=1),))
        n["landstack.units"] = _insert(cur, "landstack.units",
            ["building_id", "ulpin", "ulpin_3d", "floor", "unit_no", "geom", "base_m", "height_m", "owner_name"],
            [(u["building_id"], u["ulpin"], u["ulpin_3d"], u["floor"], u["unit_no"], _wkt(u["geom"]), u["base_m"], u["height_m"], u["owner_name"])
             for f in frames for u in f.units], {"geom": GEOM})
        n["landstack.users"] = _insert(cur, "landstack.users", ["uid", "email", "name", "role", "department"],
            [(u["uid"], u["email"], u["name"], u["role"], u["department"]) for f in frames for u in f.users])

        n["dept_planning.zones"] = _insert(cur, "dept_planning.zones", ["zone_code", "name", "permissible_uses", "geom"],
            [(z["zone_code"], z["name"], z["permissible_uses"], _wkt(z["geom"])) for f in frames for z in f.zones], {"geom": MULTI})
        n["dept_fiscal.property_tax"] = _insert(cur, "dept_fiscal.property_tax",
            ["assessment_no", "ulpin", "annual_demand", "paid_till", "arrears", "last_paid_on"],
            [(t["assessment_no"], t["ulpin"], t["annual_demand"], t["paid_till"], t["arrears"], t["last_paid_on"]) for f in frames for t in f.property_tax])
        n["dept_fiscal.valuation"] = _insert(cur, "dept_fiscal.valuation", ["ulpin", "guideline_value_per_sqm", "effective_from"],
            [(v["ulpin"], v["guideline_value_per_sqm"], v["effective_from"]) for f in frames for v in f.valuation])
        n["dept_legal.disputes"] = _insert(cur, "dept_legal.disputes",
            ["case_no", "ulpin", "court", "nature", "filed_on", "status", "next_hearing"],
            [(d["case_no"], d["ulpin"], d["court"], d["nature"], d["filed_on"], d["status"], d["next_hearing"]) for f in frames for d in f.disputes])
        n["dept_utilities.connections"] = _insert(cur, "dept_utilities.connections",
            ["ulpin", "water", "electricity", "sewer", "road_access_m", "nearest_road_class"],
            [(c["ulpin"], c["water"], c["electricity"], c["sewer"], c["road_access_m"], c["nearest_road_class"]) for f in frames for c in f.connections])

        n["gis.roads"] = _insert(cur, "gis.roads", ["name", "road_class", "width_m", "source", "geom"],
            [(r.name, r.road_class, r.width_m, r.source, _wkt(to_wgs(r.geom_utm))) for f in frames for r in f.roads], {"geom": GEOM})
        n["gis.water_lines"] = _insert(cur, "gis.water_lines", ["name", "kind", "geom"],
            [(w["name"], w["kind"], _wkt(w["geom"])) for f in frames for w in f.water_lines], {"geom": GEOM})
        n["gis.restriction_zones"] = _insert(cur, "gis.restriction_zones", ["kind", "name", "geom"],
            [(z["kind"], z["name"], _wkt(z["geom"])) for f in frames for z in f.restriction_zones], {"geom": MULTI})
        n["gis.projects"] = _insert(cur, "gis.projects", ["name", "kind", "status", "geom"],
            [(p["name"], p["kind"], p["status"], _wkt(p["geom"])) for f in frames for p in f.projects], {"geom": GEOM})
        n["gis.village_boundary"] = _insert(cur, "gis.village_boundary", ["name", "geom"],
            [(f.region.aoi_name, _wkt(to_wgs(as_multipolygon(f.aoi_utm)))) for f in frames], {"geom": MULTI})
        n.update(write_department_demo_tables(cur, frames))
        n["gis.s2_change"] = _insert(cur, "gis.s2_change",
            ["ulpin", "date_a", "date_b", "ndvi_a", "ndvi_b", "ndbi_a", "ndbi_b", "d_ndvi", "d_ndbi", "label", "confidence"],
            [(s["ulpin"], s["date_a"], s["date_b"], s["ndvi_a"], s["ndvi_b"], s["ndbi_a"], s["ndbi_b"], s["d_ndvi"], s["d_ndbi"], s["label"], s["confidence"])
             for f in frames for s in f.s2_change])
        n.update(write_mutable(cur, frames))
    conn.commit()
    return n


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--seed", type=int, default=DEFAULT_SEED)
    ap.add_argument("--osm", action="store_true", help="try OpenStreetMap roads via Overpass before synthesising")
    ap.add_argument("--dry-run", action="store_true", help="generate only; do not touch the database")
    ap.add_argument("--only-mutable", action="store_true", help="reload alerts/applications/audit only (demo reset)")
    ap.add_argument("--geojson-out", type=Path, help="directory for parcels/roads/zones GeoJSON + story_parcels.json")
    ap.add_argument("--database-url", help="overrides DATABASE_URL")
    args = ap.parse_args(argv)

    frames = build_frames(seed=args.seed, use_osm=args.osm)
    if args.geojson_out:
        write_geojson(frames, args.geojson_out)
    print(summary(frames))

    if args.dry_run:
        print("\n--dry-run: database not touched")
        return 0

    from dburl import connect, resolve_database_url

    url = resolve_database_url(args.database_url)
    print(f"\nloading into {url.split('@')[-1]} ({'mutable tables only' if args.only_mutable else 'full reload'}) ...")
    t0 = time.perf_counter()
    with connect(url) as conn:
        counts = write_db(conn, frames, only_mutable=args.only_mutable)
    for table, count in counts.items():
        print(f"  {table:38} {count:5d}")
    print(f"loaded in {time.perf_counter() - t0:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
