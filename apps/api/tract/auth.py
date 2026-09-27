"""Authentication & authorisation (CONTRACTS §3).

* firebase mode: `Authorization: Bearer <ID token>` verified with firebase-admin; custom claims
  `role` / `department`. Users without claims are citizens.
* dev mode: `X-Dev-User: <role>[:<department>][:<display name>]`; missing header = anonymous.

`current_principal` is optional (None for anonymous); `require(*roles, department=None)` builds a
dependency that enforces role/department — admin passes every check. On first sight the user is
upserted into `landstack.users` (best effort).
"""

from __future__ import annotations

import logging
import re
import threading
from collections.abc import Callable
from typing import Any

from fastapi import Depends, Request
from pydantic import BaseModel, Field

from landstack.config import Settings, get_settings
from landstack.db import DBLike, get_db
from landstack.errors import forbidden, unauthorized

log = logging.getLogger("landstack.auth")

ROLES = ("citizen", "officer", "admin")
DEPARTMENTS = ("revenue", "registration", "planning")
DESIGNATIONS = (
    "vro",           # Village Revenue Officer / Field Inspector
    "surveyor",      # Mandal / Cadastral Surveyor
    "ri",            # Revenue Inspector / Supervisor
    "tahsildar",     # Tahsildar / Mandal Revenue Officer (Quasi-Judicial Approver)
    "rdo",           # Revenue Divisional Officer / Sub-Collector (Appellate)
    "sub_registrar", # Registration Department (SRO)
    "town_planner",  # Assistant City Planner / Town Planning Inspector
    "commissioner",  # Municipal Commissioner / Authority
)


class Principal(BaseModel):
    """The authenticated caller."""

    uid: str
    name: str = ""
    role: str = "citizen"
    department: str | None = None
    designation: str | None = None
    email: str | None = None
    consents: set[str] = Field(default_factory=set)

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    @property
    def is_officer(self) -> bool:
        return self.role in ("officer", "admin")

    def can(self, *roles: str, department: str | None = None, designation: str | None = None) -> bool:
        """Role check with admin bypass; department and designation constrain officers."""
        if self.is_admin:
            return True
        if roles and self.role not in roles:
            return False
        if department and self.role == "officer" and self.department != department:
            return False
        if designation and self.role == "officer" and self.designation and self.designation != designation:
            return False
        return True


def parse_dev_header(value: str | None) -> Principal | None:
    """`officer:revenue:vro:Ramesh` or `officer:revenue:Anitha` → Principal; None for missing/blank header."""
    if not value or not value.strip():
        return None
    parts = [p.strip() for p in value.split(":")]
    role = parts[0].lower() or "citizen"
    if role not in ROLES:
        raise unauthorized(f"unknown dev role '{role}'")
    department: str | None = None
    designation: str | None = None
    name = ""

    if len(parts) >= 4:
        department = parts[1].lower() if parts[1] else None
        designation = parts[2].lower() if parts[2] else None
        name = parts[3]
    elif len(parts) == 3:
        if role == "officer" or parts[1].lower() in DEPARTMENTS:
            department = parts[1].lower()
            name = parts[2]
            # Infer realistic default designation
            if department == "revenue":
                designation = "tahsildar"
            elif department == "planning":
                designation = "town_planner"
            elif department == "registration":
                designation = "sub_registrar"
        else:
            name = parts[2] or parts[1]
    elif len(parts) == 2:
        if role == "officer":
            department = parts[1].lower()
            designation = "tahsildar" if department == "revenue" else "town_planner"
        else:
            name = parts[1]

    if not name:
        name = f"{role.title()}" + (f" ({department})" if department else "")
    if role == "officer" and department not in DEPARTMENTS:
        raise unauthorized("officer dev header needs a department: officer:<revenue|registration|planning>")
    if role != "officer":
        department = None
        designation = None

    # Deterministic, human-readable uid that matches tools/seed.py DEMO_USERS (dev-ravi-kumar, dev-anitha, dev-admin).
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or role
    uid = f"dev-{slug}"
    return Principal(uid=uid, name=name, role=role, department=department, designation=designation, email=None)


_firebase_lock = threading.Lock()
_firebase_ready = False


