# Land Stack — Build Contracts (source of truth for every component)

Read this fully before writing code. Any deviation must be reflected here first.

## 0. Product in one paragraph
A parcel-centric GIS platform. Every land parcel has a ULPIN-style id. Six "department" systems
(revenue, registration, planning, fiscal, legal, utilities) each hold their own data in their own
vocabulary. A gateway aggregates them into one Common Data Model (CDM) per parcel, with per-source
provenance. Surfaces: Map Explorer (3-tier layers), Parcel Profile drawer, Citizen Portal
(search / verify ownership / track / request), Officer Console (KPIs, queue, approvals), Admin &
Integration Console (connectors, adapter mappings, consistency findings, simulate upstream change),
Satellite panel (Sentinel-2 change detection). 2D first; the data model and map stack are 3D-ready
(buildings → floors → units with 3D-ULPIN suffixes, rendered via MapLibre fill-extrusion).

## 1. Repo layout (monorepo)
```
apps/api/                 FastAPI (Python 3.12). Package root = apps/api
  landstack/              gateway package
    main.py               creates app, mounts department sub-apps, CORS, /healthz
    config.py             pydantic-settings; all env below
    db.py                 asyncpg pool via SQLAlchemy 2 async engine; helper `fetch/fetchrow/execute`
    auth.py               Firebase + dev auth; `Principal`; `require(*roles, department=None)`
    cdm.py                Pydantic models for the CDM (section 5)
    routers/              auth, collections (OGC), tiles (MVT), parcels (aggregate), search,
                          applications (workflow), queue, stats, consistency, connectors, events,
                          reports, ai
    adapters/             base.py (DepartmentAdapter protocol), one adapter per department that
                          calls the department sub-app over HTTP (in-process via httpx ASGITransport
                          when DEPT_BASE_URL is empty), plus *.yaml field mappings
    services/             aggregator.py, workflow.py, audit.py, masking.py, consistency.py,
                          reports.py (WeasyPrint+segno), ulpin.py
  departments/            six FastAPI sub-apps: revenue, registration, planning, fiscal, legal, utilities
                          each: app.py (routers) reading ONLY its own schema dept_<name>
  ai/                     change_detection.py (offline+online), extract.py (Gemini, optional)
  tests/                  pytest; unit tests need no DB; integration tests skip unless DATABASE_URL set
  pyproject.toml, Dockerfile
apps/web/                 Vite 7 + React 19 + TypeScript
  src/
    main.tsx, app/router.tsx (TanStack Router, code-based), app/providers.tsx
    lib/api.ts (fetch wrapper with auth header), lib/auth.ts (Firebase + dev), lib/store.ts (Zustand)
    features/map/        MapView, LayerPanel, SearchBox, legend, styles/layers.ts, extrusion (3D preview)
    features/parcel/     ParcelDrawer + section components (Ownership, Registration, Planning, Fiscal,
                          Utilities, Timeline, Satellite)
    features/citizen/    CitizenHome, VerifyOwnership, TrackApplication, ServiceRequest forms
    features/officer/    OfficerConsole (KPIs via ECharts, queue, ApplicationDetail with transitions)
    features/admin/      AdminConsole (connectors, mappings, consistency, simulate deed)
    components/          small UI primitives (Button, Card, Badge, Tabs, Drawer, Field) with Tailwind v4
  index.html, vite.config.ts, tsconfig.json, package.json, Dockerfile (nginx) — Firebase Hosting serves dist/
db/migrations/            001_extensions.sql … 010_3d_dimensions.sql (006 settlement, 007 ror state, 008 boundary
                          workflow, 009 type check, 010 3D dims) — plain SQL, idempotent. Applied by tools/migrate.py in filename order.
tools/                    migrate.py, seed.py, fetch_s2.py, set_claims.py, demo_reset.py
data/                     village.geojson (AOI), s2/ (offline COGs, gitignored except README), samples/ (scans)
infra/                    docker-compose.yml, cloudrun/ (deploy.sh, service.yaml), firebase.json, .firebaserc.example
.github/workflows/ci.yml  pytest with postgis service container; web typecheck + build
docs/                     CONTRACTS.md (this), SETUP.md, STD.md
Makefile                  up · migrate · seed · dev-api · dev-web · test · deploy-api · deploy-web · demo-reset
```

