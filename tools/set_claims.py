#!/usr/bin/env python3
"""Set Land Stack role claims on Firebase Auth users (CONTRACTS §3).

Usage::

    python tools/set_claims.py --email anitha@example.com --role officer --department revenue
    python tools/set_claims.py --email admin@example.com --role admin
    python tools/set_claims.py --email ravi@example.com --role citizen        # clears department
    python tools/set_claims.py --list                                          # every user + claims
    python tools/set_claims.py --demo                                          # apply the six demo roles by email prefix

Credentials: ``GOOGLE_APPLICATION_CREDENTIALS=/path/serviceAccount.json`` (Firebase console → Project
settings → Service accounts → Generate new private key) or ``gcloud auth application-default login``.
``FIREBASE_PROJECT_ID`` (or ``--project``) is required with application-default credentials.

Users must already exist (sign in once through the web app, or add them in the Firebase console).
Claims take effect on the next ID-token refresh (≤ 1 h, or immediately after sign-out/sign-in).
"""

from __future__ import annotations

import argparse
import json
import os
import sys

ROLES = ("citizen", "officer", "admin")
DEPARTMENTS = ("revenue", "registration", "planning")

# email local-part → (role, department); used by --demo. Adjust to your real test accounts.
DEMO_ROLES = {
    "ravi": ("citizen", None),
    "lakshmi": ("citizen", None),
    "anitha": ("officer", "revenue"),
    "suresh": ("officer", "registration"),
    "farida": ("officer", "planning"),
    "admin": ("admin", None),
}


def _init(project: str | None) -> None:
    try:
        import firebase_admin
        from firebase_admin import credentials
    except ImportError as exc:  # pragma: no cover
        raise SystemExit("firebase-admin is required: pip install firebase-admin") from exc
    if firebase_admin._apps:  # noqa: SLF001
        return
    options = {"projectId": project} if project else None
    key_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    cred = credentials.Certificate(key_path) if key_path and os.path.exists(key_path) else credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, options)


def set_role(email: str, role: str, department: str | None) -> dict:
    from firebase_admin import auth

    if role not in ROLES:
        raise SystemExit(f"role must be one of {ROLES}")
    if role == "officer" and department not in DEPARTMENTS:
        raise SystemExit(f"officers need --department in {DEPARTMENTS}")
    if role != "officer":
        department = None
    user = auth.get_user_by_email(email)
    claims = {k: v for k, v in (user.custom_claims or {}).items() if k not in {"role", "department"}}
    claims["role"] = role
    if department:
        claims["department"] = department
    auth.set_custom_user_claims(user.uid, claims)
    return {"uid": user.uid, "email": user.email, "claims": auth.get_user(user.uid).custom_claims or {}}


def list_users() -> list[dict]:
    from firebase_admin import auth

    rows = []
    for user in auth.list_users().iterate_all():
        claims = user.custom_claims or {}
        rows.append(
            {
                "uid": user.uid,
                "email": user.email,
                "name": user.display_name,
                "role": claims.get("role", "citizen (default)"),
                "department": claims.get("department"),
                "disabled": user.disabled,
            }
        )
    return rows


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--email")
    ap.add_argument("--role", choices=ROLES)
    ap.add_argument("--department", choices=DEPARTMENTS)
    ap.add_argument("--list", action="store_true", help="print every user with role/department")
    ap.add_argument("--demo", action="store_true", help="apply DEMO_ROLES to users whose email local-part matches")
    ap.add_argument("--project", default=os.environ.get("FIREBASE_PROJECT_ID") or None, help="Firebase project id")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args(argv)

    _init(args.project)

    if args.list:
        rows = list_users()
        if args.json:
            print(json.dumps(rows, indent=2))
        else:
            print(f"{'email':36} {'role':10} {'department':13} uid")
            for r in rows:
                print(f"{(r['email'] or '-'):36} {r['role']:10} {(r['department'] or '-'):13} {r['uid']}")
        return 0

    if args.demo:
        from firebase_admin import auth

        applied = 0
        for user in auth.list_users().iterate_all():
            local = (user.email or "").split("@")[0].lower()
            if local in DEMO_ROLES:
                role, dept = DEMO_ROLES[local]
                result = set_role(user.email, role, dept)
                print(f"{user.email:36} -> {result['claims']}")
                applied += 1
        print(f"{applied} user(s) updated")
        return 0

    if not (args.email and args.role):
        ap.error("--email and --role are required (or use --list / --demo)")
    result = set_role(args.email, args.role, args.department)
    print(json.dumps(result, indent=2) if args.json else f"{result['email']} ({result['uid']}) claims = {result['claims']}")
    print("note: the user must refresh their ID token (sign out/in) before the API sees the new role")
    return 0


if __name__ == "__main__":
    sys.exit(main())
