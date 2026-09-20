# CLAUDE.md — Land Stack (Hexaverse2, branch `sampath`)

**The living context file for this repo** — read by Claude Code, Cursor and any other agent/IDE
(AGENTS.md symlinks here). Read this first, then `docs/CONTRACTS.md` (the binding spec every
component is written against), then `docs/SETUP.md`.

**How to keep it updated** (humans and agents): after any meaningful change, edit ONLY the
"Current state" and "Status log" sections below — append a dated one-liner to the Status log and
adjust Current state if a capability was added/removed. Never rewrite the stable sections
(project description, repo map, how-to-work rules) unless they became untrue. Agents: update this
file in the same commit as the change it describes.

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

Team is mixed Python + JS; agents build components, the team adds ideas/tools on top. Time is not
the constraint — quality and seamlessness are.
Everything external must be free. Hosting target: a Firebase project (Blaze plan) → Firebase
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
- Cinematic landing at `/` (teammate's template, emerald), map at `/map`, marketing `/welcome` + `/help`,
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
  always-on deterministic rule engine; auto-running parcel risk briefs + officer application advice (models retire on NVIDIA Build — 410 Gone means pick a live id from /v1/models);
  document extraction prefers NVIDIA vision. Responses carry `engine` for honest labelling.
- **3D** (accurate + usable): buildings carry width/depth/basements (migration 010), units carry
  floor area + elevation bands; 3D units are clickable with a data card; basements are floor 0
  (true base −3.2 m, rendered as a slab at grade).
- Imagery basemap works with zero keys (public Esri World Imagery tiles; keyed service if
  `VITE_ESRI_API_KEY` is set).
- **Citizen Apply wizard** (Sep 2026): `/citizen/request` is one intent-based page — pick a parcel,
  then Transfer ownership / Fix a record mistake / Build / Raise a complaint; two new citizen-fileable
  types `record_correction` and `land_complaint` (migration 011) run through the same workflow engine;
  `POST /landstack/ai/pre-check` triages every application before submission (deterministic rules —
  blockers/warnings/notes, never blocks; officer decides). Tag `demo-stable-v1` marks the pre-wizard state.
- **Bhu-Sahayak chatbot** (Sep 2026): one floating launcher in the app chrome (signed-in pages);
  `POST /landstack/ai/assistant` routes intents with pure regex/keywords and answers only from the
  caller's masked records (CDM, own applications, triage/due-diligence rules); the LLM only rephrases
  and every reply is engine-labelled. Uses the map's selected parcel as context.
- **Refinement pass** (Phases 0–5, Sep 2026): browsing simplified (context-aware QuickNav,
  role-aware layer tiers), one design family ("poster" landing / "tool" app on shared emerald
  tokens via `.landing-scope`), landing bento grid + FaintTelemetry hero, docs/help made current
  (8 parcels · 3 states everywhere), performance (landing + OfficerConsole lazy routes: index
  chunk 343→164 kB gz, echarts out of first load; LayerPanel useShallow; queue rows memoized).
- **Cinematic Header & Limelight Dock** (Sep 2026): Frosted Light Parchment (`#F4F1E7/85`, `backdrop-blur-2xl`),
  3-tier volumetric limelight spotlight navigation (`#B38A4C` top glow + trapezoidal volumetric beam + text floor glow)
  mathematically dead-centered (`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`) strictly preserving
  core routes (`Home`, `Map`, `Citizen`, `Officer`, `Admin`). Smooth popdown fixed search attached under header dock (`⌘K` or `/`),
  15vh cinematic retraction wipe letterbox toggle, high-contrast Forest Green (`#23483A`) profile pill.
- **Citizen Owned Parcel Linkage** (Sep 2026): `useMyParcel` hook and `GET /landstack/citizen/my-parcels` mapping
  citizen accounts (e.g. Ravi Kumar) to their registered land (Sy 123/4, Khata K-0421, ULPIN `TFCM91641E6C82`,
  Mangalagiri AP). 1-click **"Go to My Parcel"** with animated camera fly-to and drawer auto-open across AccountPanel,
  CitizenHome quick-launch banner, and pinned green `📍 My Land (123/4)` story chip on `/map`.
- **Workflow Transparency & Governance Integrity** (Sep 2026):
  - Admin Console simulation upgraded from raw JSON dump to a 4-stage visual progress pipeline (`Deed Registered` $\to$ `Event Dispatched & Mismatch Caught` $\to$ `Alert Raised` $\to$ `Queue Application Created`) with direct 1-click buttons.
  - Alerts console enhanced with mechanism clarification banner, explicit microcopy on "Resolve" (dismisses notice), and direct `[Review in Queue (APP-XXXX) →]` buttons on all linked cards.
  - Work Queue enhanced with upfront `StatutoryImpactCard` previewing exact database table modifications (`dept_revenue.ror`, Khata transfer, PostGIS boundary commit, Planning building sanction) before approval, plus rich post-approval confirmation and live map link.
  - Parcel Overview drawer features actionable *"Title Mutation in Progress"* callout linking directly to the Queue, plus direct alert inspection buttons.
  - Interactive multi-tab `MechanismExplainerModal` ("How mechanisms work") accessible across Admin, Alerts, and Queue comparing Indian ground reality with Land Stack automated interoperability.
  - Backend correlation: enriched `GET /landstack/alerts` with `open_application_id` and `open_application_type` subqueries, and stored `application_id` in alert detail.
- **AI Engine Tuning, Responses & Compactness** (Sep 2026):
  - Hyperparameter optimization: tightly bounded token limits (Assistant $\le 650$, advice $\le 180$, DD summary $\le 200$, parcel brief $\le 350$) reducing latency and eliminating rambles.
  - High-density structured system prompts with strict zero-filler rules, generating clean `**[Assessment]**`, `**[Actionable Steps]**`, and `**[Key Verification]**` sections.
  - Interactive deep-link action buttons: Markdown links `[Label](/path)` rendered as instant navigation buttons in Bhu-Sahayak chat.
  - Compact view mode: high-density UI toggle in floating assistant with localStorage persistence, tighter line heights and margins.
  - Instant one-click copy response utility on every assistant reply.
  - Lean fact-sheet pruning: omitting empty/null keys from model inputs, slashing token consumption by ~60%.
- **Dynamic RoR Land Ownership & Statutory Authority** (Sep 2026):
  - Eradicated all static/mock citizen parcel dictionaries (`KNOWN_USER_PARCELS`).
  - Real-time `useMyParcel()` hook querying `GET /landstack/citizen/my-parcels` backed dynamically by `dept_revenue.ror`.
  - Statutory applicant authority guard in Citizen Apply (`ServiceRequest.tsx`), AI pre-check (`ai_assist.py`), and backend workflow (`workflow.py`): building permission applications require verified title ownership on the RoR, rendering prominent blocker notices and disabling submissions for non-owners.
  - Cross-app cache synchronization: mutation approvals immediately invalidate `['citizen', 'my-parcels']`, `['parcel']`, and `['applications']`.
- **Authentic Farmer-Connectable Multilingual Localization (Telugu & Hindi)** (Sep 2026):
  - Comprehensive, non-robotic i18n framework in `apps/web/src/lib/i18n.ts` supporting `en`, `te`, and `hi`.
  - Built using authentic rural revenue and administrative terminology:
    - AP / TG Telugu: పట్టాదారు పాస్ పుస్తకం, 1-B అడంగల్/పహణీ, రికార్డు మార్పిడి (మ్యుటేషన్), హద్దుల కొలత/ఎఫ్-లైన్ సర్వే, తహసీల్దార్, సబ్-రిజిస్ట్రార్, ఈసీ (ఎన్‌కంబరెన్స్).
    - Hindi: अधिकार अभिलेख (खतौनी), खसरा संख्या, दाखिल-खारिज (नामांतरण), फौती / वारिसाना नामांतरण, मेढ़ पैमाइश / मौका मुआयना, लगान बकाया, सर्किल रेट.
  - 1-click language selector `[ EN | తె | हि ]` integrated into the floating limelight dock and AccountPanel with reactive Zustand + localStorage state (`useUI.locale`).
  - 100% reactive coverage across Citizen Portal (overview, My Land cards, notice board, objection filing), Service Request wizard (5 service intents with breakdown steps and RoR owner mismatch guard), Track Applications, Verify Ownership, Interactive Map controls & layers, Parcel Drawer (all 8 tabs, 9-point buyer due diligence, and sub-sections), Status Chips, Officer Console & Work Queue, and Alerts.
  - Bhu-Sahayak AI Assistant: fully multilingual with localized greeting cards, categorical prompt chips, and Rule 6 prompt-tuning in `ai_assist.py` for respectful native vernacular advice.
Notable fixed first-run issues: asyncpg `substring(id from :n)` typing, MapLibre nested-zoom
expressions, Vite dep-optimizer maplibre worker, persisted-layers merge bug, web healthcheck.
Still open: Neon/Firebase/Cloud Run deployment not yet exercised; WeasyPrint deps on Cloud Run
unverified.

## Status log (append-only, newest first — one line per meaningful change)

- 2026-09-21 landing numbering sequence fixed: harmonized landing narrative chapters into strict sequential order 01 to 09 (01 Cadastral GIS, 02 Core Breakthrough, 03 Federated Systems, 04 Capabilities, 05 Unified Search, 06 Pilot Corridors, 07 Interoperability Engine, 08 Operational Architecture, 09 Final CTA), converted LandScenes to non-numeric interludes, eliminating duplicates and gaps.
- 2026-09-21 landing narrative full restoration: restored all cinematic scenes below hero (SystemScene 01 ParcelMap 3 GIS tiers, ProblemBreakthrough 6-office maze with live interactive parcel check, LandScene farmer livelihood, 6-dept matrix, hardware-accelerated 10-card horizontal scroll with zero-render useScroll binding, ULPIN search scene, 3-state pilot corridors, state adapter flowchart, operational architecture, family dispute scene, final CTA, and GovStrip).
- 2026-09-21 landing dock fixed stacking context: lifted floating dock outside hero section and isolate boundary with z-index 99999 so it remains above all downstream cards when scrolling.
- 2026-09-21 hero animation integrated GLSLHills: integrated 21st.dev GLSLHills component (apps/web/src/components/ui/glsl-hills.tsx) by Ali Imam into HeroSection.tsx with 3D procedural wireframe hill contours framing the hero over white canvas.
- 2026-09-21 hero animation switched to FluidStrings: activated interactive fluid black strings over white canvas (apps/web/src/features/landing/FluidStrings.tsx) in HeroSection.tsx with harmonic wave breathing layout and real-time cursor pluck physics.
- 2026-09-20 authentic farmer-connectable Telugu & Hindi localization: implemented reactive i18n system (apps/web/src/lib/i18n.ts) with authentic revenue terminology (1-B పహణీ, పట్టాదారు, మ్యుటేషన్, హద్దుల కొలత; खतौनी, खसरा, दाखिल-खारिज, मेढ़ पैमाइश, लगान) across Citizen, Map, Parcel Drawer, Officer Console, and Bhu-Sahayak AI with prompt tuning in ai_assist.py.
- 2026-09-20 demo users expansion: expanded demo identities to 17 users spanning AP, TN, and TG citizens (matching all seeded story parcels in dept_revenue.ror), regional departmental officers (Revenue, Registration, Planning), and system admin, with categorized switcher tabs in AccountPanel and UserMenu.
- 2026-09-20 dynamic land ownership & statutory building authority: removed static KNOWN_USER_PARCELS, wired useMyParcel to GET /citizen/my-parcels, enforced statutory Pattadar verification in building permissions (UI blocker, AI triage, 403 in workflow), and added comprehensive cross-app query invalidation on mutation approvals.
- 2026-09-20 AI tuning, responses & compactness: hyperparameter optimization (Assistant max_tokens 650, advice 180, DD summary 200), high-density structured prompt engineering, interactive deep-link action buttons in chat, compact view toggle, copy response utility, and lean fact-sheet pruning.
- 2026-09-20 workflow clarity & governance: visual lifecycle pipeline in Admin, linked queue applications in Alerts, upfront statutory record impact preview in Queue, citizen parcel linkage (Sy 123/4 fly-to), dead-center limelight dock, and MechanismExplainerModal.
- 2026-09-17 readable values everywhere: consistency callout, admin findings, timeline details, report PDF (utilities yes/no, flags humanized, None-safe rows).
- 2026-09-17 `ae1d829` Bhu-Sahayak chatbot: POST /landstack/ai/assistant (pure intent router + grounded templated replies, LLM rephrase only) + floating launcher in the shell (6 routing tests, 92 total).
- 2026-09-17 `b187cb3` public notices: GET /notices (15-day statutory window over pending transfers) + POST objections into payload.objections; notice board on the citizen home, objections in the officer drawer.
- 2026-09-17 `ab2ea2d` succession flow: nominees on the RoR (migration 012, masked, all 3 dialects) + `succession` type — wizard card, triage (dispute/pending-blocked), officer evidence, approval runs the mutation (86 tests).
- 2026-09-17 `4087548` buyer due-diligence: GET /parcels/{ulpin}/due-diligence (9-point deterministic checklist) + on-demand "Thinking of buying?" card in the parcel Overview (5 tests, 84 total).
- 2026-09-17 `3533da8` citizen tracking: approval side effects (payload.side_effect) shown as a one-line cross-department note in every timeline.
- 2026-09-17 `717e37f` officer decision view: auto-assembled per-source evidence panel + readable zoning-check line in the application drawer.
- 2026-09-17 `c850129` citizen Apply wizard: intent cards + AI pre-check endpoint; new types record_correction & land_complaint (migration 011, 6 triage tests).
- 2026-09-17 `30b59e5` web: nav cleanup — un-nested citizen apps panel, dropped redundant back buttons.
- 2026-09-16 `2621476` chore: dead-code cleanup (OverviewHint, ls_seen_welcome) + actions v5.
- 2026-09-16 `d4eb974` perf: lazy landing/officer routes (−52% first load), memoized hot lists.
- 2026-09-16 `9e11d4b` (team) FaintTelemetry hero + landing typography restyle (+`9c493f7` type fix).
- 2026-09-16 `218c92c` refinement Phases 1–4: nav simplification, design unification, landing bento, docs currency.
- 2026-09-15 `31fb0b6` NVIDIA models verified per key (nemotron-3-super + 11b vision, reasoning-safe budgets).
- 2026-09-15 `69c9d17` upgrade phases A–E: AI assist (NVIDIA + rule engine, auto-triggering), keyless imagery,
  accurate 3D (dims/basements/clickable units), ground-reality names, docs refreshed.
- 2026-09-14 `e19796a` bounded boundary editing (validate → propose → approve → RoR sync), migrations 008–009.
- 2026-09-14 `063d212` ParcelPicker, citizen home apps, officer quick actions, alert→field review.
- 2026-09-14 `bea8604` per-state revenue dialects (Meebhoomi/Patta Chitta/Dharani) + revenue_tg adapter.
- 2026-09-14 `7e25a54` national India overview (cluster markers + Regions panel).
- 2026-09-14 `8c5ee06` settlement/resurvey layer (migration 006) + resurvey badges.
- 2026-09-13 `5159df8` three states (AP·TN·TG, 575 parcels), AP ULPINs preserved.

## How to work in this repo

- **CONTRACTS first.** If you change a column, endpoint, CDM field, header, layer name or env var,
  edit `docs/CONTRACTS.md` in the same commit. Three components depend on it staying true.
- **Strict Navigation & Routing Rules**: Never alter or rename core application routes (`/`, `/map`,
  `/citizen`, `/officer`, `/admin`). Visual animations (limelight spotlights, docks) must sit ON TOP
  of existing authentic routes, never replace them with dummy or unrouted tabs. Header navigation tabs
  must maintain true dynamic mathematical center alignment (`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`).
- **Strict Governance Layer Separation (Alerts vs. Applications)**:
  - **Alerts** are automated detection/sensor flags (`landstack.alerts`). Resolving an alert merely dismisses
    the notification notice; it has NO statutory authority to modify property titles, extents, or land records.
  - **Applications** (`landstack.applications`) are legally binding quasi-judicial administrative workflows.
    Official title mutation and boundary alterations strictly require reviewing and approving applications
    in the Officer **Work Queue**. UI components must never imply that resolving an alert alters the RoR.
- **Statutory Side-Effect Transparency**: Application transition buttons must clearly preview the exact
  database and departmental impacts (RoR owner transfer, PostGIS polygon commit, Building Sanction) before
  an officer confirms approval. Post-approval confirmation must prominently surface the live record change.
- **Strict AI Tuning & Compactness Rules**:
  - **Bounded Token Ceilings**: Never set unbounded token limits (e.g. 3000 tokens for short summaries). Tightly bound generation budgets: Bhu-Sahayak Assistant $\le 650$ tokens; Due Diligence summary $\le 200$ tokens; Parcel Risk Brief $\le 350$ tokens; Officer Application Advice $\le 180$ tokens.
  - **Zero Conversational Fluff**: System prompts must explicitly forbid conversational preamble or pleasantry filler ("Hello", "Certainly", "Hope this helps"). Jump straight to the diagnostic assessment and actionable remedy.
  - **High Information Density**: Enforce structured sections (`**[Assessment]**`, `**[Actionable Steps]**`, `**[Key Verification]**`).
  - **Interactive In-Chat Deep Links**: System prompts and rule engine templates must output clickable Markdown links `[Label](/path)` for application forms (`/citizen/request?type=mutation`), maps, and tracking, allowing frontend components to render instant navigation action buttons.
  - **Lean Context Serialization**: Fact-sheets provided to models must omit empty, null, or zero keys to keep prompt overhead under 350 tokens and prevent context bloat.
  - **Deterministic Rule Fallback Parity**: Fallback responses (`engine: "rules"`) must maintain the exact same structured, clickable, compact standard as LLM-generated output.
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
  Demo profiles span all 3 pilot states (17 identities across AP, TN, TG):
  - AP Citizens: Ravi Kumar (Sy 123/4), Lakshmi Devi (Buyer/Assignee), Nageswara Rao Tenali (Sy 124), Leena Jayaraman (Sy 125/2), Jatin Baral (Sy 126), Sambasiva Rao Mekala (Sy 127/1), Venkata Rao Kandula (Sy 128).
  - AP Officers: Anitha (Revenue / Tahsildar), Suresh (Registration / Sub-Registrar), Farida (Planning / TPO).
  - TN Citizens & Officers: Robert Kuruvilla (Sy 45/2, Sriperumbudur), Muthu (Revenue / Tahsildar), Karthik (Registration / Sub-Registrar).
  - TG Citizens & Officers: Pardhasaradhi Naik (Sy 77, Shamshabad), Kavitha (Revenue / Tahsildar), Rajesh (Planning / TPO).
  - National: Admin (DoLR System Administrator).
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
