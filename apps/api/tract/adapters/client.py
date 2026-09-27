"""HTTP client to the department sub-apps (and back to the gateway for events).

When `DEPT_BASE_URL` is empty the six departments are mounted inside this very process, so requests go
through `httpx.ASGITransport` against the root ASGI app (registered by `main.create_app` through
`set_root_app`). Otherwise a normal HTTP client talks to `DEPT_BASE_URL`.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from landstack.config import get_settings

log = logging.getLogger("landstack.adapters.client")

_root_app: Any = None
_client: httpx.AsyncClient | None = None


def set_root_app(app: Any) -> None:
    """Called by the app factory so in-process calls can target the mounted department apps."""
    global _root_app, _client
    _root_app = app
    _client = None


def reset_client() -> None:
    global _client
    _client = None


def internal_client() -> httpx.AsyncClient:
    """Lazily-built shared client (in-process ASGI transport or real HTTP, per settings)."""
    global _client
    if _client is not None:
        return _client
    settings = get_settings()
    timeout = httpx.Timeout(max(settings.dept_timeout_s, 0.05), connect=max(settings.dept_timeout_s, 0.05))
    if settings.dept_base_url:
        _client = httpx.AsyncClient(base_url=settings.dept_base_url.rstrip("/"), timeout=timeout)
    else:
        if _root_app is None:
            raise RuntimeError("root app not registered; call set_root_app(app) or set DEPT_BASE_URL")
        transport = httpx.ASGITransport(app=_root_app, raise_app_exceptions=False)
        _client = httpx.AsyncClient(transport=transport, base_url="http://landstack.internal", timeout=timeout)
    return _client


class UpstreamError(Exception):
    """Raised when a department/gateway call fails (non-2xx or transport error)."""

    def __init__(self, status: int | None, message: str) -> None:
        super().__init__(message)
        self.status = status


def _decode(resp: httpx.Response) -> dict[str, Any]:
    if resp.status_code >= 400:
        try:
            body = resp.json()
            message = body.get("error", {}).get("message") or body.get("detail") or resp.text
        except ValueError:
            message = resp.text
        raise UpstreamError(resp.status_code, f"HTTP {resp.status_code}: {message}"[:300])
    return resp.json() if resp.content else {}


async def get_json(path: str, params: dict[str, Any] | None = None, headers: dict[str, str] | None = None) -> dict:
    try:
        resp = await internal_client().get(path, params=params, headers=headers)
    except httpx.TimeoutException as exc:
        raise UpstreamError(None, "timeout") from exc
    except httpx.HTTPError as exc:
        raise UpstreamError(None, f"transport error: {type(exc).__name__}") from exc
    return _decode(resp)


async def post_json(
    path: str, body: dict[str, Any], headers: dict[str, str] | None = None, timeout: float | None = None
) -> dict:
    try:
        resp = await internal_client().post(path, json=body, headers=headers, timeout=timeout)
    except httpx.TimeoutException as exc:
        raise UpstreamError(None, "timeout") from exc
    except httpx.HTTPError as exc:
        raise UpstreamError(None, f"transport error: {type(exc).__name__}") from exc
    return _decode(resp)
