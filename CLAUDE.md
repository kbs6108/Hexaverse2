# CLAUDE.md — Land Stack (Hexaverse2, branch `experiment-branch`)

**The living context file for this repo** — read by Claude Code, Cursor, Antigravity, and any other agent/IDE
(`AGENTS.md` symlinks here). Read this first, then `docs/CONTRACTS.md` (the binding spec every
component is written against), then `docs/SETUP.md`.

**How to keep it updated** (humans and agents): after any meaningful change, edit ONLY the
"Current state" and "Status log" sections below — append a dated one-liner to the Status log and
adjust Current state if a capability was added/removed. Never rewrite the stable sections
(project description, repo map, how-to-work rules) unless they became untrue. Agents: update this
file in the same commit as the change it describes.

## What this project is

Smart India Hackathon 2026, problem statement **SIH26014** (Ministry of Rural Development / Dept.
of Land Resources): *"An Integrated GIS-based Digital Public Infrastructure for Land Governance"*.
Product name: **Land Stack (Hexaverse)**. One sentence: click a land parcel on a map and get everything
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
apps/api/             FastAPI 0.115+, Python 3.12, SQLAlchemy 2 async (text SQL, no ORM), asyncpg
  landstack/          gateway: config, db, auth (firebase|dev), cdm, routers/, adapters/ (+ *.yaml mappings), services/
  departments/        revenue · registration · planning · fiscal · legal · utilities — FastAPI sub-apps, own schemas
  ai/                 change_detection.py (Sentinel-2 NDVI/NDBI, offline mode), extract.py (vision OCR / extraction)
  tests/              111 unit & integration tests (full workflow, masking, due diligence, triage, dynamic pricing)
