"""Per-department post-processing applied after YAML mapping (structure derivations only)."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any


def _revenue(fragment: dict[str, Any], doc: dict[str, Any]) -> dict[str, Any]:
    owners = fragment.get("party", {}).get("owners") or []
    for o in owners:
        o.setdefault("share", round(1.0 / len(owners), 4) if owners else 1.0)
    if owners:
        fragment.setdefault("party", {})["owners"] = owners
    return fragment


def _registration(fragment: dict[str, Any], doc: dict[str, Any]) -> dict[str, Any]:
    deeds = (doc.get("deeds") or {}).get("items") or []
    reg = fragment.setdefault("rights", {}).setdefault("registration", {})
    reg["status"] = "registered" if deeds else "unregistered"
    encs = fragment.setdefault("restrictions", {}).setdefault("encumbrances", [])
    for e in encs:
        if e.get("active") is None:
            e["active"] = True
    return fragment


def _planning(fragment: dict[str, Any], doc: dict[str, Any]) -> dict[str, Any]:
    perms = (doc.get("permissions") or {}).get("items") or []
    bp = fragment.setdefault("planning", {}).setdefault("building_permission", {})
    if not perms:
        bp["status"] = "none"
    elif not bp.get("status"):
        bp["status"] = perms[0].get("status") or "pending"
    return fragment


def _fiscal(fragment: dict[str, Any], doc: dict[str, Any]) -> dict[str, Any]:
    tax = fragment.setdefault("fiscal", {}).setdefault("tax", {})
    if tax.get("arrears") is None and tax:
        tax["arrears"] = 0
    return fragment


HOOKS: dict[str, Callable[[dict[str, Any], dict[str, Any]], dict[str, Any]]] = {
    "revenue": _revenue,
    "registration": _registration,
    "planning": _planning,
    "fiscal": _fiscal,
}