## 2. Environment variables
API (apps/api/.env):
```
DATABASE_URL=postgresql+asyncpg://landstack:landstack@localhost:5432/landstack   # Neon: postgresql+asyncpg://...?ssl=require
AUTH_MODE=dev | firebase
FIREBASE_PROJECT_ID=            # required when AUTH_MODE=firebase
GOOGLE_APPLICATION_CREDENTIALS= # service account json path (local) — on Cloud Run use default creds
CORS_ORIGINS=http://localhost:5173,https://<project>.web.app
DEPT_BASE_URL=                  # empty = call department sub-apps in-process; else e.g. https://api.example/
DEPT_TIMEOUT_S=0.3
EVENTS_SHARED_SECRET=change-me  # department → gateway webhook auth
REPORT_HMAC_SECRET=change-me
PUBLIC_WEB_URL=http://localhost:5173
STORAGE_BACKEND=local | gcs ; STORAGE_LOCAL_DIR=./data/storage ; GCS_BUCKET=
S2_OFFLINE=1 ; S2_DATA_DIR=./data/s2
NVIDIA_API_KEY=                 # NVIDIA Build (build.nvidia.com): AI briefs, advice, doc extraction; empty → rule engine
NVIDIA_MODEL=nvidia/nemotron-3-super-120b-a12b ; NVIDIA_VISION_MODEL=meta/llama-3.2-11b-vision-instruct
GEMINI_API_KEY=                 # optional legacy fallback for document extraction
```
Web (apps/web/.env):
```
VITE_API_URL=http://localhost:8000
VITE_AUTH_MODE=dev | firebase
VITE_FIREBASE_API_KEY= VITE_FIREBASE_AUTH_DOMAIN= VITE_FIREBASE_PROJECT_ID= VITE_FIREBASE_APP_ID=
VITE_ESRI_API_KEY=              # optional; imagery basemap disabled without it
VITE_DEFAULT_CENTER=78.90,21.00 ; VITE_DEFAULT_ZOOM=4.4   # national overview framing the AP/TN/TG clusters
```

## 3. Auth & roles
Roles: `citizen`, `officer`, `admin`. Officers carry `department` ∈ {revenue, registration, planning}.
- firebase mode: `Authorization: Bearer <Firebase ID token>`; roles from custom claims `role`, `department`.
  `tools/set_claims.py --email x --role officer --department revenue` sets claims via firebase-admin.
  Users without claims default to `citizen`.
- dev mode: header `X-Dev-User: <role>[:<department>][:<display name>]`, e.g. `officer:revenue:Anitha`.
  Missing header = anonymous (public endpoints only). Dev uid = `dev-<slug(name)>` (e.g. `dev-ravi-kumar`, `dev-anitha`, `dev-admin`) — matches `landstack.users` seeded by tools/seed.py.
`Principal { uid, name, role, department, consents: set[str] }`. `require("officer", department="revenue")`.
Admin passes every check. Consent tokens (citizen full-detail access) are rows in `landstack.consents`.

## 4. Database (PostgreSQL 16/17 + PostGIS 3.4+). Owner: data lane. Exact DDL lives in db/migrations.
Schemas: `landstack`, `dept_revenue`, `dept_registration`, `dept_planning`, `dept_fiscal`, `dept_legal`,
`dept_utilities`, `gis`. All geometry EPSG:4326; area computed via `ST_Area(geom::geography)`.
Key tables (columns are authoritative in SQL; names here are what the API relies on):
- landstack.parcels(ulpin PK text, state, district, taluk, village, survey_no, sub_division, geom MultiPolygon,
  area_sqm numeric, land_use text, zone_code text, status_flags jsonb default '{}', updated_at timestamptz)
- landstack.buildings(id serial, ulpin FK, footprint MultiPolygon, floors int, height_m numeric, name,
  width_m numeric, depth_m numeric, basement_floors int default 0 — migration 010; dims from the footprint's
  minimum rotated rectangle)
- landstack.units(id serial, building_id FK, ulpin_3d text unique  -- '<ULPIN>-F<floor:02>-U<unit:02>',
  floor int, unit_no text, geom Polygon, base_m numeric, height_m numeric, owner_name text)
