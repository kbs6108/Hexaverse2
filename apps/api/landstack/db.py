"""Async database facade over a SQLAlchemy 2 engine (asyncpg driver).

No ORM models anywhere: callers pass SQL strings with `:named` bound parameters. Rows are returned as
plain dicts with Decimal → float and other driver types normalised so they can be cached, merged into
the CDM and serialised. `DB.transaction()` binds the facade to a single connection for its duration
(via a ContextVar) so nested calls share one transaction.

The `get_db` FastAPI dependency returns the process-wide instance; tests call `use_db(fake)` to swap
in a fake that implements the same four methods.
"""

from __future__ import annotations

import datetime as dt
import decimal
import json
import logging
import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from contextvars import ContextVar
from typing import Any, Protocol
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, create_async_engine

from landstack.config import get_settings

log = logging.getLogger("landstack.db")


class DBLike(Protocol):
    """Structural type shared by the real facade and test fakes."""

    async def fetch(self, sql: str, **params: Any) -> list[dict[str, Any]]: ...
    async def fetchrow(self, sql: str, **params: Any) -> dict[str, Any] | None: ...
    async def fetchval(self, sql: str, **params: Any) -> Any: ...
    async def execute(self, sql: str, **params: Any) -> int: ...
    def transaction(self) -> Any: ...


def _json_default(value: Any) -> Any:
    if isinstance(value, decimal.Decimal):
        return float(value)
    if isinstance(value, dt.datetime | dt.date | dt.time):
        return value.isoformat()
    if isinstance(value, uuid.UUID | memoryview | bytes):
        return str(value) if isinstance(value, uuid.UUID) else bytes(value).hex()
    if isinstance(value, set):
        return sorted(value)
    raise TypeError(f"not JSON serialisable: {type(value).__name__}")


def json_dumps(value: Any) -> str:
    """JSON encoding that tolerates DB/driver types (Decimal, datetime, UUID)."""
    return json.dumps(value, default=_json_default, ensure_ascii=False)


def coerce(value: Any) -> Any:
    """Normalise driver values to plain Python (Decimal→float, memoryview→bytes, JSON text→object)."""
    if isinstance(value, decimal.Decimal):
        return float(value)
    if isinstance(value, memoryview):
        return bytes(value)
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, list | tuple):
        return [coerce(v) for v in value]
    if isinstance(value, dict):
        return {k: coerce(v) for k, v in value.items()}
    if isinstance(value, str) and value[:1] in "{[" and value[-1:] in "}]":
        # asyncpg normally decodes json/jsonb itself; this covers `::text` casts and raw json columns.
        try:
            return json.loads(value)
        except ValueError:
            return value
    return value


def row_to_dict(row: Any) -> dict[str, Any]:
    mapping = row._mapping if hasattr(row, "_mapping") else dict(row)
    return {str(k): coerce(v) for k, v in mapping.items()}


def normalise_database_url(url: str) -> tuple[str, dict[str, Any]]:
    """Return (sqlalchemy_url, connect_args) — asyncpg driver forced, `ssl=/sslmode=` moved to connect_args."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://") :]
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    connect_args: dict[str, Any] = {}
    ssl = query.pop("ssl", None) or query.pop("sslmode", None)
    if ssl:
        connect_args["ssl"] = "require" if ssl in {"true", "1", "required"} else ssl
    query.pop("channel_binding", None)
    return urlunsplit(parts._replace(query=urlencode(query))), connect_args


class DB:
    """Thin async facade: fetch / fetchrow / fetchval / execute / transaction()."""

    def __init__(self, engine: AsyncEngine) -> None:
        self.engine = engine
        self._tx: ContextVar[AsyncConnection | None] = ContextVar("landstack_tx", default=None)

    @classmethod
    def from_url(cls, url: str) -> DB:
        sa_url, connect_args = normalise_database_url(url)
        engine = create_async_engine(
            sa_url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            pool_recycle=1800,
            connect_args=connect_args,
        )
        return cls(engine)

    async def _run(self, op: Callable[[AsyncConnection], Awaitable[Any]]) -> Any:
        conn = self._tx.get()
        if conn is not None:
            return await op(conn)
        async with self.engine.begin() as fresh:
            return await op(fresh)

    async def fetch(self, sql: str, **params: Any) -> list[dict[str, Any]]:
        async def op(conn: AsyncConnection) -> list[dict[str, Any]]:
            result = await conn.execute(text(sql), params)
            return [row_to_dict(r) for r in result.mappings().all()]

        return await self._run(op)

    async def fetchrow(self, sql: str, **params: Any) -> dict[str, Any] | None:
        async def op(conn: AsyncConnection) -> dict[str, Any] | None:
            result = await conn.execute(text(sql), params)
            row = result.mappings().first()
            return row_to_dict(row) if row is not None else None

        return await self._run(op)

    async def fetchval(self, sql: str, **params: Any) -> Any:
        async def op(conn: AsyncConnection) -> Any:
            result = await conn.execute(text(sql), params)
            row = result.first()
            return coerce(row[0]) if row is not None else None

        return await self._run(op)

    async def execute(self, sql: str, **params: Any) -> int:
        async def op(conn: AsyncConnection) -> int:
            result = await conn.execute(text(sql), params)
            return result.rowcount if result.rowcount is not None else 0

        return await self._run(op)

    @asynccontextmanager
    async def transaction(self) -> AsyncIterator[DB]:
        """Bind all calls inside the block to one connection/transaction (re-entrant)."""
        if self._tx.get() is not None:
            yield self
            return
        async with self.engine.begin() as conn:
            token = self._tx.set(conn)
            try:
                yield self
            finally:
                self._tx.reset(token)

    async def ping(self) -> bool:
        return (await self.fetchval("SELECT 1")) == 1

    async def dispose(self) -> None:
        await self.engine.dispose()


_current: DBLike | None = None


def use_db(db: DBLike | None) -> None:
    """Install a process-wide DB instance (tests pass a fake; `None` resets to lazy real engine)."""
    global _current
    _current = db


def get_db() -> DBLike:
    """FastAPI dependency returning the shared DB facade (created lazily from settings)."""
    global _current
    if _current is None:
        _current = DB.from_url(get_settings().database_url)
        log.info("database engine created")
    return _current


async def fetch(sql: str, **params: Any) -> list[dict[str, Any]]:
    """Module-level convenience for code outside FastAPI (e.g. ai/change_detection.py)."""
    return await get_db().fetch(sql, **params)


async def fetchrow(sql: str, **params: Any) -> dict[str, Any] | None:
    return await get_db().fetchrow(sql, **params)


async def execute(sql: str, **params: Any) -> int:
    return await get_db().execute(sql, **params)
