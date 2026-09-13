"""Blob storage backends for generated reports: local filesystem or Google Cloud Storage."""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Protocol

from landstack.config import Settings, get_settings


class Storage(Protocol):
    async def put(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str: ...
    async def get(self, key: str) -> bytes | None: ...
    async def exists(self, key: str) -> bool: ...


class LocalStorage:
    def __init__(self, root: str | Path) -> None:
        self.root = Path(root)

    def _path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if self.root.resolve() not in path.parents and path != self.root.resolve():
            raise ValueError("invalid storage key")
        return path

    async def put(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_bytes, data)
        return key

    async def get(self, key: str) -> bytes | None:
        path = self._path(key)
        if not path.exists():
            return None
        return await asyncio.to_thread(path.read_bytes)

    async def exists(self, key: str) -> bool:
        return self._path(key).exists()


class GcsStorage:
    """Google Cloud Storage backend (requires the optional `google-cloud-storage` package)."""

    def __init__(self, bucket: str) -> None:
        from google.cloud import storage as gcs  # optional dependency

        self._bucket = gcs.Client().bucket(bucket)

    async def put(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        blob = self._bucket.blob(key)
        await asyncio.to_thread(blob.upload_from_string, data, content_type=content_type)
        return key

    async def get(self, key: str) -> bytes | None:
        blob = self._bucket.blob(key)
        if not await asyncio.to_thread(blob.exists):
            return None
        return await asyncio.to_thread(blob.download_as_bytes)

    async def exists(self, key: str) -> bool:
        return await asyncio.to_thread(self._bucket.blob(key).exists)


_storage: Storage | None = None


def get_storage(settings: Settings | None = None) -> Storage:
    global _storage
    if _storage is None:
        settings = settings or get_settings()
        _storage = (
            GcsStorage(settings.gcs_bucket)
            if settings.storage_backend == "gcs"
            else LocalStorage(settings.storage_local_dir)
        )
    return _storage


def use_storage(storage: Storage | None) -> None:
    global _storage
    _storage = storage
