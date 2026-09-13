"""Dev-header parsing, claim mapping, role checks and the `require()` dependency."""

from __future__ import annotations

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from landstack.auth import Principal, current_principal, parse_dev_header, principal_from_claims, require
from landstack.errors import AppError, install_error_handlers


def test_parse_dev_header_variants() -> None:
    assert parse_dev_header(None) is None
    assert parse_dev_header("   ") is None
    p = parse_dev_header("officer:revenue:Anitha")
    assert (p.role, p.department, p.name) == ("officer", "revenue", "Anitha")
    c = parse_dev_header("citizen:Ravi Kumar")
    assert (c.role, c.department, c.name) == ("citizen", None, "Ravi Kumar")
    a = parse_dev_header("admin")
    assert a.role == "admin" and a.department is None and a.uid.startswith("dev-")
    assert parse_dev_header("citizen:Ravi Kumar").uid == parse_dev_header("citizen:Ravi Kumar").uid


def test_parse_dev_header_rejects_bad_input() -> None:
    with pytest.raises(AppError):
        parse_dev_header("wizard")
    with pytest.raises(AppError):
        parse_dev_header("officer")  # officers need a department


def test_principal_from_claims_defaults_to_citizen() -> None:
    p = principal_from_claims({"uid": "abc", "email": "x@y.z"})
    assert p.role == "citizen" and p.department is None and p.name == "x@y.z"
    o = principal_from_claims({"sub": "u1", "role": "officer", "department": "Planning", "name": "Farida"})
    assert (o.role, o.department) == ("officer", "planning")
    assert principal_from_claims({"uid": "u", "role": "superuser"}).role == "citizen"


def test_can_checks() -> None:
    admin = Principal(uid="a", role="admin")
    rev = Principal(uid="r", role="officer", department="revenue")
    cit = Principal(uid="c", role="citizen")
    assert admin.can("officer", department="planning")
    assert rev.can("officer") and rev.can("officer", department="revenue")
    assert not rev.can("officer", department="planning")
    assert not cit.can("officer") and cit.can("citizen") and cit.can()


def _app() -> FastAPI:
    app = FastAPI()
    install_error_handlers(app)

    @app.get("/open")
    async def open_(p: Principal | None = Depends(current_principal)) -> dict:
        return {"anon": p is None}

    @app.get("/officer")
    async def officer(p: Principal = Depends(require("officer", department="revenue"))) -> dict:
        return {"uid": p.uid, "role": p.role}

    return app


def test_require_dependency(fake_db) -> None:
    client = TestClient(_app())
    assert client.get("/open").json() == {"anon": True}
    r = client.get("/officer")
    assert r.status_code == 401 and r.json()["error"]["code"] == "unauthorized"
    r = client.get("/officer", headers={"X-Dev-User": "officer:planning:Farida"})
    assert r.status_code == 403 and r.json()["error"]["code"] == "forbidden"
    r = client.get("/officer", headers={"X-Dev-User": "officer:revenue:Anitha"})
    assert r.status_code == 200 and r.json()["role"] == "officer"
    assert client.get("/officer", headers={"X-Dev-User": "admin"}).status_code == 200
    # first sight upserts the user (best effort)
    assert fake_db.executed_like("INSERT INTO landstack.users")
