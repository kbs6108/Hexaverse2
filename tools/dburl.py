"""Shared helpers for the CLI tools: DATABASE_URL normalisation and a psycopg connection.

The API uses SQLAlchemy's ``postgresql+asyncpg://`` scheme (with ``?ssl=require`` on Neon);
psycopg wants plain ``postgresql://`` and ``sslmode=require``. Both spellings are accepted here.
"""

from __future__ import annotations

import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

__all__ = ["normalise_database_url", "resolve_database_url", "connect"]

_DEFAULT_URL = "postgresql://landstack:landstack@localhost:5432/landstack"


def normalise_database_url(url: str) -> str:
    """Return a libpq-compatible URL from an SQLAlchemy/asyncpg-flavoured one."""
    parts = urlsplit(url.strip())
    scheme = parts.scheme.split("+", 1)[0]
    if scheme == "postgres":
        scheme = "postgresql"
    if scheme != "postgresql":
        raise ValueError(f"unsupported DATABASE_URL scheme {parts.scheme!r}")
    query = []
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == "ssl":
            key, value = "sslmode", ("require" if value.lower() in {"true", "1", "require"} else value)
        query.append((key, value))
    return urlunsplit((scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def resolve_database_url(explicit: str | None = None) -> str:
    """Pick the URL from ``--database-url``, then ``DATABASE_URL``, then the docker-compose default."""
    return normalise_database_url(explicit or os.environ.get("DATABASE_URL") or _DEFAULT_URL)


def connect(url: str):
    """Open a psycopg 3 connection (autocommit off). Imported lazily so dry runs need no driver."""
    try:
        import psycopg
    except ImportError as exc:  # pragma: no cover - environment dependent
        raise SystemExit("psycopg is required: pip install 'psycopg[binary]'") from exc
    try:
        return psycopg.connect(url)
    except psycopg.OperationalError as exc:
        raise SystemExit(f"cannot connect to {url.split('@')[-1]}: {exc}".rstrip()) from exc
