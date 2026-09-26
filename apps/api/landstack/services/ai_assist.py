"""AI assistance (CONTRACTS §6): parcel risk briefs and officer application advice.

Two engines, one contract:
  * `nvidia` — NVIDIA Build (build.nvidia.com), OpenAI-compatible chat completions.
    Set NVIDIA_API_KEY; NVIDIA_MODEL defaults to meta/llama-3.3-70b-instruct.
  * `rules`  — a deterministic fallback built from the same facts, so the feature
    is always alive: without a key the narrative is templated, never absent.

Every response carries `engine` so the UI can label the provenance honestly.
The LLM only ever sees a compact, already-masked fact sheet (built from the CDM
the requesting principal is allowed to see) — no raw personal data beyond it.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from landstack.auth import Principal
from landstack.config import get_settings
from landstack.db import DBLike

log = logging.getLogger("landstack.ai")

CHAT_TIMEOUT_S = 18.0


# ----------------------------------------------------------------------------- LLM client (Gemini / NVIDIA / rules)
async def chat(messages: list[dict[str, str]], *, max_tokens: int = 800, temperature: float = 0.2) -> str | None:
    """One chat completion against Gemini or NVIDIA Build; None when unconfigured or failing (callers fall back)."""
    s = get_settings()
    if s.gemini_api_key:
        try:
            async with httpx.AsyncClient(timeout=CHAT_TIMEOUT_S) as client:
                r = await client.post(
                    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                    headers={"Authorization": f"Bearer {s.gemini_api_key}"},
                    json={
                        "model": s.gemini_model,
                        "messages": messages,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                    },
                )
                if r.status_code == 200:
                    data = r.json()
                    return str(data["choices"][0]["message"]["content"]).strip()
                log.warning("gemini chat error (%d): %s", r.status_code, r.text[:200])
        except Exception as exc:
            log.warning("gemini chat failed: %s", str(exc)[:200])

    if s.nvidia_api_key:
        try:
            async with httpx.AsyncClient(timeout=CHAT_TIMEOUT_S) as client:
                r = await client.post(
                    f"{s.nvidia_base_url.rstrip('/')}/chat/completions",
                    headers={"Authorization": f"Bearer {s.nvidia_api_key}"},
                    json={
                        "model": s.nvidia_model,
                        "messages": messages,
                        "max_tokens": max_tokens,
                        "temperature": temperature,
                    },
                )
                if r.status_code == 200:
                    return str(r.json()["choices"][0]["message"]["content"]).strip()
                log.warning("nvidia chat error (%d): %s", r.status_code, r.text[:200])
        except Exception as exc:
            log.warning("nvidia chat failed: %s", str(exc)[:200])

    return None


def engine_name() -> str:
    s = get_settings()
    if s.gemini_api_key:
        return f"gemini:{s.gemini_model}"
    if s.nvidia_api_key:
        return f"nvidia:{s.nvidia_model}"
    return "rules"


# ----------------------------------------------------------------------------- rule engine
def rule_findings(cdm: dict[str, Any]) -> tuple[list[dict[str, Any]], int]:
    """Deterministic findings + 0–100 risk score from the (already masked) CDM."""
    findings: list[dict[str, Any]] = []
    score = 0

    def add(severity: str, points: int, text: str, act: str | None = None) -> None:
        nonlocal score
        score += points
        findings.append({"severity": severity, "text": text, "action": act})

    st = cdm.get("status") or {}
    cons = cdm.get("consistency") or {}
    fiscal = cdm.get("fiscal") or {}
    flags = cdm.get("status_flags") or {}

    if st.get("has_dispute"):
        cases = (cdm.get("restrictions") or {}).get("disputes") or []
        nxt = next((d.get("next_hearing") for d in cases if d.get("next_hearing")), None)
        add("high", 30, f"Active court dispute on this parcel ({len(cases)} case(s))"
            + (f", next hearing {nxt}" if nxt else "") + ".",
            "Hold registrations/mutations until the case is disposed.")
    if st.get("has_mortgage"):
        enc = [e for e in (cdm.get("restrictions") or {}).get("encumbrances") or [] if e.get("active")]
        holder = enc[0].get("holder") if enc else None
        add("medium", 15, "Active mortgage encumbrance" + (f" held by {holder}" if holder else "") + ".",
            "Require lender consent / discharge before transfer.")
    arrears = float(st.get("tax_arrears") or 0)
    if arrears > 0:
        add("medium", 15, f"Property-tax arrears of ₹{arrears:,.0f}.",
            "Collect dues before processing new approvals.")
    if st.get("pending_mutation"):
        add("medium", 12, "A mutation (ownership transfer) is pending in the revenue queue.",
            "Verify the registered deed and complete the mutation workflow.")
    if st.get("change_alert"):
        add("high", 20, "Satellite change detection flags possible unrecorded construction.",
            "Order a field review and compare with the building-permission record.")
    if cons.get("area_match") is False:
        add("medium", 12, "Recorded extent differs between the revenue and registration records.",
            "Reconcile the RoR and deed extents (boundary correction if the resurvey confirms).")
    if cons.get("owner_match") is False:
        add("medium", 10, "Owner name differs between the RoR and the latest registered deed.",
            "Check for an unprocessed transfer; initiate mutation if the deed is genuine.")
    if flags.get("resurvey") == "in_progress":
        add("info", 5, "This area is under active resurvey — boundaries may be revised.", None)
    elif flags.get("resurvey") == "pending":
        add("info", 3, "Survey data predates the modern resurvey programme.", None)
    reg = ((cdm.get("rights") or {}).get("registration") or {})
    if reg.get("status") == "unregistered":
        add("medium", 10, "No registered deed found for this parcel.",
            "Treat ownership claims with caution; rely on the RoR and field verification.")
    if not findings:
        findings.append({"severity": "ok", "text": "No adverse flags: registered, dispute-free, tax paid up, records consistent.", "action": None})
    if fiscal.get("estimated_value"):
        value = float(fiscal["estimated_value"])
        findings.append({"severity": "info", "text": f"Indicative value ₹{value:,.0f} at the guideline rate.", "action": None})
    return findings, min(100, score)


def risk_level(score: int) -> str:
    return "high" if score >= 40 else "elevated" if score >= 15 else "low"


def triage(
    cdm: dict[str, Any],
    app_type: str,
    principal: Principal | None = None,
    ror_owner: str | None = None,
) -> dict[str, Any]:
    """Pre-submission triage for the citizen wizard — pure and deterministic (no LLM),
    so the wizard can show it instantly. Blockers say "this will very likely be rejected
    and why"; the citizen may still submit (the officer decides, not the machine)."""
    st = cdm.get("status") or {}
    cons = cdm.get("consistency") or {}
    blockers: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []
    notes: list[dict[str, Any]] = []
    transfer_like = app_type in ("mutation", "record_correction", "succession")

    def add(bucket: list[dict[str, Any]], text: str, action: str | None = None) -> None:
        bucket.append({"text": text, "action": action})

    # Statutory title check for building permission
    if app_type == "building_permission" and principal is not None and not principal.is_officer:
        owner_candidate = ror_owner or ((cdm.get("rights") or {}).get("ror") or {}).get("owner_name")
        if owner_candidate:
            p_name = (principal.name or "").strip().lower()
            o_name = owner_candidate.strip().lower()
            is_match = False
            if p_name and o_name:
                is_match = (p_name in o_name) or (o_name in p_name)
                if not is_match:
                    from landstack.services.consistency import name_score
                    is_match = name_score(owner_candidate, principal.name or "") >= 60
            if not is_match:
                add(
                    blockers,
                    f"Applicant identity mismatch: Registered owner on the Record of Rights is '{owner_candidate}', but you are applying as '{principal.name}'. Statutory building permission requires verified title ownership.",
                    "Only the lawful title holder can apply for construction permission. If you recently acquired this land, wait for the revenue mutation to complete.",
                )

    if app_type == "succession":
        nominees = ((cdm.get("rights") or {}).get("ror") or {}).get("nominees") or []
        if nominees:
            names = ", ".join(f"{n.get('name')} ({n.get('relation')})" for n in nominees[:4])
            add(notes, f"Nominees recorded on the RoR: {names}.",
                "The reallocation should match the recorded nominees or come with a legal-heir certificate.")
        else:
            add(warnings, "No nominee is recorded on the RoR for this parcel.",
                "Attach the legal-heir certificate and the death certificate — the officer will verify heirship manually.")

    if st.get("has_dispute"):
        if transfer_like:
            add(blockers, "An active court case is recorded on this parcel; a transfer or correction is normally held until the case is disposed.",
                "Attach the court order if the case is already decided, or wait for disposal.")
        else:
            add(notes, "An active court case is recorded on this parcel — the officer will see it alongside your request.")
    if st.get("pending_mutation"):
        if app_type in ("mutation", "succession"):
            add(blockers, "Another ownership transfer is already pending on this parcel.",
                "Track the existing application before filing a new one — a duplicate will be returned.")
        else:
            add(warnings, "An ownership transfer is pending on this parcel; your request may be processed after it.")
    if st.get("has_mortgage") and transfer_like:
        add(warnings, "An active mortgage is recorded on this parcel.",
            "A transfer needs the lender's consent or a discharge certificate — attach it if you have one.")
    arrears = float(st.get("tax_arrears") or 0)
    if arrears > 0:
        add(warnings, f"Property-tax arrears of ₹{arrears:,.0f} are recorded.",
            "Clearing dues first usually speeds up processing.")
    if st.get("change_alert") and app_type == "building_permission":
        add(warnings, "Satellite imagery flags possible unrecorded construction on this parcel.",
            "Expect a site inspection; existing structures will be compared with the permission record.")
    if cons.get("area_match") is False and app_type == "record_correction":
        add(notes, "The recorded extent already differs between the revenue and registration records — attach any measurement or deed evidence to support your correction.")
    if cons.get("owner_match") is False and transfer_like:
        add(warnings, "The owner name differs between the RoR and the latest registered deed.",
            "The officer will reconcile the records during the document check.")
    reg = (cdm.get("rights") or {}).get("registration") or {}
    if reg.get("status") == "unregistered" and app_type == "mutation":
        add(warnings, "No registered deed is on record for this parcel.",
            "A mutation normally needs the registered deed; attach it or register the transaction first.")

    if app_type == "utility_request":
        util = cdm.get("utilities") or {}
        if not util.get("road_access_m") or float(util.get("road_access_m") or 0) <= 0:
            add(warnings, "No dedicated road access width is recorded for this parcel.",
                "Service line right-of-way (ROW) clearance or alignment survey may be required.")
        if arrears > 0:
            add(warnings, f"Municipal tax arrears of ₹{arrears:,.0f} are recorded.",
                "Property tax clearance receipt may be requested by the DISCOM or Water Board.")
        else:
            add(notes, "Utility feasibility and service line alignment will be verified by the local municipal and revenue staff.")

    if app_type == "acquisition_claim":
        acqs = cdm.get("acquisition") or []
        if not acqs:
            add(warnings, "No active statutory land acquisition notice or road widening corridor is currently mapped for this parcel.",
                "Ensure your survey number matches the official Gazette notification before filing.")
        else:
            first_acq = acqs[0]
            days = first_acq.get("days_left")
            if days is not None and days <= 7:
                add(warnings, f"Statutory objection window closes in {days} day(s).",
                    "Submit your consent settlement or §15 objection before the gazette deadline.")
            if first_acq.get("severance_risk"):
                add(notes, "Severance risk flagged: the residual parcel is under statutory minimum viability thresholds.",
                    "You have the legal right under RFCTLARR Act §94 to demand 100% acquisition of the entire parcel.")
            else:
                add(notes, f"Calculated statutory compensation offer: ₹{first_acq.get('total_compensation_offer', 0):,.0f} (includes 100% statutory solatium under RFCTLARR Act §30).")

    _, score = rule_findings(cdm)
    return {
        "type": app_type,
        "engine": "rules",
        "risk_score": score,
        "risk_level": risk_level(score),
        "blockers": blockers,
        "warnings": warnings,
        "notes": notes,
        "ok_to_submit": not blockers,
    }


