"""Transition-table logic with the §8 rows held in memory."""

from __future__ import annotations

from landstack.auth import Principal
from landstack.services.workflow import find_transition, is_allowed, is_terminal, next_actions


def row(
    t: str,
    f: str,
    to: str,
    role: str,
    dept: str | None,
    label: str | None = None,
    terminal: bool = False,
    designation: str | None = None,
) -> dict:
    return {
        "type": t,
        "from_status": f,
        "to_status": to,
        "allowed_role": role,
        "allowed_department": dept,
        "allowed_designation": designation,
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

ANITHA = Principal(uid="o1", name="Anitha", role="officer", department="revenue", designation="tahsildar")
RAMESH_VRO = Principal(uid="o3", name="Ramesh", role="officer", department="revenue", designation="vro")
SWATHI_SURVEYOR = Principal(uid="o4", name="Swathi", role="officer", department="revenue", designation="surveyor")
CHAITANYA_RI = Principal(uid="o5", name="Chaitanya", role="officer", department="revenue", designation="ri")
FARIDA = Principal(uid="o2", name="Farida", role="officer", department="planning", designation="town_planner")
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
    assert [a["action"] for a in next_actions(TRANSITIONS, {**fr, "status": "open"}, FARIDA)] == []
    assert [a["action"] for a in next_actions(TRANSITIONS, {**fr, "status": "open"}, ADMIN)] == ["assigned"]


def test_designation_hierarchy_enforced() -> None:
    hierarchy_transitions = [
        row("mutation", "submitted", "document_check", "officer", "revenue", "Start Document Scrutiny"),
        row("mutation", "document_check", "field_inspection", "officer", "revenue", "Refer to VRO", designation="ri"),
        row("mutation", "field_inspection", "boundary_demarcation", "officer", "revenue", "Submit VRO Panchanama", designation="vro"),
        row("mutation", "boundary_demarcation", "scrutiny_review", "officer", "revenue", "Submit Demarcation Report", designation="surveyor"),
        row("mutation", "scrutiny_review", "approved", "officer", "revenue", "Approve RoR Mutation", terminal=True, designation="tahsildar"),
    ]

    # 1. VRO can submit Panchanama from field_inspection, but Tahsildar / RI / Surveyor cannot
    vro_step = find_transition(hierarchy_transitions, "mutation", "field_inspection", "boundary_demarcation")
    app_fi = {**APP, "status": "field_inspection"}
    assert is_allowed(vro_step, RAMESH_VRO, app_fi)
    assert not is_allowed(vro_step, ANITHA, app_fi)  # Tahsildar cannot pose as VRO for panchanama
    assert not is_allowed(vro_step, SWATHI_SURVEYOR, app_fi)
    assert not is_allowed(vro_step, CHAITANYA_RI, app_fi)
    assert is_allowed(vro_step, ADMIN, app_fi)  # Admin override works

    # 2. Surveyor can demarcate boundary, but VRO cannot
    surv_step = find_transition(hierarchy_transitions, "mutation", "boundary_demarcation", "scrutiny_review")
    app_bd = {**APP, "status": "boundary_demarcation"}
    assert is_allowed(surv_step, SWATHI_SURVEYOR, app_bd)
    assert not is_allowed(surv_step, RAMESH_VRO, app_bd)
    assert not is_allowed(surv_step, ANITHA, app_bd)

    # 3. Only Tahsildar can execute the statutory final approval or rejection
    tahsildar_step = find_transition(hierarchy_transitions, "mutation", "scrutiny_review", "approved")
    app_sr = {**APP, "status": "scrutiny_review"}
    assert is_allowed(tahsildar_step, ANITHA, app_sr)
    assert not is_allowed(tahsildar_step, RAMESH_VRO, app_sr)
    assert not is_allowed(tahsildar_step, SWATHI_SURVEYOR, app_sr)
    assert not is_allowed(tahsildar_step, CHAITANYA_RI, app_sr)
    assert is_allowed(tahsildar_step, ADMIN, app_sr)

    # 4. RI CANNOT reject or approve mutation (statutory prohibition)
    reject_step = row("mutation", "scrutiny_review", "rejected", "officer", "revenue", "Reject Mutation", terminal=True, designation="tahsildar")
    assert is_allowed(reject_step, ANITHA, app_sr)
    assert not is_allowed(reject_step, CHAITANYA_RI, app_sr)
    assert not is_allowed(reject_step, RAMESH_VRO, app_sr)
    assert not is_allowed(reject_step, SWATHI_SURVEYOR, app_sr)
