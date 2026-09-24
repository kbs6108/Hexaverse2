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


def is_parcel_owner(principal: Principal | None, cdm: dict[str, Any] | None) -> bool:
    """True if the authenticated principal is the registered title owner of this parcel."""
    if principal is None or not principal.name or not cdm:
        return False
    p_name = principal.name.strip().lower()
    owners = (cdm.get("party") or {}).get("owners") or []
    for o in owners:
        o_name = (o.get("name") or "").strip().lower()
        if not o_name:
            continue
        if p_name == o_name or p_name in o_name or o_name in p_name:
            return True
        try:
            from landstack.services.consistency import name_score
            if name_score(p_name, o_name) >= 60:
                return True
        except Exception:
            pass
    return False


def should_mask(principal: Principal | None, ulpin: str, cdm: dict[str, Any] | None = None) -> bool:
    """Officers/admins see everything; title owners see their own land; other citizens require consent."""
    if principal is None:
        return True
    if principal.is_officer:
        return False
    if ulpin in principal.consents:
        return False
    if is_parcel_owner(principal, cdm):
        return False
    return True


def mask_cdm(cdm: dict[str, Any], prefs: dict[str, Any] | None = None) -> dict[str, Any]:
    """Return a masked deep copy of a CDM dict according to statutory privacy and owner preferences."""
    out = copy.deepcopy(cdm)
    prefs = prefs or {}
    public_owner_name = bool(prefs.get("public_owner_name", False))
    public_nominees = bool(prefs.get("public_nominees", False))
    public_deed_details = bool(prefs.get("public_deed_details", False))
    public_building_units = bool(prefs.get("public_building_units", True))
    public_utilities = bool(prefs.get("public_utilities", True))

    party = out.setdefault("party", {})
    if not public_owner_name:
        for owner in party.get("owners", []) or []:
            owner["name"] = mask_name(owner.get("name"))
            owner.pop("father_name", None)
        party["masked"] = True
    else:
        party["masked"] = False

    # Nominees: if owner turned off public_nominees, completely hide from public viewers
    ror = out.get("rights", {}).get("ror", {})
    if not public_nominees:
        if "nominees" in ror:
            ror["nominees"] = []
    else:
        for nom in ror.get("nominees", []) or []:
            nom["name"] = mask_name(nom.get("name"))

    reg = out.setdefault("rights", {}).setdefault("registration", {})
    if reg:
        if not public_deed_details:
            reg["doc_no"] = mask_doc_no(reg.get("doc_no"))
            for key in ("claimant", "executant"):
                if reg.get(key):
                    reg[key] = mask_name(reg[key])

    # Buildings & Units
    if not public_building_units:
        for building in out.get("buildings", []) or []:
            building["units"] = []
    else:
        for building in out.get("buildings", []) or []:
            for unit in building.get("units", []) or []:
                unit["owner_name"] = mask_name(unit.get("owner_name"))

    # Utilities
    if not public_utilities:
        out["utilities"] = None
    elif not public_owner_name and out.get("utilities"):
        util = out["utilities"]
        if isinstance(util, dict):
            for k in ("electricity_details", "water_details", "gas_details"):
                d = util.get(k)
                if isinstance(d, dict) and d.get("consumer_name"):
                    d["consumer_name"] = mask_name(d["consumer_name"])
            for h in util.get("history", []) or []:
                if isinstance(h, dict) and h.get("consumer_name"):
                    h["consumer_name"] = mask_name(h["consumer_name"])

    for enc in out.get("restrictions", {}).get("encumbrances", []) or []:
        if enc.get("holder") and enc.get("kind") not in ("mortgage", "lien", "charge"):
            enc["holder"] = mask_name(enc["holder"])
    return out
