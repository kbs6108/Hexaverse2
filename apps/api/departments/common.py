"""Shared plumbing for the department sub-apps: app factory, `X-Source-System` header, `as_of` envelope,
and the dev-only chaos knobs `?delay_ms=&fail=1` (CONTRACTS §6/§7)."""

from __future__ import annotations

import asyncio
import datetime as dt
from typing import Any

from fastapi import Depends, FastAPI, Query, Request, Response

from landstack.config import Settings, get_settings
from landstack.db import DBLike, get_db
from landstack.errors import AppError, install_error_handlers


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def envelope(source: str, **body: Any) -> dict[str, Any]:
    """Every department response carries `as_of` and `source`."""
    return {"as_of": now_iso(), "source": source, **body}


async def chaos(
    delay_ms: int = Query(0, ge=0, le=30000),
    fail: int = Query(0, ge=0, le=1),
    settings: Settings = Depends(get_settings),
) -> None:
    """Dev-mode latency/failure injection so the gateway's timeouts and provenance can be demonstrated."""
    if not settings.dev_auth:
        return
    if delay_ms:
        await asyncio.sleep(delay_ms / 1000)
    if fail:
        raise AppError(503, "simulated_failure", "simulated upstream failure (fail=1)")


def make_dept_app(name: str, title: str, description: str, source_system: str) -> FastAPI:
    app = FastAPI(
        title=title,
        description=description,
        version="0.1.0",
        docs_url="/docs",
        openapi_url="/openapi.json",
        contact={"name": f"{source_system} (mock)"},
    )
    app.state.source_system = source_system
    app.state.dept_name = name
    install_error_handlers(app)

    @app.middleware("http")
    async def _source_header(request: Request, call_next: Any) -> Response:
        response = await call_next(request)
        response.headers["X-Source-System"] = source_system
        return response

    @app.get("/", tags=["meta"])
    async def index() -> dict[str, Any]:
        return envelope(
            source_system, department=name, title=title, docs=f"/{name}/docs", openapi=f"/{name}/openapi.json"
        )

    @app.get("/health", tags=["meta"])
    async def health(db: DBLike = Depends(get_db)) -> dict[str, Any]:
        try:
            ok = (await db.fetchval("SELECT 1")) == 1
        except Exception as exc:
            raise AppError(503, "db_unavailable", f"database unreachable: {type(exc).__name__}") from exc
        return envelope(source_system, status="ok" if ok else "degraded", department=name)

    return app


def require_found(row: Any, what: str, ident: str) -> Any:
    if row is None:
        raise AppError(404, "not_found", f"{what} '{ident}' not found")
    return row
