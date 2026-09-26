"""Application workflow (CONTRACTS §8) driven by the `landstack.transitions` table.

Pure rule helpers (`find_transition`, `is_allowed`, `next_actions`) operate on plain transition rows so
they are unit-testable with an in-memory list; the async functions wrap them with persistence, audit
and the department side-effects that run when an application reaches `approved`.
"""

from __future__ import annotations

import datetime as dt
import json
import logging
from typing import Any

from landstack.adapters import client
from landstack.auth import Principal
from landstack.db import DBLike, json_dumps
from landstack.errors import AppError, forbidden, not_found
from landstack.services import audit
from landstack.services.cache import TTLCache

log = logging.getLogger("landstack.workflow")

APPLICATION_TYPES = (
    "mutation",
    "building_permission",
    "ownership_verification",
    "field_review",
    "boundary_correction",
    "record_correction",
    "land_complaint",
    "succession",
    "utility_request",
    "acquisition_claim",
)
INITIAL_STATUS = {
    "mutation": "submitted",
    "building_permission": "submitted",
    "field_review": "open",
    "ownership_verification": "completed",
    "boundary_correction": "submitted",
    "record_correction": "submitted",
    "land_complaint": "submitted",
    "succession": "submitted",
    "utility_request": "submitted",
    "acquisition_claim": "submitted",
}
DEFAULT_DEPARTMENT = {
    "mutation": "revenue",
    "building_permission": "planning",
    "ownership_verification": "registration",
    "field_review": None,
    "boundary_correction": "revenue",
    "record_correction": "revenue",
    "land_complaint": "revenue",
    "succession": "revenue",
    "utility_request": "revenue",
    "acquisition_claim": "revenue",
}

_transitions_cache: TTLCache[list[dict[str, Any]]] = TTLCache(ttl_s=60.0)


# ----------------------------------------------------------------------------- pure rules
def _norm(s: Any) -> str:
    return str(s or "").strip().lower().replace(" ", "_")


