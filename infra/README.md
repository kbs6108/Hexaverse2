# infra/

| Path | What |
|---|---|
| `docker-compose.yml` | Local stack: PostGIS 16-3.4, one-shot `migrate` (+seed when empty), API with hot reload, Vite dev server. Profiles `prod` (nginx web build) and `tiles` (martin). |
| `.env.example` | Compose-level variables (ports, Postgres credentials, `SEED_ON_UP`). Copy to `infra/.env`. |
| `cloudrun/` | `deploy.sh`, `cloudbuild.yaml`, `service.yaml`, README with free-tier numbers and Neon steps. |
| `firebase/README.md` | Notes on the root `firebase.json` / `.firebaserc.example` (Firebase CLI needs them at repo root). |

## Local

```bash
cp infra/.env.example infra/.env            # optional; defaults are fine
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
make up                                     # db → migrate+seed → api :8000 → web :5173
make logs                                   # follow everything
make down                                   # stop (keeps the pgdata volume; `make down V=1` wipes it)
```

- API: http://localhost:8000/docs · health http://localhost:8000/healthz · department docs at `/revenue/docs` etc.
- Web: http://localhost:5173 (dev mode: pick a role in the header; it sets `X-Dev-User`).
- Postgres: `postgresql://landstack:landstack@localhost:5432/landstack`.
- `docker compose -f infra/docker-compose.yml --profile prod up web-prod` serves the nginx build on :8080.
- `--profile tiles` starts martin on :3000 (`http://localhost:3000/catalog`); the API's own MVT endpoint is the default.

The `api` container mounts `apps/api`, `tools`, `db` and `data`, so edits reload in place. The image
is built from the repo root (`apps/api/Dockerfile`) because the admin demo-reset endpoint executes
`tools/demo_reset.py`.

## Cloud

See `cloudrun/README.md` (API) and `firebase/README.md` (web), or the walkthrough in `docs/SETUP.md`.
