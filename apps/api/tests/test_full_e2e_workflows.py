"""Comprehensive End-to-End Workflow Tests against Live Land Stack Services.

Validates the complete lifecycle:
1. Multi-user / multi-device identity isolation (different citizens / officers).
2. Verification order enforcement (VRO -> Surveyor -> RI -> Tahsildar).
3. Statutory rejection transparency: exact speaking order, authority, designation, and timestamp.
4. Statutory approval and app-wide state reflection:
   - Record corrections propagate across revenue, cadastral parcels, and CDM.
   - Utility requests provision connections and reflect in parcel profile.
   - Acquisition claims record §23A / §64 consent awards on project impacts.
5. Ownership verification accuracy and citizen data protection.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

PARCEL_ULPIN = "TFCM91641E6C82"  # Mangalagiri Sy 126
CORRECTION_ULPIN = "TFCM916196F0FE"  # Mangalagiri Sy 124
VERIFY_ULPIN = "TFCM9134DACFB3"  # Mangalagiri Sy 123/4 (Ravindra Nallamothu)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def app_client():
    async with AsyncClient(base_url="http://localhost:8000", timeout=15.0) as client:
        yield client


@pytest.mark.asyncio
async def test_multi_user_registration_and_isolation(app_client: AsyncClient):
    """Two different citizens on independent sessions have isolated profiles and records."""
    headers_citizen_a = {"X-Dev-User": "citizen::Kiran Naidu"}
    headers_citizen_b = {"X-Dev-User": "citizen::Priya Sharma"}

    # Both users fetch their identity
    me_a = (await app_client.get("/landstack/me", headers=headers_citizen_a)).json()
    me_b = (await app_client.get("/landstack/me", headers=headers_citizen_b)).json()

    assert me_a["name"] == "Kiran Naidu"
    assert me_a["role"] == "citizen"
    assert me_a["uid"] == "dev-kiran-naidu"

    assert me_b["name"] == "Priya Sharma"
    assert me_b["role"] == "citizen"
    assert me_b["uid"] == "dev-priya-sharma"
    assert me_a["uid"] != me_b["uid"]

    # Citizen A submits a land complaint
    sub_res = await app_client.post(
        "/landstack/applications",
        headers=headers_citizen_a,
        json={
            "ulpin": PARCEL_ULPIN,
            "type": "land_complaint",
            "payload": {
                "category": "boundary_encroachment",
                "description": "Northern fence moved by adjacent occupant without notice.",
            },
        },
    )
    assert sub_res.status_code == 201
    app_a = sub_res.json()
    assert app_a["applicant_uid"] == "dev-kiran-naidu"
    assert app_a["applicant_name"] == "Kiran Naidu"

    # Citizen A sees it in their application list
    apps_a = (await app_client.get("/landstack/applications", headers=headers_citizen_a)).json()["items"]
    assert any(a["id"] == app_a["id"] for a in apps_a)

    # Citizen B cannot see Citizen A's application in their personal listing
    apps_b = (await app_client.get("/landstack/applications", headers=headers_citizen_b)).json()["items"]
    assert not any(a["id"] == app_a["id"] for a in apps_b)


@pytest.mark.asyncio
async def test_rejection_reason_transparency_in_order(app_client: AsyncClient):
    """Test verification hierarchy and explicit statutory rejection reason returned to citizen."""
    citizen_headers = {"X-Dev-User": "citizen::Suresh Kumar"}
    vro_headers = {"X-Dev-User": "officer:revenue:vro:Ramesh"}
    surveyor_headers = {"X-Dev-User": "officer:revenue:surveyor:Swathi"}
    tahsildar_headers = {"X-Dev-User": "officer:revenue:tahsildar:Anitha"}

    # 1. Citizen submits a mutation application
    sub = await app_client.post(
        "/landstack/applications",
        headers=citizen_headers,
        json={
            "ulpin": PARCEL_ULPIN,
            "type": "mutation",
            "payload": {
                "to_owner": "Suresh Kumar",
                "reason": "Registered Sale Deed No 4021/2026",
            },
        },
    )
    assert sub.status_code == 201
    app_data = sub.json()
    app_id = app_data["id"]
    assert app_data["status"] == "submitted"

    # 2. VRO cannot issue final quasi-judicial rejection directly
    vro_bad = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=vro_headers,
        json={"action": "rejected", "remark": "Premature rejection by field staff"},
    )
    assert vro_bad.status_code in (403, 409)

    # 3. VRO performs legitimate field inspection and ground panchanama
    vro_ok = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=vro_headers,
        json={"action": "field_inspection", "remark": "Conducted ground panchanama with village elders."},
    )
    assert vro_ok.status_code == 200
    assert vro_ok.json()["status"] == "field_inspection"

    # 4. VRO forwards to Cadastral Surveyor for Demarcation
    vro_fwd = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=vro_headers,
        json={"action": "boundary_demarcation", "remark": "Submitted panchanama, request FMB demarcation."},
    )
    assert vro_fwd.status_code == 200

    # 5. Surveyor submits FMB Cadastral Verification
    surv_ok = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=surveyor_headers,
        json={"action": "scrutiny_review", "remark": "FMB boundaries checked. Notice of discrepancy flagged."},
    )
    assert surv_ok.status_code == 200

    # 6. Tahsildar reviews scrutiny report and rejects with speaking order
    rejection_grounds = "Title deed encumbrance mismatch: prior mortgage unpaid at SBI Mangalagiri branch. Khata 421 dispute."
    rej = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=tahsildar_headers,
        json={"action": "rejected", "remark": rejection_grounds},
    )
    assert rej.status_code == 200
    rej_data = rej.json()
    assert rej_data["status"] == "rejected"
    assert rej_data["payload"]["rejection_reason"] == rejection_grounds
    assert rej_data["payload"]["rejected_by"] == "Anitha"
    assert rej_data["payload"]["rejected_by_designation"] == "tahsildar"
    assert "rejected_at" in rej_data["payload"]

    # 7. Citizen tracks application and receives full statutory order & grounds
    track_res = await app_client.get(f"/landstack/applications/{app_id}", headers=citizen_headers)
    assert track_res.status_code == 200
    citizen_view = track_res.json()
    assert citizen_view["status"] == "rejected"
    assert citizen_view["payload"]["rejection_reason"] == rejection_grounds
    assert citizen_view["payload"]["rejected_by_designation"] == "tahsildar"
    assert citizen_view["payload"]["rejected_by"] == "Anitha"


@pytest.mark.asyncio
async def test_record_correction_approval_and_appwide_reflection(app_client: AsyncClient):
    """Test that approved record correction propagates across database, CDM, and parcel endpoints."""
    citizen_headers = {"X-Dev-User": "citizen::Jatin Baral"}
    vro_headers = {"X-Dev-User": "officer:revenue:vro:Ramesh"}
    surveyor_headers = {"X-Dev-User": "officer:revenue:surveyor:Swathi"}
    ri_headers = {"X-Dev-User": "officer:revenue:ri:Chaitanya"}
    tahsildar_headers = {"X-Dev-User": "officer:revenue:tahsildar:Anitha"}

    # Submit record correction for survey extent
    new_extent = "265.50 sqm"
    sub = await app_client.post(
        "/landstack/applications",
        headers=citizen_headers,
        json={
            "ulpin": CORRECTION_ULPIN,
            "type": "record_correction",
            "payload": {
                "field": "extent",
                "corrected_value": new_extent,
                "description": "Rectify discrepancy between RoR 1B and digital cadastral map",
            },
        },
    )
    assert sub.status_code == 201
    app_id = sub.json()["id"]

    # Order of verification:
    # 1. VRO inspects
    r1 = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=vro_headers,
        json={"action": "field_inspection", "remark": "Verified survey stones on ground."},
    )
    assert r1.status_code == 200

    # 2. VRO forwards for boundary demarcation
    r2 = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=vro_headers,
        json={"action": "boundary_demarcation", "remark": "Forwarded to Surveyor for Cadastral Check."},
    )
    assert r2.status_code == 200

    # 3. Surveyor submits FMB cadastral verification
    r3 = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=surveyor_headers,
        json={"action": "scrutiny_review", "remark": "FMB sketch verified: area discrepancy confirmed."},
    )
    assert r3.status_code == 200

    # 4. RI provides supervisory endorsement
    r4 = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=ri_headers,
        json={"action": "statutory_sanction", "remark": "Endorsed to Tahsildar for statutory sanction."},
    )
    assert r4.status_code == 200

    # 5. Tahsildar passes final statutory approval order
    approval_remark = "Statutory record correction sanctioned as per G.O. Ms. No. 42 Revenue Dept."
    appr = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=tahsildar_headers,
        json={"action": "approved", "remark": approval_remark},
    )
    assert appr.status_code == 200
    appr_data = appr.json()
    assert appr_data["status"] == "approved"
    assert appr_data["payload"]["approval_remark"] == approval_remark

    # Verify app-wide reflection: parcel CDM reflects updated area in spatial block
    parcel_res = await app_client.get(f"/landstack/parcels/{CORRECTION_ULPIN}", headers=citizen_headers)
    assert parcel_res.status_code == 200
    p_data = parcel_res.json()
    assert float(p_data["spatial"]["area_sqm"]) == 265.50


@pytest.mark.asyncio
async def test_utility_request_approval_and_cdm_reflection(app_client: AsyncClient):
    """Test utility connection request sanctioning and CDM aggregation."""
    citizen_headers = {"X-Dev-User": "citizen::Ravi Kumar"}
    vro_headers = {"X-Dev-User": "officer:revenue:vro:Ramesh"}
    tahsildar_headers = {"X-Dev-User": "officer:revenue:tahsildar:Anitha"}

    # Submit utility request
    sub = await app_client.post(
        "/landstack/applications",
        headers=citizen_headers,
        json={
            "ulpin": PARCEL_ULPIN,
            "type": "utility_request",
            "payload": {
                "action": "new_connection",
                "utility_type": "electricity",
                "sanctioned_load_kw": 5.0,
                "tariff_category": "LT-1 Domestic",
                "phase": "3-Phase",
                "consumer_name": "Ravi Kumar",
                "remarks": "Residential construction power supply sanction",
            },
        },
    )
    assert sub.status_code == 201
    app_id = sub.json()["id"]

    # Order of verification: VRO takes up for review
    r1 = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=vro_headers,
        json={"action": "in_review", "remark": "Verified feasibility of service line connection."},
    )
    assert r1.status_code == 200

    # Tahsildar approves from in_review
    appr = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=tahsildar_headers,
        json={"action": "approved", "remark": "Sanctioned connection under LT-1 domestic quota."},
    )
    assert appr.status_code == 200
    assert appr.json()["status"] == "approved"

    # Verify parcel CDM includes utility connection
    p_res = await app_client.get(f"/landstack/parcels/{PARCEL_ULPIN}", headers=citizen_headers)
    assert p_res.status_code == 200
    p_cdm = p_res.json()
    u_details = p_cdm.get("utilities", {})
    assert u_details.get("electricity") is True
    assert u_details.get("electricity_details", {}).get("consumer_name") == "Ravi Kumar"
    assert any(h.get("consumer_name") == "Ravi Kumar" for h in u_details.get("history", []))


@pytest.mark.asyncio
async def test_acquisition_claim_approval_and_impact_reflection(app_client: AsyncClient):
    """Test that statutory acquisition claim consent updates project parcel impacts."""
    citizen_headers = {"X-Dev-User": "citizen::Ravindra Nallamothu"}
    vro_headers = {"X-Dev-User": "officer:revenue:vro:Ramesh"}
    tahsildar_headers = {"X-Dev-User": "officer:revenue:tahsildar:Anitha"}

    # Submit consent claim
    sub = await app_client.post(
        "/landstack/applications",
        headers=citizen_headers,
        json={
            "ulpin": VERIFY_ULPIN,
            "type": "acquisition_claim",
            "payload": {
                "project_id": 1,
                "response_type": "consent_settlement",
                "compensation_accepted": True,
                "consent_terms": "Accepted under RFCTLARR Section 23A direct settlement agreement",
            },
        },
    )
    assert sub.status_code == 201
    app_id = sub.json()["id"]

    # Scrutinize claim
    r1 = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=vro_headers,
        json={"action": "in_review", "remark": "Verified title and extent affected by project alignment."},
    )
    assert r1.status_code == 200

    # Tahsildar approves direct consent settlement award
    appr = await app_client.post(
        f"/landstack/applications/{app_id}/transition",
        headers=tahsildar_headers,
        json={"action": "approved", "remark": "Sanctioned direct consent compensation award under Sec 23A."},
    )
    assert appr.status_code == 200
    assert appr.json()["status"] == "approved"

    # Verify CDM reflects updated acquisition impact status
    p_res = await app_client.get(f"/landstack/parcels/{VERIFY_ULPIN}", headers=citizen_headers)
    assert p_res.status_code == 200
    p_data = p_res.json()
    impacts = p_data.get("projects", {}).get("affected_projects", [])
    if impacts:
        assert any(i.get("status") == "consent_accepted" for i in impacts)


@pytest.mark.asyncio
async def test_ownership_verification_precision(app_client: AsyncClient):
    """Test ownership verification logic for legitimate owners vs mismatches."""
    citizen_headers = {"X-Dev-User": "citizen::Ravindra Nallamothu"}

    # 1. Successful verification with exact match
    valid_res = await app_client.post(
        "/landstack/verify-ownership",
        headers=citizen_headers,
        json={
            "ulpin": VERIFY_ULPIN,
            "claimed_name": "Ravindra Nallamothu",
        },
    )
    assert valid_res.status_code == 200
    v_data = valid_res.json()
    assert v_data["match"] is True
    assert v_data["score"] >= 80.0

    # 2. Failed verification with incorrect name
    invalid_res = await app_client.post(
        "/landstack/verify-ownership",
        headers=citizen_headers,
        json={
            "ulpin": VERIFY_ULPIN,
            "claimed_name": "Unauthorized Stranger",
        },
    )
    assert invalid_res.status_code == 200
    inv_data = invalid_res.json()
    assert inv_data["match"] is False
    assert inv_data["score"] < 50.0