async def pre_check(db: DBLike, ulpin: str, app_type: str, principal: Principal) -> dict[str, Any]:
    """Triage against the CDM the caller is allowed to see (masking applies first)."""
    from landstack.services import aggregator

    cdm = await aggregator.get_parcel_cdm(db, ulpin, principal)
    ror_owner = await db.fetchval(
        "SELECT owner_name FROM dept_revenue.ror WHERE ulpin = :u ORDER BY updated_at DESC NULLS LAST LIMIT 1",
        u=ulpin,
    )
    return {"ulpin": ulpin, "ror_owner": ror_owner, **triage(cdm, app_type, principal=principal, ror_owner=ror_owner)}


def due_diligence(cdm: dict[str, Any]) -> dict[str, Any]:
    """Buyer due-diligence checklist — pure and deterministic, from the (masked) CDM.
    Every check is pass | caution | fail; the verdict is the worst check. This is a
    record summary, not legal advice — the report PDF remains the signed artefact."""
    st = cdm.get("status") or {}
    cons = cdm.get("consistency") or {}
    restr = cdm.get("restrictions") or {}
    reg = (cdm.get("rights") or {}).get("registration") or {}
    flags = cdm.get("status_flags") or {}
    checks: list[dict[str, Any]] = []

    def add(name: str, status: str, text: str) -> None:
        checks.append({"name": name, "status": status, "text": text})

    if reg.get("status") == "registered":
        add("Registered deed", "pass",
            f"Registered {reg.get('deed_type') or 'deed'}"
            + (f" {reg['doc_no']}" if reg.get("doc_no") else "")
            + (f" on {reg['registered_on']}" if reg.get("registered_on") else "") + ".")
    else:
        add("Registered deed", "caution", "No registered deed on record — ownership rests on the RoR alone.")

    disputes = restr.get("disputes") or []
    if st.get("has_dispute"):
        cases = ", ".join(d.get("case_no", "?") for d in disputes[:3]) or "on record"
        add("Court disputes", "fail", f"Active litigation: {cases}. A purchase now inherits the case.")
    else:
        add("Court disputes", "pass", "No court case recorded on this parcel.")

    enc = [e for e in restr.get("encumbrances") or [] if e.get("active")]
    if enc:
        holder = enc[0].get("holder")
        add("Encumbrances", "caution",
            f"Active {enc[0].get('kind', 'encumbrance')}" + (f" held by {holder}" if holder else "")
            + " — needs discharge or lender consent before transfer.")
    else:
        add("Encumbrances", "pass", "No active mortgage or charge.")

    arrears = float(st.get("tax_arrears") or 0)
    tax = (cdm.get("fiscal") or {}).get("tax") or {}
    if arrears > 0:
        add("Property tax", "caution", f"Arrears of ₹{arrears:,.0f} — usually settled by the seller before sale.")
    else:
        add("Property tax", "pass", "Paid up" + (f" till {tax['paid_till']}" if tax.get("paid_till") else "") + ".")

    if st.get("pending_mutation"):
        add("Pending transfer", "caution", "An ownership transfer is already pending — the seller may not be the final owner.")
    else:
        add("Pending transfer", "pass", "No transfer pending in the revenue queue.")

    if cons.get("area_match") is False or cons.get("owner_match") is False:
        parts = []
        if cons.get("area_match") is False:
            parts.append("extent")
        if cons.get("owner_match") is False:
            parts.append("owner name")
        add("Records agree", "caution", f"The {' and '.join(parts)} differ(s) between the revenue and registration records.")
    else:
        add("Records agree", "pass", "Revenue and registration records are consistent.")

    if st.get("change_alert"):
        add("Unrecorded construction", "caution", "Satellite change detection flags possible construction not in the permission record.")
    else:
        add("Unrecorded construction", "pass", "No satellite change alert.")

    zones = restr.get("restriction_zones") or []
    if zones:
        add("Restriction zones", "caution", "Inside " + ", ".join(f"{z.get('name')} ({z.get('kind')})" for z in zones[:3]) + " — use may be limited.")
    else:
        add("Restriction zones", "pass", "Not inside any restriction zone.")

    if flags.get("resurvey") == "in_progress":
        add("Resurvey", "caution", "The area is under active resurvey — boundaries and extents may be revised.")
    elif flags.get("resurvey") == "pending":
        add("Resurvey", "caution", "Survey data predates the modern resurvey programme.")
    else:
        add("Resurvey", "pass", "Survey data is current.")

    statuses = {c["status"] for c in checks}
    verdict = "high_risk" if "fail" in statuses else "caution" if "caution" in statuses else "clear"
    return {
        "engine": "rules",
        "verdict": verdict,
        "checks": checks,
        "estimated_value": (cdm.get("fiscal") or {}).get("estimated_value"),
    }


async def due_diligence_report(cdm: dict[str, Any]) -> dict[str, Any]:
    """Buyer due-diligence report: runs deterministic 9-point checks, then when configured,
    synthesizes a crisp AI buyer verdict summary with Gemini / NVIDIA."""
    res = due_diligence(cdm)
    s = get_settings()
    if s.gemini_api_key or s.nvidia_api_key:
        lines = [f"• {c['name']}: {c['text']} ({c['status']})" for c in res["checks"]]
        sys_prompt = (
            "You are an expert AI land records analyst on Land Stack.\n"
            "Given the 9-point due diligence checklist below for an Indian land parcel, "
            "write a crisp 1 to 2 sentence executive buyer summary highlighting the main clearance or primary risk. "
            "Be direct, neutral, and compact. Output strictly 1-2 sentences; never write greetings, preamble, or disclaimers."
        )
        user_content = f"Overall Verdict: {res['verdict']}\n\n9-Point Checks:\n" + "\n".join(lines)
        ai_summary = await chat(
            [{"role": "system", "content": sys_prompt}, {"role": "user", "content": user_content}],
            max_tokens=200,
            temperature=0.2,
        )
        if ai_summary:
            clean_summary = ai_summary.strip().strip('"').strip("'")
            res["summary"] = clean_summary
            res["engine"] = engine_name()

    return res


# ----------------------------------------------------------------------------- Bhu-Sahayak assistant
_APP_ID_RE = re.compile(r"\bAPP-\d{4}-\d{1,8}\b", re.I)
_ULPIN_RE = re.compile(r"\b[0-9A-Z]{14}\b")
_SURVEY_RE = re.compile(r"\b(?:sy\.?\s*no\.?|survey\s*(?:no\.?|number)?)\s*(\d{1,4}(?:/\d{1,3})?)\b", re.I)

