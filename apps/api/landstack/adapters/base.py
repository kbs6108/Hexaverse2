"""Adapter protocol and the generic HTTP/YAML-driven implementation.

`HttpDepartmentAdapter.fetch(ulpin)` calls every endpoint listed in its mapping file, builds a source
document `{endpoint_name: body}`, applies the mapping to produce a CDM fragment, lets the department's
post-processor derive structural fields (registration status, permission status...) and returns
`AdapterResult(fragment, provenance)` where provenance is `{ok, ms, as_of, source, error}`.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

from landstack.adapters import client, postprocess
from landstack.adapters.mapping import apply_mapping, load_mapping


@dataclass
class AdapterResult:
    fragment: dict[str, Any] = field(default_factory=dict)
    provenance: dict[str, Any] = field(default_factory=dict)


@runtime_checkable
class DepartmentAdapter(Protocol):
    name: str
    source: str

    async def fetch(self, ulpin: str) -> AdapterResult: ...


def _now_iso() -> str:
    import datetime as dt

    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


class HttpDepartmentAdapter:
    """Department adapter driven by a YAML mapping (see `adapters/mapping.py`)."""

    def __init__(self, name: str, mapping_name: str) -> None:
        self.name = name
        self.mapping_name = mapping_name
        self.mapping = load_mapping(mapping_name)
        self.source: str = str(self.mapping.get("source") or name)

    def _endpoint_request(self, spec: Any, ulpin: str) -> tuple[str, dict[str, Any]]:
        if isinstance(spec, str):
            return spec, {self.mapping.get("id_field", "ulpin"): ulpin}
        params = {k: str(v).replace("{ulpin}", ulpin) for k, v in (spec.get("params") or {}).items()}
        if not params:
            params = {self.mapping.get("id_field", "ulpin"): ulpin}
        return spec["path"], params

    async def fetch_document(self, ulpin: str) -> dict[str, Any]:
        doc: dict[str, Any] = {}
        for key, spec in (self.mapping.get("endpoints") or {}).items():
            path, params = self._endpoint_request(spec, ulpin)
            doc[key] = await client.get_json(path, params=params)
        return doc

    def translate(self, doc: dict[str, Any]) -> dict[str, Any]:
        fragment = apply_mapping(self.mapping, doc)
        hook = postprocess.HOOKS.get(self.name)
        return hook(fragment, doc) if hook else fragment

    async def fetch(self, ulpin: str) -> AdapterResult:
        started = time.perf_counter()
        try:
            doc = await self.fetch_document(ulpin)
            fragment = self.translate(doc)
        except client.UpstreamError as exc:
            return AdapterResult({}, self._prov(started, ok=False, error=str(exc)))
        except Exception as exc:
            return AdapterResult({}, self._prov(started, ok=False, error=f"{type(exc).__name__}: {exc}"[:200]))
        as_of = next((b.get("as_of") for b in doc.values() if isinstance(b, dict) and b.get("as_of")), None)
        source = next((b.get("source") for b in doc.values() if isinstance(b, dict) and b.get("source")), None)
        return AdapterResult(fragment, self._prov(started, ok=True, as_of=as_of, source=source))

    def _prov(
        self, started: float, ok: bool, error: str | None = None, as_of: str | None = None, source: str | None = None
    ) -> dict[str, Any]:
        return {
            "ok": ok,
            "ms": int((time.perf_counter() - started) * 1000),
            "as_of": as_of if ok else None,
            "source": source or self.source,
            "error": error,
            "cached_as_of": None,
        }

    async def health(self) -> dict[str, Any]:
        started = time.perf_counter()
        try:
            body = await client.get_json(f"/{self.name}/health")
            return {"ok": True, "latency_ms": int((time.perf_counter() - started) * 1000), "note": body.get("status")}
        except Exception as exc:
            return {"ok": False, "latency_ms": int((time.perf_counter() - started) * 1000), "note": str(exc)[:200]}
