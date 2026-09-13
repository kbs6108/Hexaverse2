# Hexaverse 2 — Land Stack

### Smart India Hackathon (SIH 2026) · Problem Statement SIH26014
**Ministry of Rural Development / Department of Land Resources (DoLR)**  
*An Integrated GIS-based Digital Public Infrastructure for Land Governance*

[![CI](https://github.com/kbs6108/Hexaverse2/actions/workflows/ci.yml/badge.svg)](https://github.com/kbs6108/Hexaverse2/actions/workflows/ci.yml)
![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![PostGIS](https://img.shields.io/badge/PostGIS-3.4-336791?logo=postgresql&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre-GL-blue?logo=maplibre&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

---

## 📌 Executive Summary

**Land Stack** gives every land parcel one ULPIN-style (Unique Land Parcel Identification Number) identity and unifies the siloed records maintained by six distinct government departments:
1. **Revenue** (Record of Rights / RoR, ownership, pattas)
2. **Registration** (Deeds, encumbrances, transaction history)
3. **Planning** (Zoning, land use classification, building permissions)
4. **Fiscal** (Property tax assessments, guideline values, dues)
5. **Legal** (Court disputes, lis pendens, caveats)
6. **Utilities** (Water, electricity, road access, municipal connections)

All records are integrated in real time into a unified **Common Data Model (CDM)** with per-source provenance, audit logging, and automated cross-department consistency checks.

---

## 🏛️ System Architecture

```mermaid
flowchart LR
  subgraph Client["Browser · apps/web (Vite + React 19 + MapLibre)"]
    UI[Map Explorer · Citizen Portal · Officer Console · Admin Console]
  end
  subgraph GCP["Cloud Infrastructure (Free Tier)"]
    FH[Firebase Hosting<br/>Static Dist / CDN]
    FA[Firebase Auth<br/>Custom Claims / Roles]
    subgraph CR["Cloud Run · landstack-api (FastAPI)"]
      GW[Gateway<br/>/landstack/* · OGC Items · MVT Tiles<br/>CDM Aggregator · Workflow · Masking · Reports]
      REV[/Revenue/]:::dept
      REG[/Registration/]:::dept
      PLN[/Planning/]:::dept
      FIS[/Fiscal/]:::dept
      LEG[/Legal/]:::dept
      UTL[/Utilities/]:::dept
    end
    SM[Secret Manager]
    GCS[(GCS Bucket<br/>Signed PDF Reports)]
  end
  NEON[(Neon PostgreSQL 16 + PostGIS<br/>landstack · dept_* · gis schemas)]
  ESRI[Esri World Imagery]
  S2[Sentinel-2 COGs<br/>Planetary Computer]
  GEM[Gemini API<br/>Document Extraction]

  UI -- HTTPS --> FH
  UI -- ID token --> FA
  UI -- "Bearer Token · JSON / .pbf" --> GW
  UI -. Tiles .-> ESRI
  GW -- In-process ASGI --> REV & REG & PLN & FIS & LEG & UTL
  REG -- "POST /landstack/events" --> GW
  GW -- asyncpg (SSL) --> NEON
  REV & REG & PLN & FIS & LEG & UTL -- Isolated Schema --> NEON
  GW --> GCS
  GW --> S2
  GW -.-> GEM
  SM -. env .-> CR
  classDef dept fill:#e8f5e9,stroke:#2e7d32,stroke-width:1.5px,color:#1b5e20;
```

---

## 🌟 Key Features & Capabilities

- **🗺️ Three-Tier GIS Map Explorer**:
  - Interactive MapLibre GL viewer with PostGIS dynamic vector tiles (MVT) and optional Esri satellite imagery.
  - 3D unit extrusion support for multi-story cadastres (`ulpin_3d = <ULPIN>-F01-U01`).
- **👥 Citizen Services Portal**:
  - Unified parcel search by ULPIN, survey number, or location.
  - Ownership verification, encumbrance certificate preview, service request submission, and application tracking.
- **👮 Role-Based Officer Console**:
  - Department-specific queues and review workflows (mutation, building permission, grievance redressal).
  - Cross-department conflict and dispute detection alerts.
- **⚙️ Admin & Integration Hub**:
  - State adapter mapping engine to conform diverse state land schemas into the national CDM.
  - Automated consistency validation and audit logging.
- **🛰️ AI & Satellite Change Detection**:
  - Sentinel-2 multi-spectral NDVI/NDBI analysis to flag unrecorded construction and green-cover changes over time.

---

## 🌿 Repository Branch Structure

The project follows a multi-branch workflow:

| Branch | Description |
|---|---|
| **`main`** | Project overview, architecture specification, and release documentation. |
| **`Balaji`** | **Active full-stack codebase** containing the complete monorepo (FastAPI gateway, 6 department microservices, React web app, PostGIS migrations, tools, and Docker environments). |
| **`sampath`** | Upstream feature integration and workflow configurations. |

> 💡 **To view and run the full monorepo code**, switch to the [`Balaji`](https://github.com/kbs6108/Hexaverse2/tree/Balaji) branch:
> ```bash
> git checkout Balaji
> ```

---

## 🚀 Quick Start (Local Development)

To run the complete platform locally:

```bash
# 1. Switch to the development branch containing the code
git checkout Balaji

# 2. Configure environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Spin up services using Docker Compose
make up
```

Once started:
- **Web App**: [http://localhost:5173](http://localhost:5173) *(Includes demo role switcher in header)*
- **API Gateway & Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📂 Monorepo Structure

```
Hexaverse2/
├── apps/
│   ├── api/          # FastAPI gateway + 6 department microservices (Python 3.12)
│   └── web/          # React 19 + TypeScript + MapLibre GL frontend
├── db/
│   └── migrations/   # Idempotent PostGIS SQL migrations
├── docs/             # Technical specifications (CONTRACTS.md, SETUP.md, STD.md)
├── infra/            # Docker compose, Cloud Run deployment, Firebase hosting config
└── tools/            # Migration, seed data generation, Sentinel-2 fetch utilities
```

---

## 📍 Demo Area
- **Test Cadastre**: Peri-urban Mangalagiri, Guntur district, Andhra Pradesh (Synthetic cadastre with real bounding box coordinates).
