"""Utilities (water / electricity / sewer / gas / broadband / road access).
Schema: `dept_utilities`.
GET /connections?ulpin= · POST /modify
"""

from __future__ import annotations

import datetime as dt
import json
from typing import Any

from fastapi import Depends
from pydantic import BaseModel, Field

from departments.common import chaos, envelope, make_dept_app
from landstack.db import DBLike, get_db

SOURCE = "ULB Utilities (mock)"
app = make_dept_app(
    "utilities",
    "Utilities — Connections & Municipal Services",
    "Municipal service connections (power, water, sewer, gas, broadband), infrastructure details, and service requests.",
    SOURCE,
)


class UtilityModifyIn(BaseModel):
    ulpin: str
    action: str = "modify"  # new_connection, name_transfer, load_enhancement, category_change, meter_replacement, modify
    utility_type: str = "all"  # electricity, water, sewer, gas, broadband, sanitation, all
    consumer_name: str | None = None
    sanctioned_load_kw: float | None = None
    pipe_size_mm: int | None = None
    tariff_category: str | None = None
    phase: str | None = None
    meter_no: str | None = None
    provider: str | None = None
    remarks: str | None = None
    application_id: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)


@app.get("/connections", dependencies=[Depends(chaos)])
async def connections(ulpin: str, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    row = await db.fetchrow("SELECT * FROM dept_utilities.connections WHERE ulpin = :u", u=ulpin)
    return envelope(SOURCE, item=row)


@app.post("/modify", status_code=200)
async def modify_utilities(body: UtilityModifyIn, db: DBLike = Depends(get_db)) -> dict[str, Any]:
    """Modify or sanction utility connections (new connection, name transfer, load change, meter replacement)."""
    async with db.transaction():
        row = await db.fetchrow("SELECT * FROM dept_utilities.connections WHERE ulpin = :u", u=body.ulpin)
        if row is None:
            # Create baseline record if parcel lacks one
            row = await db.fetchrow(
                """
                INSERT INTO dept_utilities.connections
                    (ulpin, water, electricity, sewer, gas, broadband, rainwater_harvesting, solid_waste_mgmt, road_access_m, nearest_road_class)
                VALUES (:u, false, false, false, false, false, false, true, 6.0, 'residential')
                RETURNING *
                """,
                u=body.ulpin,
            )

        elec_details = dict(row.get("electricity_details") or {})
        water_details = dict(row.get("water_details") or {})
        sewer_details = dict(row.get("sewer_details") or {})
        gas_details = dict(row.get("gas_details") or {})
        bb_details = dict(row.get("broadband_details") or {})
        san_details = dict(row.get("sanitation_details") or {})
        history = list(row.get("history") or [])

        w_flag = row.get("water")
        e_flag = row.get("electricity")
        s_flag = row.get("sewer")
        g_flag = row.get("gas")
        b_flag = row.get("broadband")

        u_type = (body.utility_type or "all").lower()
        action = (body.action or "modify").lower()

        # 1. Name transfer or global sync across utilities
        if action == "name_transfer" or u_type in ("all", "global"):
            if body.consumer_name:
                if elec_details or e_flag:
                    elec_details["consumer_name"] = body.consumer_name
                if water_details or w_flag:
                    water_details["consumer_name"] = body.consumer_name
                if gas_details or g_flag:
                    gas_details["consumer_name"] = body.consumer_name

        # 2. Electricity modifications
        if u_type in ("electricity", "power", "all"):
            if action in ("new_connection", "modify", "load_enhancement", "category_change", "meter_replacement"):
                e_flag = True
                elec_details["status"] = "active"
            if body.consumer_name:
                elec_details["consumer_name"] = body.consumer_name
            if body.sanctioned_load_kw is not None:
                elec_details["sanctioned_load_kw"] = float(body.sanctioned_load_kw)
            if body.tariff_category:
                elec_details["tariff_category"] = body.tariff_category
            if body.phase:
                elec_details["phase"] = body.phase
            if body.meter_no:
                elec_details["meter_no"] = body.meter_no
            if body.provider:
                elec_details["provider"] = body.provider
            if not elec_details.get("consumer_no") and body.action == "new_connection":
                elec_details["consumer_no"] = f"USC-{body.ulpin[:6].upper()}-01"
                elec_details["connection_date"] = dt.date.today().isoformat()

        # 3. Water modifications
        if u_type in ("water", "water_supply", "all"):
            if action in ("new_connection", "modify", "load_enhancement", "meter_replacement"):
                w_flag = True
                water_details["status"] = "active"
            if body.consumer_name:
                water_details["consumer_name"] = body.consumer_name
            if body.pipe_size_mm is not None:
                water_details["pipe_size_mm"] = int(body.pipe_size_mm)
            if body.meter_no:
                water_details["meter_no"] = body.meter_no
            if body.provider:
                water_details["provider"] = body.provider
            if not water_details.get("consumer_no") and body.action == "new_connection":
                water_details["consumer_no"] = f"CAN-{body.ulpin[6:11].upper()}-W"
                water_details["connection_date"] = dt.date.today().isoformat()

        # 4. Sewer modifications
        if u_type in ("sewer", "drainage", "sewerage", "all"):
            if action in ("new_connection", "modify"):
                s_flag = True
                sewer_details["status"] = "connected"
                if not sewer_details.get("connection_no"):
                    sewer_details["connection_no"] = f"UGD-{body.ulpin[:5].upper()}-S"
                    sewer_details["network_type"] = "Underground Drainage (UGD)"
                    sewer_details["nearest_manhole_distance_m"] = 6.0
                    sewer_details["chamber_inspection"] = "clear_pass"

        # 5. Gas modifications
        if u_type in ("gas", "png", "all"):
            if action in ("new_connection", "modify", "meter_replacement"):
                g_flag = True
                gas_details["status"] = "active"
            if body.consumer_name:
                gas_details["consumer_name"] = body.consumer_name
            if body.meter_no:
                gas_details["meter_no"] = body.meter_no
            if body.provider:
                gas_details["provider"] = body.provider
            if not gas_details.get("bp_no") and body.action == "new_connection":
                gas_details["bp_no"] = f"PNG-{body.ulpin[2:7].upper()}-G"
                gas_details["connection_type"] = "Domestic Piped Natural Gas (PNG)"

        # 6. Broadband modifications
        if u_type in ("broadband", "fiber", "internet", "all"):
            if action in ("new_connection", "modify"):
                b_flag = True
                bb_details["status"] = "active"
                if not bb_details.get("infrastructure"):
                    bb_details["infrastructure"] = "Underground Fiber Optic Micro-Duct (OFC)"
                    bb_details["available_isps"] = ["BSNL Bharat Fiber", "JioFiber", "Airtel Xstream"]
                    bb_details["max_speed_available"] = "1 Gbps Gigabit FTTH"

        # Merge any custom details
        if body.details:
            if u_type == "electricity":
                elec_details.update(body.details)
            elif u_type == "water":
                water_details.update(body.details)
            elif u_type == "sewer":
                sewer_details.update(body.details)
            elif u_type == "gas":
                gas_details.update(body.details)
            elif u_type == "broadband":
                bb_details.update(body.details)
            elif u_type == "sanitation":
                san_details.update(body.details)

        # Log history entry
        log_entry = {
            "date": dt.date.today().isoformat(),
            "action": body.action,
            "utility_type": body.utility_type,
            "consumer_name": body.consumer_name,
            "remark": body.remarks or f"Utility {body.action.replace('_', ' ')} processed",
            "application_id": body.application_id,
        }
        history.insert(0, log_entry)

        updated = await db.fetchrow(
            """
            UPDATE dept_utilities.connections
            SET
                water = :w,
                electricity = :e,
                sewer = :s,
                gas = :g,
                broadband = :b,
                electricity_details = CAST(:ed AS jsonb),
                water_details = CAST(:wd AS jsonb),
                sewer_details = CAST(:sd AS jsonb),
                gas_details = CAST(:gd AS jsonb),
                broadband_details = CAST(:bd AS jsonb),
                sanitation_details = CAST(:snd AS jsonb),
                history = CAST(:h AS jsonb),
                updated_at = now()
            WHERE ulpin = :u
            RETURNING *
            """,
            u=body.ulpin,
            w=bool(w_flag),
            e=bool(e_flag),
            s=bool(s_flag),
            g=bool(g_flag),
            b=bool(b_flag),
            ed=json.dumps(elec_details),
            wd=json.dumps(water_details),
            sd=json.dumps(sewer_details),
            gd=json.dumps(gas_details),
            bd=json.dumps(bb_details),
            snd=json.dumps(san_details),
            h=json.dumps(history),
        )

    return envelope(SOURCE, item=updated)
