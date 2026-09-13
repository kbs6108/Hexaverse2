"""Consistent error envelope `{error: {code, message, details}}` for the gateway and department apps."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

log = logging.getLogger("landstack.errors")


class AppError(Exception):
    """Domain error carrying an HTTP status and a stable machine-readable code."""

    def __init__(self, status: int, code: str, message: str, details: Any = None) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.details = details


def envelope(code: str, message: str, details: Any = None, status: int = 400) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message, "details": details}})


def not_found(what: str, ident: str) -> AppError:
    return AppError(404, "not_found", f"{what} '{ident}' not found")


def forbidden(message: str = "forbidden") -> AppError:
    return AppError(403, "forbidden", message)


def unauthorized(message: str = "authentication required") -> AppError:
    return AppError(401, "unauthorized", message)


def install_error_handlers(app: FastAPI) -> None:
    """Register handlers so every error leaves the app in the shared envelope shape."""

    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return envelope(exc.code, exc.message, exc.details, exc.status)

    @app.exception_handler(HTTPException)
    async def _http_error(_: Request, exc: HTTPException) -> JSONResponse:
        code = {401: "unauthorized", 403: "forbidden", 404: "not_found", 422: "validation_error"}.get(
            exc.status_code, "http_error"
        )
        detail = exc.detail
        message = detail if isinstance(detail, str) else "request failed"
        details = None if isinstance(detail, str) else detail
        resp = envelope(code, message, details, exc.status_code)
        if exc.headers:
            resp.headers.update(exc.headers)
        return resp

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return envelope("validation_error", "request validation failed", exc.errors(), 422)

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        log.exception("unhandled error on %s %s", request.method, request.url.path)
        return envelope("internal_error", "internal server error", {"type": type(exc).__name__}, 500)
