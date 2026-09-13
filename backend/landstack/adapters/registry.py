"""Chooses the `<dept>_<state>` mapping per parcel state (fallback `_ap`) and caches adapter instances."""

from __future__ import annotations

from functools import lru_cache

from landstack.adapters.base import DepartmentAdapter, HttpDepartmentAdapter
from landstack.adapters.mapping import MAPPINGS_DIR

DEPARTMENTS: tuple[str, ...] = ("revenue", "registration", "planning", "fiscal", "legal", "utilities")
DEFAULT_STATE = "ap"


def mapping_name_for(dept: str, state: str | None) -> str:
    candidate = f"{dept}_{(state or DEFAULT_STATE).lower()}"
    if (MAPPINGS_DIR / f"{candidate}.yaml").exists():
        return candidate
    return f"{dept}_{DEFAULT_STATE}"


@lru_cache(maxsize=32)
def get_adapter(dept: str, state: str | None = None) -> HttpDepartmentAdapter:
    return HttpDepartmentAdapter(dept, mapping_name_for(dept, state))


def get_adapters(state: str | None = None) -> list[DepartmentAdapter]:
    return [get_adapter(d, state) for d in DEPARTMENTS]
