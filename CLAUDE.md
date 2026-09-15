# CLAUDE.md — Land Stack (Hexaverse2, branch `sampath`)

This file is the hand-off from the session that built this repo. Read it first, then
`docs/CONTRACTS.md` (the binding spec every component was written against), then `docs/SETUP.md`.

## What this project is

Smart India Hackathon 2026, problem statement **SIH26014** (Ministry of Rural Development / Dept.
of Land Resources): *"An Integrated GIS-based Digital Public Infrastructure for Land Governance"*.
Product name: **Land Stack**. One sentence: click a land parcel on a map and get everything
government knows about it — record of rights, registration & encumbrance, zoning & building
permission, property tax & valuation, disputes, utilities — aggregated live from six separate
"department" systems through one ULPIN-style parcel key, with per-source provenance.

Judges grade six things (all traced in `docs/plan/landstack-plan.html` §1): three-tier GIS layers
(base / essential governance / use-case), sample datasets with interoperable cross-department
workflows, role-based dashboards, citizen services (search, ownership verification, status tracking,
service requests), open APIs + auth + RBAC + audit, and a Standard Technical Document.
Differentiator vs the real DoLR pilot (Chandigarh/TN, Dec 2025): the *open interoperability layer*
— adapter model with per-state field mappings, event contract, consent-aware access, OGC-shaped APIs.

Owner: Rishith (rvulli@tenstorrent.com). Team is mixed Python + JS. Claude builds components;
Rishith adds ideas/tools/components on top. Time is not the constraint — quality and seamlessness are.
Everything external must be free. Hosting target: Rishith's Firebase project (Blaze plan) → Firebase
Hosting (web) + Cloud Run (API) + Neon (PostGIS, free) + Firebase Auth. 2D first; data model and map
stack are already 3D-ready (buildings → floors → units, `ulpin_3d = <ULPIN>-F01-U01`, MapLibre
fill-extrusion behind the "3D units · preview" toggle). Future: 3D-ULPIN blocks / 3D map generation.

## Repo map

```
docs/CONTRACTS.md     THE spec: layout, env vars, auth, DB schema, CDM JSON, every endpoint, workflow, layers, demo data
docs/SETUP.md         step-by-step for a human: Docker local run, Neon, Firebase Auth, Cloud Run, Hosting, demo prep
docs/STD.md           Standard Technical Document (markdown source; docx in docs/plan/)
docs/plan/            landstack-plan.html (full architecture + 7-day plan), STD .docx, pitch deck .pptx, seed-preview.png
apps/api/             FastAPI 0.1xx, Python 3.12, SQLAlchemy 2 async (text SQL, no ORM), asyncpg
  landstack/          gateway: config, db, auth (firebase|dev), cdm, routers/, adapters/ (+ *.yaml mappings), services/
  departments/        revenue · registration · planning · fiscal · legal · utilities — FastAPI sub-apps, own schemas
  ai/                 change_detection.py (Sentinel-2 NDVI/NDBI, offline mode), extract.py (Gemini OCR, optional)
  tests/              73 unit tests (no DB) + integration tests (run when DATABASE_URL is set)
apps/web/             Vite 7 · React 19 · TS strict · MapLibre GL 6 via react-map-gl 8 · TanStack Router/Query · Zustand · Tailwind v4 · ECharts · Firebase Auth
db/migrations/        001 extensions · 002 landstack · 003 departments · 004 gis · 005 views (idempotent SQL)
tools/                migrate.py · seed.py (synthetic cadastre, --osm optional, --dry-run) · demo_reset.py · fetch_s2.py · set_claims.py
infra/                docker-compose.yml (db, migrate, api, web; profiles prod/tiles) · cloudrun/ deploy
.github/workflows/    ci.yml — PostGIS service container: migrate + seed + pytest; web tsc + build
Makefile              up · down · migrate · seed · demo-reset · dev-api · dev-web · test · lint · deploy-api · deploy-web
```

## Current state (updated after the multi-phase build sessions)