apps/web/             Vite 7 · React 19 · TS strict · MapLibre GL 6 via react-map-gl 8 · TanStack Router/Query · Zustand · Tailwind v4 · ECharts · Firebase Auth
db/migrations/        001 extensions through 017 land acquisition & projects (idempotent plain SQL)
tools/                migrate.py · seed.py (synthetic cadastre, --osm optional, --dry-run) · demo_reset.py · fetch_s2.py · set_claims.py
infra/                docker-compose.yml (db, migrate, api, web; profiles prod/tiles) · cloudrun/ deploy · firebase/
.github/workflows/    ci.yml (test + build) · deploy-api.yml (Cloud Run) · deploy-web.yml (Firebase Hosting)
Makefile              up · down · migrate · seed · demo-reset · dev-api · dev-web · test · lint · deploy-api · deploy-web
pytest.ini            asyncio_mode = auto, testpaths = apps/api/tests
```

## Current state (updated September 2026)

Running end-to-end on the local Docker stack and 100% green in tests (**111 passed / 111 total tests** in `apps/api`; clean frontend production compilation with 0 TypeScript errors across 3,184 modules). Since the initial release, the platform has gained:

- **Land Acquisition & Linear Infrastructure Corridors** (Migration 017):
  - Corridor Right-of-Way (ROW) spatial overlays for National Highways (NHAI), Metro Rail, and Railways.
  - Automated corridor severance calculation computing severed area and residual parcel percentages.
  - Citizen statutory compensation claims under RFCTLARR Act 2013 with §15 objection triage and Tahsildar §23A/§64 direct consent awards.
  - Workflow transitions supporting returned applications and quasi-judicial rejection speaking orders.
- **Forensic Document Cross-Verification Engine** (`services/document_verify.py` & `ai/extract.py`):
  - Ground-truth automated cross-verification of deed survey numbers, extent ($m^2$), and parties against PostGIS cadastre.
  - SHA-256 instrument fingerprinting, tamper risk level classification, active encumbrance audits, and sub-judice litigation checks.
  - Statutory preconditions (Sub-Registrar stamp check, VRO ground panchanama, 15-day notice publication) and quasi-judicial disclaimers.
- **4-Stage Statutory Revenue Desk Scrutiny** (`StageGatedDeskTracker` in `TrackApplication.tsx` & `ApplicationDetail.tsx`):
  - Strict sequential desk enforcement under ROR Act §5: VRO Desk (Panchanama & Ryot Notice) $\to$ Mandal Surveyor Desk (FMB Traverse & Demarcation) $\to$ Revenue Inspector Desk (30-Yr Link Document Scrutiny) $\to$ Tahsildar Desk (Speaking Order / Title Update).
  - Multi-status handling including returned-for-clarification flows with officer remarks and citizen resubmission.
- **Interactive Marketing & Cadastre Sandbox Widgets** (`apps/web/src/features/marketing/`):
  - `StatutoryHierarchySimulator.tsx`: Interactive simulator proving state revenue acts override municipal bylaws.
  - `ParcelDecoderWidget.tsx`: Dissects 14-character ULPIN encoding (state code, mandal, village, survey number).
  - `Cadastral3DStrataExplorer.tsx`: 3D ISO 19152 volumetric cadastre simulator with elevation bands and utility easements.
  - `DepartmentProvenanceExplorer.tsx`: Cross-department cryptographic SHA-256 verification matrix.
- **Comprehensive Utilities Integration** (Migration 016):
  - In-process service request routing for power, water, and gas with live reflection in parcel CDM profile and cache invalidation.
- **UI/UX Accessibility & Contrast Overhaul**:
  - Added `--color-primary-contrast` and `--color-primary-hover` to Tailwind `@theme inline` in `styles.css`.
  - Fixed dark text on dark green surfaces across `FloatingDock.tsx`, `LayerPanel.tsx`, and `RegionMarkers.tsx`.
- **Cinematic Landing & Story Narrative**:
  - Restored living topographic breathing elevation shader, 6-department interactive matrix, compact capability cards, and GovIdentity header/footer.
- **Three Pilot States** (AP, TN, TG):
  - 575 total parcels across Mangalagiri AP, Sriperumbudur TN, and Shamshabad TG with state-specific revenue dialects (Meebhoomi / Patta Chitta / Dharani).
- **DPDP Act 2023 Consent Architecture**:
  - Purpose-bound tokenization, cryptographic owner masking (`R*** K***`), and consent-governed inspection tokens.
- **Authentic Farmer-Connectable Localization**:
  - Reactive English, Telugu (తెలుగు), and Hindi (हिन्दी) support across all public, citizen, and officer interfaces with genuine revenue terminology.

## Status log (append-only, newest first — one line per meaningful change)

- 2026-09-27 institutional branding & codebase cleanup: eliminated all mock/demo labels across frontend badges, adapters, and translations in favor of authoritative state department sources; ran ruff and typecheck cleanup fixing undefined variables and unused artifacts with 111/111 passing tests.

- 2026-09-26 contrast & UI accessibility fix: added `--color-primary-contrast` and `--color-primary-hover` to `@theme inline` in `styles.css`, fixed black-on-green text in `FloatingDock.tsx`, `LayerPanel.tsx`, and `RegionMarkers.tsx`.
- 2026-09-26 interactive sandbox & cadastre explorer widgets: created `StatutoryHierarchySimulator.tsx`, `Cadastral3DStrataExplorer.tsx`, `ParcelDecoderWidget.tsx`, and `DepartmentProvenanceExplorer.tsx` in `apps/web/src/features/marketing/`.
- 2026-09-26 4-stage statutory revenue desk scrutiny: implemented `StageGatedDeskTracker` in `TrackApplication.tsx` and `ApplicationDetail.tsx` enforcing ROR Act §5 sequential progression (VRO -> Surveyor -> RI -> Tahsildar) with returned clarification handling.
- 2026-09-26 forensic document cross-verification & cadastral alignment: implemented `services/document_verify.py` and `ai/extract.py` cross-verifying extracted deed survey/extent/parties against PostGIS cadastre with SHA-256 fingerprinting, encumbrance audit, and statutory preconditions.
- 2026-09-25 land acquisition & linear infrastructure corridors: added migration 017 (`017_land_acquisition_and_projects.sql`), NHAI/Metro ROW buffers, corridor severance calculations, and RFCTLARR 2013 statutory compensation claims.
- 2026-09-25 comprehensive utilities integration: added migration 016 (`016_comprehensive_utilities.sql`), utility request lifecycle, and CDM aggregation for electricity, water, and gas services.
- 2026-09-22 hero mountain gradient & colors: upgraded GLSLHills (glsl-hills.tsx) with a dual-mesh multi-chromatic elevation gradient (Forest Green #183B2B -> Radiant Emerald -> Alpine Teal -> Golden Amber #D1A654) on wireframe contour lines and an ethereal translucent topographic relief surface over the mountain body with atmospheric radial glows.
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
- 2026-09-15 `69c9d17` upgrade phases A–E: AI assist (NVIDIA + rule engine, auto-triggering), keyless imagery, accurate 3D (dims/basements/clickable units), ground-reality names, docs refreshed.
- 2026-09-14 `e19796a` bounded boundary editing (validate -> propose -> approve -> RoR sync), migrations 008–009.
- 2026-09-14 `063d212` ParcelPicker, citizen home apps, officer quick actions, alert->field review.
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
- **Backend Architecture Rules**:
  - Backend SQL is plain `text()` with `:named` params through `landstack/db.py` (`fetch/fetchrow/fetchval/execute/transaction`). No ORM models.
  - Migrations are idempotent plain SQL in `db/migrations/`; always add `018_*.sql`, never edit applied migrations.
  - Departments must only touch their own `dept_<name>` schema and communicate with the gateway over HTTP (in-process via `DEPT_BASE_URL=""`). That separation *is* the interoperability story.
  - The aggregator (`services/aggregator.py`) fans out to adapters with a per-source timeout and returns partial results with `provenance`; masking (`services/masking.py`) is applied after the role-independent cache. Keep that order.
- **Frontend Architecture Rules**:
  - Web: TanStack Query for all server state, Zustand only for UI state; every profile section renders a `ProvenanceBadge`; status is never colour-only (every status chip has an icon and hatch pattern).
  - Design tokens live in `apps/web/src/styles.css` (primary `#0A3A2A`, primary-contrast `#FFFFFF`, amber `#B45309`, brick `#B91C1C`, violet `#3730A3`).
  - Always ensure buttons styled with `bg-primary` apply `text-white` or tokens defined in `@theme inline` to prevent dark-on-dark contrast regressions.
