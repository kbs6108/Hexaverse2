"""Transition-table logic with the §8 rows held in memory."""

from __future__ import annotations

from landstack.auth import Principal
from landstack.services.workflow import find_transition, is_allowed, is_terminal, next_actions


def row(t: str, f: str, to: str, role: str, dept: str | None, label: str | None = None, terminal: bool = False) -> dict:
    return {
        "type": t,
        "from_status": f,
        "to_status": to,
        "allowed_role": role,
        "allowed_department": dept,
        "action_label": label or to.replace("_", " ").title(),
        "is_terminal": terminal,
    }


TRANSITIONS = [
    row("mutation", "submitted", "document_check", "officer", "revenue", "Start document check"),
    row("mutation", "document_check", "field_verification", "officer", "revenue"),
    row("mutation", "field_verification", "approved", "officer", "revenue", "Approve", True),
    row("mutation", "field_verification", "returned", "officer", "revenue", "Return"),
    row("mutation", "field_verification", "rejected", "officer", "revenue", "Reject", True),
    row("mutation", "returned", "submitted", "citizen", None, "Resubmit"),
    row("building_permission", "submitted", "planning_check", "officer", "planning"),
    row("building_permission", "planning_check", "site_inspection", "officer", "planning"),
    row("building_permission", "site_inspection", "approved", "officer", "planning", "Approve", True),
    row("building_permission", "site_inspection", "rejected", "officer", "planning", "Reject", True),
    row("field_review", "open", "assigned", "admin", None, "Assign"),
    row("field_review", "assigned", "resolved", "officer", None, "Resolve", True),
]

ANITHA = Principal(uid="o1", name="Anitha", role="officer", department="revenue")
FARIDA = Principal(uid="o2", name="Farida", role="officer", department="planning")
ADMIN = Principal(uid="a", name="Admin", role="admin")
RAVI = Principal(uid="c1", name="Ravi Kumar", role="citizen")
APP = {"id": "APP-2026-000001", "type": "mutation", "status": "submitted", "applicant_uid": "c1"}


def test_find_transition_by_status_or_label() -> None:
    assert find_transition(TRANSITIONS, "mutation", "submitted", "document_check")["to_status"] == "document_check"
    assert (
        find_transition(TRANSITIONS, "mutation", "submitted", "Start document check")["to_status"] == "document_check"
    )
    assert find_transition(TRANSITIONS, "mutation", "submitted", "approved") is None
    assert find_transition(TRANSITIONS, "mutation", "field_verification", "APPROVE")["is_terminal"] is True


def test_role_and_department_enforced() -> None:
    t = find_transition(TRANSITIONS, "mutation", "submitted", "document_check")
    assert is_allowed(t, ANITHA, APP)
    assert not is_allowed(t, FARIDA, APP)
    assert not is_allowed(t, RAVI, APP)
    assert is_allowed(t, ADMIN, APP)


def test_citizen_resubmit_only_own_application() -> None:
    returned = {**APP, "status": "returned"}
    t = find_transition(TRANSITIONS, "mutation", "returned", "resubmit")
    assert is_allowed(t, RAVI, returned)
    assert not is_allowed(t, Principal(uid="c2", role="citizen"), returned)
    assert not is_allowed(t, ANITHA, returned)


def test_next_actions_and_terminal() -> None:
    fv = {**APP, "status": "field_verification"}
    labels = sorted(a["action"] for a in next_actions(TRANSITIONS, fv, ANITHA))
    assert labels == ["approved", "rejected", "returned"]
    assert next_actions(TRANSITIONS, fv, FARIDA) == []
    assert next_actions(TRANSITIONS, fv, None) == []
    assert is_terminal(TRANSITIONS, "mutation", "approved")
    assert not is_terminal(TRANSITIONS, "mutation", "returned")
    assert is_terminal(TRANSITIONS, "ownership_verification", "completed")  # no rows → instant
    fr = {"id": "x", "type": "field_review", "status": "assigned", "applicant_uid": "a"}
    assert [a["action"] for a in next_actions(TRANSITIONS, fr, FARIDA)] == ["resolved"]
    assert next_actions(TRANSITIONS, {**fr, "status": "open"}, FARIDA) == []
    assert [a["action"] for a in next_actions(TRANSITIONS, {**fr, "status": "open"}, ADMIN)] == ["assigned"]
