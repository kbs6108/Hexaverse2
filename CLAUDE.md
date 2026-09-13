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

## Current state (as of the hand-off commit)

Verified in the build sandbox (which had **no Postgres and no browser**):
- `apps/api`: `pytest -q` → 73 passed; `ruff check` + `ruff format --check` clean.
- `apps/web`: `tsc --noEmit` clean; `vite build` OK (~1.1 MB maplibre chunk, ~1.1 MB echarts chunk, gzip ≈ 850 KB total).
- All five migrations parse (pglast). `tools/seed.py --dry-run` → 1,024 non-overlapping parcels,
  six story parcels present (123/4 Ravi Kumar clean; 124 agricultural with satellite change alert;
  125/2 disputed; 126 mortgaged; 127/1 tax arrears + area mismatch; 128 pending mutation).
- A cross-lane contract audit fixed 17 mismatches between SQL ↔ API ↔ web (see git log message and
  `docs/CONTRACTS.md` §3 for the dev-uid rule `dev-<slug(name)>`).

**Never yet executed:** the SQL against a real PostGIS, and the web app in a real browser.
The first `make up` (or the first CI run on push) is the moment of truth. Expected first-run issues,
in order of likelihood:
1. asyncpg bind-parameter typing in a few queries (`substring(id from :n)`, `ST_AsMVT(f.*, :name …)`,
   `make_interval(hours => :hours)`, `None` params rendering untyped) → add explicit `::type` casts.
2. `landstack.parcel_tile_features` view performance at low zoom (correlated subqueries per parcel)
   → materialise or pre-join; add `ST_Simplify` below z14.
3. `ST_AsMVT` with `numeric` columns → cast to `double precision`/`int` in the view.
4. The `landstack_app` role DO-block in 002 on Neon (no superuser) → guard or skip.
5. WeasyPrint system deps in the API image (fonts, pango) for `/reports/{id}.pdf`.
6. In-process `httpx.ASGITransport` round-trip `POST /registration/deeds` → `POST /landstack/events`.
7. Frontend: MapLibre `feature-state` with promoted string ids, OpenFreeMap glyphs, CORS on tile fetches
   (`CORS_ORIGINS` must include the web origin), hover-card `queryRenderedFeatures` layer ids.

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

## First tasks for the next session (suggested order)

1. `cp apps/api/.env.example apps/api/.env && cp apps/web/.env.example apps/web/.env && make up`.
   Fix whatever the migrate/seed container and the API log throw (list above). Then open
   http://localhost:5173, pick "Anitha" in the role switcher, click parcel 123/4, and walk every tab.
2. Run the demo script end to end (docs/plan/landstack-plan.html §15): simulate deed on 123/4 as
   Admin → parcel turns amber → mutation in Anitha's queue → approve → RoR updates; Satellite tab on
   124; fail the fiscal service with `?fail=1` and confirm the profile degrades per block.
3. Push; make CI green (`.github/workflows/ci.yml` runs against a real PostGIS).
4. Cloud: Neon project → `make neon-migrate`; Firebase Auth providers (Google + email) →
   `tools/set_claims.py`; `make deploy-api` (Cloud Run, asia-south1); `make deploy-web` (Hosting).
5. Then the roadmap: real OSM roads via `tools/seed.py --osm`, Sentinel-2 online path via
   `tools/fetch_s2.py`, Gemini OCR (`GEMINI_API_KEY`), Bhuvan WMS overlay flag, second state adapter,
   and the 3D work (buildings/units already seeded; extrusion layer exists; next is per-unit
   selection + 3D-ULPIN profile, then deck.gl overlay / glTF export if wanted).

## Sources the plan relies on (for the pitch and the STD)

PS text mirrors: sih2026.vuce.in/ps/SIH26014 · Land Stack pilot: PIB PRID 2210204 (31 Dec 2025) ·
ULPIN/NGDRS/GoRT: dolr.gov.in · Bhu-Naksha: nic.gov.in/project/bhunaksha · Planetary Computer STAC ·
OGC API Features 17-069r4 · GeoJSON RFC 7946 · ISO 19152 LADM · MeitY MDDS · DEPA (India Stack).
Full list with URLs at the end of docs/plan/landstack-plan.html.