- **Dev Auth & Personas**:
  - Header: `X-Dev-User: <role>[:<department>][:<name>]` (e.g. `officer:revenue:tahsildar:Anitha`, `citizen::Ravi Kumar`, `admin::Admin`).
  - Dev uids are `dev-<slug>`; the database seed uses the same.
  - Demo profiles span all 3 pilot states (17 identities across AP, TN, TG):
    - AP Citizens: Ravi Kumar (Sy 123/4), Lakshmi Devi (Buyer/Assignee), Nageswara Rao Tenali (Sy 124), Leena Jayaraman (Sy 125/2), Jatin Baral (Sy 126), Sambasiva Rao Mekala (Sy 127/1), Venkata Rao Kandula (Sy 128).
    - AP Officers: Anitha (Revenue / Tahsildar), Ramesh (Revenue / VRO), Swathi (Revenue / Surveyor), Prasad (Revenue / RI), Suresh (Registration / Sub-Registrar), Farida (Planning / TPO).
    - TN Citizens & Officers: Robert Kuruvilla (Sy 45/2, Sriperumbudur), Muthu (Revenue / Tahsildar), Karthik (Registration / Sub-Registrar).
    - TG Citizens & Officers: Pardhasaradhi Naik (Sy 77, Shamshabad), Kavitha (Revenue / Tahsildar), Rajesh (Planning / TPO), Srinivas (Utilities / Engineer).
    - National: Admin (DoLR System Administrator).
- **Testing & Verification**:
  - Run full test suite: `apps/api/.venv/bin/pytest` (all 111 tests). Note: `test_full_e2e_workflows.py` verifies live workflow transitions against `http://localhost:8000`, so ensure the Docker API container (`landstack-api-1`) is up and healthy.
  - Frontend typecheck and build: `npm run typecheck && npm run build` in `apps/web`.
- **Git Branching Strategy**:
  - Active development branch is `experiment-branch`.
  - When releasing or preparing submission milestones, fast-forward merge `experiment-branch` into `main` (`git checkout main && git merge experiment-branch && git push origin main`).
  - Never commit secrets, `.env`, `data/s2/*.tif`, or `serviceAccount*.json`.

## Sources the plan relies on (for the pitch and the STD)

PS text mirrors: sih2026.vuce.in/ps/SIH26014 · Land Stack pilot: PIB PRID 2210204 (31 Dec 2025) ·
ULPIN/NGDRS/GoRT: dolr.gov.in · Bhu-Naksha: nic.gov.in/project/bhunaksha · Planetary Computer STAC ·
OGC API Features 17-069r4 · GeoJSON RFC 7946 · ISO 19152 LADM · MeitY MDDS · DEPA (India Stack).
Full list with URLs at the end of docs/plan/landstack-plan.html.
