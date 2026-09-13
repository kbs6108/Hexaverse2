#!/usr/bin/env bash
# Build and deploy the Land Stack API to Cloud Run (free-tier sized).
#
#   PROJECT_ID=my-firebase-project ./infra/cloudrun/deploy.sh
#   ./infra/cloudrun/deploy.sh --project my-firebase-project --region asia-south1
#
# Env / flags:  PROJECT_ID (required)  REGION=asia-south1  SERVICE=landstack-api  REPO=landstack
#               CORS_ORIGINS, PUBLIC_WEB_URL (default: https://$PROJECT_ID.web.app + .firebaseapp.com)
#               GCS_BUCKET (default: $PROJECT_ID-landstack-reports; created if missing)
#               SKIP_BUILD=1 to redeploy the last image, TAG=<tag> to pin an image tag.
# Secrets: infra/cloudrun/secrets.env (gitignored; see secrets.env.example) → Secret Manager.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../.." && pwd)"

PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-landstack-api}"
REPO="${REPO:-landstack}"
TAG="${TAG:-$(git -C "$root" rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
SKIP_BUILD="${SKIP_BUILD:-0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT_ID="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --service) SERVICE="$2"; shift 2 ;;
    --tag) TAG="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$PROJECT_ID" ]]; then
  PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
fi
[[ -n "$PROJECT_ID" ]] || { echo "PROJECT_ID is required (env, --project, or gcloud config set project)" >&2; exit 2; }
command -v gcloud >/dev/null || { echo "gcloud CLI not found: https://cloud.google.com/sdk/docs/install" >&2; exit 2; }

CORS_ORIGINS="${CORS_ORIGINS:-https://${PROJECT_ID}.web.app,https://${PROJECT_ID}.firebaseapp.com}"
PUBLIC_WEB_URL="${PUBLIC_WEB_URL:-https://${PROJECT_ID}.web.app}"
GCS_BUCKET="${GCS_BUCKET:-${PROJECT_ID}-landstack-reports}"
IMAGE_BASE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}"
IMAGE="${IMAGE_BASE}:${TAG}"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

log "Project ${PROJECT_ID} · region ${REGION} · service ${SERVICE} · image ${IMAGE}"
gcloud config set project "$PROJECT_ID" >/dev/null

log "Enabling APIs (idempotent)"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com cloudbuild.googleapis.com storage.googleapis.com --quiet

log "Artifact Registry repo ${REPO}"
if ! gcloud artifacts repositories describe "$REPO" --location "$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPO" --repository-format docker --location "$REGION" \
    --description "Land Stack images" --quiet
fi

log "Report bucket gs://${GCS_BUCKET}"
if ! gcloud storage buckets describe "gs://${GCS_BUCKET}" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://${GCS_BUCKET}" --location "$REGION" --uniform-bucket-level-access --quiet
fi

if [[ "$SKIP_BUILD" != "1" ]]; then
  log "Cloud Build (context = repo root, Dockerfile = backend/Dockerfile)"
  gcloud builds submit "$root" --config "$here/cloudbuild.yaml" \
    --substitutions "_IMAGE=${IMAGE},_IMAGE_LATEST=${IMAGE_BASE}:latest" --quiet
fi

# ---- secrets -------------------------------------------------------------------------------------
secret_names=(DATABASE_URL EVENTS_SHARED_SECRET REPORT_HMAC_SECRET GEMINI_API_KEY)
secrets_file="$here/secrets.env"
project_number="$(gcloud projects describe "$PROJECT_ID" --format 'value(projectNumber)')"
run_sa="${project_number}-compute@developer.gserviceaccount.com"

if [[ -f "$secrets_file" ]]; then
  log "Pushing secrets from ${secrets_file} to Secret Manager"
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    value="${value%\"}"; value="${value#\"}"
    if [[ ! " ${secret_names[*]} " =~ " ${key} " ]]; then echo "  skip ${key} (not a known secret)"; continue; fi
    if [[ -z "$value" ]]; then echo "  skip ${key} (empty)"; continue; fi
    if ! gcloud secrets describe "$key" >/dev/null 2>&1; then
      gcloud secrets create "$key" --replication-policy automatic --quiet
    fi
    printf '%s' "$value" | gcloud secrets versions add "$key" --data-file=- --quiet
    echo "  ${key}: new version added"
  done < "$secrets_file"
else
  echo "no ${secrets_file}; assuming secrets already exist in Secret Manager"
fi

set_secrets=()
for key in "${secret_names[@]}"; do
  if gcloud secrets describe "$key" >/dev/null 2>&1; then
    gcloud secrets add-iam-policy-binding "$key" --member "serviceAccount:${run_sa}" \
      --role roles/secretmanager.secretAccessor --quiet >/dev/null
    set_secrets+=("${key}=${key}:latest")
  elif [[ "$key" != "GEMINI_API_KEY" ]]; then
    echo "ERROR: secret ${key} does not exist. Create infra/cloudrun/secrets.env (see secrets.env.example)." >&2
    exit 1
  fi
done
secrets_arg="$(IFS=,; echo "${set_secrets[*]}")"

log "Granting the runtime service account object access on the bucket"
gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET}" \
  --member "serviceAccount:${run_sa}" --role roles/storage.objectAdmin --quiet >/dev/null

# ---- deploy --------------------------------------------------------------------------------------
# '|' separated because CORS_ORIGINS itself contains commas ('^|^' prefix tells gcloud the delimiter).
env_vars="AUTH_MODE=firebase"
env_vars+="|FIREBASE_PROJECT_ID=${PROJECT_ID}"
env_vars+="|CORS_ORIGINS=${CORS_ORIGINS}"
env_vars+="|PUBLIC_WEB_URL=${PUBLIC_WEB_URL}"
env_vars+="|STORAGE_BACKEND=gcs"
env_vars+="|GCS_BUCKET=${GCS_BUCKET}"
env_vars+="|S2_OFFLINE=1"
env_vars+="|DEPT_BASE_URL="
env_vars+="|DEPT_TIMEOUT_S=0.3"
env_vars+="|LOG_LEVEL=INFO"

log "Deploying ${SERVICE}"
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 --memory 512Mi \
  --min-instances 0 --max-instances 3 \
  --concurrency 80 \
  --timeout 300 \
  --cpu-boost \
  --execution-environment gen2 \
  --set-env-vars "^|^${env_vars}" \
  --set-secrets "$secrets_arg" \
  --labels "app=landstack,env=demo" \
  --quiet

URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format 'value(status.url)')"
log "Deployed: ${URL}"
cat <<MSG

Next steps
  1. Smoke test:            curl ${URL}/healthz
  2. Web app:               set VITE_API_URL=${URL} and VITE_AUTH_MODE=firebase in apps/web/.env, then make deploy-web
  3. CORS / PUBLIC_WEB_URL: currently ${CORS_ORIGINS} / ${PUBLIC_WEB_URL}
                            (custom domain? re-run with CORS_ORIGINS=... PUBLIC_WEB_URL=... SKIP_BUILD=1)
  4. Firebase Auth:         add the Hosting domain under Authentication → Settings → Authorized domains
  5. Database:              make neon-migrate NEON_DATABASE_URL='postgresql://...?sslmode=require'
MSG
