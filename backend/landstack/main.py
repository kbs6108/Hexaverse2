"""Gateway application factory: routers, CORS, department sub-app mounts, health, error envelope.

Run with `uvicorn landstack.main:app --reload`.
"""

from __future__ import annotations

import logging
import time
import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from landstack import __version__
from landstack.adapters import client as dept_client
from landstack.config import Settings, get_settings
from landstack.db import DBLike, get_db
from landstack.errors import AppError, install_error_handlers
from landstack.routers import (
    admin,
    ai,
    alerts,
    applications,
    auth,
    collections,
    connectors,
    consents,
    consistency,
    events,
    parcels,
    reports,
    search,
    stats,
    tiles,
)

log = logging.getLogger("landstack")

DEPARTMENT_APPS: dict[str, str] = {
    "revenue": "departments.revenue.app",
    "registration": "departments.registration.app",
    "planning": "departments.planning.app",
    "fiscal": "departments.fiscal.app",
    "legal": "departments.legal.app",
    "utilities": "departments.utilities.app",
}


def _import_app(module_path: str) -> FastAPI:
    import importlib

    return importlib.import_module(module_path).app


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings: Settings = app.state.settings
    logging.basicConfig(level=settings.log_level.upper(), format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    log.info(
        "Land Stack API %s starting · auth_mode=%s · departments=%s · storage=%s",
        __version__,
        settings.auth_mode,
        settings.dept_base_url or "in-process",
        settings.storage_backend,
    )
    if settings.auth_mode == "dev":
        log.warning("AUTH_MODE=dev: identities come from the X-Dev-User header. Never run this in production.")
    yield
    db = get_db()
    if hasattr(db, "dispose"):
        await db.dispose()


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="Land Stack Gateway API",
        description="Parcel-centric aggregation of six department systems into one Common Data Model (SIH 2026 prototype).",
        version=__version__,
        lifespan=lifespan,
        docs_url="/docs",
        openapi_url="/openapi.json",
    )
    app.state.settings = settings
    install_error_handlers(app)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Source-System", "X-Report-SHA256"],
    )

    @app.middleware("http")
    async def request_id(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:16]
        request.state.request_id = rid
        started = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        response.headers["X-Response-Time-Ms"] = str(int((time.perf_counter() - started) * 1000))
        return response

    for router in (
        auth.router,
        collections.router,
        tiles.router,
        search.router,
        parcels.router,
        applications.router,
        stats.router,
        alerts.router,
        consistency.router,
        connectors.router,
        events.router,
        reports.router,
        consents.router,
        admin.router,
        ai.router,
    ):
        app.include_router(router)

    for name, module_path in DEPARTMENT_APPS.items():
        app.mount(f"/{name}", _import_app(module_path), name=name)

    @app.get("/healthz", tags=["meta"])
    async def healthz(db: DBLike = Depends(get_db)) -> dict[str, Any]:
        try:
            ok = (await db.fetchval("SELECT 1")) == 1
        except Exception as exc:
            raise AppError(503, "db_unavailable", f"database unreachable: {type(exc).__name__}") from exc
        return {"status": "ok" if ok else "degraded", "version": __version__, "auth_mode": settings.auth_mode}

    @app.get("/", tags=["meta"])
    async def index(request: Request) -> dict[str, Any]:
        base = str(request.base_url).rstrip("/")
        return {
            "name": "Land Stack Gateway API",
            "version": __version__,
            "auth_mode": settings.auth_mode,
            "docs": f"{base}/docs",
            "openapi": f"{base}/openapi.json",
            "health": f"{base}/healthz",
            "collections": f"{base}/landstack/collections",
            "departments": {
                name: {"docs": f"{base}/{name}/docs", "openapi": f"{base}/{name}/openapi.json"}
                for name in DEPARTMENT_APPS
            },
        }

    dept_client.set_root_app(app)
    return app


app = create_app()