def find_transition(
    rows: list[dict[str, Any]],
    app_type: str,
    from_status: str,
    action: str,
    principal: Principal | None = None,
    app: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    """Match `action` against `to_status` or `action_label` for the application's type/current status.
    If multiple candidate transitions exist for this action, prefers the one allowed for `principal`.
    """
    wanted = _norm(action)
    candidates: list[dict[str, Any]] = []
    for row in rows:
        if row["type"] != app_type or row["from_status"] != from_status:
            continue
        if _norm(row["to_status"]) == wanted or _norm(row.get("action_label")) == wanted:
            candidates.append(row)
    if not candidates:
        return None
    if principal is not None and app is not None:
        for c in candidates:
            if is_allowed(c, principal, app):
                return c
    return candidates[0]


def is_allowed(row: dict[str, Any], principal: Principal, app: dict[str, Any]) -> bool:
    """Role + department + designation check; admin bypasses; citizens may only act on their own applications."""
    if principal.is_admin:
        return True
    role = row.get("allowed_role")
    if role and principal.role != role:
        return False
    dept = row.get("allowed_department")
    if dept and principal.role == "officer" and principal.department != dept:
        return False
    desig = row.get("allowed_designation")
    if desig and principal.role == "officer":
        p_desig = (getattr(principal, "designation", None) or "").strip().lower()
        if not p_desig or p_desig != desig.strip().lower():
            return False
    if principal.role == "officer" and principal.department == "revenue":
        if row.get("to_status") in ("approved", "rejected"):
            p_desig = (getattr(principal, "designation", None) or "").strip().lower()
            if p_desig != "tahsildar":
                return False
    if principal.role == "citizen" and app.get("applicant_uid") not in (None, principal.uid):
        return False
    return True


def next_actions(rows: list[dict[str, Any]], app: dict[str, Any], principal: Principal | None) -> list[dict[str, Any]]:
    """Actions the principal may take from the application's current status."""
    out = []
    for row in rows:
        if row["type"] != app["type"] or row["from_status"] != app["status"]:
            continue
        if principal is None or not is_allowed(row, principal, app):
            continue
        out.append(
            {
                "action": row["to_status"],
                "label": row.get("action_label") or row["to_status"].replace("_", " ").title(),
                "to_status": row["to_status"],
                "allowed_designation": row.get("allowed_designation"),
                "is_terminal": bool(row.get("is_terminal")),
            }
        )
    return out


def history_view(app: dict[str, Any]) -> list[dict[str, Any]]:
    """`payload.history` (ts/from/status/by/role/designation/remark) in the shape the web HistoryEntry type reads."""
    payload = app.get("payload") or {}
    if isinstance(payload, str):  # jsonb returned as text (some drivers / test fakes)
        try:
            payload = json.loads(payload)
        except ValueError:
            payload = {}
    out = []
    for h in (payload.get("history") if isinstance(payload, dict) else None) or []:
        if not isinstance(h, dict):
            continue
        out.append(
            {
                "ts": h.get("ts"),
                "from_status": h.get("from"),
                "to_status": h.get("status"),
                "action": h.get("remark") if h.get("remark") == "created" else None,
                "actor_name": h.get("by"),
                "actor_role": h.get("role"),
                "actor_designation": h.get("designation"),
                "remark": h.get("remark") if h.get("remark") != "created" else None,
            }
        )
    return out


def is_terminal(rows: list[dict[str, Any]], app_type: str, status: str) -> bool:
    return not any(r["type"] == app_type and r["from_status"] == status for r in rows)


# ----------------------------------------------------------------------------- persistence
async def load_transitions(db: DBLike, force: bool = False) -> list[dict[str, Any]]:
    rows = None if force else _transitions_cache.get("all")
    if rows is None:
        try:
            rows = await db.fetch(
                "SELECT type, from_status, to_status, allowed_role, allowed_department, allowed_designation, action_label, is_terminal "
                "FROM landstack.transitions ORDER BY type, from_status, to_status"
            )
        except Exception:
            rows = await db.fetch(
                "SELECT type, from_status, to_status, allowed_role, allowed_department, NULL AS allowed_designation, action_label, is_terminal "
                "FROM landstack.transitions ORDER BY type, from_status, to_status"
            )
        _transitions_cache.set("all", rows)
    return rows


async def next_application_id(db: DBLike, year: int | None = None) -> str:
    """`APP-<year>-<6 digits>`; serialised with an advisory lock inside the caller's transaction."""
    year = year or dt.date.today().year
    prefix = f"APP-{year}-"
    await db.execute("SELECT pg_advisory_xact_lock(hashtext('landstack.applications.id'))")
    # (:n)::int — asyncpg sends untyped params, and substring(text from $1) cannot
    # infer the type, which fails at the driver (CLAUDE.md first-run issue #1).
    last = await db.fetchval(
        "SELECT max(substring(id from (:n)::int)::int) FROM landstack.applications WHERE id LIKE :like",
        n=len(prefix) + 1,
        like=prefix + "%",
    )
    return f"{prefix}{(int(last) if last else 0) + 1:06d}"


async def get_application(db: DBLike, app_id: str) -> dict[str, Any]:
    row = await db.fetchrow(
        "SELECT a.*, p.survey_no, p.village FROM landstack.applications a "
        "LEFT JOIN landstack.parcels p ON p.ulpin = a.ulpin WHERE a.id = :id",
        id=app_id,
    )
    if row is None:
        raise not_found("application", app_id)
    row["history"] = history_view(row)
    return row


async def create_application(
    db: DBLike,
    principal: Principal,
    ulpin: str,
    app_type: str,
    payload: dict[str, Any] | None,
    *,
    applicant_name: str | None = None,
    status: str | None = None,
    system_initiated: bool = False,
) -> dict[str, Any]:
    if app_type not in APPLICATION_TYPES:
        raise AppError(422, "invalid_type", f"type must be one of {', '.join(APPLICATION_TYPES)}")
    exists = await db.fetchval("SELECT 1 FROM landstack.parcels WHERE ulpin = :u", u=ulpin)
    if not exists:
        raise not_found("parcel", ulpin)

    # Statutory title check for building permission
    if app_type == "building_permission" and not principal.is_officer and not system_initiated:
        ror_owner = await db.fetchval(
            "SELECT owner_name FROM dept_revenue.ror WHERE ulpin = :u ORDER BY updated_at DESC NULLS LAST LIMIT 1",
            u=ulpin,
        )
        if ror_owner:
            p_name = (applicant_name or principal.name or "").strip().lower()
            o_name = ror_owner.strip().lower()
            is_match = (p_name in o_name) or (o_name in p_name)
            if not is_match:
                from landstack.services.consistency import name_score
                is_match = name_score(ror_owner, applicant_name or principal.name or "") >= 60
            if not is_match:
                raise AppError(
                    403,
                    "not_parcel_owner",
                    f"Applicant '{applicant_name or principal.name}' is not the registered title holder ({ror_owner}) of parcel {ulpin}. Statutory town planning regulations require verified title ownership to apply for building permission.",
                )

    payload = dict(payload or {})
    if system_initiated:
        payload["system_initiated"] = True
    payload.setdefault("history", []).append(
        {"ts": _now(), "status": status or INITIAL_STATUS[app_type], "by": principal.name, "remark": "created"}
    )
    async with db.transaction():
        app_id = await next_application_id(db)
        row = await db.fetchrow(
            """
            INSERT INTO landstack.applications
                (id, ulpin, type, applicant_uid, applicant_name, status, payload, assigned_department, created_at, updated_at)
            VALUES (:id, :ulpin, :type, :uid, :name, :status, CAST(:payload AS jsonb), :dept, now(), now())
            RETURNING *
            """,
            id=app_id,
            ulpin=ulpin,
            type=app_type,
            uid=principal.uid,
            name=applicant_name or principal.name,
            status=status or INITIAL_STATUS[app_type],
            payload=json_dumps(payload),
            dept=DEFAULT_DEPARTMENT[app_type],
        )
        await audit.record(
            db,
            principal,
            "application.created",
            "application",
            app_id,
            ulpin,
            None,
            row,
            source="system" if system_initiated else "gateway",
        )

        if app_type == "acquisition_claim":
            resp_type = payload.get("response_type") or "consent_settlement"
            prj_id = int(payload.get("project_id") or 1)
            status_map = {
                "consent_settlement": "consent_accepted",
                "compensation_negotiation": "negotiation_pending",
                "statutory_objection": "objection_filed",
                "tdr_opt_in": "tdr_opted",
            }
            new_st = status_map.get(resp_type, "notice_published")
            await db.execute(
                """
                UPDATE gis.project_parcel_impacts
                SET status = :status, updated_at = now()
                WHERE ulpin = :u AND project_id = :p
                """,
                status=new_st,
                u=ulpin,
                p=prj_id,
            )
            await db.execute(
                """
                INSERT INTO gis.acquisition_claims (
                    application_id, ulpin, project_id, response_type, applicant_name,
                    demanded_amount, grounds, proposed_alignment, bank_account_no, bank_ifsc,
                    bank_name, tdr_preferred_zone, supporting_docs, status, created_at, updated_at
                ) VALUES (
                    :aid, :u, :p, :resp, :name, :amt, :grounds, :align, :acct, :ifsc, :bname,
                    :zone, CAST(:docs AS jsonb), 'submitted', now(), now()
                )
                """,
                aid=app_id,
                u=ulpin,
                p=prj_id,
                resp=resp_type,
                name=applicant_name or principal.name or "Landowner",
                amt=float(payload.get("demanded_amount") or 0) if payload.get("demanded_amount") else None,
                grounds=payload.get("grounds"),
                align=payload.get("proposed_alignment"),
                acct=payload.get("bank_account_no"),
                ifsc=payload.get("bank_ifsc"),
                bname=payload.get("bank_name"),
                zone=payload.get("tdr_preferred_zone"),
                docs=json_dumps(payload.get("supporting_docs") or []),
            )
            from landstack.services import aggregator

            aggregator.invalidate(ulpin)
    if row is not None:
        row["history"] = history_view(row)
    return row or {"id": app_id}


async def list_applications(
    db: DBLike,
    *,
    applicant_uid: str | None = None,
    ulpin: str | None = None,
    status: str | None = None,
    department: str | None = None,
    app_type: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    clauses, params = ["TRUE"], {"limit": limit, "offset": offset}
    for col, val in (
        ("applicant_uid", applicant_uid),
        ("ulpin", ulpin),
        ("status", status),
        ("assigned_department", department),
        ("type", app_type),
    ):
        if val:
            clauses.append(f"a.{col} = :{col}")
            params[col] = val
    rows = await db.fetch(
        f"SELECT a.*, p.survey_no, p.village FROM landstack.applications a "
        f"LEFT JOIN landstack.parcels p ON p.ulpin = a.ulpin "
        f"WHERE {' AND '.join(clauses)} ORDER BY a.updated_at DESC LIMIT :limit OFFSET :offset",
        **params,
    )
    for r in rows:
        r["history"] = history_view(r)
    return rows


async def list_queue(
    db: DBLike, principal: Principal, department: str | None = None, limit: int = 200
) -> list[dict[str, Any]]:
    """Open applications an officer can act on (terminal statuses excluded)."""
    rows = await load_transitions(db)
    dept = department or (principal.department if principal.role == "officer" else None)
    apps = await list_applications(db, department=dept, limit=limit)
    out = []
    for app in apps:
        if is_terminal(rows, app["type"], app["status"]):
            continue
        app["next_actions"] = next_actions(rows, app, principal)
        out.append(app)
    return out


async def transition(
    db: DBLike, app_id: str, action: str, principal: Principal, remark: str | None = None
) -> dict[str, Any]:
    """Apply `action`, enforce role/department/from_status, audit, run terminal side effects."""
    rows = await load_transitions(db)
    async with db.transaction():
        app = await db.fetchrow("SELECT * FROM landstack.applications WHERE id = :id FOR UPDATE", id=app_id)
        if app is None:
            raise not_found("application", app_id)
        row = find_transition(rows, app["type"], app["status"], action, principal, app)
        if row is None:
            allowed = [r["to_status"] for r in rows if r["type"] == app["type"] and r["from_status"] == app["status"]]
            raise AppError(409, "invalid_transition", f"cannot '{action}' from '{app['status']}'", {"allowed": allowed})
        if not is_allowed(row, principal, app):
            req = f"'{action}' requires {row.get('allowed_role')}"
            if row.get("allowed_department"):
                req += f" ({row['allowed_department']})"
            if row.get("allowed_designation"):
                req += f" [Designation: {row['allowed_designation']}]"
            raise forbidden(req)
        payload = dict(app.get("payload") or {})
        if app["type"] == "boundary_correction" and row["to_status"] == "approved":
            # Re-validate at approval time (neighbours may have changed since filing);
            # a failing proposal cannot be approved — the transaction aborts here.
            from landstack.services import boundary

            geom = payload.get("proposed_geometry")
            if geom and isinstance(geom, dict) and geom.get("type") in ("Polygon", "MultiPolygon"):
                recheck = await boundary.validate(db, app["ulpin"], geom)
                if not recheck["valid"]:
                    failed = [c["name"] for c in recheck["checks"] if not c["ok"]]
                    raise AppError(409, "boundary_invalid",
                                   f"proposal no longer passes validation: {', '.join(failed)}",
                                   {"checks": recheck["checks"]})
                payload["validation_at_approval"] = {"checks": recheck["checks"], "metrics": recheck["metrics"]}
        payload.setdefault("history", []).append(
            {
                "ts": _now(),
                "from": app["status"],
                "status": row["to_status"],
                "by": principal.name,
                "role": principal.role,
                "designation": principal.designation,
                "remark": remark,
            }
        )
        if row["to_status"] in ("rejected", "dismissed"):
            payload["rejection_reason"] = remark or "Application rejected by competent authority."
            payload["rejected_at"] = _now()
            payload["rejected_by"] = principal.name
            payload["rejected_by_designation"] = principal.designation
        elif row["to_status"] in ("approved", "resolved"):
            payload["approval_remark"] = remark or "Application approved and order passed by competent authority."
            payload["approved_at"] = _now()
            payload["approved_by"] = principal.name
            payload["approved_by_designation"] = principal.designation
        updated = await db.fetchrow(
            "UPDATE landstack.applications SET status = :status, payload = CAST(:payload AS jsonb), updated_at = now() "
            "WHERE id = :id RETURNING *",
            status=row["to_status"],
            payload=json_dumps(payload),
            id=app_id,
        )
        await audit.record(
            db,
            principal,
            f"application.{row['to_status']}",
            "application",
            app_id,
            app["ulpin"],
            {"status": app["status"]},
            {"status": row["to_status"], "remark": remark},
        )
    if row["to_status"] in ("approved", "resolved"):
        side = await run_side_effects(db, updated or app, principal)
        if side:
            payload["side_effect"] = side
            updated = await db.fetchrow(
                "UPDATE landstack.applications SET payload = CAST(:payload AS jsonb) WHERE id = :id RETURNING *",
                payload=json_dumps(payload),
                id=app_id,
            )
    from landstack.services import aggregator

    aggregator.invalidate(app["ulpin"])
    result = updated or app
    result["history"] = history_view(result)
    result["next_actions"] = next_actions(rows, result, principal)
    return result


async def run_side_effects(db: DBLike, app: dict[str, Any], principal: Principal) -> dict[str, Any] | None:
    """On approval: mutation → revenue POST /mutations; building_permission → planning POST /permissions."""
    payload = app.get("payload") or {}
    try:
        if app["type"] in ("mutation", "succession"):
            to_owner = (
                payload.get("to_owner")
                or payload.get("new_owner_name")
                or payload.get("nominee_name")
                or app.get("applicant_name")
            )
            if not to_owner:
                log.warning("No new owner specified for mutation application %s", app["id"])
                return None

            to_owner = str(to_owner).strip()
            from_owner = payload.get("from_owner")
            if not from_owner:
                from_owner = await db.fetchval(
                    "SELECT owner_name FROM dept_revenue.ror WHERE ulpin = :u ORDER BY updated_at DESC NULLS LAST LIMIT 1",
                    u=app["ulpin"],
                )

            # 1. Update Revenue RoR (owner, father_name, nominees reset, mutation history)
            body = {
                "ulpin": app["ulpin"],
                "to_owner": to_owner,
                "reason": payload.get("reason") or ("succession" if app["type"] == "succession" else "mutation approved"),
                "application_id": app["id"],
                "father_name": payload.get("father_name") or payload.get("new_father_name"),
                "nominees": payload.get("nominees") or payload.get("new_nominees") or [],
                "doc_no": payload.get("doc_no"),
            }
            res = await client.post_json("/revenue/mutations", body, timeout=5.0)

            # 2. Transfer 3D Building Units to new owner
            await db.execute(
                """
                UPDATE landstack.units u
                SET owner_name = :to_owner
                FROM landstack.buildings b
                WHERE b.id = u.building_id AND b.ulpin = :u
                """,
                to_owner=to_owner,
                u=app["ulpin"],
            )

            # 3. Synchronize Registration Deed Record (Chain of Title)
            # Ensure the chain of title in deeds reflects this transfer so consistency check passes
            existing_deed = await db.fetchval(
                "SELECT doc_no FROM dept_registration.deeds WHERE ulpin = :u AND claimant ILIKE :c LIMIT 1",
                u=app["ulpin"],
                c=to_owner,
            )
            if not existing_deed:
                year = dt.date.today().year
                seq = await db.fetchval(
                    "SELECT count(*) + 1 FROM dept_registration.deeds WHERE doc_no LIKE :p",
                    p=f"DOC-{year}-%",
                )
                doc_no = payload.get("doc_no") or f"DOC-{year}-{int(seq or 1):05d}"
                parcel_row = await db.fetchrow(
                    "SELECT area_sqm, district, taluk FROM landstack.parcels WHERE ulpin = :u",
                    u=app["ulpin"],
                )
                valuation = await db.fetchval(
                    "SELECT guideline_value_per_sqm FROM dept_fiscal.valuation WHERE ulpin = :u",
                    u=app["ulpin"],
                )
                area = float((parcel_row or {}).get("area_sqm") or 0)
                rate = float(valuation or 5000)
                consideration = payload.get("consideration") or round(area * rate, 2)
                sro = (parcel_row or {}).get("taluk") or (parcel_row or {}).get("district") or "GNT-02"

                await db.execute(
                    """
                    INSERT INTO dept_registration.deeds
                        (doc_no, ulpin, deed_type, executant, claimant, consideration, extent_sqm, registered_on, sro_code)
                    VALUES (:doc, :u, :dt, :ex, :cl, :cons, :ext, CURRENT_DATE, :sro)
                    ON CONFLICT (doc_no) DO UPDATE SET claimant = EXCLUDED.claimant, executant = EXCLUDED.executant
                    """,
                    doc=doc_no,
                    u=app["ulpin"],
                    dt=payload.get("reason") or ("succession" if app["type"] == "succession" else "sale"),
                    ex=from_owner or "Previous Title Holder",
                    cl=to_owner,
                    cons=consideration,
                    ext=area or None,
                    sro=str(sro).upper()[:20],
                )

            # 4. Endorse Building Permissions to new owner
            await db.execute(
                """
                UPDATE dept_planning.building_permissions
                SET conditions = CASE
                    WHEN conditions IS NULL OR conditions = '' THEN 'Title & permissions transferred to ' || :to_owner
                    ELSE conditions || ' · Title & permissions transferred to ' || :to_owner
                END
                WHERE ulpin = :u
                """,
                to_owner=to_owner,
                u=app["ulpin"],
            )

            # 5. Resolve Pending Mutation Alerts
            await db.execute(
                """
                UPDATE landstack.alerts
                SET status = 'resolved'
                WHERE ulpin = :u AND kind = 'pending_mutation' AND status <> 'resolved'
                """,
                u=app["ulpin"],
            )

            # 6. Clear pending_mutation flag on landstack.parcels
            await db.execute(
                "UPDATE landstack.parcels SET pending_mutation = false, updated_at = now() WHERE ulpin = :u",
                u=app["ulpin"],
            )

            # 7. Reset Consents & Privacy Preferences for new owner
            await db.execute("DELETE FROM landstack.consents WHERE ulpin = :u", u=app["ulpin"])
            await db.execute(
                """
                INSERT INTO landstack.parcel_privacy (ulpin, public_owner_name, public_nominees, public_deed_details, public_building_units, public_utilities, updated_at)
                VALUES (:u, false, false, false, true, true, now())
                ON CONFLICT (ulpin) DO UPDATE SET
                    public_owner_name = false,
                    public_nominees = false,
                    public_deed_details = false,
                    updated_at = now()
                """,
                u=app["ulpin"],
            )

            # 8. Transfer utility connections to new owner
            try:
                await client.post_json(
                    "/utilities/modify",
                    {
                        "ulpin": app["ulpin"],
                        "action": "name_transfer",
                        "utility_type": "all",
                        "consumer_name": to_owner,
                        "remarks": f"Statutory transfer via {app['type']} ({app['id']})",
                        "application_id": app["id"],
                    },
                    timeout=5.0,
                )
            except Exception as u_exc:
                log.warning("Utility name transfer failed for %s: %s", app["id"], u_exc)

            await audit.record(
                db, principal, f"{app['type']}.completed_full_transfer", "application", app["id"], app["ulpin"], None,
                {"to_owner": to_owner, "from_owner": from_owner, "revenue_result": res}
            )
            return {"department": "revenue", "ok": True, "transferred": True, "to_owner": to_owner, "result": res}
        if app["type"] == "boundary_correction":
            from landstack.services import boundary

            geom = payload.get("proposed_geometry")
            if not geom or not isinstance(geom, dict) or geom.get("type") not in ("Polygon", "MultiPolygon"):
                log.info("boundary_correction %s approved without explicit polygon geometry modification", app["id"])
                return {"department": "survey", "ok": True, "demarcated": True}
            applied = await boundary.apply_geometry(db, app["ulpin"], geom)
            await audit.record(
                db, principal, "parcel.boundary_applied", "parcel", app["ulpin"], app["ulpin"],
                {"area_sqm": payload.get("area_before_sqm")}, applied,
            )
            sync = await client.post_json(
                "/revenue/extent",
                {"ulpin": app["ulpin"], "extent_sqm": applied["new_area"], "application_id": app["id"]},
                timeout=5.0,
            )
            return {"department": "revenue", "ok": True, "result": {"applied": applied, "ror_sync": sync}}
        if app["type"] == "building_permission":
            body = {
                "ulpin": app["ulpin"],
                "floors": int(payload.get("floors") or 1),
                "built_up_sqm": float(payload.get("built_up_sqm") or 0),
                "application_id": app["id"],
                "status": "approved",
            }
            res = await client.post_json("/planning/permissions", body, timeout=5.0)
            await audit.record(
                db, principal, "planning.permission_issued", "application", app["id"], app["ulpin"], None, res
            )
            return {"department": "planning", "ok": True, "result": res}
        if app["type"] == "record_correction":
            field = str(payload.get("field") or "owner_name").strip().lower()
            corrected_val = str(payload.get("corrected_value") or "").strip()
            if not corrected_val:
                log.warning("No corrected value in record_correction application %s", app["id"])
                return None

            # 1. Update revenue RoR & mutations
            body = {
                "ulpin": app["ulpin"],
                "field": field,
                "corrected_value": corrected_val,
                "description": payload.get("description") or f"Record correction ({field}) approved",
                "application_id": app["id"],
            }
            res = await client.post_json("/revenue/correction", body, timeout=5.0)

            # 2. If owner_name changed, cascade to all related tables:
            if field in ("owner_name", "name", "pattadar_name"):
                # 2a. Building units
                await db.execute(
                    """
                    UPDATE landstack.units u
                    SET owner_name = :new_name
                    FROM landstack.buildings b
                    WHERE b.id = u.building_id AND b.ulpin = :u
                    """,
                    new_name=corrected_val,
                    u=app["ulpin"],
                )

                # 2b. User account if applicant is a registered user
                if app.get("applicant_uid"):
                    await db.execute(
                        "UPDATE landstack.users SET name = :new_name WHERE uid = :uid",
                        new_name=corrected_val,
                        uid=app["applicant_uid"],
                    )
                    await db.execute(
                        "UPDATE landstack.applications SET applicant_name = :new_name WHERE applicant_uid = :uid",
                        new_name=corrected_val,
                        uid=app["applicant_uid"],
                    )

                # 2c. Registration deed claimant (so consistency check and title chain pass)
                from_val = res.get("from_value") if isinstance(res, dict) else None
                if not from_val:
                    from_val = app.get("applicant_name")

                if from_val:
                    await db.execute(
                        "UPDATE dept_registration.deeds SET claimant = :new_name WHERE ulpin = :u AND claimant ILIKE :prev",
                        new_name=corrected_val,
                        u=app["ulpin"],
                        prev=f"%{from_val}%",
                    )
                else:
                    await db.execute(
                        "UPDATE dept_registration.deeds SET claimant = :new_name WHERE ulpin = :u",
                        new_name=corrected_val,
                        u=app["ulpin"],
                    )

                # 2d. Sync utility consumer name
                try:
                    await client.post_json(
                        "/utilities/modify",
                        {
                            "ulpin": app["ulpin"],
                            "action": "name_transfer",
                            "utility_type": "all",
                            "consumer_name": corrected_val,
                            "remarks": f"Name update synced from record correction ({app['id']})",
                            "application_id": app["id"],
                        },
                        timeout=5.0,
                    )
                except Exception as u_exc:
                    log.warning("Utility record correction sync failed for %s: %s", app["id"], u_exc)

            # 3. If extent changed, sync parcels.area_sqm
            elif field in ("extent", "extent_sqm", "area"):
                try:
                    import re
                    cleaned = re.sub(r"[^\d.]", "", corrected_val)
                    val_num = float(cleaned)
                    if "acre" in corrected_val.lower():
                        val_num = round(val_num * 4046.8564224, 2)
                    elif "cent" in corrected_val.lower():
                        val_num = round(val_num * 40.468564224, 2)
                    await db.execute(
                        "UPDATE landstack.parcels SET area_sqm = :a, updated_at = now() WHERE ulpin = :u",
                        a=val_num,
                        u=app["ulpin"],
                    )
                except Exception as exc:
                    log.warning("Could not sync parcel area_sqm for %s: %s", app["ulpin"], exc)

            # 4. If survey_no changed, sync parcels.survey_no
            elif field in ("survey_no", "sy_no"):
                await db.execute(
                    "UPDATE landstack.parcels SET survey_no = :s, updated_at = now() WHERE ulpin = :u",
                    s=corrected_val,
                    u=app["ulpin"],
                )

            await audit.record(
                db,
                principal,
                "record_correction.applied",
                "application",
                app["id"],
                app["ulpin"],
                None,
                {"field": field, "corrected_value": corrected_val, "revenue_result": res},
            )
            return {"department": "revenue", "ok": True, "field": field, "corrected_value": corrected_val, "result": res}

        if app["type"] == "land_complaint":
            # Resolve alerts and disputes
            await db.execute(
                "UPDATE landstack.alerts SET status = 'resolved' WHERE ulpin = :u AND status <> 'resolved'",
                u=app["ulpin"],
            )
            await db.execute(
                "UPDATE dept_legal.disputes SET status = 'disposed', updated_at = now() WHERE ulpin = :u AND status <> 'disposed'",
                u=app["ulpin"],
            )
            await audit.record(
                db, principal, "land_complaint.resolved", "application", app["id"], app["ulpin"], None, {"status": "resolved"}
            )
            return {"ok": True, "type": "land_complaint", "status": "resolved"}

        if app["type"] == "field_review":
            await db.execute(
                "UPDATE landstack.alerts SET status = 'resolved' WHERE ulpin = :u AND kind = 'change_detected' AND status <> 'resolved'",
                u=app["ulpin"],
            )
            await audit.record(
                db, principal, "field_review.resolved", "application", app["id"], app["ulpin"], None, {"status": "resolved"}
            )
            return {"ok": True, "type": "field_review", "status": "resolved"}

        if app["type"] == "utility_request":
            u_action = payload.get("action") or "new_connection"
            u_type = payload.get("utility_type") or "electricity"
            body = {
                "ulpin": app["ulpin"],
                "action": u_action,
                "utility_type": u_type,
                "consumer_name": payload.get("consumer_name") or app.get("applicant_name"),
                "sanctioned_load_kw": float(payload["sanctioned_load_kw"]) if payload.get("sanctioned_load_kw") is not None else None,
                "pipe_size_mm": int(payload["pipe_size_mm"]) if payload.get("pipe_size_mm") is not None else None,
                "tariff_category": payload.get("tariff_category"),
                "phase": payload.get("phase"),
                "meter_no": payload.get("meter_no"),
                "provider": payload.get("provider"),
                "remarks": payload.get("remarks") or payload.get("description") or f"Sanctioned under application {app['id']}",
                "application_id": app["id"],
            }
            res = await client.post_json("/utilities/modify", body, timeout=5.0)
            from landstack.services import aggregator
            aggregator.invalidate(app["ulpin"])
            await audit.record(
                db, principal, "utilities.request_sanctioned", "application", app["id"], app["ulpin"], None, res
            )
            return {"department": "utilities", "ok": True, "result": res}

        if app["type"] == "acquisition_claim":
            response_type = payload.get("response_type") or "consent_settlement"
            project_id = int(payload.get("project_id") or 1)
            status_map = {
                "consent_settlement": "consent_accepted",
                "compensation_negotiation": "award_passed",
                "statutory_objection": "objection_filed",
                "tdr_opt_in": "tdr_opted",
            }
            new_status = status_map.get(response_type, "consent_accepted")
            await db.execute(
                """
                UPDATE gis.project_parcel_impacts
                SET status = :status, updated_at = now()
                WHERE ulpin = :u AND project_id = :p
                """,
                status=new_status,
                u=app["ulpin"],
                p=project_id,
            )
            await db.execute(
                """
                UPDATE gis.acquisition_claims
                SET status = 'approved', updated_at = now()
                WHERE application_id = :aid
                """,
                aid=app["id"],
            )
            from landstack.services import aggregator

            aggregator.invalidate(app["ulpin"])
            await audit.record(
                db,
                principal,
                "acquisition.claim_approved",
                "application",
                app["id"],
                app["ulpin"],
                None,
                {"response_type": response_type, "project_id": project_id, "status": new_status},
            )
            return {"department": "revenue", "ok": True, "status": new_status}
    except Exception as exc:
        log.warning("side effect failed for %s: %s", app["id"], exc)
        return {"ok": False, "error": str(exc)[:200]}
    return None


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