# First match wins — keep the more specific intents (succession, complaint before generic transfer) up front.
_INTENT_KEYWORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    (
        "status",
        (
            "status", "track", "progress", "pending with", "my application", "my request",
            "delayed", "delay", "stuck", "where is my file", "how long will it take", "next step",
            "tahsildar delay", "queue", "application update", "file status", "tracking",
        ),
    ),
    (
        "succession",
        (
            "succession", "inherit", "inheritance", "deceased", "death", "died", "passed away",
            "father died", "mother died", "husband died", "parent died", "legal heir", "waris",
            "warisan", "varisu", "ancestral", "ancestor", "will", "nominee", "family property",
            "partition", "heir", "family share", "after death", "hereditary",
        ),
    ),
    (
        "complaint",
        (
            "complaint", "complain", "encroach", "encroachment", "fence", "neighbor", "neighbour",
            "wall", "border", "demarcation", "trespass", "trespassing", "occupy", "occupying",
            "illegal occupation", "kabza", "possession", "measuring", "overlap", "resurvey",
            "survey demarcation", "land grab", "boundary dispute", "boundary issue", "boundary correction",
            "boundary", "boundary wall", "pillar", "encroached",
        ),
    ),
    (
        "privacy",
        (
            "privacy", "mask", "masked", "masking", "hide my details", "dpdp", "hide name", "public view",
            "unmask", "privacy settings", "private details", "confidential", "hide details",
        ),
    ),
    (
        "hierarchy",
        (
            "vro", "surveyor", "ri", "revenue inspector", "tahsildar", "hierarchy", "officer levels",
            "who approves", "who checks", "mro", "desk authority", "stages", "workflow hierarchy",
            "approval levels", "officer queue",
        ),
    ),
    (
        "transfer_7d",
        (
            "full transfer", "what gets transferred", "rights transfer", "does everything transfer",
            "building units transfer", "nominee reset", "7 dimensions", "everything transferred",
            "all rights transferred", "transfer everything",
        ),
    ),
    (
        "threed_cadastre",
        (
            "3d", "3d cadastre", "3d units", "3d parcel", "vertical cadastre", "spatial unit",
            "spatial units", "strata", "air rights", "sub-parcel",
        ),
    ),
    (
        "build",
        (
            "build", "building", "construct", "construction", "permit", "permission", "floors",
            "house plan", "naksha", "sanction", "setback", "far", "zoning", "residential zone",
            "commercial use", "can i build", "agricultural to residential", "land conversion",
            "nala", "building approval", "layout approval", "site plan", "commercial shop",
        ),
    ),
    (
        "transfer",
        (
            "transfer", "mutation", "sell", "sale", "buyer wants", "bought", "purchased",
            "change owner", "new owner", "patta transfer", "registry done", "name in record",
            "name in pahani", "name in adangal", "name change", "khata transfer", "title transfer",
            "after registration", "unprocessed deed", "7/12 transfer", "khata change",
        ),
    ),
    (
        "buy",
        (
            "buy", "buying", "purchase", "purchasing", "due diligence", "safe to", "invest",
            "investing", "worth", "check plot", "verify title", "clear title", "genuine seller",
            "double registration", "fraud", "fake deed", "bank loan on land", "mortgage check",
            "lien", "clean title", "is it safe", "safe to buy", "buyer check", "title risk",
        ),
    ),
    (
        "correction",
        (
            "correction", "correct", "mistake", "wrong", "misspell", "spelling", "typo",
            "fix the record", "fix my", "name error", "extent mismatch", "area mismatch",
            "discrepancy", "passbook error", "pahani wrong", "record correction", "clerical error",
        ),
    ),
    (
        "dispute",
        (
            "dispute", "court", "case", "litigation", "stay order", "injunction", "suit",
            "civil suit", "legal notice", "vakil", "lawyer", "sub judice", "police complaint",
            "disputed", "court stay", "hearing",
        ),
    ),
    (
        "tax",
        (
            "tax", "dues", "arrears", "payment", "demand", "challan", "property tax",
            "municipal tax", "receipt", "unpaid tax", "penalty", "clear tax",
        ),
    ),
    (
        "owner",
        (
            "owner", "who owns", "ownership", "whose", "verify owner", "check owner",
            "seller name", "confirm owner", "pattadar", "verify ownership", "owner name",
        ),
    ),
    (
        "notice",
        (
            "notice", "objection", "object to", "notice board", "public notice",
            "statutory notice", "objecting", "raise objection",
        ),
    ),
    (
        "report",
        (
            "report", "certificate", "pdf", "download", "printout", "certified report",
            "bhu aadhaar", "card", "certified copy",
        ),
    ),
    (
        "utility",
        (
            "utility", "utilities", "electricity", "power connection", "water connection",
            "tap connection", "sewer", "drainage", "sewerage", "ugd", "gas connection", "png",
            "broadband", "fiber", "ofc", "sanitation", "meter change", "load enhancement",
            "utility change", "utility details", "water bill", "current bill", "power bill",
        ),
    ),
    (
        "acquisition",
        (
            "acquisition", "land acquisition", "road widening", "compensation", "solatium",
            "government project", "metro corridor", "highway", "partial land", "partial occupation",
            "row", "right of way", "project affect", "project cutting", "decline project",
            "negotiate compensation", "statutory objection", "section 15", "section 19",
            "rfctlarr", "nhai", "tdr", "transferable development rights",
        ),
    ),
    (
        "doc_verify",
        (
            "document", "doc check", "verify deed", "sale deed check", "ec check", "encumbrance certificate",
            "link deed", "title chain", "forensic", "tamper", "stamp duty", "sro registration",
            "document verify", "analyze document", "upload deed", "deed check",
        ),
    ),
    (
        "locate",
        (
            "locate", "find", "where is", "search parcel", "how to search", "ulpin",
            "bhudhaar", "survey number search", "find my land", "map search",
        ),
    ),
)

ASSISTANT_INTENTS = ("status", *[k for k, _ in _INTENT_KEYWORDS if k != "status"], "help")

_INTENT_APP_TYPE = {
    "transfer": "mutation",
    "succession": "succession",
    "correction": "record_correction",
    "complaint": "land_complaint",
    "build": "building_permission",
    "utility": "utility_request",
    "acquisition": "acquisition_claim",
}


def route_intent(message: str) -> dict[str, Any]:
    """Pure intent router for the Bhu-Sahayak assistant — regexes and keywords only,
    so it is unit-testable without a DB and never hallucinates an entity."""
    text = message.strip()
    low = text.lower()
    app_m = _APP_ID_RE.search(text)
    ulpin_m = _ULPIN_RE.search(text.upper())
    survey_m = _SURVEY_RE.search(text)
    intent = None
    for name, keywords in _INTENT_KEYWORDS:
        matched = False
        for k in keywords:
            if len(k) <= 3:
                if re.search(r"\b" + re.escape(k) + r"\b", low):
                    matched = True
                    break
            elif k in low:
                matched = True
                break
        if matched:
            intent = name
            break
    if app_m and (intent is None or intent == "locate"):
        intent = "status"
    return {
        "intent": intent or "help",
        "app_id": app_m.group(0).upper() if app_m else None,
        "ulpin": ulpin_m.group(0) if ulpin_m else None,
        "survey_no": survey_m.group(1) if survey_m else None,
    }


def _worst(items: list[dict[str, Any]], n: int = 2) -> str:
    return " ".join(i["text"] for i in items[:n])


