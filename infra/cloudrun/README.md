# Cloud Run — Land Stack API

The gateway (FastAPI + six in-process department sub-apps) runs as **one** Cloud Run service,
`landstack-api`, in the same GCP project as Firebase Hosting. Sized for the free tier: 1 vCPU,
512 MiB, min 0 / max 3 instances, concurrency 80, request timeout 300 s, port `$PORT` (8080).

## Files

| File | Purpose |
|---|---|
| `deploy.sh` | One-command build + deploy (APIs, Artifact Registry, GCS bucket, secrets, `gcloud run deploy`). |
| `cloudbuild.yaml` | Builds `apps/api/Dockerfile` with the **repo root** as context (image needs `tools/` + `db/` for demo-reset). |
| `service.yaml` | Knative manifest equivalent for `gcloud run services replace`. |
| `secrets.env.example` | Template for `secrets.env` (gitignored) → pushed to Secret Manager by `deploy.sh`. |

## Deploy

```bash
gcloud auth login && gcloud auth application-default login
cp infra/cloudrun/secrets.env.example infra/cloudrun/secrets.env   # fill DATABASE_URL etc.
make deploy-api PROJECT_ID=<your-firebase-project-id>               # ≈ 5–8 min first time (Cloud Build)
```

`deploy.sh` prints the service URL. Put it in `apps/web/.env` as `VITE_API_URL` and redeploy the web
app. If you use a custom Hosting domain re-run with `CORS_ORIGINS=https://a,https://b PUBLIC_WEB_URL=https://a SKIP_BUILD=1`.

Environment (from `docs/CONTRACTS.md` §2): `AUTH_MODE=firebase`, `FIREBASE_PROJECT_ID`, `CORS_ORIGINS`,
`PUBLIC_WEB_URL`, `STORAGE_BACKEND=gcs`, `GCS_BUCKET`, `S2_OFFLINE=1`, `DEPT_BASE_URL=` (in-process).
Secrets via Secret Manager: `DATABASE_URL`, `EVENTS_SHARED_SECRET`, `REPORT_HMAC_SECRET`, `GEMINI_API_KEY` (optional).
Firebase Admin uses the Cloud Run default service account — no key file needed on the server.

## Cost expectations (Blaze plan, all within always-free quotas for a demo)

| Service | Free allowance per month | Demo usage |
|---|---|---|
| Cloud Run | 2 M requests, 360 000 GiB-s memory, 180 000 vCPU-s, 1 GiB egress (North America; asia-south1 egress is billed at ~$0.12/GiB beyond the free tier of other regions) | a jury session is a few thousand requests; at 512 MiB a warm instance costs ~0.5 GiB-s per second of *request time* only (min-instances 0) |
| Cloud Build | 120 build-min/day | ~6 min per API build |
| Artifact Registry | 0.5 GB storage | image ≈ 450 MB; delete old tags with `gcloud artifacts docker images delete` |
| Secret Manager | 6 active secret versions, 10 000 access ops | 4 secrets |
| Cloud Storage (reports) | 5 GB (US regions); asia-south1 storage ≈ $0.02/GB-month | a few MB of PDFs |
| Firebase Hosting | 10 GB storage, 360 MB/day transfer | dist ≈ 3 MB |
| Firebase Auth | 50 000 MAU (Google + Email/Password) | 6 demo users |
| Neon (external) | 0.5 GB storage, 190 compute-h, auto-suspend after 5 min | seed ≈ 60 MB |

Expected bill for hackathon usage: **₹0–₹50/month** (egress from asia-south1 is the only line that
can be non-zero). Set a Cloud Billing budget alert at ₹500 anyway. `min-instances 0` means the first
request after idle takes 3–8 s (cold start + Neon wake-up); the demo-day checklist in `docs/SETUP.md`
covers warming.

## Neon database

1. https://console.neon.tech → *New project*: name `landstack`, region **AWS ap-southeast-1 (Singapore)**
   (closest to asia-south1), Postgres 16.
2. Copy the connection string (**pooled** or direct both work; direct is simpler for migrations).
   It looks like `postgresql://landstack_owner:***@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.
3. Migrations enable PostGIS themselves (`db/migrations/001_extensions.sql` runs `CREATE EXTENSION IF NOT EXISTS postgis`;
   Neon ships PostGIS 3.4 pre-installed, no console toggle needed).
4. From your machine:
   ```bash
   pip install -r tools/requirements.txt
   make neon-migrate NEON_DATABASE_URL='postgresql://...?sslmode=require'   # migrate + seed (~40 s)
   ```
5. For the API, write the **asyncpg** spelling into `infra/cloudrun/secrets.env`:
   `DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?ssl=require`
   (`tools/dburl.py` accepts either spelling for the CLI tools).

## Operations

```bash
gcloud run services logs tail landstack-api --region asia-south1
gcloud run services describe landstack-api --region asia-south1 --format 'value(status.url)'
gcloud run services update landstack-api --region asia-south1 --min-instances 1     # demo day, revert after
gcloud run revisions list --service landstack-api --region asia-south1
```

Roll back: `gcloud run services update-traffic landstack-api --region asia-south1 --to-revisions <rev>=100`.
