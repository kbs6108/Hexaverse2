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
from typing import Any

import httpx

from landstack.auth import Principal
from landstack.config import get_settings
from landstack.db import DBLike

log = logging.getLogger("landstack.ai")

CHAT_TIMEOUT_S = 18.0


# ----------------------------------------------------------------------------- NVIDIA client
async def chat(messages: list[dict[str, str]], *, max_tokens: int = 500, temperature: float = 0.2) -> str | None:
    """One chat completion against NVIDIA Build; None when unconfigured or failing (callers fall back)."""
    s = get_settings()
    if not s.nvidia_api_key:
        return None
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
            r.raise_for_status()
            return str(r.json()["choices"][0]["message"]["content"]).strip()
    except Exception as exc:  # network, quota, model errors — degrade, never break the page
        log.warning("nvidia chat failed: %s", str(exc)[:200])
        return None


def engine_name() -> str:
    s = get_settings()
    return f"nvidia:{s.nvidia_model}" if s.nvidia_api_key else "rules"


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


def _fact_sheet(cdm: dict[str, Any], findings: list[dict[str, Any]]) -> str:
    ids = cdm.get("identifiers") or {}
    keep = {
        "survey_no": ids.get("survey_no"),
        "state": ids.get("state"),
        "village": ids.get("village"),
        "land_use": (cdm.get("planning") or {}).get("land_use"),
        "zone": (cdm.get("planning") or {}).get("zone_code"),
        "area_sqm": (cdm.get("spatial") or {}).get("area_sqm"),
        "status": cdm.get("status"),
        "resurvey": (cdm.get("status_flags") or {}).get("resurvey"),
        "findings": [f["text"] for f in findings],
    }
    return json.dumps(keep, default=str)


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
             "content": "You are a land-records analyst for an Indian land-governance platform. "
                        "Write for a revenue officer. Be factual, concise and neutral; do not invent "
                        "facts beyond the sheet. Output JSON only: "
                        '{"narrative": "<3-4 sentences>", "recommendations": ["<max 3 short imperative actions>"]}'},
            {"role": "user", "content": "Parcel fact sheet:\n" + _fact_sheet(cdm, findings)},
        ]
    )
    if text:
        try:
            import re

            m = re.search(r"\{.*\}", text, re.S)
            parsed = json.loads(m.group(0)) if m else {}
            narrative = str(parsed.get("narrative") or "").strip() or None
            recs = parsed.get("recommendations")
            if isinstance(recs, list) and recs:
                recommendations = [str(r) for r in recs][:3]
        except Exception:
            narrative = text[:600]
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
                        '{"action": "<one allowed action or null>", "rationale": "<2 sentences>"}'},
            {"role": "user",
             "content": json.dumps({
                 "application": {"id": app["id"], "type": app["type"], "status": app["status"],
                                  "payload_keys": sorted((app.get("payload") or {}).keys())},
                 "allowed_actions": [a["action"] for a in actions],
                 "parcel_findings": [f["text"] for f in brief["findings"]],
             })},
        ],
        max_tokens=250,
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
