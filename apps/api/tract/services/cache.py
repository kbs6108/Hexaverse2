"""Tiny in-process TTL cache (dict + monotonic clock) used for the per-ULPIN CDM."""

from __future__ import annotations

import time
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class TTLCache(Generic[T]):
    def __init__(self, ttl_s: float = 60.0, max_items: int = 5000) -> None:
        self.ttl_s = ttl_s
        self.max_items = max_items
        self._items: dict[str, tuple[float, T]] = {}

    def get(self, key: str) -> T | None:
        item = self._items.get(key)
        if item is None:
            return None
        expires, value = item
        if expires < time.monotonic():
            self._items.pop(key, None)
            return None
        return value

    def set(self, key: str, value: T, ttl_s: float | None = None) -> None:
        if len(self._items) >= self.max_items:
            now = time.monotonic()
            for k in [k for k, (exp, _) in self._items.items() if exp < now]:
                self._items.pop(k, None)
            if len(self._items) >= self.max_items:
                self._items.pop(next(iter(self._items)))
        self._items[key] = (time.monotonic() + (ttl_s if ttl_s is not None else self.ttl_s), value)

    def invalidate(self, key: str | None = None) -> None:
        if key is None:
            self._items.clear()
        else:
            self._items.pop(key, None)

    def __len__(self) -> int:
        return len(self._items)

    def stats(self) -> dict[str, Any]:
        return {"items": len(self._items), "ttl_s": self.ttl_s}