Running end-to-end on the local Docker stack and green in CI (real PostGIS: migrate + seed + 73
tests; web tsc + build). Since the original hand-off the platform gained, in order:
- Cinematic landing at `/` (Karthik's template, emerald), map at `/map`, marketing `/welcome` + `/help`,
  QuickNav, government-identity header badge + footer (honest "Built for GoI/MoRD" framing).
- **Three states** (Phase 2): Mangalagiri AP · Sriperumbudur TN · Shamshabad TG, ~150 scattered
  parcels each (575 total), per-state revenue dialects (Meebhoomi / Patta Chitta / Dharani) served
  by the revenue mock and translated by `revenue_{ap,tn,tg}.yaml`; settlement/resurvey layer
  (`gis.settlement_schemes` + `status_flags.resurvey`); national India overview with cluster markers
  and a Regions panel. AP story-parcel ULPINs unchanged from the single-region seed.
- **Workflow/UX** (Phase 3): ParcelPicker (recents + story parcels) on every ULPIN field, citizen
  "your applications", officer one-click queue advance, alert → field-review filing.
- **Bounded boundary editing** (Phase 4): on-map vertex editor → validation (±15% area, no overlap,
  village containment, `services/boundary.py`) → `boundary_correction` workflow → approval re-validates,
  applies geometry, syncs RoR extent via revenue `POST /extent`. Migrations 008/009.
- **AI assist**: `services/ai_assist.py` on NVIDIA Build (`NVIDIA_API_KEY`, OpenAI-compatible) with an
  always-on deterministic rule engine; auto-running parcel risk briefs + officer application advice;
  document extraction prefers NVIDIA vision. Responses carry `engine` for honest labelling.
- **3D** (accurate + usable): buildings carry width/depth/basements (migration 010), units carry
  floor area + elevation bands; 3D units are clickable with a data card; basements are floor 0
  (true base −3.2 m, rendered as a slab at grade).
- Imagery basemap works with zero keys (public Esri World Imagery tiles; keyed service if
  `VITE_ESRI_API_KEY` is set).
Notable fixed first-run issues: asyncpg `substring(id from :n)` typing (predicted #1), the MapLibre
nested-zoom-expression style errors, the Vite dep-optimizer maplibre worker, the persisted-layers
merge bug, and the web container healthcheck (localhost→127.0.0.1). Still open from the original
list: low-zoom tile view could use ST_Simplify/materialisation; WeasyPrint deps on Cloud Run
unverified; Neon/Firebase/Cloud Run deployment not yet exercised.

## How to work in this repo

- **CONTRACTS first.** If you change a column, endpoint, CDM field, header, layer name or env var,
  edit `docs/CONTRACTS.md` in the same commit. Three components depend on it staying true.
- Backend SQL is plain `text()` with `:named` params through `landstack/db.py` (`fetch/fetchrow/
  fetchval/execute/transaction`). No ORM models. Migrations are idempotent; add `006_*.sql`, never edit
  applied files.
- Departments must only touch their own `dept_<name>` schema and talk to the gateway over HTTP
  (in-process via `DEPT_BASE_URL=""`). That separation *is* the interoperability story.
- The aggregator (`services/aggregator.py`) fans out to adapters with a per-source timeout and
  returns partial results with `provenance`; masking (`services/masking.py`) is applied after the
  role-independent cache. Keep that order.
- Web: TanStack Query for all server state, Zustand only for UI state; every profile section renders
  a `ProvenanceBadge`; status is never colour-only. Design tokens live in `src/styles.css`
  (green #0E6B54 primary, amber pending, brick disputed, violet mortgaged, slate government;
  Bricolage Grotesque / IBM Plex Sans / IBM Plex Mono).
- Dev auth: header `X-Dev-User: <role>[:<department>][:<name>]` (e.g. `officer:revenue:Anitha`,
  `citizen::Ravi Kumar`, `admin::Admin`). Dev uids are `dev-<slug>`; the seed uses the same.
- Tests: `cd apps/api && pytest -q`; with `DATABASE_URL` set the integration tests also run.
  `make test` runs both lanes. Keep them green before every commit.
- Commit on `sampath`. Never commit `.env`, `data/s2/*.tif`, `serviceAccount*.json`.

## Suggested next tasks

1. Cloud: Neon project → `make neon-migrate`; Firebase Auth providers (Google + email) →
   `tools/set_claims.py`; `make deploy-api` (Cloud Run, asia-south1); `make deploy-web` (Hosting).
   Watch for: the `landstack_app` DO-block on Neon, WeasyPrint deps in the API image.
2. Performance: ST_Simplify / materialise `parcel_tile_features` below z14; lazy-load the landing's
   three.js chunk (index bundle ~1.2 MB); bump GitHub Actions v4 → v5 (Node 20 deprecation).
3. Real data: `tools/seed.py --osm` per region; `tools/fetch_s2.py --compute` for real Sentinel-2;
   Bhuvan WMS overlay behind a flag if reachable.
4. AI: with NVIDIA_API_KEY set, tune the brief/advice prompts against real outputs; consider an
   officer "daily digest" and consistency-finding triage on the same service.
5. 3D next steps: deck.gl overlay or glTF export; per-unit consent/ownership flows on 3D-ULPINs.

## Sources the plan relies on (for the pitch and the STD)

PS text mirrors: sih2026.vuce.in/ps/SIH26014 · Land Stack pilot: PIB PRID 2210204 (31 Dec 2025) ·
ULPIN/NGDRS/GoRT: dolr.gov.in · Bhu-Naksha: nic.gov.in/project/bhunaksha · Planetary Computer STAC ·
OGC API Features 17-069r4 · GeoJSON RFC 7946 · ISO 19152 LADM · MeitY MDDS · DEPA (India Stack).
Full list with URLs at the end of docs/plan/landstack-plan.html.
