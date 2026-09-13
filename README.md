# Land Stack — parcel-centric GIS for land governance

[![CI](https://github.com/OWNER/Hexaverse2/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/Hexaverse2/actions/workflows/ci.yml)
![Python 3.12](https://img.shields.io/badge/python-3.12-3776AB) ![React 19](https://img.shields.io/badge/react-19-149ECA) ![PostGIS](https://img.shields.io/badge/PostGIS-3.4-336791)

Land Stack (SIH 2026 prototype) gives every land parcel one ULPIN-style identity and stitches the
records that six departments keep about it — revenue (RoR), registration (deeds, encumbrances),
planning (zones, building permissions), fiscal (tax, guideline value), legal (disputes) and
utilities — into a single **Common Data Model** with per-source provenance and consistency checks.
On top sit a three-tier **Map Explorer** (MapLibre, PostGIS vector tiles, optional Esri imagery,
3D unit extrusion), a **Citizen Portal** (search, verify ownership, track, request), an **Officer
Console** (KPIs, queues, mutation / building-permission workflows) and an **Admin & Integration
Console** (connectors, adapter mappings, consistency findings, simulated upstream events), plus
Sentinel-2 change detection that flags unrecorded construction. Everything runs on free tiers:
Firebase Hosting + Auth, Cloud Run, Neon PostGIS.

## Architecture

```mermaid
flowchart LR
  subgraph Client["Browser · apps/web (Vite + React 19 + MapLibre)"]
    UI[Map Explorer · Citizen · Officer · Admin]
  end
  subgraph GCP["Google Cloud project (free tier)"]
    FH[Firebase Hosting<br/>static dist/]
    FA[Firebase Auth<br/>Google · Email/Password<br/>custom claims role/department]
    subgraph CR["Cloud Run · landstack-api (FastAPI, 512Mi, 0–3 inst.)"]
      GW[Gateway<br/>/landstack/* · OGC items · MVT tiles<br/>CDM aggregator · workflow · masking · reports]
      REV[/revenue/]:::d
      REG[/registration/]:::d
      PLN[/planning/]:::d
      FIS[/fiscal/]:::d
      LEG[/legal/]:::d
      UTL[/utilities/]:::d
    end
    SM[Secret Manager]
    GCS[(GCS bucket<br/>signed PDF reports)]
  end
  NEON[(Neon PostgreSQL 16 + PostGIS<br/>landstack · dept_* · gis schemas)]
  ESRI[Esri World Imagery]
  S2[Sentinel-2 COGs<br/>offline / Planetary Computer]
  GEM[Gemini API<br/>optional doc extraction]

  UI -- HTTPS --> FH
  UI -- ID token --> FA
  UI -- "Bearer <token> · JSON / .pbf" --> GW
  UI -. tiles .-> ESRI
  GW -- in-process ASGI (httpx) --> REV & REG & PLN & FIS & LEG & UTL
  REG -- "POST /landstack/events (X-Events-Secret)" --> GW
  GW -- asyncpg (ssl) --> NEON
  REV & REG & PLN & FIS & LEG & UTL -- own schema only --> NEON
  GW --> GCS
  GW --> S2
  GW -.-> GEM
  SM -. env .-> CR
  classDef d fill:#dff0e9,stroke:#0e6b54,color:#1d2320;
```

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env && cp apps/web/.env.example apps/web/.env
make up          # PostGIS → migrations + deterministic seed → API :8000 → web :5173
open http://localhost:5173   # dev mode: switch between the six demo users in the header
```

`make help` lists every target (`test`, `lint`, `demo-reset`, `deploy-api`, `deploy-web`, `neon-migrate`, …).

## Documentation

| Doc | Contents |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Step-by-step: local run, Neon, Firebase, Cloud Run, keys, demo-day checklist, troubleshooting |
| [docs/CONTRACTS.md](docs/CONTRACTS.md) | Source of truth: layout, env vars, roles, schema, CDM, API, workflow, layers |
| [docs/STD.md](docs/STD.md) | Standard Technical Document (architecture, schemas, API/GIS/security standards, UI, deployment) |
| [backend/README.md](backend/README.md) | Gateway + department sub-apps |
| [apps/web/README.md](apps/web/README.md) | Web app |
| [infra/README.md](infra/README.md) | docker-compose, Cloud Run, Firebase Hosting |
| [data/README.md](data/README.md) | What is real vs synthetic in the demo AOI |

## Repository map

```
backend      FastAPI gateway + six department sub-apps (Python 3.12)     apps/web   Vite + React + MapLibre
backend/db    plain SQL, idempotent, applied in order                     backend/tools  migrate · seed · demo_reset · set_claims · fetch_s2
infra/        docker-compose · cloudrun/ · firebase/                      docs/      CONTRACTS · SETUP · STD
```

Demo area: peri-urban Mangalagiri, Guntur district, AP (real bbox, synthetic cadastre — see `data/README.md`).
