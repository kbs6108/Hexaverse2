# Land Stack — Setup Guide

Written for someone who has never used Docker, Neon, Firebase or Cloud Run. Follow (a)→(b) to run
it on your laptop in five minutes; (c)→(f) put it on the internet for free; (g)–(i) are optional
extras, demo-day prep and fixes for the errors people actually hit.

---

## (a) Prerequisites

| Tool | Version | Install | Check |
|---|---|---|---|
| Git | any | https://git-scm.com | `git --version` |
| Docker Desktop (or Docker Engine + Compose v2.24+) | 4.30+ | https://docs.docker.com/get-docker | `docker compose version` |
| Python | 3.12 | https://python.org (Windows: tick *Add to PATH*) | `python3 --version` |
| Node.js | 22 LTS | https://nodejs.org | `node --version` |
| GNU make | any | macOS: `xcode-select --install` · Ubuntu: `sudo apt install make` · Windows: use WSL2 or run the commands inside the Makefile by hand | `make --version` |
| gcloud CLI *(cloud steps only)* | latest | https://cloud.google.com/sdk/docs/install | `gcloud --version` |
| Firebase CLI *(cloud steps only)* | latest | `npm i -g firebase-tools` (or `npx firebase-tools`) | `firebase --version` |

Accounts you will create later: **Neon** (free), **Firebase / Google Cloud** (Blaze plan with a
card, but everything here stays within the always-free quotas), optional **ArcGIS Location Platform**
and **Google AI Studio**.

```bash
git clone <repo-url> Hexaverse2 && cd Hexaverse2
git checkout sampath
```

---