- landstack.users(uid PK text, email, name, role, department, created_at)
- landstack.consents(id, ulpin, granted_to_uid, granted_by, expires_at)
- landstack.applications(id text PK 'APP-2026-000123', ulpin, type, applicant_uid, applicant_name, status,
  payload jsonb, assigned_department, created_at, updated_at)
  type ∈ mutation | building_permission | ownership_verification | field_review | boundary_correction | record_correction | land_complaint
- landstack.transitions(type, from_status, to_status, allowed_role, allowed_department, action_label, is_terminal)
- landstack.audit_log(id bigserial, ts, actor_uid, actor_name, actor_role, action, entity_type, entity_id,
  ulpin, before jsonb, after jsonb, source) — INSERT only for app role
- landstack.alerts(id serial, ulpin, kind, severity, title, detail jsonb, status open|assigned|resolved, created_at)
  kind ∈ change_detected | inconsistency | pending_mutation
- landstack.reports(id text PK, ulpin, issued_to_uid, issued_to_name, issued_at, sha256, signature, storage_key)
- landstack.connector_status(name PK, ok bool, latency_ms int, last_sync timestamptz, note)
- dept_revenue.ror(khata_no PK, ulpin, survey_no, owner_name, father_name, ownership_type, extent_sqm,
  classification, mutation_history jsonb, updated_at)
- dept_revenue.mutations(id serial, ulpin, from_owner, to_owner, reason, application_id, created_at)
- dept_registration.deeds(doc_no PK, ulpin, deed_type, executant, claimant, consideration numeric,
  registered_on date, sro_code); dept_registration.encumbrances(id, ulpin, kind, holder, amount, from_date, to_date, active)
- dept_registration.outbox(id serial, event, ulpin, payload jsonb, created_at, delivered_at)
- dept_planning.zones(id, zone_code, name, permissible_uses text[], geom MultiPolygon)
- dept_planning.building_permissions(permit_no PK, ulpin, status, floors, built_up_sqm, applied_on, approved_on, conditions)
- dept_fiscal.property_tax(assessment_no PK, ulpin, annual_demand, paid_till, arrears, last_paid_on)
- dept_fiscal.valuation(ulpin PK, guideline_value_per_sqm, effective_from)
- dept_legal.disputes(case_no PK, ulpin, court, nature, filed_on, status, next_hearing)
- dept_utilities.connections(ulpin PK, water bool, electricity bool, sewer bool, road_access_m, nearest_road_class)
- gis.roads(id, name, road_class, width_m, geom LineString); gis.water_lines(id, geom LineString);
  gis.restriction_zones(id, kind, name, geom MultiPolygon); gis.projects(id, name, kind, status, geom);
  gis.village_boundary(id, name, geom MultiPolygon); gis.settlement_schemes(id, state, scheme,
  phase notified|in_progress|completed, survey_year, geom MultiPolygon — migration 006; parcels carry
  the matching status_flags.resurvey = completed|in_progress|pending); gis.s2_change(ulpin PK, date_a,
  date_b, ndvi_a, ndvi_b, ndbi_a, ndbi_b, d_ndvi, d_ndbi, label, confidence)
Indexes: GiST on every geom; gin_trgm on parcels.survey_no and ror.owner_name (pg_trgm).
View landstack.parcel_status(ulpin, has_dispute, has_mortgage, tax_arrears, pending_mutation, registered, permission_status, change_alert)
used for map colouring and stats. Tiles read `landstack.parcel_tile_features` view (parcels ⋈ parcel_status ⋈ ror.owner_name).

