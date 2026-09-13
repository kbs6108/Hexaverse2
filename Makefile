# Land Stack — developer entry points. `make help` lists targets.
SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE_FILE ?= infra/docker-compose.yml
COMPOSE_ENV  ?= $(if $(wildcard infra/.env),infra/.env,infra/.env.example)
COMPOSE      := docker compose --env-file $(COMPOSE_ENV) -f $(COMPOSE_FILE)
PY           ?= python3
VENV         ?= .venv
VENV_PY      := $(VENV)/bin/python
PROJECT_ID   ?= $(shell gcloud config get-value project 2>/dev/null)
REGION       ?= asia-south1
SERVICE      ?= landstack-api
DATABASE_URL ?= postgresql+asyncpg://landstack:landstack@localhost:5432/landstack
NEON_DATABASE_URL ?=

.PHONY: help up down logs ps migrate seed demo-reset venv dev-api dev-web test lint build-web deploy-api deploy-web neon-migrate neon-reset firebase-login clean

help: ## Show this help
	@awk 'BEGIN {FS = ":.*## "; printf "\nUsage: make <target> [VAR=value]\n\n"} /^[a-zA-Z0-9_-]+:.*## / {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@printf "\nVars: PROJECT_ID REGION NEON_DATABASE_URL DATABASE_URL (V=1 with down wipes volumes)\n\n"

# ---- local stack (docker) ----
up: ## Start db, run migrations+seed once, then api (:8000) and web (:5173)
	$(COMPOSE) up -d db
	$(COMPOSE) up migrate
	$(COMPOSE) up -d api web
	@echo "API  http://localhost:8000/docs   Web  http://localhost:5173"

down: ## Stop the stack (V=1 also removes the pgdata / node_modules volumes)
	$(COMPOSE) --profile prod --profile tiles down --remove-orphans $(if $(V),-v,)

logs: ## Tail logs of every running service
	$(COMPOSE) logs -f --tail=100

ps: ## Show service status + health
	$(COMPOSE) ps

migrate: ## Apply db/migrations/*.sql to DATABASE_URL (default: local compose db)
	DATABASE_URL="$(DATABASE_URL)" $(PY) backend/tools/migrate.py

seed: ## (Re)load the deterministic demo cadastre into DATABASE_URL — truncates all tables
	DATABASE_URL="$(DATABASE_URL)" $(PY) backend/tools/seed.py

demo-reset: ## Reset mutable tables (applications, alerts, audit…) to the seeded state in <30 s
	DATABASE_URL="$(DATABASE_URL)" $(PY) backend/tools/demo_reset.py

# ---- local dev without docker for the app processes ----
venv: ## Create .venv with API + tools + dev dependencies
	test -d $(VENV) || $(PY) -m venv $(VENV)
	$(VENV_PY) -m pip install -q --upgrade pip
	$(VENV_PY) -m pip install -q -r backend/requirements.txt -r backend/tools/requirements.txt pytest pytest-asyncio ruff

dev-api: venv ## Run the API with uvicorn --reload from .venv (uses backend/.env)
	cd backend && ../../$(VENV_PY) -m uvicorn landstack.main:app --reload --port 8000

dev-web: ## Run the Vite dev server (apps/web/.env)
	cd apps/web && npm install --no-audit --no-fund && npm run dev

test: venv ## pytest (integration tests run when DATABASE_URL is reachable)
	cd backend && ../../$(VENV_PY) -m pytest -q

lint: venv ## ruff on the API + tools, tsc on the web app
	$(VENV)/bin/ruff check backend
	cd apps/web && npm run typecheck

build-web: ## Production build of apps/web into apps/web/dist
	cd apps/web && npm ci --no-audit --no-fund && npm run build

# ---- cloud ----
deploy-api: ## Build + deploy the API to Cloud Run (PROJECT_ID=... REGION=asia-south1)
	PROJECT_ID="$(PROJECT_ID)" REGION="$(REGION)" SERVICE="$(SERVICE)" ./infra/cloudrun/deploy.sh

deploy-web: ## Build + deploy apps/web to Firebase Hosting (needs .firebaserc and `firebase login`)
	test -f .firebaserc || { echo "copy .firebaserc.example to .firebaserc and set your project id"; exit 1; }
	npx --yes firebase-tools deploy --only hosting

firebase-login: ## Log in the Firebase CLI
	npx --yes firebase-tools login

neon-migrate: ## Migrate + seed the Neon database (NEON_DATABASE_URL=postgresql://...?sslmode=require)
	@test -n "$(NEON_DATABASE_URL)" || { echo "set NEON_DATABASE_URL"; exit 1; }
	$(PY) backend/tools/migrate.py --database-url "$(NEON_DATABASE_URL)"
	$(PY) backend/tools/seed.py --database-url "$(NEON_DATABASE_URL)"

neon-reset: ## Demo-reset the Neon database (mutable tables only)
	@test -n "$(NEON_DATABASE_URL)" || { echo "set NEON_DATABASE_URL"; exit 1; }
	$(PY) backend/tools/demo_reset.py --database-url "$(NEON_DATABASE_URL)"

clean: ## Remove build artefacts and caches
	rm -rf apps/web/dist backend/.pytest_cache .ruff_cache .pytest_cache
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
