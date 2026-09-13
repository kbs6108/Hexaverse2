"""Privacy masking for citizens without consent (CONTRACTS §5).

owner names → first letter + '***' per word; father_name removed; doc_no → last 4; units.owner_name masked;
`party.masked = true`. Applied after caching so the cache stays role-independent.
"""

from __future__ import annotations

import copy
from typing import Any

from landstack.auth import Principal


def mask_name(name: str | None) -> str | None:
    if not name:
        return name
    return " ".join((w[0] + "***") if w else w for w in str(name).split())


def mask_doc_no(doc_no: str | None) -> str | None:
    if not doc_no:
        return doc_no
    s = str(doc_no)
    return "****" + s[-4:] if len(s) > 4 else "****"


def should_mask(principal: Principal | None, ulpin: str) -> bool:
    """Officers/admins see everything; citizens only with a consent for the parcel."""
    if principal is None:
        return True
    if principal.is_officer:
        return False
    return ulpin not in principal.consents


def mask_cdm(cdm: dict[str, Any]) -> dict[str, Any]:
    """Return a masked deep copy of a CDM dict."""
    out = copy.deepcopy(cdm)
    party = out.setdefault("party", {})
    for owner in party.get("owners", []) or []:
        owner["name"] = mask_name(owner.get("name"))
        owner.pop("father_name", None)
    party["masked"] = True

    reg = out.setdefault("rights", {}).setdefault("registration", {})
    if reg:
        reg["doc_no"] = mask_doc_no(reg.get("doc_no"))
        for key in ("claimant", "executant"):
            if reg.get(key):
                reg[key] = mask_name(reg[key])

    for building in out.get("buildings", []) or []:
        for unit in building.get("units", []) or []:
            unit["owner_name"] = mask_name(unit.get("owner_name"))

    for enc in out.get("restrictions", {}).get("encumbrances", []) or []:
        if enc.get("holder") and enc.get("kind") not in ("mortgage", "lien", "charge"):
            enc["holder"] = mask_name(enc["holder"])
    return out