## 5. Common Data Model (gateway → UI). Pydantic in landstack/cdm.py; TS mirror in web/src/lib/cdm.ts
```json
{
  "ulpin": "TDR1K3M9A2F7C1",
  "identifiers": {"state":"AP","district":"Guntur","taluk":"Mangalagiri","village":"Mangalagiri (R)","survey_no":"123/4","khata_no":"K-0421"},
  "spatial": {"area_sqm":223.0,"centroid":[80.5683,16.4310],"crs":"EPSG:4326","bbox":[..4],"geometry_ref":"/landstack/collections/parcels/items/TDR1K3M9A2F7C1"},
  "party": {"owners":[{"name":"Ravi Kumar","father_name":"...","share":1.0,"type":"patta"}],"masked":false},
  "rights": {"registration":{"status":"registered|unregistered","doc_no":"...","deed_type":"sale","registered_on":"2026-04-12","sro_code":"GNT-02"},
             "ror":{"khata_no":"K-0421","classification":"dry","extent_sqm":223.0,"ownership_type":"patta"}},
  "restrictions": {"encumbrances":[{"kind":"mortgage","holder":"SBI","amount":1200000,"active":true}],
                   "disputes":[{"case_no":"OS 12/2025","court":"...","status":"pending","next_hearing":"..."}],
                   "restriction_zones":[{"kind":"flood","name":"Krishna floodplain"}]},
  "planning": {"zone_code":"R1","zone_name":"Residential","land_use":"residential",
               "building_permission":{"status":"approved|pending|rejected|none","permit_no":"BP-5678","floors":2}},
  "fiscal": {"tax":{"assessment_no":"...","annual_demand":12500,"arrears":0,"paid_till":"2026-27"},"guideline_value_per_sqm":18000,"estimated_value":4014000},
  "utilities": {"water":true,"electricity":true,"sewer":false,"road_access_m":12,"nearest_road_class":"district"},
  "buildings": [{"id":1,"floors":3,"height_m":9.5,"width_m":18.4,"depth_m":12.1,"basement_floors":1,
                 "units":[{"ulpin_3d":"...-F01-U01","floor":1,"unit_no":"101","owner_name":"...","base_m":0,"height_m":3.2,"area_sqm":98.5}]}],
  "alerts": [{"id":1,"kind":"change_detected","severity":"high","title":"...","status":"open"}],
  "provenance": {"revenue":{"ok":true,"ms":41,"as_of":"2026-09-13T08:12:00Z","source":"AP Meebhoomi (mock)"},
                 "fiscal":{"ok":false,"error":"timeout","cached_as_of":null}},
  "consistency": {"area_match":true,"owner_match":true,"issues":[{"field":"extent_sqm","revenue":2400,"registration":2800}]},
  "status": {"registered":true,"has_dispute":false,"has_mortgage":false,"tax_arrears":0,"pending_mutation":false,"change_alert":false},
  "status_flags": {"resurvey":"completed"}
}
```
Masking (citizen without consent): owner names → first letter + '***' per word; father_name removed; doc_no → last 4;
units.owner_name masked; `party.masked=true`.