def _init_firebase(settings: Settings) -> None:
    global _firebase_ready
    if _firebase_ready:
        return
    with _firebase_lock:
        if _firebase_ready:
            return
        import firebase_admin
        from firebase_admin import credentials

        options = {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None
        if settings.google_application_credentials:
            firebase_admin.initialize_app(credentials.Certificate(settings.google_application_credentials), options)
        else:
            firebase_admin.initialize_app(options=options)  # default credentials (Cloud Run)
        _firebase_ready = True


def principal_from_claims(claims: dict[str, Any]) -> Principal:
    """Map decoded Firebase token claims to a Principal (missing role → citizen)."""
    role = str(claims.get("role") or "citizen").lower()
    if role not in ROLES:
        role = "citizen"
    department = claims.get("department")
    department = str(department).lower() if department and role == "officer" else None
    designation = claims.get("designation")
    designation = str(designation).lower() if designation and role == "officer" else None
    return Principal(
        uid=str(claims.get("uid") or claims.get("sub") or claims.get("user_id")),
        name=str(claims.get("name") or claims.get("email") or "User"),
        role=role,
        department=department,
        designation=designation,
        email=claims.get("email"),
    )


def _verify_firebase(token: str, settings: Settings) -> Principal:
    _init_firebase(settings)
    from firebase_admin import auth as fb_auth

    try:
        claims = fb_auth.verify_id_token(token)
    except Exception as exc:
        raise unauthorized(f"invalid Firebase token: {type(exc).__name__}") from exc
    return principal_from_claims(claims)


async def upsert_user(db: DBLike, principal: Principal) -> None:
    """Best-effort `landstack.users` upsert; DB errors are logged, never raised."""
    try:
        existing = await db.fetchrow("SELECT name FROM landstack.users WHERE uid = :uid", uid=principal.uid)
        if existing and existing.get("name"):
            principal.name = existing["name"]
        else:
            await db.execute(
                """
                INSERT INTO landstack.users (uid, email, name, role, department, created_at)
                VALUES (:uid, :email, :name, :role, :department, now())
                ON CONFLICT (uid) DO UPDATE SET role = EXCLUDED.role,
                    department = EXCLUDED.department, email = COALESCE(EXCLUDED.email, landstack.users.email)
                """,
                uid=principal.uid,
                email=principal.email,
                name=principal.name,
                role=principal.role,
                department=principal.department,
            )
    except Exception as exc:
        log.debug("user upsert skipped: %s", exc)


async def has_consent(db: DBLike, principal: Principal | None, ulpin: str) -> bool:
    """True when the principal holds an unexpired consent row for the parcel (cached on the principal)."""
    if principal is None:
        return False
    if principal.is_officer:
        return True
    if ulpin in principal.consents:
        return True
    try:
        row = await db.fetchrow(
            """
            SELECT id FROM landstack.consents
            WHERE ulpin = :ulpin AND granted_to_uid = :uid AND (expires_at IS NULL OR expires_at > now())
            LIMIT 1
            """,
            ulpin=ulpin,
            uid=principal.uid,
        )
    except Exception as exc:
        log.debug("consent lookup failed: %s", exc)
        return False
    if row:
        principal.consents.add(ulpin)
        return True
    return False


async def current_principal(
    request: Request,
    db: DBLike = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Principal | None:
    """Optional principal dependency: None when anonymous."""
    cached = getattr(request.state, "principal", None)
    if cached is not None:
        return cached
    principal: Principal | None
    if settings.auth_mode == "firebase":
        header = request.headers.get("authorization", "")
        if not header:
            principal = None
        else:
            scheme, _, token = header.partition(" ")
            if scheme.lower() != "bearer" or not token:
                raise unauthorized("expected 'Authorization: Bearer <token>'")
            principal = _verify_firebase(token.strip(), settings)
    else:
        principal = parse_dev_header(request.headers.get("x-dev-user"))
    if principal is not None:
        await upsert_user(db, principal)
    request.state.principal = principal
    return principal


def require(*roles: str, department: str | None = None) -> Callable[..., Any]:
    """Dependency factory: `Depends(require("officer", department="revenue"))`. Admin always passes."""

    async def _dep(principal: Principal | None = Depends(current_principal)) -> Principal:
        if principal is None:
            raise unauthorized()
        if not principal.can(*roles, department=department):
            wanted = "/".join(roles) or "signed-in user"
            if department:
                wanted += f" ({department})"
            raise forbidden(f"requires {wanted}")
        return principal

    return _dep


require_user = require()
require_officer = require("officer")
require_admin = require("admin")
