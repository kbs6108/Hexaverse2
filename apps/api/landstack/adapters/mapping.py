"""YAML field-mapping engine used by `HttpDepartmentAdapter`.

Mapping file format (`adapters/mappings/<dept>_<state>.yaml`):

```yaml
source: "AP Meebhoomi (mock)"         # provenance label
department: revenue
id_field: ulpin                       # request parameter carrying the parcel id
endpoints:                            # fetched in order; bodies are keyed by name in the source document
  ror: {path: /revenue/ror, params: {ulpin: "{ulpin}"}}
units:                                # source path → unit of the source value; converted to sqm first
  ror.items[0].extent_hectares: hectare
map:                                  # source path → CDM dotted path (or list of paths)
  ror.items[0].owner_name: party.owners[0].name
lists:                                # list → list mapping with a per-item field map
  restrictions.encumbrances: {from: encumbrances.items, map: {kind: kind, holder: holder}}
```
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

MAPPINGS_DIR = Path(__file__).parent / "mappings"

TO_SQM: dict[str, float] = {
    "sqm": 1.0,
    "m2": 1.0,
    "hectare": 10_000.0,
    "ha": 10_000.0,
    "acre": 4046.8564224,
    "cent": 40.468564224,
    "cents": 40.468564224,
    "sqft": 0.09290304,
    "sqyd": 0.83612736,
    "gunta": 101.1714,
    "ground": 222.967,
}

_TOKEN = re.compile(r"([^.\[\]]+)|\[(-?\d+)\]")


def convert_to_sqm(value: Any, unit: str) -> float | None:
    """Convert an area in `unit` to square metres (rounded to 2 dp); None for missing/unknown."""
    if value is None or value == "":
        return None
    factor = TO_SQM.get(unit.lower().strip())
    if factor is None:
        raise ValueError(f"unknown area unit '{unit}'")
    return round(float(value) * factor, 2)


def parse_path(path: str) -> list[str | int]:
    tokens: list[str | int] = []
    for name, idx in _TOKEN.findall(path):
        tokens.append(int(idx) if idx != "" else name)
    return tokens


def get_path(doc: Any, path: str) -> Any:
    """Read `a.b[0].c` from nested dict/list; None when any hop is missing."""
    cur = doc
    for tok in parse_path(path):
        if isinstance(tok, int):
            if not isinstance(cur, list) or not (-len(cur) <= tok < len(cur)):
                return None
            cur = cur[tok]
        else:
            if not isinstance(cur, dict) or tok not in cur:
                return None
            cur = cur[tok]
    return cur


def set_path(target: dict[str, Any], path: str, value: Any) -> None:
    """Write `a.b[0].c = value`, creating dicts/lists (list slots padded with dicts) on the way."""
    tokens = parse_path(path)
    cur: Any = target
    for i, tok in enumerate(tokens):
        last = i == len(tokens) - 1
        nxt = tokens[i + 1] if not last else None
        if isinstance(tok, int):
            while len(cur) <= tok:
                cur.append({} if not isinstance(nxt, int) else [])
            if last:
                cur[tok] = value
            else:
                if cur[tok] is None:
                    cur[tok] = [] if isinstance(nxt, int) else {}
                cur = cur[tok]
        else:
            if last:
                cur[tok] = value
            else:
                if tok not in cur or cur[tok] is None:
                    cur[tok] = [] if isinstance(nxt, int) else {}
                cur = cur[tok]


@lru_cache(maxsize=64)
def load_mapping(name: str) -> dict[str, Any]:
    """Load `<name>.yaml` from the mappings dir (cached)."""
    path = MAPPINGS_DIR / f"{name}.yaml"
    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    data.setdefault("name", name)
    return data


def available_mappings() -> list[str]:
    return sorted(p.stem for p in MAPPINGS_DIR.glob("*.yaml"))


def apply_mapping(mapping: dict[str, Any], doc: dict[str, Any]) -> dict[str, Any]:
    """Translate a source document into a CDM fragment following the mapping spec."""
    fragment: dict[str, Any] = {}
    units: dict[str, str] = mapping.get("units") or {}
    for src, targets in (mapping.get("map") or {}).items():
        value = get_path(doc, src)
        if value is None:
            continue
        if src in units:
            value = convert_to_sqm(value, units[src])
        for target in targets if isinstance(targets, list) else [targets]:
            set_path(fragment, target, value)
    for target, spec in (mapping.get("lists") or {}).items():
        items = get_path(doc, spec["from"]) or []
        item_map: dict[str, str] = spec.get("map") or {}
        item_units: dict[str, str] = spec.get("units") or {}
        out: list[dict[str, Any]] = []
        for item in items:
            row: dict[str, Any] = {}
            for src_field, cdm_field in item_map.items():
                v = get_path(item, src_field)
                if v is None:
                    continue
                if src_field in item_units:
                    v = convert_to_sqm(v, item_units[src_field])
                set_path(row, cdm_field, v)
            out.append(row)
        set_path(fragment, target, out)
    for target, value in (mapping.get("constants") or {}).items():
        set_path(fragment, target, value)
    return fragment


def mapping_table(mapping: dict[str, Any]) -> dict[str, Any]:
    """JSON-friendly rendering for `GET /landstack/adapters`."""
    rows = []
    for src, targets in (mapping.get("map") or {}).items():
        for t in targets if isinstance(targets, list) else [targets]:
            unit = (mapping.get("units") or {}).get(src)
            rows.append(
                {
                    "source_field": src,
                    "cdm_path": t,
                    "cdm_field": t,
                    "unit": unit,
                    "transform": f"{unit} → sqm" if unit else None,
                }
            )
    for target, spec in (mapping.get("lists") or {}).items():
        for s, t in (spec.get("map") or {}).items():
            path = f"{target}[].{t}"
            rows.append(
                {
                    "source_field": f"{spec['from']}[].{s}",
                    "cdm_path": path,
                    "cdm_field": path,
                    "unit": None,
                    "transform": None,
                }
            )
    endpoints = mapping.get("endpoints") or {}
    return {
        "name": mapping.get("name"),
        "department": mapping.get("department"),
        "state": mapping.get("state"),
        "source": mapping.get("source"),
        "source_system": mapping.get("source"),
        "endpoints": endpoints,
        "endpoint": ", ".join(e["path"] if isinstance(e, dict) else str(e) for e in endpoints.values()) or None,
        "fields": rows,
    }