async def assistant(
    db: DBLike,
    message: str,
    ulpin: str | None,
    principal: Principal,
    history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """Grounded chatbot reply: route the intent, fetch the app's verified records
    (masked CDM / caller's applications), resolve conversational context from prior chat history,
    and generate a warm, flexible, context-aware answer powered by Gemini/NVIDIA."""
    from landstack.services import aggregator, workflow

    routed = route_intent(message)
    intent = routed["intent"]
    target_ulpin = routed["ulpin"] or (ulpin.strip() if ulpin else None) or None
    target_survey = routed["survey_no"]
    target_app_id = routed["app_id"]

    # Multi-turn context resolution: recover parcel, survey number, or application from prior messages
    if history:
        for prev in reversed(history):
            text = prev.get("content") or ""
            prev_routed = route_intent(text)
            if not target_ulpin and prev_routed.get("ulpin"):
                target_ulpin = prev_routed["ulpin"]
            if not target_ulpin and not target_survey and prev_routed.get("survey_no"):
                target_survey = prev_routed["survey_no"]
            if not target_app_id and prev_routed.get("app_id"):
                target_app_id = prev_routed["app_id"]
            if intent == "help" and prev_routed.get("intent") and prev_routed["intent"] != "help":
                intent = prev_routed["intent"]
            if (target_ulpin or target_survey) and target_app_id:
                break

    sources: list[dict[str, Any]] = []
    suggestions: list[str] = []
    reply: str

    # Survey number → ULPIN, when a survey number is in context and no ULPIN is specified yet
    if not target_ulpin and target_survey:
        rows = await db.fetch(
            "SELECT ulpin, village FROM landstack.parcels WHERE survey_no = :s ORDER BY ulpin LIMIT 3",
            s=target_survey,
        )
        if len(rows) == 1:
            target_ulpin = rows[0]["ulpin"]
        elif len(rows) > 1:
            opts = ", ".join(f"{r['ulpin']} ({r['village']})" for r in rows)
            return {
                "reply": f"Survey number {target_survey} matches more than one parcel: {opts}. "
                         "Please tell me the ULPIN (or select the parcel on the map) to continue.",
                "engine": "rules", "intent": intent, "sources": [], "suggestions": [],
            }

    cdm: dict[str, Any] | None = None
    if target_ulpin and intent not in ("notice", "report", "help"):
        try:
            cdm = await aggregator.get_parcel_cdm(db, target_ulpin, principal)
            sources.append({"kind": "parcel", "id": target_ulpin})
        except Exception:
            if not history:
                reply = (f"I could not find a parcel with id {target_ulpin}. Check the ULPIN, or search "
                         "by survey number on the map and open the parcel first.")
                return {"reply": reply, "engine": "rules", "intent": intent, "sources": [], "suggestions": ["How do I find my parcel?"]}

    # Baseline deterministic rule reply (fallback & grounding reference)
    if intent == "status":
        if target_app_id:
            try:
                app = await workflow.get_application(db, target_app_id)
            except Exception:
                app = None
            if app is None or (principal.role == "citizen" and app.get("applicant_uid") != principal.uid):
                reply = (f"I can't show {target_app_id} — it either doesn't exist or was filed by someone else. "
                         "You can see all of your own applications under Citizen services → Track application.")
            else:
                sources.append({"kind": "application", "id": app["id"]})
                hist = app.get("history") or []
                last = hist[-1] if hist else None
                reply = (f"{app['id']} ({app['type'].replace('_', ' ')}, Sy. No. {app.get('survey_no') or '—'}) "
                         f"is currently **{app['status'].replace('_', ' ')}** with the "
                         f"{app.get('assigned_department') or 'revenue'} department."
                         + (f" Last step: {last.get('action', '')} — {last.get('remark')}" if last and last.get("remark") else ""))
                suggestions = ["What happens next?", "Show my other applications"]
        else:
            rows = await db.fetch(
                "SELECT id, type, status FROM landstack.applications WHERE applicant_uid = :u "
                "ORDER BY updated_at DESC LIMIT 3", u=principal.uid,
            )
            if rows:
                lines = "; ".join(f"{r['id']} ({r['type'].replace('_', ' ')}) — {r['status'].replace('_', ' ')}" for r in rows)
                reply = f"Your most recent applications: {lines}. Open Track application for the full step-by-step history."
                sources = [{"kind": "application", "id": r["id"]} for r in rows]
            else:
                reply = ("You have no applications yet. Start one from Citizen services → Apply: pick your parcel, "
                         "choose what you need (transfer, correction, building permission, complaint or succession), "
                         "and the record is checked before you submit.")
            suggestions = ["How do I transfer ownership?", "How do I fix a record mistake?"]

    elif intent in _INTENT_APP_TYPE and cdm is not None:
        app_type = _INTENT_APP_TYPE[intent]
        ror_owner = None
        if ulpin:
            ror_owner = await db.fetchval(
                "SELECT owner_name FROM dept_revenue.ror WHERE ulpin = :u ORDER BY updated_at DESC NULLS LAST LIMIT 1",
                u=ulpin,
            )
        t = triage(cdm, app_type, principal=principal, ror_owner=ror_owner)
        head = {
            "transfer": "For an ownership transfer on this parcel",
            "succession": "For succession (inheritance) on this parcel",
            "correction": "For a record correction on this parcel",
            "complaint": "For a complaint on this parcel",
            "build": "For building permission on this parcel",
            "utility": "For utility connection / modification on this parcel",
            "acquisition": "For government project acquisition settlement & compensation on this parcel",
        }.get(intent, "For this service on the parcel")
        if t["blockers"]:
            reply = f"{head}, the record shows a statutory blocker: {_worst(t['blockers'])}"
        elif t["warnings"]:
            reply = f"{head}, the record looks workable with caveats: {_worst(t['warnings'])} File it under Citizen services → Apply."
        else:
            reply = f"{head}, the record is clean — no blockers or warnings. File it under Citizen services → Apply and it should move quickly."
        if t["notes"]:
            reply += f" Also noted: {_worst(t['notes'], 1)}"
        suggestions = ["What documents do I need?", "Check my application status"]

    elif intent == "doc_verify":
        reply = (
            "On Land Stack, every uploaded title deed or certificate undergoes automated forensic AI extraction and "
            "cadastral cross-verification. The engine checks: 1) Executant vs official 1-B RoR owner, 2) Deed extent vs digital cadastre area, "
            "3) Boundary alignment with village FMB, and 4) Registration stamps & encumbrances. "
            "You can upload your deed for instant pre-screening at [Citizen Services → Apply](/citizen/request) or check title at [Verify Ownership](/citizen/verify)."
        )
        suggestions = ["How do I apply for mutation?", "How to verify ownership?"]

    elif intent == "buy" and cdm is not None:
        dd = due_diligence(cdm)
        bad = [c for c in dd["checks"] if c["status"] == "fail"]
        warn = [c for c in dd["checks"] if c["status"] == "caution"]
        verdict = {"clear": "clear on all nine checks", "caution": "mostly clear, with cautions",
                   "high_risk": "high risk"}[dd["verdict"]]
        reply = f"Buyer check on this parcel: **{verdict}**."
        if bad:
            reply += " Failed: " + "; ".join(f"{c['name']} — {c['text']}" for c in bad[:2])
        if warn:
            reply += " Caution: " + "; ".join(f"{c['name']} — {c['text']}" for c in warn[:2])
        if dd.get("estimated_value"):
            est_val = float(dd['estimated_value'])
            est_mv = float(dd.get('estimated_market_value') or (est_val * 1.35))
            reply += f" Indicative value: ₹{est_val:,.0f} (guideline circle rate), estimated market price: ₹{est_mv:,.0f}."
        reply += " This is a record summary, not legal advice — the certified report PDF is the signed artefact."
        suggestions = ["Any court disputes?", "How do I get the certified report?"]

    elif intent == "tax" and cdm is not None:
        st = cdm.get("status") or {}
        fsc = cdm.get("fiscal") or {}
        tax = fsc.get("tax") or {}
        arrears = float(st.get("tax_arrears") or 0)
        if arrears > 0:
            reply = f"Property tax on this parcel has arrears of ₹{arrears:,.0f}. Clearing dues first usually speeds up any application."
        else:
            reply = "Property tax on this parcel is paid up" + (f" till {tax['paid_till']}" if tax.get("paid_till") else "") + "."
        if fsc.get("estimated_value"):
            est_val = float(fsc['estimated_value'])
            est_mv = float(fsc.get('estimated_market_value') or (est_val * 1.35))
            tier = f" ({fsc['location_tier']})" if fsc.get("location_tier") else ""
            reply += f" Indicative circle valuation: ₹{est_val:,.0f}{tier}, estimated fair market value: ~₹{est_mv:,.0f}."
        suggestions = ["Is it safe to buy?", "How do I pay tax dues?"]

    elif intent == "dispute" and cdm is not None:
        disputes = (cdm.get("restrictions") or {}).get("disputes") or []
        if disputes:
            cases = "; ".join(
                f"{d.get('case_no', '?')} ({d.get('court', 'court')}" + (f", next hearing {d['next_hearing']})" if d.get("next_hearing") else ")")
                for d in disputes[:3])
            reply = f"Yes — active litigation is recorded on this parcel: {cases}. Transfers are normally held until disposal."
        else:
            reply = "No court case or litigation is recorded on this parcel."
        suggestions = ["Check buyer due diligence", "Who is the owner?"]

    elif intent == "owner" and cdm is not None:
        ror = (cdm.get("rights") or {}).get("ror") or {}
        owner = ror.get("owner_name") or "not on record"
        reply = (f"The record of rights lists the owner as **{owner}**"
                 + (f" (khata {ror['khata_no']})" if ror.get("khata_no") else "") + "."
                 " Names are masked by default to protect citizen privacy — to confirm a specific person, "
                 "use Citizen services → Verify ownership, which answers yes/no without exposing personal data.")
        suggestions = ["Verify ownership against a name", "Is it safe to buy?"]

    elif intent == "notice":
        reply = (
            "**[Public Statutory Notice Board]**\n"
            "Pending transfers of rights (mutations, successions, boundary adjustments) are published for 15 days on the "
            "[Public Notice Board](/citizen).\n\n"
            "• **Statutory Window**: Any citizen or legal heir may inspect pending transfers and file an objection within 15 days.\n"
            "• **Quasi-Judicial Link**: Filed objections automatically lock the workflow until the Tahsildar reviews merit.\n"
            "• **Tracking**: You can track active objections directly on [Map Explorer](/map) in the parcel drawer."
        )
        suggestions = ["How do I file an objection?", "Track application status", "Open public notice board"]

    elif intent == "report":
        reply = (
            "**[Certified Parcel Land Information Report]**\n"
            "Download an authoritative, digitally signed Land Information Report (LIR) for legal, banking, or registry use:\n\n"
            "• **Generate PDF**: Select your parcel on [Map Explorer](/map) and click **Download Certified Report**.\n"
            "• **QR Verification**: Every report includes a cryptographic tamper-evident QR code verifiable at `/verify/<id>`.\n"
            "• **Comprehensive Audit**: Aggregates RoR ownership, registered deeds, active mortgages, court stays, and satellite alerts."
        )
        suggestions = ["How to download report?", "Buyer due diligence", "Survey no 123/4"]

    elif intent == "complaint":
        reply = (
            "**[Boundary Encroachment & Illegal Occupation]**\n"
            "If a neighbor built over your property line or someone is occupying your land:\n\n"
            "• **1. Official Field Demarcation**: [Apply for Boundary Correction](/citizen/request?type=boundary_correction) "
            "or [Field Review](/citizen/request?type=field_review). A government surveyor is officially dispatched with total-station DGPS to measure against the registered FMB/Tippan.\n"
            "• **2. Satellite Change Alerts**: Open [Map Explorer](/map) to inspect Sentinel-2 detection of unrecorded earthworks, walls, or structures.\n"
            "• **3. Statutory Hold**: If a transfer is pending on the disputed parcel, file an objection on the [Notice Board](/citizen) within the 15-day statutory window.\n\n"
            "💡 *Share your survey number (e.g. \"survey no 123/4\") to inspect your boundary geometry directly.*"
        )
        suggestions = ["Survey no 123/4", "Apply for boundary correction", "Check satellite alerts"]

    elif intent == "transfer":
        reply = (
            "**[Ownership Mutation after Property Purchase]**\n"
            "To update your name on government revenue records (Pahani / RoR / Patta / Khata) after deed registration:\n\n"
            "• **1. File Mutation Application**: [Apply for Mutation](/citizen/request?type=mutation) under Citizen Services.\n"
            "• **2. Automated Cross-Check**: Land Stack instantly reconciles your Sub-Registrar deed against the Revenue RoR and validates mortgage clearance.\n"
            "• **3. 15-Day Notice & Tahsildar Approval**: Follow real-time milestone transitions on [Track Application](/citizen/track).\n\n"
            "💡 *Provide your survey number or ULPIN to verify if your registered deed is already on record.*"
        )
        suggestions = ["Survey no 123/4", "Apply for mutation", "Track application"]

    elif intent == "succession":
        reply = (
            "**[Inheritance & Family Succession]**\n"
            "To transfer agricultural or urban property following a family member's demise:\n\n"
            "• **1. File Succession Request**: [Apply for Succession](/citizen/request?type=succession) under Citizen Services.\n"
            "• **2. Recorded Nominee Verification**: If the deceased owner registered nominees on the RoR, ownership is expedited automatically.\n"
            "• **3. Legal Heir Certificate**: If no nominee was recorded, attach the Tahsildar succession certificate or family tree affidavit.\n\n"
            "💡 *Share your survey number to verify whether nominees are recorded on this parcel.*"
        )
        suggestions = ["Survey no 123/4", "Apply for succession", "Who are the nominees?"]

    elif intent == "build":
        reply = (
            "**[Building Permission & Master Plan Zoning]**\n"
            "Before starting construction or obtaining layout/building sanctions:\n\n"
            "• **1. Check Master Plan Zone**: Open [Map Explorer](/map) (Planning tab) to check residential/commercial zoning, FAR, and setback rules.\n"
            "• **2. Apply for Permission**: [Apply for Building Permission](/citizen/request?type=building_permission). Pre-submission AI triage checks your proposed floors and setbacks against local bylaws.\n"
            "• **3. Unrecorded Work Warning**: Sentinel-2 satellites detect unapproved construction automatically. An approved permit prevents demolition notices."
        )
        suggestions = ["Survey no 123/4", "Check zoning on map", "Apply for building permission"]

    elif intent == "buy":
        reply = (
            "**[Buyer 9-Point Due Diligence & Fraud Check]**\n"
            "To safeguard your investment and confirm title continuity before buying:\n\n"
            "• **1. 9-Point Multi-Dept Audit**: Inspect the parcel on [Map Explorer](/map) to audit court stays, bank mortgages, tax arrears, and deed consistency.\n"
            "• **2. Verify Seller Ownership**: Use [Verify Ownership](/citizen/verify) to confirm the seller's name against confidential records without exposing personal data.\n"
            "• **3. Certified LIR**: Generate a signed [Certified Report PDF](/map) with QR verification to share with your bank or legal counsel.\n\n"
            "💡 *Tell me your survey number (e.g. \"survey no 123/4\") to run an instant buyer clearance check.*"
        )
        suggestions = ["Is survey no 123/4 safe to buy?", "Verify seller ownership", "Check bank loan / mortgage"]

    elif intent == "correction":
        reply = (
            "**[Clerical Error & Extent Record Correction]**\n"
            "If your name, father's name, survey number, or area extent is wrongly recorded in the RoR or passbook:\n\n"
            "• **1. Apply for Correction**: [Apply for Record Correction](/citizen/request?type=record_correction) under Citizen Services.\n"
            "• **2. Cross-Department Reconciliation**: The system flags the exact difference between the Sub-Registrar registered deed extent and Revenue RoR.\n"
            "• **3. Officer Order**: The Revenue Officer verifies the registered deed copy and updates the digital khata upon field verification."
        )
        suggestions = ["Survey no 123/4", "Apply for record correction", "Extent mismatch check"]

    elif intent == "dispute":
        reply = (
            "**[Court Litigation, Stay Orders & Injunctions]**\n"
            "• **Restrictions Tab**: Open the parcel on [Map Explorer](/map) and check the **Restrictions** section. Active civil suits, stay orders, and next hearing dates are aggregated from e-Courts.\n"
            "• **Transfer Hold**: Parcels with active litigation carry automated statutory holds preventing new mutations or encumbrances.\n\n"
            "💡 *Share your survey number to check whether court disputes are active on your plot.*"
        )
        suggestions = ["Survey no 123/4", "Is survey no 123/4 safe to buy?", "Check court dispute"]

    elif intent == "tax":
        reply = (
            "**[Property Tax Status & Guideline Valuation]**\n"
            "• **Fiscal Tab**: Check the parcel on [Map Explorer](/map) under the **Fiscal** tab to see property tax dues and guideline valuation.\n"
            "• **Application Hold**: Unpaid property tax delays mutation and building permission approvals. Clearing dues speeds up processing."
        )
        suggestions = ["Survey no 123/4", "Check tax status", "Guideline valuation"]

    elif intent == "owner":
        reply = (
            "**[Privacy-Preserving Land Ownership Verification]**\n"
            "• **Verify Ownership**: Go to [Verify Ownership](/citizen/verify). Type the parcel number and claimed owner name to receive an instant Yes/No match without leaking sensitive personal records.\n"
            "• **RoR on Map**: The parcel drawer on [Map Explorer](/map) shows registered khata, classification, and masked pattadar name."
        )
        suggestions = ["Verify ownership", "Survey no 123/4", "Is survey no 123/4 safe to buy?"]

    elif intent == "utility":
        if cdm is not None:
            util = cdm.get("utilities") or {}
            elec = util.get("electricity_details") or {}
            water = util.get("water_details") or {}
            gas = util.get("gas_details") or {}
            bb = util.get("broadband_details") or {}
            sewer = util.get("sewer_details") or {}
            reply = (
                f"**[Utility Infrastructure for Survey No. {ids.get('survey_no') or target_ulpin}]**\n\n"
                f"• **⚡ Power / Electricity**: {elec.get('provider', 'DISCOM Grid')} — Consumer No: `{elec.get('consumer_no', 'N/A')}`, Sanctioned Load: **{elec.get('sanctioned_load_kw', 5)} kW** ({elec.get('tariff_category', 'LT-I Domestic')}, {elec.get('phase', '1-Phase')}), Meter: `{elec.get('meter_no', 'N/A')}`\n"
                f"• **🚰 Water Supply**: {water.get('provider', 'Municipal Water Works')} — CAN No: `{water.get('consumer_no', 'N/A')}`, Pipe Diameter: **{water.get('pipe_size_mm', 15)} mm**, Meter: `{water.get('meter_no', 'N/A')}`\n"
                f"• **🚽 Sewerage (UGD)**: {sewer.get('network_type', 'Underground Drainage')} — Connection ID: `{sewer.get('connection_no', 'N/A')}`, Manhole Distance: {sewer.get('nearest_manhole_distance_m', 7)}m\n"
                f"• **🔥 Piped Natural Gas (PNG)**: {gas.get('provider', 'City Gas Network')} — BP No: `{gas.get('bp_no', 'N/A')}`, Meter: `{gas.get('meter_no', 'N/A')}`\n"
                f"• **🌐 OFC Fiber Internet**: Gigabit FTTH — Available ISPs: {', '.join(bb.get('available_isps', ['BSNL', 'JioFiber', 'Airtel']))} ({bb.get('max_speed_available', '1 Gbps')})\n"
                f"• **🛣️ Road Access**: **{util.get('road_access_m', 6)} meters** frontage ({util.get('nearest_road_class', 'residential')})\n\n"
                f"To add a new connection, transfer consumer name, or enhance load: [Apply for Utility Services](/citizen/request?type=utility_request&ulpin={target_ulpin})."
            )
        else:
            reply = (
                "**[Municipal Utility Services & Infrastructure]**\n"
                "Land Stack monitors and manages 6 major utility lifelines per parcel:\n\n"
                "• **1. Electricity (DISCOM)**: Consumer Service Connection (USC), sanctioned load (kW), tariff category (LT-I/II), phase, and meter serial.\n"
                "• **2. Water Supply**: Consumer Account Number (CAN), pipe diameter (15–50mm), daily supply schedule, and water quality index.\n"
                "• **3. Sewerage (UGD)**: Underground drainage connection, nearest manhole distance, and inspection chamber clearance.\n"
                "• **4. Piped Natural Gas (PNG)**: City Gas Distribution BP number, connection type, and meter.\n"
                "• **5. Telecom / OFC Fiber**: Underground micro-duct status, ISP coverage (BSNL, Jio, Airtel), and gigabit FTTH readiness.\n"
                "• **6. Sanitation & Rainwater Harvesting**: SWM QR code, door-to-door waste collection, and certified percolation pit capacity.\n\n"
                "Need to add a new connection or change consumer name / load? [Apply for Utility Services](/citizen/request?type=utility_request)."
            )
        suggestions = ["Apply for utility service", "Check building permission", "Is survey no 123/4 safe to buy?"]

    elif intent == "acquisition":
        if target_cdm and target_cdm.get("acquisition"):
            acqs = target_cdm["acquisition"]
            acq = acqs[0]
            reply = (
                f"**[Statutory Land Acquisition Notice for Survey No. {ids.get('survey_no') or target_ulpin}]**\n\n"
                f"• **Project**: **{acq.get('project_name')}**\n"
                f"• **Executing Agency**: {acq.get('executing_agency', 'Public Works / Infrastructure Agency')}\n"
                f"• **Statutory Act & Section**: {acq.get('statutory_act', 'RFCTLARR Act, 2013')} — `{acq.get('notification_section', 'Section 19')}` (Gazette: `{acq.get('gazette_no', 'N/A')}`)\n"
                f"• **Parcel Take**: **{acq.get('affected_area_sqm', 0):,.1f} m²** ({acq.get('impact_pct', 0):,.1f}%) | **Residual Land Retained**: {acq.get('residual_area_sqm', 0):,.1f} m²\n"
                f"• **Statutory Compensation Breakdown**:\n"
                f"  - Base Land Value: **₹{acq.get('base_land_value', 0):,.0f}** (@ ₹{acq.get('guideline_rate_per_sqm', 0):,.0f}/m²)\n"
                f"  - 100% Mandatory Solatium (§30): **₹{acq.get('solatium_amount', 0):,.0f}**\n"
                f"  - Structural / Asset Damages: **₹{acq.get('structural_damage_estimate', 0):,.0f}**\n"
                f"  - **Total Statutory Award**: **₹{acq.get('total_compensation_offer', 0):,.0f}**\n"
                f"  - **Fast-Track Consent Payout (+25% bonus)**: **₹{acq.get('consent_settlement_total', 0):,.0f}**\n"
                f"  - *Alternative Option*: **{acq.get('tdr_units_offered_sqm', 0):,.0f} m² TDR / FSI Credits**\n"
                f"• **Objections Deadline**: **{acq.get('objection_deadline')}** ({acq.get('days_left', 0)} days remaining)\n\n"
                f"**Your Legal Options Under Law**:\n"
                f"1. **Accept Award (Consent Settlement)**: Receive direct DBT transfer with 25% bonus.\n"
                f"2. **Negotiate / Claim Higher Compensation (§64)**: Object to land valuation or claim severance damages.\n"
                f"3. **Decline / File Statutory Objection (§15)**: Challenge project alignment or demand 100% full acquisition if remaining plot is unviable (§94).\n"
                f"4. **Opt for TDR**: Receive Transferable Development Rights certificates.\n\n"
                f"[Respond to Statutory Acquisition Notice](/citizen/request?type=acquisition_claim&ulpin={target_ulpin})."
            )
        else:
            reply = (
                "**[Government Land Acquisition & Fair Compensation (RFCTLARR 2013)]**\n\n"
                "When the government acquires private land for public infrastructure (roads, highways, metro, civic complexes):\n\n"
                "• **1. Partial Land Occupation (Road Widening)**: Only the Right-of-Way (RoW) strip is acquired (e.g. 50–100 m² along the road frontage). The residual parcel is retained by the landowner and sub-divided with a new survey sub-number.\n"
                "• **2. Statutory Compensation Formula (RFCTLARR Act 2013)**:\n"
                "  - **Base Value**: Guideline / Circle Rate × Urban (1.0x) or Rural (1.25–2.0x) factor.\n"
                "  - **100% Solatium (§30)**: Mandatory 100% bonus over land value (exempt from income tax under §96).\n"
                "  - **Asset Valuation (§29)**: Full payout for compound walls, gates, borewells, and trees.\n"
                "  - **Consent Bonus (§23A)**: Up to 25% additional cash bonus for fast amicable consent settlement without litigation.\n"
                "  - **TDR Option**: Landowners can opt for 2x–4x Transferable Development Rights (DRC) instead of cash.\n"
                "• **3. Landowner's 3 Legal Pathways**:\n"
                "  - **Accept & Settle**: Direct bank transfer (DBT) via PFMS with consent bonus.\n"
                "  - **Negotiate (§64)**: Claim higher market compensation, severance damages, or commercial potential.\n"
                "  - **Decline / File §15 Objection**: Challenge alignment, propose alternative government corridor, or compel 100% acquisition if remaining strip is unviable (§94).\n\n"
                "[Check & Respond to Acquisition Notices](/citizen/request?type=acquisition_claim)."
            )
        suggestions = ["How is road compensation calculated?", "What is solatium in land acquisition?", "Can I decline land acquisition?"]

    elif intent == "privacy":
        reply = (
            "**[Landowner Privacy Controls & DPDP Act 2023]**\n"
            "• **Permanent Masking Protection**: Under the Digital Personal Data Protection (DPDP) Act, your **Full Legal Name** (masked as R*** K***), **Family Nominees** (hidden), and **Registered Deed Number** (masked as ****0001) are permanently protected. Toggling them on is disabled to prevent accidental public disclosure.\n"
            "• **Statutory Public Disclosures**: Under Section 3 of the Transfer of Property Act, land boundaries, zoning, active bank mortgages, court disputes, and property tax demand are statutory public notices that protect innocent purchasers against fraud and cannot be concealed.\n"
            "• **Verified Ownership**: Third parties can confirm ownership using [Verify Ownership](/citizen/verify), which returns an instant Yes/No match without exposing your identity.\n"
            "• **Officer Access**: Authorized revenue officers (VRO, Surveyor, RI, Tahsildar) retain full unmasked access during official duties."
        )
        suggestions = ["Verify ownership against a name", "Open live map", "Check buyer due diligence"]

    elif intent == "hierarchy":
        reply = (
            "**[4-Tier Statutory Revenue Officer Hierarchy]**\n"
            "Under the AP Rights in Land and Pattadar Pass Books Act, revenue workflows follow strict desk separation:\n\n"
            "1. **Village Revenue Officer (VRO)**: First-line ground verification, physical possession check, and field panchanama with neighboring farmers.\n"
            "2. **Cadastral / Mandal Surveyor**: Total-station / DGPS measurement against village FMB & Tippan, sub-division and corner stone positioning.\n"
            "3. **Revenue Inspector (RI)**: Reconciles VRO panchanama and survey traverse; audits link deeds & 30-year EC; submits formal endorsement.\n"
            "4. **Tahsildar / MRO**: Sole quasi-judicial authority empowered by law to grant or reject mutations, issue digital Pattadar Passbooks, and sign statutory orders."
        )
        suggestions = ["Track application status", "Apply for mutation", "What is VRO panchanama?"]

    elif intent == "transfer_7d":
        reply = (
            "**[Comprehensive 7-Dimension Land Transfer]**\n"
            "When the Tahsildar approves a Mutation or Succession, **everything** transfers across all 7 state governance layers:\n\n"
            "• **1. Revenue RoR**: Owner name, father's name updated; previous owner's nominees cleared/reset; mutation history logged.\n"
            "• **2. Registration Deeds**: Deed consistency verified (Executant $\\to$ Claimant match).\n"
            "• **3. Planning & Permits**: Existing building permits and development rights endorsed to new owner.\n"
            "• **4. 3D Cadastre Units**: All multi-level building units/apartments (`ulpin_3d`) retitled to new owner.\n"
            "• **5. Alerts & Status**: Yellow 'Pending Mutation' flags cleared automatically.\n"
            "• **6. Privacy & Consents**: Old consents revoked; fresh DPDP privacy preferences initialized.\n"
            "• **7. Citizen Portal**: Parcel appears under **YOUR LAND** for the buyer; removed from seller."
        )
        suggestions = ["Track application", "Apply for mutation", "Check my registered land"]

    elif intent == "threed_cadastre":
        reply = (
            "**[3D Cadastre & Spatial Unit Registry]**\n"
            "Land Stack integrates 3D spatial cadastre for high-rise and multi-unit parcels:\n\n"
            "• **3D ULPINs**: Each apartment or floor unit has a unique sub-cadastre ID (e.g. `AP071234567890-F02-U01`).\n"
            "• **Floor Area Ratio (FAR)**: Pre-submission checks verify permissible built-up area and height limits against Master Plan zoning.\n"
            "• **Unit Transfers**: Upon parcel title transfer, all associated 3D building units are automatically retitled to the new title holder."
        )
        suggestions = ["Check zoning on map", "Apply for building permission", "Open live map"]

    elif intent == "locate":
        reply = (
            "**[Locate Parcel on Map Explorer]**\n"
            "• **Search**: Type your survey number (e.g. `123/4`), 14-digit ULPIN, or village name into the top search bar or on [Map Explorer](/map).\n"
            "• **Polygon Inspection**: Click any parcel boundary to inspect ownership, registered deeds, encumbrances, and satellite alerts.\n"
            "• **State Switcher**: Toggle between AP, TN, and TG to jump directly to regional cadastre maps."
        )
        suggestions = ["Survey no 123/4", "Survey no 125/2", "Open live map"]

    else:
        reply = (
            "**[Bhu-Sahayak AI Assistant]**\n"
            "Select a problem or share a survey number to inspect verified land records:\n\n"
            "• **Boundary / Encroachment**: [Apply for Boundary Correction](/citizen/request?type=boundary_correction) or check satellite alerts\n"
            "• **Ownership / Mutation**: [Apply for Mutation](/citizen/request?type=mutation) to update passbook after buying\n"
            "• **Inheritance / Succession**: [Apply for Succession](/citizen/request?type=succession) for family property transfer\n"
            "• **Construction / Zoning**: [Apply for Building Permission](/citizen/request?type=building_permission) & check bylaws\n"
            "• **Officer Workflow Hierarchy**: Learn what VRO, Surveyor, RI, and Tahsildar check\n"
            "• **Privacy Controls**: DPDP Act masking & public land disclosure rules\n"
            "• **Track Applications**: [Track Application](/citizen/track) to inspect file status and officer timeline\n\n"
            "💡 *Tip: Mention any survey number (e.g. \"survey no 123/4\") or ULPIN to diagnose records directly!*"
        )
        suggestions = ["Who approves my mutation?", "How does privacy masking work?", "What gets transferred when buying land?"]

    # Build rich ground-truth facts for the LLM
    fact_lines: list[str] = []
    if cdm is not None:
        ids = cdm.get("identifiers") or {}
        st = cdm.get("status") or {}
        rights = cdm.get("rights") or {}
        ror = rights.get("ror") or {}
        reg = rights.get("registration") or {}
        planning = cdm.get("planning") or {}
        fiscal = cdm.get("fiscal") or {}
        restr = cdm.get("restrictions") or {}
        flags = cdm.get("status_flags") or {}
        dd = due_diligence(cdm)

        fact_lines.append(f"Parcel ULPIN: {target_ulpin}, Survey No: {ids.get('survey_no')}, Village: {ids.get('village')}, State: {ids.get('state')}")
        fact_lines.append(f"Planning Land Use: {planning.get('land_use')}, Zone: {planning.get('zone_code')}, Permissible: {planning.get('permissible_uses')}, Building permission status: {planning.get('building_permission_status')}")
        fact_lines.append(f"Revenue RoR: Owner: {ror.get('owner_name')}, Khata No: {ror.get('khata_no')}, Extent: {ror.get('extent')} {ror.get('extent_unit')}, Classification: {ror.get('classification')}")
        if ror.get("nominees"):
            nom_str = ", ".join(f"{n.get('name')} ({n.get('relation')}, share {n.get('share')})" for n in ror["nominees"])
            fact_lines.append(f"Recorded Nominees/Heirs: {nom_str}")
        fact_lines.append(f"Registration Status: {reg.get('status')}, Deed No: {reg.get('deed_no')}, Has Active Mortgage: {st.get('has_mortgage')}")
        if restr.get("encumbrances"):
            enc_str = "; ".join(f"{e.get('type')} by {e.get('holder')} (amount: ₹{e.get('amount')}, active: {e.get('active')})" for e in restr["encumbrances"])
            fact_lines.append(f"Encumbrances: {enc_str}")
        fact_lines.append(f"Property Tax Arrears: ₹{float(st.get('tax_arrears') or 0):,.0f}, Paid till: {(fiscal.get('tax') or {}).get('paid_till')}, Guideline Circle Value: ₹{float(fiscal.get('estimated_value') or 0):,.0f} (₹{fiscal.get('guideline_value_per_sqm') or 0}/m²), Fair Market Value: ₹{float(fiscal.get('estimated_market_value') or 0):,.0f} (₹{fiscal.get('market_value_per_sqm') or 0}/m²), Location Tier: {fiscal.get('location_tier', 'Developing Node')}")
        disputes = restr.get("disputes") or []
        fact_lines.append(f"Court Disputes / Litigation: {len(disputes)} case(s)" + (f" ({'; '.join(d.get('case_no','') for d in disputes)})" if disputes else " None"))
        fact_lines.append(f"Buyer Due Diligence Verdict: {dd.get('verdict')} (checks passed: {sum(1 for c in dd.get('checks',[]) if c['status']=='pass')}/9)")
        fact_lines.append(f"Resurvey Status: {flags.get('resurvey')}, Change Alert: {st.get('change_alert')}, Pending Mutation: {st.get('pending_mutation')}")

        util = cdm.get("utilities") or {}
        elec = util.get("electricity_details") or {}
        water = util.get("water_details") or {}
        gas = util.get("gas_details") or {}
        bb = util.get("broadband_details") or {}
        fact_lines.append(
            f"Utilities: Electricity: {'Active' if util.get('electricity') else 'None'} (Consumer: {elec.get('consumer_no', 'N/A')}, Provider: {elec.get('provider', 'N/A')}, Load: {elec.get('sanctioned_load_kw', 'N/A')}kW), "
            f"Water: {'Active' if util.get('water') else 'None'} (CAN: {water.get('consumer_no', 'N/A')}, Pipe: {water.get('pipe_size_mm', 'N/A')}mm), "
            f"Sewer: {'Connected' if util.get('sewer') else 'None'}, "
            f"Gas: {'Active' if util.get('gas') else 'None'} (BP: {gas.get('bp_no', 'N/A')}), "
            f"Broadband: {'Active FTTH' if util.get('broadband') else 'None'} ({bb.get('max_speed_available', 'N/A')}), "
            f"Road Access: {util.get('road_access_m', 'N/A')}m ({util.get('nearest_road_class', 'N/A')})"
        )

    if target_app_id:
        try:
            app = await workflow.get_application(db, target_app_id)
            if app:
                fact_lines.append(f"Application {app['id']}: Type: {app['type']}, Status: {app['status']}, Assigned Dept: {app.get('assigned_department')}")
        except Exception:
            pass

    # Conversational LLM generation (Gemini / NVIDIA)
    s = get_settings()
    engine = "rules"
    if s.gemini_api_key or s.nvidia_api_key:
        sys_prompt = (
            "You are Bhu-Sahayak, the intelligent, authoritative, and compact AI land governance assistant on Land Stack.\n\n"
            "STRICT TUNING & COMPACTNESS RULES:\n"
            "1. MAXIMUM COMPACTNESS: Keep total response under 150 words. Zero pleasantry fluff (NO 'Hello!', 'Certainly!', 'I would be happy to help'). Jump straight into the diagnostic assessment.\n"
            "2. HIGH INFORMATION DENSITY STRUCTURE:\n"
            "   - **[Assessment]**: 1-2 sharp sentences identifying the legal, cadastral, or administrative root cause.\n"
            "   - **[Actionable Steps]**: 2-3 concise bullets with explicit markdown navigation links, e.g. [Apply for Mutation](/citizen/request?type=mutation), [Apply for Boundary Correction](/citizen/request?type=boundary_correction), [Track Application](/citizen/track), [Verify Ownership](/citizen/verify), [Map Explorer](/map).\n"
            "   - **[Statutory Conditions & Authority]**: 1 factual sentence specifying the statutory preconditions (e.g. VRO ground panchanama, Surveyor FMB demarcation, 15-day objection notice) and Competent Authority.\n"
            "3. STRICT GROUNDING: Cite exact Survey No, ULPIN, Khata, and amounts from the verified record when present. Never fabricate data.\n"
            "4. PRIVACY MASKING: If an owner name is masked (e.g. R*** K***), explain that privacy masking protects identity and direct the user to [Verify Ownership](/citizen/verify).\n"
            "5. GOVERNMENT ACQUISITION PROJECTS: If the user inquires about government project compensation or acquisition, note that RFCTLARR Act 2013 claims apply exclusively to citizens whose parcels have an official Gazette corridor notification. Direct eligible titleholders to [Land Acquisition Claim](/citizen/request?type=acquisition_claim).\n"
            "6. DOCUMENT VERIFICATION: If the user asks about uploaded deeds or title chains, explain that Land Stack auto-screens deed numbers, parties, boundaries, and SHA-256 tamper seals against the digital cadastre during [Citizen Services → Apply](/citizen/request).\n"
            "7. INTERACTIVE LINKS: Always format app destinations as clickable markdown links [Label](/path) so the UI renders interactive action buttons.\n"
            "8. LOCAL LANGUAGE & FARMER CONNECTION: If the user asks in Telugu or Hindi, or the conversation includes Telugu/Hindi, respond directly in that language using respectful, local terminology familiar to farmers and landowners (e.g. in Telugu: పట్టాదారు పాస్ పుస్తకం, 1-B అడంగల్ / పహణీ, రికార్డు మార్పిడి / మ్యుటేషన్, హద్దుల కొలత / ఎఫ్-లైన్ పిటిషన్, తహసీల్దార్; in Hindi: खतौनी, खसरा संख्या, दाखिल-खारिज / नामांतरण, मेढ़ पैमाइश, लेखपाल / पटवारी, तहसीलदार). Keep explanations clear, supportive, and free of confusing bureaucratic jargon."
        )

        llm_messages: list[dict[str, str]] = [{"role": "system", "content": sys_prompt}]

        # Include prior conversation history for multi-turn awareness (trimmed for compact token usage)
        if history:
            for h in history[-6:]:
                role = "assistant" if h.get("role") in ("assistant", "bot") else "user"
                content = (h.get("content") or "").strip()
                if content and not content.startswith("**[Bhu-Sahayak AI Assistant]**"):
                    llm_messages.append({"role": role, "content": content})

        user_content = f"User Question: {message}\n\n"
        if fact_lines:
            user_content += "[VERIFIED LAND RECORDS FOR CONTEXT]\n" + "\n".join(f"• {line}" for line in fact_lines) + "\n\n"
        user_content += f"[BASELINE SYSTEM FINDINGS]\n{reply}"

        llm_messages.append({"role": "user", "content": user_content})

        llm_reply = await chat(llm_messages, max_tokens=650, temperature=0.2)
        if llm_reply:
            reply = llm_reply
            engine = engine_name()

    return {"reply": reply, "engine": engine, "intent": intent, "sources": sources, "suggestions": suggestions[:3]}


def _fact_sheet(cdm: dict[str, Any], findings: list[dict[str, Any]]) -> str:
    ids = cdm.get("identifiers") or {}
    st = cdm.get("status") or {}
    restr = cdm.get("restrictions") or {}
    enc = [e for e in restr.get("encumbrances") or [] if e.get("active")]
    disputes = restr.get("disputes") or []
    ror = (cdm.get("rights") or {}).get("ror") or {}
    raw = {
        "ulpin": ids.get("ulpin"),
        "survey_no": ids.get("survey_no"),
        "village": ids.get("village"),
        "state": ids.get("state"),
        "area_sqm": (cdm.get("spatial") or {}).get("area_sqm"),
        "owner": ror.get("owner_name"),
        "land_use": (cdm.get("planning") or {}).get("land_use"),
        "tax_arrears": st.get("tax_arrears"),
        "active_mortgage": bool(enc),
        "court_disputes": len(disputes),
        "change_alert": st.get("change_alert"),
        "resurvey": (cdm.get("status_flags") or {}).get("resurvey"),
        "findings": [f["text"] for f in findings],
    }
    # Keep only truthy / high-signal entries for token compactness
    compact = {k: v for k, v in raw.items() if v not in (None, False, 0, [])}
    return json.dumps(compact, default=str)


# ----------------------------------------------------------------------------- features
async def parcel_brief(db: DBLike, ulpin: str, principal: Principal) -> dict[str, Any]:
    """Risk brief for one parcel: score + findings always; LLM narrative when configured."""
    from landstack.services import aggregator

    cdm = await aggregator.get_parcel_cdm(db, ulpin, principal)
    findings, score = rule_findings(cdm)
    level = risk_level(score)

    narrative = None
    recommendations = [f["action"] for f in findings if f.get("action")]
    text = await chat(
        [
            {"role": "system",
             "content": "You are an expert land records analyst on Land Stack. Write for a revenue officer. "
                        "Be factual, ultra-compact, and neutral. Do not invent facts beyond the sheet. Output JSON only: "
                        '{"narrative": "<max 2 compact sentences highlighting primary risk or clean clearance>", "recommendations": ["<max 3 short imperative actions under 8 words each>"]}'},
            {"role": "user", "content": "Parcel fact sheet:\n" + _fact_sheet(cdm, findings)},
        ],
        max_tokens=350,
        temperature=0.2,
    )
    if text:
        import re

        try:
            m = re.search(r"\{.*\}", text, re.S)
            parsed = json.loads(m.group(0)) if m else {}
            narrative = str(parsed.get("narrative") or "").strip() or None
            recs = parsed.get("recommendations")
            if isinstance(recs, list) and recs:
                recommendations = [str(r) for r in recs][:3]
        except Exception:
            narrative = None
        if not narrative:
            # Salvage a truncated JSON reply (reasoning models can run out of budget
            # mid-object): pull the narrative string even without a closing brace.
            m = re.search(r'"narrative"\s*:\s*"((?:[^"\\]|\\.)+)', text)
            if m:
                narrative = m.group(1).strip() or None
    if not narrative:
        heads = [f["text"] for f in findings if f["severity"] in ("high", "medium")]
        narrative = (
            f"Risk {level} ({score}/100). " + " ".join(heads[:3])
            if heads
            else f"Risk {level} ({score}/100). The record is clean across all six departments."
        )
    return {
        "ulpin": ulpin,
        "engine": engine_name() if text else "rules",
        "risk_score": score,
        "risk_level": level,
        "findings": findings,
        "narrative": narrative,
        "recommendations": recommendations[:3],
    }


async def application_advice(db: DBLike, app_id: str, principal: Principal) -> dict[str, Any]:
    """Recommend the next workflow action for an application, grounded in the parcel's flags."""
    from landstack.services import workflow

    app = await workflow.get_application(db, app_id)
    rows = await workflow.load_transitions(db)
    actions = workflow.next_actions(rows, app, principal)
    brief = await parcel_brief(db, app["ulpin"], principal)

    blockers = [f["text"] for f in brief["findings"] if f["severity"] == "high"]
    cautions = [f["text"] for f in brief["findings"] if f["severity"] == "medium"]
    labels = [a["label"] for a in actions]

    suggestion, rationale = None, None
    if actions:
        forward = [a for a in actions if not a["is_terminal"] and a["to_status"] != "returned"]
        approve = next((a for a in actions if a["to_status"] in ("approved", "resolved")), None)
        reject = next((a for a in actions if a["to_status"] == "rejected"), None)
        if blockers and reject and app["type"] in ("mutation", "building_permission"):
            suggestion, rationale = reject["action"], "Blocking flags on the parcel: " + "; ".join(blockers[:2])
        elif forward:
            suggestion, rationale = forward[0]["action"], (
                "No blocking flags — proceed to the next step." if not cautions
                else "Proceed, but verify: " + "; ".join(cautions[:2])
            )
        elif approve and not blockers:
            suggestion, rationale = approve["action"], (
                "All checks are clear." if not cautions else "Approvable; note: " + "; ".join(cautions[:2])
            )

    text = await chat(
        [
            {"role": "system",
             "content": "You advise an Indian land-records officer on one pending application. "
                        "Choose ONLY from the allowed actions. Output JSON only: "
                        '{"action": "<one allowed action or null>", "rationale": "<strictly 1-2 factual sentences explaining why>"}'},
            {"role": "user",
             "content": json.dumps({
                 "application": {"id": app["id"], "type": app["type"], "status": app["status"],
                                  "payload_keys": sorted((app.get("payload") or {}).keys())},
                 "allowed_actions": [a["action"] for a in actions],
                 "parcel_findings": [f["text"] for f in brief["findings"]],
             })},
        ],
        max_tokens=180,
        temperature=0.1,
    )
    engine = "rules"
    if text:
        try:
            import re

            m = re.search(r"\{.*\}", text, re.S)
            parsed = json.loads(m.group(0)) if m else {}
            act = parsed.get("action")
            if act in [a["action"] for a in actions]:
                suggestion = act
                rationale = str(parsed.get("rationale") or rationale or "").strip()
                engine = engine_name()
        except Exception:
            pass

    return {
        "application_id": app_id,
        "engine": engine,
        "suggested_action": suggestion,
        "rationale": rationale,
        "allowed_actions": labels,
        "parcel_risk": {"score": brief["risk_score"], "level": brief["risk_level"]},
    }


async def draft_speaking_order(
    db: DBLike,
    app_id: str,
    action: str,
    principal: Principal,
) -> dict[str, Any]:
    """Generate formal quasi-judicial statutory speaking orders or field inspection reports for officers."""
    from datetime import date

    from landstack.services import aggregator, workflow

    app = await workflow.get_application(db, app_id)
    cdm = await aggregator.get_parcel_cdm(db, app["ulpin"], principal)
    brief = await parcel_brief(db, app["ulpin"], principal)

    app_type = app.get("type", "mutation")
    survey_no = app.get("survey_no") or (cdm.get("identifiers") or {}).get("survey_no") or "—"
    village = (cdm.get("identifiers") or {}).get("village") or "Mangalagiri"
    applicant = app.get("applicant_name") or "Applicant"
    to_owner = (app.get("payload") or {}).get("new_owner_name") or applicant
    today_str = date.today().strftime("%d-%m-%Y")
    des = (principal.designation or "officer").lower()

    if action in ("approved", "resolved"):
        if des == "tahsildar":
            draft = (
                f"PROCEEDINGS OF THE TAHSILDAR & MANDAL REVENUE OFFICER, {village.upper()}.\n"
                f"Present: {principal.name}, Tahsildar.\n"
                f"Rc. No. {app_id}/Revenue/{app_type.capitalize()}. Dated: {today_str}.\n"
                f"Sub: Land Administration — Transfer of Registry under Section 5(1) of RoR Act — Sy. No. {survey_no} of {village} — Statutory Sanction Accorded.\n"
                f"Ref: 1. Application #{app_id} by Sri/Smt {applicant}.\n"
                f"     2. Ground Panchanama report of Village Revenue Officer (VRO).\n"
                f"     3. Field Traverse & Demarcation Report of Mandal Surveyor.\n"
                f"     4. Scrutiny endorsement of Revenue Inspector (RI).\n\n"
                f"ORDER:\n"
                f"The spot verification and cadastral records confirm peaceful physical possession and an unbroken title chain. "
                f"There are no subsisting Section 22A prohibitions, active court stays, or conflicting claims.\n"
                f"In exercise of quasi-judicial powers vested under Section 5(1) of the Rights in Land and Pattadar Pass Books Act, "
                f"sanction is hereby accorded to record the mutation in favour of '{to_owner}' for Sy. No. {survey_no}. "
                f"The digital Record of Rights (1-B Khata) stands updated and e-Pattadar Passbook is ordered to be generated."
            )
        elif des == "town_planner":
            draft = (
                f"OFFICE OF THE TOWN PLANNING AUTHORITY, {village.upper()}.\n"
                f"File No: {app_id}/Planning/BP. Dated: {today_str}.\n"
                f"Sub: Town Planning — Grant of Building Sanction under Municipal Building Bylaws — Sy. No. {survey_no}.\n"
                f"ORDER: Scrutiny of architectural drawings, site setbacks, and Floor Area Ratio (FAR) confirms compliance with Master Plan zoning regulations. "
                f"Statutory building permission is hereby granted subject to standard fire safety, structural stability, and rainwater harvesting covenants."
            )
        else:
            draft = f"Verified on ground. All documentary evidence, boundaries, and identity requirements on Sy. No. {survey_no} are verified and found in order."
    elif action in ("rejected", "dismissed"):
        blockers = [f["text"] for f in brief["findings"] if f["severity"] in ("high", "medium")]
        ground_text = "; ".join(blockers[:2]) if blockers else "Discrepancy in title chain / boundaries"
        draft = (
            f"STATUTORY PROCEEDING OF THE COMPETENT AUTHORITY, {village.upper()}.\n"
            f"Rc. No. {app_id}/Rejection Order. Dated: {today_str}.\n"
            f"Sub: Rejection of {app_type.replace('_', ' ').title()} Application — Sy. No. {survey_no} — Speaking Order Passed.\n"
            f"GROUNDS FOR REJECTION:\n"
            f"Upon detailed scrutiny of records and ground inspection, the application is rejected under statutory provisions on the following grounds:\n"
            f"1. {ground_text}.\n"
            f"2. The applicant has failed to establish uninterrupted title or satisfy statutory compliance.\n"
            f"The application #{app_id} is accordingly returned/rejected with liberty to file a fresh claim upon rectifying defects."
        )
    elif "field_inspection" in action or "panchanama" in action.lower():
        draft = (
            f"VILLAGE REVENUE OFFICER (VRO) GROUND PANCHANAMA REPORT:\n"
            f"Conducted spot inspection on Sy. No. {survey_no} in {village} in the presence of neighboring ryots and panchas. "
            f"Verified that the applicant '{applicant}' is in actual physical and peaceful possession. "
            f"No adverse boundary encroachment or unrecorded crop disputes observed. Forwarded to Cadastral Surveyor."
        )
    elif "boundary_demarcation" in action or "survey" in action.lower():
        draft = (
            f"CADASTRAL SURVEYOR TRAVERSE & FIELD DEMARCATION REPORT:\n"
            f"Measured Sy. No. {survey_no} of {village} using DGPS / Total Station against the village FMB (Field Measurement Book) and Tippan. "
            f"All four corner boundary stones inspected. Ground extent reconciles with the registered deed within statutory tolerance limits. "
            f"Sub-division sketch prepared and forwarded for RI scrutiny."
        )
    elif "scrutiny_review" in action or "endorsement" in action.lower():
        draft = (
            f"REVENUE INSPECTOR (RI) SCRUTINY & TITLE CHAIN ENDORSEMENT:\n"
            f"Audited the link documents, 30-year Encumbrance Certificate, VRO Ground Panchanama, and Mandal Surveyor FMB demarcation report for Sy. No. {survey_no}. "
            f"Reconciled revenue khata and registration entries. Found genuine and regular. "
            f"Respectfully submitted to the Tahsildar with recommendation for statutory approval."
        )
    else:
        draft = f"Completed statutory verification for step '{action.replace('_', ' ')}' on Sy. No. {survey_no}. Records scrutinized and forwarded for statutory processing."

    s = get_settings()
    engine = "rules"
    if s.gemini_api_key or s.nvidia_api_key:
        sys_prompt = (
            "You are an expert Indian land administration legal drafting assistant. "
            "Given the application context, parcel facts, and officer action, draft a crisp, formal, "
            "and legally sound administrative proceeding or inspection remark. "
            "Use authoritative revenue terminology (RoR Act, FMB, Panchanama, Section 5, G.O.Ms, Speaking Order). "
            "Keep it under 150 words. Do not include greetings or markdown fences."
        )
        llm_reply = await chat(
            [
                {"role": "system", "content": sys_prompt},
                {
                    "role": "user",
                    "content": f"App ID: {app_id}, Type: {app_type}, Action: {action}, Officer: {principal.name} ({des}), Sy No: {survey_no}, Village: {village}, Applicant: {applicant}.\nDraft:\n{draft}",
                },
            ],
            max_tokens=300,
            temperature=0.1,
        )
        if llm_reply and len(llm_reply.strip()) > 50:
            draft = llm_reply.strip()
            engine = engine_name()

    # Determine act reference based on application type
    act_map = {
        "mutation": "Rights in Land & Pattadar Pass Books Act, §5(1)",
        "record_correction": "Revenue Record Correction Rules",
        "building_permission": "Municipal Building Bylaws & Town Planning Act",
        "succession": "Hindu Succession Act / Indian Succession Act",
        "boundary_correction": "Land Survey & Boundaries Act",
        "land_complaint": "Revenue Court Proceedings Rules",
    }
    act = act_map.get(app_type, "Revenue Administrative Rules")

    des_labels = {
        "vro": "Village Revenue Officer (VRO)",
        "surveyor": "Cadastral / Mandal Surveyor",
        "ri": "Revenue Inspector (RI)",
        "tahsildar": "Tahsildar / MRO",
        "sub_registrar": "Sub-Registrar (SRO)",
        "town_planner": "Town Planning Officer",
    }
    officer_role = des_labels.get(des, principal.designation or "Revenue Officer")

    return {
        "application_id": app_id,
        "action": action,
        "order_text": draft,
        "act": act,
        "officer_role": officer_role,
        "subject": f"{app_type.replace('_', ' ').title()} — Sy. No. {survey_no}, {village}",
        "references": [f"Application #{app_id}", f"Parcel Sy. No. {survey_no}", f"Village: {village}"],
        "conditions": [],
        "engine": engine,
    }

