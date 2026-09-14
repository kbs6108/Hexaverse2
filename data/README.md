# data/ — provenance and how to swap in real data

## What is real and what is synthetic

| Layer | Source | Notes |
|---|---|---|
| **AOIs** (`village.geojson`, `gis.village_boundary`) | Real bounding boxes | Three peri-urban demo regions, one per state: Mangalagiri, Guntur, AP (80.545–80.567 E, 16.434–16.452 N — the original AOI); Sriperumbudur, Kancheepuram, TN (79.940–79.962 E, 12.945–12.963 N); Shamshabad, Ranga Reddy, TG (78.388–78.410 E, 17.240–17.258 N). Each ≈2.3 × 2.0 km. The basemaps and any Sentinel-2 imagery are the real places. |
| **Parcels, survey numbers, ULPINs** | **Synthetic** (`tools/seed.py`, seed 42) | Per region: carved from road-bounded blocks with recursive strip splitting, then thinned to ~150 parcels of whole blocks (a staged-digitisation look — clear clusters with gaps). ~575 parcels across the three states. Survey numbers are Indian-style (`123`, `123/4`, `45/2A`) but do **not** correspond to real village maps. ULPINs are ULPIN-*style* (geohash + geometry hash), not DILRMP-issued; the AP story-parcel ULPINs are unchanged from the original single-region seed. |
| **Roads** | Synthetic by default; OpenStreetMap with `--osm` | `python tools/seed.py --osm` fetches `highway=*` from Overpass and uses those centrelines when reachable (© OpenStreetMap contributors, ODbL). |
| **Zones, restriction zones, projects, water lines** | Synthetic, *indicative* | Named after real features per state (Krishna/Palar/Musi floodplains, ORR / Chennai–Bengaluru Expressway / Regional Ring Road, metro corridors) to make the demo legible, but geometries are invented. |
| **Department records** (RoR, deeds, encumbrances, permissions, tax, valuation, disputes, utilities) | Synthetic | Indian names (curated Telugu/Tamil/Telangana lists per state + Faker `en_IN`), realistic distributions (patta 80 % / joint 15 % / govt 5 %, ~85 % registered, ~8 % mortgaged, ~4 % disputed, ~7 % tax arrears, ~6 % cross-department anomalies). |
| **Sentinel-2 change** (`gis.s2_change`) | Synthetic baseline; real when `tools/fetch_s2.py --compute` is run | Seeded NDVI/NDBI values are plausible per land use; real imagery from Microsoft Planetary Computer (Sentinel-2 L2A, Copernicus) replaces them. |
| **Users** | Demo accounts | `dev-ravi-kumar`, `dev-lakshmi-devi`, `dev-anitha`, `dev-suresh`, `dev-farida`, `dev-admin`. |

## Why synthetic?

State cadastral maps (Bhu Naksha / Meebhoomi / TN Patta Chitta / Dharani) and RoR/IGRS records are not available as
open, redistributable datasets and contain personal information. A synthetic cadastre inside a
real AOI gives a defensible demo: no real person's land is shown, every scenario the jury needs
(clean title, unrecorded conversion, dispute, mortgage, arrears + area mismatch, pending mutation)
is guaranteed to exist, and the generator is deterministic so every environment shows the same
ULPINs (`samples/story_parcels.json`).

## Files

```
data/
  village.geojson          AOI polygon (also loaded into gis.village_boundary)
  samples/
    parcels.geojson        seeded parcels with owner/status properties (inspection without a DB)
    roads.geojson, zones.geojson, village.geojson
    story_parcels.json     ULPINs, centroids and bboxes of the eight story parcels (6 AP + TN 45/2 + TG 77), the three regions, + demo users
  s2/                      Sentinel-2 COGs + manifest.json (gitignored; created by tools/fetch_s2.py)
  storage/                 generated PDF reports when STORAGE_BACKEND=local (gitignored)
```

## Swapping in real data

1. **Real cadastre** — load polygons with `survey_no`, `village` into `landstack.parcels`
   (EPSG:4326 MultiPolygon), compute `ulpin` with `landstack.services.ulpin.ulpin_style` (or use
   DILRMP ULPINs directly, any 14-char id works), `area_sqm = ST_Area(geom::geography)`. Then run
   only the department generators from `tools/seed.py` (`make_department_records`) or point the
   department adapters (`apps/api/landstack/adapters/*.yaml`) at the real APIs.
2. **Real zoning** — replace `dept_planning.zones` with the APCRDA / DTCP master-plan layer; the
   `zone_code` vocabulary (R1, R2, C1, AG, IND, PUB) is free-form text.
3. **Real imagery** — `python tools/fetch_s2.py --compute` (needs internet, ~200 MB download) fills
   `data/s2/` and recomputes `gis.s2_change` + alerts; set `S2_OFFLINE=0` to compute on demand.
4. **Real roads** — `python tools/seed.py --osm` or load any LineString layer into `gis.roads`
   with `road_class ∈ national|state|district|village|lane`.

Everything here is licensed for hackathon demonstration only; do not present the synthetic
records as real land titles.