## 6. Gateway API (prefix as shown; JSON; errors `{ "error": {"code","message","details"} }`)
Public: `GET /healthz`, `GET /landstack/collections`, `GET /landstack/collections/{layer}/items?bbox=&limit=&offset=&land_use=&status=`
(layers: parcels, zones, restriction_zones, roads, projects, village_boundary, buildings, settlement_schemes), `GET /landstack/collections/parcels/items/{ulpin}`,
`GET /landstack/tiles/{layer}/{z}/{x}/{y}.pbf` (ST_AsMVT; layers: parcels, zones, restriction_zones, roads, water_lines, projects, settlement_schemes, units),
`GET /landstack/search?q=` (ulpin/survey/khata always; owner name only for officer+), `GET /verify/{report_id}` (JSON), `GET /reports/{id}.pdf`.
Any signed-in: `GET /landstack/parcels/{ulpin}` (CDM, masked per role/consent), `GET /landstack/me`,
`POST /landstack/verify-ownership {ulpin, claimed_name}` → `{match: bool, score, compared: ["ror","latest_deed"]}`,
`POST /landstack/applications {ulpin, type, payload}`, `GET /landstack/applications?mine=1`, `GET /landstack/applications/{id}`,
`POST /landstack/reports/{ulpin}` → `{id, url}`, `POST /landstack/consents/request {ulpin}`.
Officer (revenue) / admin: `POST /landstack/parcels/{ulpin}/boundary/validate {geometry}` → bounded-edit checks
(valid geometry · 4–200 vertices · |Δarea| ≤ 15% · no overlap > 1 m² · within village boundary) + metrics and an
assistive `suggestion` (snap-to-neighbours + overlap subtraction); `POST /landstack/parcels/{ulpin}/boundary
{geometry, reason}` → files a `boundary_correction` application (rejected up-front unless validation passes).
Officer+: `GET /landstack/parcels/{ulpin}/timeline`, `GET /landstack/queue?department=`, `POST /landstack/applications/{id}/transition {action, remark}`,
`GET /landstack/stats`, `GET /landstack/alerts?status=`, `POST /landstack/alerts/{id}/assign`, `POST /landstack/alerts/{id}/resolve`,
`POST /landstack/ai/change-detection {ulpin | bbox, date_a?, date_b?}`, `POST /landstack/ai/extract-document (multipart)`,
`POST /landstack/ai/application-advice {id}` → suggested next workflow action + rationale grounded in parcel flags.
Any signed-in: `POST /landstack/ai/parcel-brief {ulpin}` → risk score/level, findings, narrative, recommendations —
NVIDIA Build model when NVIDIA_API_KEY is set, deterministic rule engine otherwise; response carries `engine`.
The web auto-runs the brief on flagged parcels and the advice on any open application.
Any signed-in: `POST /landstack/ai/pre-check {ulpin, type}` → pre-submission triage for the citizen Apply wizard:
`{ulpin, type, engine:"rules", risk_score, risk_level, blockers[], warnings[], notes[], ok_to_submit}` (items are
`{text, action?}`). Always the deterministic rule engine; never prevents submission — the officer decides.
422 unknown_type if `type` is not a known application type. The web auto-runs it once a parcel + intent are chosen.
Admin: `GET /landstack/consistency`, `GET /landstack/connectors`, `GET /landstack/adapters` (mappings from yaml),
`POST /landstack/consents/grant {ulpin, uid, hours}`, `POST /landstack/admin/simulate/deed {ulpin, claimant}` (calls registration POST /deeds),
`POST /landstack/admin/demo-reset`.
Service: `POST /landstack/events` with header `X-Events-Secret`.
Department sub-apps (mounted; each has its own OpenAPI at `/<dept>/docs`): see section 7. All department GETs accept `?delay_ms=&fail=1` in dev.

## 7. Department APIs (vocabulary is intentionally different per department)
revenue:      GET /revenue/ror?ulpin= | GET /revenue/ror/{khata_no} | POST /revenue/mutations {ulpin,to_owner,reason,application_id}
              POST /revenue/extent {ulpin,extent_sqm,application_id} — RoR extent sync after an approved boundary correction
              RoR rows carry `state` (migration 007) and are served in that state's dialect: AP Meebhoomi
              (khata_no/owner_name/extent_sqm), TN Patta Chitta (patta_no/pattadar_name/extent_hectares),
              TG Dharani (ppb_no/pattadar_name/extent_acres) — translated back by revenue_{ap,tn,tg}.yaml.
registration: GET /registration/deeds?ulpin= | GET /registration/encumbrances?ulpin=&active=1 | POST /registration/deeds {ulpin,deed_type,executant,claimant,consideration} → writes outbox + POSTs /landstack/events
planning:     GET /planning/zone?ulpin= | GET /planning/permissions?ulpin= | POST /planning/permissions {ulpin,floors,built_up_sqm,application_id,status}
              GET /planning/check?ulpin=&use=residential&floors= → {permissible: bool, reasons[]}
fiscal:       GET /fiscal/tax?ulpin= | GET /fiscal/valuation?ulpin=
legal:        GET /legal/disputes?ulpin=
utilities:    GET /utilities/connections?ulpin=
Every response: header `X-Source-System`, body includes `as_of` (ISO). Events: `registration.deed_registered`,
`revenue.ror_updated`, `planning.permission_issued`. Event body: `{event, ulpin, source, occurred_at, payload}`.

## 8. Workflow (transitions seeded in 002_landstack.sql)
mutation: submitted → document_check → field_verification → approved | returned | rejected (revenue officer); returned → submitted (citizen resubmits)
building_permission: submitted → planning_check → site_inspection → approved | rejected (planning officer); auto planning_check result stored in payload
field_review: open → assigned → resolved (admin assigns, revenue/planning officer resolves)
boundary_correction: submitted → geometry_check → approved | returned | rejected (revenue officer; migration 008).
  Approval RE-validates the proposal (409 boundary_invalid if it no longer passes), then applies the geometry to
  landstack.parcels (area recomputed) and syncs the RoR extent via revenue POST /extent. Fully audited.
