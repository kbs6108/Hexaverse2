"""Shared fixtures: a scripted in-memory FakeDB (no Postgres) and integration-test gating."""

from __future__ import annotations

import copy
import os
from collections.abc import Callable
from contextlib import asynccontextmanager
from typing import Any

import pytest

from landstack import db as dbmod

Rows = list[dict[str, Any]] | Callable[[dict[str, Any]], list[dict[str, Any]]]


class FakeDB:
    """Answers SQL by substring rules (first match wins); records every statement for assertions."""

    def __init__(self) -> None:
        self.rules: list[tuple[str, Rows]] = []
        self.queries: list[tuple[str, dict[str, Any]]] = []
        self.executed: list[tuple[str, dict[str, Any]]] = []
        self.on("SELECT 1", [{"?column?": 1}])

    def on(self, needle: str, rows: Rows) -> FakeDB:
        self.rules.insert(0, (" ".join(needle.split()).lower(), rows))
        return self

    def _match(self, sql: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        flat = " ".join(sql.split()).lower()
        for needle, rows in self.rules:
            if needle in flat:
                return copy.deepcopy(rows(params) if callable(rows) else rows)
        return []

    async def fetch(self, sql: str, **params: Any) -> list[dict[str, Any]]:
        self.queries.append((sql, params))
        return self._match(sql, params)

    async def fetchrow(self, sql: str, **params: Any) -> dict[str, Any] | None:
        rows = await self.fetch(sql, **params)
        return rows[0] if rows else None

    async def fetchval(self, sql: str, **params: Any) -> Any:
        row = await self.fetchrow(sql, **params)
        return next(iter(row.values())) if row else None

    async def execute(self, sql: str, **params: Any) -> int:
        self.executed.append((sql, params))
        return 1

    @asynccontextmanager
    async def transaction(self):
        yield self

    def executed_like(self, needle: str) -> list[tuple[str, dict[str, Any]]]:
        n = " ".join(needle.split()).lower()
        return [(s, p) for s, p in self.executed if n in " ".join(s.split()).lower()]


@pytest.fixture
def fake_db() -> Any:
    db = FakeDB()
    dbmod.use_db(db)
    yield db
    dbmod.use_db(None)


@pytest.fixture
def client(fake_db: Any) -> Any:
    from fastapi.testclient import TestClient

    from landstack.main import create_app

    app = create_app()
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


def pytest_collection_modifyitems(config: Any, items: list[Any]) -> None:
    if os.environ.get("DATABASE_URL"):
        return
    skip = pytest.mark.skip(reason="integration test: set DATABASE_URL to run")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip)
