"""Builds the real app with the fake DB installed and drives it end to end (including in-process adapters)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from landstack.main import DEPARTMENT_APPS, create_app
from landstack.services import aggregator

ULPIN = "TDR1K3M9A2F7C1"


def test_root_and_health(client) -> None:
    r = client.get("/")
    assert r.status_code == 200 and "X-Request-ID" in r.headers
    body = r.json()
    assert body["docs"].endswith("/docs") and set(body["departments"]) == set(DEPARTMENT_APPS)
    h = client.get("/healthz").json()
    assert h["status"] == "ok" and h["auth_mode"] == "dev"


def test_collections_listing(client) -> None:
    body = client.get("/landstack/collections").json()
    ids = {c["id"] for c in body["collections"]}
    assert ids == {"parcels", "zones", "restriction_zones", "roads", "projects", "village_boundary", "buildings", "settlement_schemes"}
    parcels = next(c for c in body["collections"] if c["id"] == "parcels")
    assert any(link["rel"] == "tiles" for link in parcels["links"])
    assert client.get("/landstack/collections/nope").json()["error"]["code"] == "not_found"


@pytest.mark.parametrize("dept", sorted(DEPARTMENT_APPS))
def test_department_openapi(client, dept: str) -> None:
    r = client.get(f"/{dept}/openapi.json")
    assert r.status_code == 200 and r.json()["info"]["title"]
    assert r.headers["X-Source-System"]
    idx = client.get(f"/{dept}/").json()
    assert idx["as_of"] and idx["department"] == dept


def test_department_endpoint_envelope_and_chaos(client, fake_db) -> None:
    fake_db.on(
        "FROM dept_revenue.ror WHERE ulpin",
        [{"khata_no": "K-0421", "ulpin": ULPIN, "owner_name": "Ravi Kumar", "extent_sqm": 223.0}],
    )
    r = client.get("/revenue/ror", params={"ulpin": ULPIN})
    assert r.status_code == 200 and r.headers["X-Source-System"] == "AP Meebhoomi (mock)"
    body = r.json()
    assert body["as_of"] and body["items"][0]["owner_name"] == "Ravi Kumar"
    bad = client.get("/revenue/ror", params={"ulpin": ULPIN, "fail": 1})
    assert bad.status_code == 503 and bad.json()["error"]["code"] == "simulated_failure"


def test_auth_gates_and_me(client) -> None:
    assert client.get("/landstack/me").status_code == 401
    me = client.get("/landstack/me", headers={"X-Dev-User": "officer:revenue:Anitha"}).json()
    assert me["role"] == "officer" and me["department"] == "revenue" and me["consents"] == []
    assert client.get("/landstack/stats", headers={"X-Dev-User": "citizen:Ravi Kumar"}).status_code == 403
    assert client.get("/landstack/consistency", headers={"X-Dev-User": "officer:revenue:Anitha"}).status_code == 403
    r = client.post("/landstack/events", json={"event": "revenue.ror_updated", "ulpin": ULPIN})
    assert r.status_code == 401
    r = client.post(
        "/landstack/events",
        json={"event": "revenue.ror_updated", "ulpin": ULPIN},
        headers={"X-Events-Secret": "change-me"},
    )
    assert r.status_code == 202 and r.json()["accepted"]


def _prime_parcel(fake_db) -> None:
    fake_db.on(
        "FROM landstack.parcels p LEFT JOIN landstack.parcel_status",
        lambda p: (
            []
            if p.get("ulpin") not in (None, ULPIN)
            else [
                {
                    "ulpin": ULPIN,
                    "state": "AP",
                    "district": "Guntur",
                    "taluk": "Mangalagiri",
                    "village": "Mangalagiri (R)",
                    "survey_no": "123/4",
                    "sub_division": None,
                    "land_use": "residential",
                    "zone_code": "R1",
                    "status_flags": {},
                    "updated_at": None,
                    "area_sqm": 223.0,
                    "cx": 80.5683,
                    "cy": 16.431,
                    "xmin": 80.568,
                    "ymin": 16.430,
                    "xmax": 80.569,
                    "ymax": 16.432,
                    "has_dispute": False,
                    "has_mortgage": False,
                    "tax_arrears": 0,
                    "pending_mutation": False,
                    "registered": True,
                    "permission_status": "approved",
                    "change_alert": False,
                }
            ]
        ),
    )
    fake_db.on(
        "FROM dept_revenue.ror WHERE ulpin",
        [
            {
                "khata_no": "K-0421",
                "ulpin": ULPIN,
                "survey_no": "123/4",
                "owner_name": "Ravi Kumar",
                "father_name": "Suresh",
                "ownership_type": "patta",
                "extent_sqm": 223.0,
                "classification": "dry",
                "mutation_history": [],
            }
        ],
    )
    fake_db.on(
        "FROM dept_registration.deeds WHERE ulpin",
        [
            {
                "doc_no": "DOC-2026-00042",
                "deed_type": "sale",
                "executant": "Lakshmi Devi",
                "claimant": "Ravi Kumar",
                "registered_on": "2026-04-12",
                "sro_code": "GNT-02",
            }
        ],
    )
    fake_db.on(
        "FROM dept_planning.zones z JOIN landstack.parcels p ON ST_Intersects",
        [{"id": 1, "zone_code": "R1", "name": "Residential", "permissible_uses": ["residential"]}],
    )
    fake_db.on(
        "FROM dept_planning.building_permissions WHERE ulpin",
        [{"permit_no": "BP-5678", "status": "approved", "floors": 2}],
    )
    fake_db.on(
        "FROM dept_fiscal.property_tax",
        [{"assessment_no": "A-1", "annual_demand": 12500, "arrears": 0, "paid_till": "2026-27"}],
    )
    fake_db.on("FROM dept_fiscal.valuation", [{"guideline_value_per_sqm": 18000, "effective_from": "2026-04-01"}])
    fake_db.on(
        "FROM dept_utilities.connections",
        [{"water": True, "electricity": True, "sewer": False, "road_access_m": 12, "nearest_road_class": "district"}],
    )


def test_parcel_cdm_end_to_end_through_in_process_adapters(client, fake_db) -> None:
    aggregator.invalidate()
    _prime_parcel(fake_db)
    officer = client.get(f"/landstack/parcels/{ULPIN}", headers={"X-Dev-User": "officer:revenue:Anitha"})
    assert officer.status_code == 200, officer.text
    cdm = officer.json()
    assert all(cdm["provenance"][d]["ok"] for d in DEPARTMENT_APPS), cdm["provenance"]
    assert cdm["provenance"]["revenue"]["source"] == "AP Meebhoomi (mock)" and cdm["provenance"]["revenue"]["as_of"]
    assert cdm["party"]["owners"][0]["name"] == "Ravi Kumar" and cdm["identifiers"]["khata_no"] == "K-0421"
    assert (
        cdm["rights"]["registration"]["status"] == "registered"
        and cdm["rights"]["registration"]["doc_no"] == "DOC-2026-00042"
    )
    assert (
        cdm["planning"]["zone_name"] == "Residential"
        and cdm["planning"]["building_permission"]["permit_no"] == "BP-5678"
    )
    assert cdm["fiscal"]["estimated_value"] == 18000 * 223.0 and cdm["utilities"]["road_access_m"] == 12
    assert cdm["consistency"]["area_match"] and cdm["consistency"]["owner_match"]
    citizen = client.get(f"/landstack/parcels/{ULPIN}", headers={"X-Dev-User": "citizen:Lakshmi Devi"}).json()
    assert citizen["party"]["masked"] is True and citizen["party"]["owners"][0]["name"] == "R*** K***"
    assert citizen["rights"]["registration"]["doc_no"] == "****0042"
    missing = client.get("/landstack/parcels/NOPE", headers={"X-Dev-User": "admin"})
    assert missing.status_code == 404 and missing.json()["error"]["code"] == "not_found"


def test_adapters_and_connectors_admin_views(client) -> None:
    ad = client.get("/landstack/adapters", headers={"X-Dev-User": "admin"}).json()
    assert {m["name"] for m in ad["items"]} >= {"revenue_ap", "revenue_tn", "registration_ap"}
    conn = client.get("/landstack/connectors", headers={"X-Dev-User": "admin"}).json()
    assert {c["name"] for c in conn["items"]} == set(DEPARTMENT_APPS) and all(c["ok"] for c in conn["items"])


def test_planning_check_rule_via_http(client, fake_db) -> None:
    fake_db.on(
        "FROM dept_planning.zones z JOIN landstack.parcels p ON ST_Intersects",
        [{"id": 1, "zone_code": "R1", "name": "Residential", "permissible_uses": ["residential"]}],
    )
    fake_db.on("FROM gis.restriction_zones r", [])
    ok = client.get("/planning/check", params={"ulpin": ULPIN, "use": "residential", "floors": 2}).json()
    assert ok["permissible"] is True and ok["reasons"] == []
    bad = client.get("/planning/check", params={"ulpin": ULPIN, "use": "industrial", "floors": 3}).json()
    assert bad["permissible"] is False and len(bad["reasons"]) == 2


def test_validation_error_envelope(client) -> None:
    r = client.post("/landstack/applications", json={"ulpin": ULPIN}, headers={"X-Dev-User": "citizen:Ravi Kumar"})
    assert r.status_code == 422 and r.json()["error"]["code"] == "validation_error"
    r = client.get("/landstack/tiles/nope/1/0/0.pbf")
    assert r.status_code == 404
    r = client.get("/landstack/tiles/parcels/3/9/0.pbf")
    assert r.status_code == 422 and r.json()["error"]["code"] == "invalid_tile"