record_correction: submitted → document_check → approved | returned | rejected (revenue officer; migration 011); returned → submitted (citizen resubmits)
land_complaint: submitted → in_review → resolved | dismissed (any officer; migration 011; queued under revenue by default)
ownership_verification: instant (no rows in transitions)
On mutation approved: gateway calls revenue POST /mutations; on building_permission approved: planning POST /permissions.
System-initiated mutation (from deed event where claimant != RoR owner): type=mutation, status=submitted, applicant_name=claimant, payload.system_initiated=true.

## 9. Map layers (web) — three tiers exactly as PS names them
Tier 1 Base: parcels (fill+line, hover/select by feature-state, id=ulpin), survey labels (z≥16), village_boundary, basemap switch.
National overview: below z8 the map shows one cluster marker per demo state (from story_parcels.json `regions`) plus a Regions panel; click flies into the cluster (parcel tiles render z≥10).
Tier 2 Essential: parcels restyled by `colour_by` ∈ land_use | ownership_type | registered | encumbrance | dispute | zone | permission; zones polygons.
Tier 3 Use-case: tax arrears, guideline value, roads, water_lines, restriction_zones, projects, settlement_schemes (resurvey phase), change alerts, (Bhuvan WMS behind flag).
3D preview: units extrusion (fill-extrusion, base_m/height_m), toggle off by default. Floor 0 = basement
(base_m negative in the data; rendered as a brick slab at grade since MapLibre has no underground camera).
In 3D mode units are clickable: a data card shows the 3D-ULPIN, level, floor area (from the unit geometry),
the true elevation band (e.g. −3.2 → 0 m for a basement) and the occupant of record. Unit tiles carry
building_name and area_sqm (unit_tile_features, migration 010).

## 10. Demo regions & story parcels
Three real bounding boxes, one per state, to demonstrate multi-state scaling (deterministic seed=42):
- **AP** — Mangalagiri, Guntur district; bbox ≈ 80.545–80.567 E, 16.434–16.452 N (the original AOI).
- **TN** — Sriperumbudur, Kancheepuram district; bbox ≈ 79.940–79.962 E, 12.945–12.963 N.
- **TG** — Shamshabad, Ranga Reddy district; bbox ≈ 78.388–78.410 E, 17.240–17.258 N.
Each region generates a dense cadastre then thins to ~150 parcels of whole blocks (staged-digitisation
look: clear clusters with gaps). Per region: 6 master-plan zones, 3 restriction zones, 2 projects and a
village boundary, all lightly localized (names, courts, projects per state); ≥3 buildings with units
overall. `landstack.parcels.state` ∈ {AP, TN, TG}. Sequence bases per region keep khata/deed/permit/case
ids collision-free (AP K-0001+, TN K-2001+, TG K-4001+, etc.).
Story parcels (stable survey numbers; AP ULPINs unchanged from the single-region seed):
AP: 123/4 clean residential (owner Ravi Kumar) · 124 agricultural with change alert (built-up 2025) ·
125/2 disputed · 126 mortgaged · 127/1 tax arrears + area mismatch · 128 pending mutation.
TN: 45/2 disputed. TG: 77 agricultural with change alert. The scripted demo state (queue, applications,
audit) is seeded in AP only; TN/TG carry satellite alerts plus their story-driven department rows.
`data/samples/story_parcels.json` lists every story parcel (with `state`) and a `regions` array
(code, state, district, village, bbox, parcel_count) that the web map uses for region navigation.
Demo users (dev mode names): Ravi Kumar (citizen), Lakshmi Devi (citizen), Anitha (officer:revenue),
Suresh (officer:registration), Farida (officer:planning), Admin.

## 11. Conventions
Python: ruff-clean, type hints, async everywhere, SQL via `text()` with bound params, no ORM models. Tests: pytest + pytest-asyncio + httpx.
TS: strict, no `any` except at boundaries, TanStack Query for all server state, Zustand only for UI state (selected ulpin, layer toggles, colour_by, role in dev).
Commits on branch `sampath`. Never commit .env or data/s2/*.tif.
