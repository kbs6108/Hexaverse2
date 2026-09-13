# Land Stack gateway API image.
#
# BUILD CONTEXT IS THE REPO ROOT, not backend:
#     docker build -f backend/Dockerfile -t landstack-api .
#     gcloud builds submit . --config infra/cloudrun/cloudbuild.yaml
#
# Why: landstack/routers/admin.py resolves REPO_ROOT and shells out to
# tools/demo_reset.py, so the image mirrors the layout (/app/backend).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

# WeasyPrint runtime (Pango/Cairo/HarfBuzz) + fonts for PDF reports
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpango-1.0-0 libpangoft2-1.0-0 libpangocairo-1.0-0 libcairo2 libharfbuzz0b libharfbuzz-subset0 \
        libgdk-pixbuf-2.0-0 libffi8 shared-mime-info fonts-dejavu-core fonts-noto-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# API deps + optional GCS backend + CLI tools deps
COPY backend/requirements.txt ./requirements.txt
COPY backend/tools/requirements.txt ./tools/requirements.txt
RUN pip install -r requirements.txt -r tools/requirements.txt "google-cloud-storage>=2.16"

COPY backend/landstack ./landstack
COPY backend/departments ./departments
COPY backend/ai ./ai
COPY backend/tools ./tools
COPY backend/db ./db
COPY data/village.geojson /app/data/village.geojson

RUN useradd -m appuser && mkdir -p /app/data/storage /app/data/s2 && chown -R appuser /app
USER appuser

# Cloud Run injects $PORT (8080); compose overrides to 8000.
ENV PORT=8080 STORAGE_LOCAL_DIR=/app/data/storage S2_DATA_DIR=/app/data/s2
EXPOSE 8080
CMD ["sh", "-c", "uvicorn landstack.main:app --host 0.0.0.0 --port ${PORT:-8080} --proxy-headers --forwarded-allow-ips='*'"]