## (b) Run locally with Docker (5 minutes)

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
make up
```

What happens: `db` (PostGIS 16) starts → the one-shot `migrate` container applies `db/migrations/*.sql`
and, because the database is empty, runs `tools/seed.py` (≈ 40 s; 500–800 synthetic parcels around
Mangalagiri) → `api` (FastAPI with hot reload) on **http://localhost:8000** → `web` (Vite dev server)
on **http://localhost:5173**. The first `npm ci` inside the web container takes a minute; `make logs`
shows progress. Re-running `make up` never re-seeds; use `make seed` to wipe and reload.

Useful URLs: API docs http://localhost:8000/docs · health http://localhost:8000/healthz ·
department docs http://localhost:8000/revenue/docs (also `/registration`, `/planning`, `/fiscal`,
`/legal`, `/utilities`).

### The six dev users and the role switcher

`AUTH_MODE=dev` (the default in `.env.example`) means no Firebase is needed. The web app shows a
**role switcher** in the header; picking a user makes every request carry the header
`X-Dev-User: <role>[:<department>][:<name>]`, which the API trusts in dev mode only.

| Persona | Header value | Sees |
|---|---|---|
| Ravi Kumar (citizen, owner of 123/4) | `citizen::Ravi Kumar` | Citizen Portal, masked owner names except on consented parcels |
| Lakshmi Devi (citizen) | `citizen::Lakshmi Devi` | Citizen Portal |
| Anitha (revenue officer) | `officer:revenue:Anitha` | Officer Console, mutation queue, RoR timeline |
| Suresh (registration officer) | `officer:registration:Suresh` | Officer Console, deeds / encumbrances |
| Farida (planning officer) | `officer:planning:Farida` | Officer Console, building-permission queue |
| Admin | `admin::Admin` | Everything + Admin & Integration Console |

Try it with curl: `curl -H 'X-Dev-User: officer:revenue:Anitha' localhost:8000/landstack/queue`.

### The entry flow

`/` is the cinematic landing; "Open the live map" goes to `/map`, which opens on a **national
overview of India**. Click a state cluster card (or use the Regions panel, top-right) to fly into
Mangalagiri (AP), Sriperumbudur (TN) or Shamshabad (TG) — parcels render once you're inside a
cluster. `/welcome` is the written overview, `/help` the guide.

Story parcels to click on the map (survey numbers): AP — **123/4** clean · **124** change alert ·
**125/2** disputed · **126** mortgaged · **127/1** tax arrears + area mismatch · **128** pending
mutation; TN — **45/2** disputed (Patta Chitta dialect); TG — **77** change alert (Dharani dialect).

Stop with `make down` (add `V=1` to delete the database volume). Without Docker for the app
processes: keep `db` running (`docker compose -f infra/docker-compose.yml up -d db migrate`) and use
`make dev-api` / `make dev-web`.

---

## (c) Neon — the hosted PostGIS database

1. Sign up at https://neon.tech → **New project**. Name `landstack`, Postgres **16**, region
   **AWS ap-southeast-1 (Singapore)** — nearest to Cloud Run `asia-south1`.
2. On the project dashboard click **Connect**, choose *Connection string*, and copy it. It looks like
   `postgresql://neondb_owner:npg_xxx@ep-quiet-sun-a1b2c3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.
3. PostGIS: nothing to click. `db/migrations/001_extensions.sql` runs `CREATE EXTENSION IF NOT EXISTS postgis`
   (and `pg_trgm`); Neon bundles PostGIS 3.4, and `tools/migrate.py` executes it for you.
4. Migrate and seed from your laptop:
   ```bash
   pip install -r tools/requirements.txt
   make neon-migrate NEON_DATABASE_URL='postgresql://neondb_owner:...@ep-....neon.tech/neondb?sslmode=require'
   ```
   You should see `applied 001_extensions.sql … done` followed by the seed counts. Later resets:
   `make neon-reset NEON_DATABASE_URL=...` (mutable tables only, < 30 s).
5. Keep two spellings of the same URL handy:
   - CLI tools accept the Neon string as-is.
   - The API (asyncpg) wants `postgresql+asyncpg://…/neondb?ssl=require` — that is what goes into
     `infra/cloudrun/secrets.env` and, if you run the API locally against Neon, into `apps/api/.env`.

Neon auto-suspends after 5 idle minutes; the first query afterwards takes ~1 s.

---

## (d) Firebase — hosting, auth and roles

1. https://console.firebase.google.com → **Add project** (or reuse the existing Blaze project). Note
   the **Project ID** (e.g. `landstack-demo-4f2a`).
2. **Project settings → General → Your apps → Web (</>)**. Register app `landstack-web`, tick
   *Also set up Firebase Hosting*. Copy the config values into `apps/web/.env`:
   ```
   VITE_AUTH_MODE=firebase
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=<project-id>
   VITE_FIREBASE_APP_ID=1:1234:web:abcd
   VITE_API_URL=https://landstack-api-xxxx-el.a.run.app   # after step (e); localhost:8000 until then
   ```
3. **Build → Authentication → Get started → Sign-in method**: enable **Google** (pick a support
   email) and **Email/Password**. Under **Settings → Authorized domains** make sure
   `localhost`, `<project-id>.web.app` and `<project-id>.firebaseapp.com` are listed.
4. Create the six test users: either sign in once through the app, or **Users → Add user** with
   emails like `ravi@…`, `lakshmi@…`, `anitha@…`, `suresh@…`, `farida@…`, `admin@…`.
5. Server credentials for firebase-admin:
   - **On Cloud Run** nothing is needed — the default service account is used (`AUTH_MODE=firebase`,
     `FIREBASE_PROJECT_ID` set by `deploy.sh`).
   - **Locally** (running the API in firebase mode or using `tools/set_claims.py`): **Project settings →
     Service accounts → Generate new private key**, save it *outside* the repo (or as
     `serviceAccount.json`, which is gitignored) and export
     `GOOGLE_APPLICATION_CREDENTIALS=/path/serviceAccount.json`. Alternative without a key file:
     `gcloud auth application-default login` and `export FIREBASE_PROJECT_ID=<project-id>`.
6. Assign roles (custom claims `role`, `department`; users without claims are citizens):
   ```bash
   pip install firebase-admin
   python tools/set_claims.py --email anitha@example.com --role officer --department revenue
   python tools/set_claims.py --email suresh@example.com --role officer --department registration
   python tools/set_claims.py --email farida@example.com --role officer --department planning
   python tools/set_claims.py --email admin@example.com  --role admin
   python tools/set_claims.py --list          # or: --demo (matches ravi/lakshmi/anitha/suresh/farida/admin@…)
   ```
   Users must sign out and back in (or wait ≤ 1 h) for a new role to reach the API.
7. Firebase CLI: `make firebase-login`, then `cp .firebaserc.example .firebaserc` and replace
   `YOUR_FIREBASE_PROJECT_ID`.

---

## (e) Cloud Run — deploy the API (`make deploy-api`)

1. `gcloud auth login` · `gcloud config set project <project-id>` (same project as Firebase; billing
   must be linked — the Blaze plan already did that).
2. Secrets file (gitignored):
   ```bash
   cp infra/cloudrun/secrets.env.example infra/cloudrun/secrets.env
   # DATABASE_URL=postgresql+asyncpg://...neon.tech/neondb?ssl=require
   # EVENTS_SHARED_SECRET=$(openssl rand -hex 32)   REPORT_HMAC_SECRET=$(openssl rand -hex 32)   GEMINI_API_KEY= (optional)
   ```
3. `make deploy-api PROJECT_ID=<project-id>` — enables APIs, creates the Artifact Registry repo and
   the reports bucket, builds the image with Cloud Build (5–8 min the first time), pushes the secrets
   to Secret Manager and deploys `landstack-api` in `asia-south1` (512 MiB, 0–3 instances,
   concurrency 80, unauthenticated). The script ends with the service URL.
4. `curl https://landstack-api-…run.app/healthz` → `{"status":"ok",…}`.
5. CORS and `PUBLIC_WEB_URL` default to `https://<project-id>.web.app` and `.firebaseapp.com`. Custom
   domain? `CORS_ORIGINS=https://land.example.org,https://<project-id>.web.app PUBLIC_WEB_URL=https://land.example.org SKIP_BUILD=1 make deploy-api`.

Details, cost table and the Knative manifest alternative: `infra/cloudrun/README.md`.

---

## (f) Firebase Hosting — deploy the web app (`make deploy-web`)

1. Put the Cloud Run URL in `apps/web/.env` as `VITE_API_URL` and set `VITE_AUTH_MODE=firebase`.
2. `make deploy-web` — `firebase.json`'s predeploy hook runs `npm ci` and `npm run build`, then
   uploads `apps/web/dist` with SPA rewrites and immutable cache headers for `/assets`.
3. Open `https://<project-id>.web.app`, sign in with Google, and check the Network tab for 200s from
   the API. A CORS error here means step (e)5.

GitHub Actions alternatives (opt-in): `.github/workflows/deploy-web.yml` (secret
`FIREBASE_SERVICE_ACCOUNT`, variables `FIREBASE_PROJECT_ID`, `VITE_*`) and
`.github/workflows/deploy-api.yml` (secret `GCP_SA_KEY`, variable `GCP_PROJECT_ID`). Both files
list the exact permissions in their header comments.

---

## (g) API keys — what to get and what you get for free

Everything runs WITHOUT any key (rule-engine AI, public imagery tiles, offline Sentinel-2).
Keys upgrade specific capabilities:

| Key | Where to get it | Where it goes | What it unlocks |
|---|---|---|---|
| **NVIDIA Build** (recommended) | https://build.nvidia.com → sign in → any model page → *Get API Key* (free credits) | `apps/api/.env` → `NVIDIA_API_KEY` | LLM-written parcel risk briefs & officer advice (default `nvidia/nemotron-3-super-120b-a12b`) and scanned-document extraction (`meta/llama-3.2-11b-vision-instruct`). Without it the same features run on the deterministic rule engine, clearly labelled. Override models with `NVIDIA_MODEL` / `NVIDIA_VISION_MODEL`. |
| Esri ArcGIS Location Platform (optional) | https://location.arcgis.com → *API keys* → tick **Basemaps** | `apps/web/.env` → `VITE_ESRI_API_KEY` | The metered imagery basemap service (2M tiles/mo free). **Not required**: without it the Imagery toggle uses Esri's public World Imagery tile endpoint. |
| Gemini (legacy, optional) | https://aistudio.google.com | `apps/api/.env` → `GEMINI_API_KEY` | Fallback document extraction when no NVIDIA key is set. |

**Free, key-less real data** already wired in:
- **Basemap** — OpenFreeMap vector tiles (OSM data, no key, no limits).
- **Satellite imagery basemap** — Esri public World Imagery tiles (attribution shown on the map).
- **Real roads** — `python tools/seed.py --osm` pulls OpenStreetMap ways via Overpass for each region.
- **Sentinel-2** — `python tools/fetch_s2.py --compute` downloads real imagery from Microsoft
  Planetary Computer (no account needed) and recomputes `gis.s2_change`; the demo ships with
  plausible offline index values (`S2_OFFLINE=1`).

---

## (h) Demo-day checklist

- [ ] **T-30 min** `make neon-reset NEON_DATABASE_URL=...` (or Admin Console → *Reset demo*) so the
      queue, alerts and audit log are in the scripted state. Locally: `make demo-reset`.
- [ ] **Warm Cloud Run**: `gcloud run services update landstack-api --region asia-south1 --min-instances 1`
      (revert to 0 afterwards; 1 warm instance ≈ ₹1–2/hour) *or* open the app 5 min before and hit
      `/healthz` + the map once. This also wakes Neon.
- [ ] Open the app in two browser profiles: citizen (Ravi) and officer (Anitha); admin in a third.
- [ ] Verify a `/verify/<report-id>` link works on a phone (QR on the PDF).
- [ ] **Offline fallbacks** ready: `make up` on the laptop with `AUTH_MODE=dev` mirrors the cloud demo
      exactly (same seed); the dev role switcher replaces Google sign-in; the vector basemap needs no
      key; Sentinel-2 uses offline values; extraction can be skipped if there is no Gemini key.
- [ ] Phone hotspot tested; `apps/web/.env` for the offline copy points at `http://localhost:8000`.
- [ ] Story parcels bookmarked: 123/4, 124, 125/2, 126, 127/1, 128 (`data/samples/story_parcels.json` has ULPINs).

---

## (i) Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Browser console: *blocked by CORS policy* | API `CORS_ORIGINS` lacks the web origin (scheme + host + port, no trailing slash) | Local: `CORS_ORIGINS=http://localhost:5173` in `apps/api/.env`, restart. Cloud: redeploy with `CORS_ORIGINS=… SKIP_BUILD=1 make deploy-api`. |
| `asyncpg … SSL required` / `connection refused` on Neon | Missing `?ssl=require` in the asyncpg URL (tools want `sslmode=require`) | Append `?ssl=require` to `DATABASE_URL` for the API; `tools/dburl.py` converts either form for the CLI. |
| `type "geometry" does not exist` / `extension "postgis" is not available` | Migrations not applied, or a plain Postgres image | `make migrate`; locally the image must be `postgis/postgis:16-3.4` (compose default); Neon has PostGIS built in. |
| `port is already allocated` (5432/8000/5173) | Another Postgres/uvicorn/Vite running | Stop it, or set `DB_PORT`/`API_PORT`/`WEB_PORT` in `infra/.env` (and `VITE_API_URL` accordingly). |
| Firebase popup: *auth/unauthorized-domain* | Hosting or local domain not whitelisted | Authentication → Settings → Authorized domains → add `localhost`, `<project>.web.app`, custom domain. |
| API 401 *invalid token* in firebase mode | Web and API point at different Firebase projects, or clock skew | Same `VITE_FIREBASE_PROJECT_ID` and `FIREBASE_PROJECT_ID`; sign out/in. |
| Officer sees only citizen pages | Claims not set or token not refreshed | `python tools/set_claims.py --list`; sign out and in. |
| `/healthz` returns 503 `db_unavailable` | Wrong `DATABASE_URL`, Neon suspended, or secret not granted | Check Cloud Run logs; `deploy.sh` grants `secretAccessor` — re-run it. |
| `demo_reset_unavailable` from the API | Image built from `apps/api` instead of repo root | Build with `docker build -f apps/api/Dockerfile .` / `deploy.sh` (uses `cloudbuild.yaml`). |
| Cold start 5–10 s | `min-instances 0` + Neon suspend | Expected; see (h) warming. |
| `npm ci` fails: lockfile mismatch | Node ≠ 22 or edited `package.json` | `nvm use 22`; run `npm install` once and commit the lockfile. |
| WeasyPrint import error locally (`libpango`) | System libraries missing | macOS `brew install pango`; Ubuntu `apt install libpango-1.0-0 libpangoft2-1.0-0`; or run the API in Docker. |
| Windows: `make` not found | No GNU make | Use WSL2 (recommended) or copy the commands from the Makefile. |
