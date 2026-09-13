# Land Stack API

FastAPI gateway plus six mock "department" services in one process. The gateway aggregates
department data per parcel into a Common Data Model (CDM) and owns auth, workflow, audit,
reports and the AI endpoints. See `docs/CONTRACTS.md` for the full contract.

## Layout

```
landstack/          gateway: config, db, auth, cdm, routers/, adapters/, services/
departments/        revenue · registration · planning · fiscal · legal · utilities (sub-apps)
ai/                 change_detection.py (Sentinel-2 NDVI/NDBI), extract.py (Gemini OCR)
tests/              pytest — unit tests need no DB; integration tests run when DATABASE_URL is set
```

## Run locally

Easiest: `make up` from the repo root (Docker: PostGIS + migrate + seed + API + web).

Without Docker, against any PostGIS (local or Neon):

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r ../../tools/requirements.txt
cp .env.example .env                      # set DATABASE_URL
python ../../tools/migrate.py && python ../../tools/seed.py
uvicorn landstack.main:app --reload --port 8000
```

Docs: http://localhost:8000/docs (gateway) and `/revenue/docs`, `/registration/docs`,
`/planning/docs`, `/fiscal/docs`, `/legal/docs`, `/utilities/docs` (one per department).

## Auth in development

With `AUTH_MODE=dev` there is no sign-in; send a header instead:

```
X-Dev-User: <role>[:<department>][:<display name>]
```

```bash
# citizen — masked owner names, own applications only
curl -H 'X-Dev-User: citizen::Ravi Kumar' localhost:8000/landstack/parcels/<ULPIN>
# revenue officer — full detail, revenue queue
curl -H 'X-Dev-User: officer:revenue:Anitha' localhost:8000/landstack/queue?department=revenue
# admin — everything, incl. connectors and simulate deed
curl -H 'X-Dev-User: admin::Admin' localhost:8000/landstack/connectors
```

Dev uids are `dev-<slug of name>` (e.g. `dev-ravi-kumar`, `dev-anitha`), which is what the
seed uses for the demo users. With `AUTH_MODE=firebase` send a Firebase ID token as
`Authorization: Bearer …`; roles come from custom claims set with `tools/set_claims.py`.

## Useful endpoints

| Purpose | Call |
|---|---|
| Aggregated parcel | `GET /landstack/parcels/{ulpin}` |
| Vector tiles for the map | `GET /landstack/tiles/{layer}/{z}/{x}/{y}.pbf` (parcels, zones, restriction_zones, roads, water_lines, projects, units) |
| OGC-style features | `GET /landstack/collections/parcels/items?bbox=…` |
| Search | `GET /landstack/search?q=123/4` |
| Citizen services | `POST /landstack/verify-ownership`, `POST /landstack/applications`, `POST /landstack/reports/{ulpin}` |
| Officer | `GET /landstack/queue`, `POST /landstack/applications/{id}/transition`, `GET /landstack/stats` |
| Admin | `GET /landstack/consistency`, `GET /landstack/adapters`, `POST /landstack/admin/simulate/deed` |
| AI | `POST /landstack/ai/change-detection`, `POST /landstack/ai/extract-document` |
| Interop | departments POST `…/registration/deeds` → event → `POST /landstack/events` |

Department endpoints accept `?delay_ms=800` and `?fail=1` in dev mode so you can rehearse
the "one source is down" state — the parcel profile degrades per block instead of failing.

## Tests and lint

```bash
pytest -q                 # 73 unit tests, no DB required
DATABASE_URL=… pytest -q  # also runs integration tests against a seeded PostGIS
ruff check . && ruff format --check .
```

## Configuration

All settings are environment variables documented in `.env.example` and `docs/CONTRACTS.md` §2.
The Docker image is built from the repository root (`docker build -f apps/api/Dockerfile .`)
because it bundles `tools/` and `db/` for migrations inside Cloud Run jobs.
