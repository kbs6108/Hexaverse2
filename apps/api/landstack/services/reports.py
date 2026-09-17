"""Signed parcel reports: HTML → PDF (WeasyPrint) with summary table, provenance, SVG mini-map and QR.

The PDF is hashed (sha256) and signed with HMAC-SHA256(REPORT_HMAC_SECRET, "<id>:<sha256>"); the
QR points at `${PUBLIC_WEB_URL}/verify/{id}` and `GET /verify/{id}` re-checks the signature.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import hmac
import html
import secrets
from typing import Any

import segno

from landstack.auth import Principal
from landstack.config import get_settings
from landstack.db import DBLike
from landstack.errors import AppError, not_found
from landstack.services import audit
from landstack.services.storage import get_storage


def new_report_id() -> str:
    return "LSR-" + secrets.token_hex(5).upper()


def sign(report_id: str, sha256_hex: str, secret: str | None = None) -> str:
    secret = secret if secret is not None else get_settings().report_hmac_secret
    return hmac.new(secret.encode(), f"{report_id}:{sha256_hex}".encode(), hashlib.sha256).hexdigest()


def verify_signature(report_id: str, sha256_hex: str, signature: str, secret: str | None = None) -> bool:
    return hmac.compare_digest(sign(report_id, sha256_hex, secret), signature or "")


def _rings(geometry: dict[str, Any] | None) -> list[list[list[float]]]:
    if not geometry:
        return []
    t, coords = geometry.get("type"), geometry.get("coordinates") or []
    if t == "Polygon":
        return [ring for ring in coords]
    if t == "MultiPolygon":
        return [ring for poly in coords for ring in poly]
    return []


def mini_map_svg(geometry: dict[str, Any] | None, size: int = 240) -> str:
    """Static SVG of the parcel outline (no network); lon/lat projected to the viewbox with padding."""
    rings = _rings(geometry)
    pts = [p for ring in rings for p in ring]
    if not pts:
        return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}"><rect width="100%" height="100%" fill="#eee"/></svg>'
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    span = max(maxx - minx, maxy - miny) or 1e-9
    pad = 20
    scale = (size - 2 * pad) / span
    ox = pad + ((size - 2 * pad) - (maxx - minx) * scale) / 2
    oy = pad + ((size - 2 * pad) - (maxy - miny) * scale) / 2

    def proj(p: list[float]) -> str:
        return f"{ox + (p[0] - minx) * scale:.1f},{size - (oy + (p[1] - miny) * scale):.1f}"

    paths = " ".join("M" + " L".join(proj(p) for p in ring) + " Z" for ring in rings)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
        f'<rect width="100%" height="100%" fill="#f4f6f8" stroke="#cbd5e1"/>'
        f'<path d="{paths}" fill="#2563eb33" stroke="#1d4ed8" stroke-width="2"/>'
        f'<text x="8" y="{size - 8}" font-size="9" fill="#475569">EPSG:4326 · bbox {minx:.4f},{miny:.4f} – {maxx:.4f},{maxy:.4f}</text>'
        "</svg>"
    )


def qr_svg(url: str) -> str:
    return segno.make(url, error="m").svg_inline(scale=3, dark="#111827")


def _e(v: Any) -> str:
    return html.escape("—" if v is None or v == "" else str(v))


def _yn(v: Any) -> str:
    return "—" if v is None else ("yes" if v else "no")


def _join(parts: list[Any], sep: str) -> str | None:
    """Join the non-empty parts; None when nothing is left (so `_e` renders the dash)."""
    keep = [str(p) for p in parts if p not in (None, "")]
    return sep.join(keep) or None


def render_html(
    cdm: dict[str, Any], report_id: str, issued_to: str, geometry: dict[str, Any] | None, verify_url: str
) -> str:
    """Build the report HTML (kept dependency-free: no template engine)."""
    ident, sp, party = cdm.get("identifiers", {}), cdm.get("spatial", {}), cdm.get("party", {})
    reg, ror = cdm.get("rights", {}).get("registration", {}), cdm.get("rights", {}).get("ror", {})
    fiscal, plan, util, status = (
        cdm.get("fiscal", {}),
        cdm.get("planning", {}),
        cdm.get("utilities", {}),
        cdm.get("status", {}),
    )
    owners = ", ".join(_e(o.get("name")) for o in party.get("owners", [])) or "—"
    rows = [
        ("ULPIN", cdm.get("ulpin")),
        ("Survey No", ident.get("survey_no")),
        ("Village / Taluk", _join([ident.get("village"), ident.get("taluk")], " / ")),
        ("District / State", _join([ident.get("district"), ident.get("state")], " / ")),
        ("Khata No", ident.get("khata_no")),
        ("Owner(s)", owners),
        ("Ownership type", ror.get("ownership_type")),
        ("Classification", ror.get("classification")),
        ("Surveyed area (sqm)", sp.get("area_sqm")),
        ("RoR extent (sqm)", ror.get("extent_sqm")),
        (
            "Registration",
            _join([reg.get("status"), _join([reg.get("deed_type"), reg.get("doc_no"), reg.get("registered_on")], " ")], " · "),
        ),
        ("Zone / Land use", _join([_join([plan.get("zone_code"), plan.get("zone_name")], " "), plan.get("land_use")], " / ")),
        ("Building permission", plan.get("building_permission", {}).get("status")),
        ("Guideline value / sqm", fiscal.get("guideline_value_per_sqm")),
        ("Estimated value", fiscal.get("estimated_value")),
        ("Tax arrears", fiscal.get("tax", {}).get("arrears")),
        ("Utilities", " · ".join(f"{label} {_yn(util.get(key))}" for label, key in
                                 (("Water", "water"), ("Electricity", "electricity"), ("Sewer", "sewer")))),
        ("Flags", ", ".join(k.removeprefix("has_").replace("_", " ") for k, v in status.items() if v is True) or "none"),
    ]
    table = "".join(f"<tr><th>{_e(k)}</th><td>{v if k == 'Owner(s)' else _e(v)}</td></tr>" for k, v in rows)
    prov = "".join(
        f"<tr><td>{_e(d)}</td><td>{'OK' if p.get('ok') else 'FAILED'}</td><td>{_e(p.get('source'))}</td>"
        f"<td>{_e(p.get('as_of'))}</td><td>{_e(p.get('ms'))} ms</td><td>{_e(p.get('error'))}</td></tr>"
        for d, p in (cdm.get("provenance") or {}).items()
    )
    issues = cdm.get("consistency", {}).get("issues") or []
    issues_html = (
        "".join(f"<li>{_e(i.get('field'))}: {_e(i.get('note'))}</li>" for i in issues)
        or "<li>No cross-department inconsistencies.</li>"
    )
    encs = cdm.get("restrictions", {}).get("encumbrances") or []
    disputes = cdm.get("restrictions", {}).get("disputes") or []
    restr = "".join(
        f"<li>Encumbrance: {_e(e.get('kind'))} · {_e(e.get('holder'))} · {_e(e.get('amount'))}</li>" for e in encs
    )
    restr += "".join(
        f"<li>Dispute: {_e(d.get('case_no'))} · {_e(d.get('court'))} · {_e(d.get('status'))}</li>" for d in disputes
    )
    restr += "".join(
        f"<li>Restriction zone: {_e(z.get('kind'))} · {_e(z.get('name'))}</li>"
        for z in cdm.get("restrictions", {}).get("restriction_zones") or []
    )
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>Land Stack report {_e(report_id)}</title>
<style>
@page {{ size: A4; margin: 18mm; }}
body {{ font-family: "DejaVu Sans", Arial, sans-serif; font-size: 10.5pt; color: #111827; }}
h1 {{ font-size: 18pt; margin: 0 0 2mm; }} h2 {{ font-size: 12pt; margin: 6mm 0 2mm; border-bottom: 1px solid #cbd5e1; }}
table {{ border-collapse: collapse; width: 100%; }} th, td {{ border: 1px solid #e5e7eb; padding: 3px 6px; text-align: left; vertical-align: top; }}
th {{ background: #f1f5f9; width: 34%; }} .head {{ display: flex; justify-content: space-between; align-items: flex-start; }}
.muted {{ color: #64748b; font-size: 9pt; }} .prov td {{ font-size: 9pt; }} .masked {{ color: #b45309; }}
</style></head><body>
<div class="head"><div><h1>Land Stack · Parcel Report</h1>
<div class="muted">Report {_e(report_id)} · issued to {_e(issued_to)} · {now}</div>
{'<div class="masked">Owner details masked (no consent on file).</div>' if party.get("masked") else ""}</div>
<div>{qr_svg(verify_url)}</div></div>
<h2>Parcel summary</h2><div style="display:flex;gap:8mm"><table style="flex:1">{table}</table><div>{mini_map_svg(geometry)}</div></div>
<h2>Restrictions</h2><ul>{restr or "<li>None on record.</li>"}</ul>
<h2>Consistency</h2><ul>{issues_html}</ul>
<h2>Source provenance</h2><table class="prov">
<tr><th>Department</th><th>Status</th><th>Source</th><th>As of</th><th>Latency</th><th>Error</th></tr>{prov}</table>
<p class="muted">Verify at {_e(verify_url)}.
This report aggregates mock department systems for the SIH 2026 prototype and is not a legal document.</p>
</body></html>"""


def html_to_pdf(html_doc: str) -> bytes:
    try:
        from weasyprint import HTML  # heavy import; keep lazy
    except Exception as exc:
        raise AppError(503, "pdf_unavailable", f"WeasyPrint not available: {exc}") from exc
    return HTML(string=html_doc).write_pdf()


async def create_report(db: DBLike, ulpin: str, principal: Principal) -> dict[str, Any]:
    """Aggregate, render, sign, store and register a report; returns `{id, url, sha256, signature}`."""
    from landstack.services import aggregator

    settings = get_settings()
    cdm = await aggregator.get_parcel_cdm(db, ulpin, principal)
    geom_json = await db.fetchval("SELECT ST_AsGeoJSON(geom)::json FROM landstack.parcels WHERE ulpin = :u", u=ulpin)
    geometry = geom_json if isinstance(geom_json, dict) else None
    report_id = new_report_id()
    verify_url = f"{settings.public_web_url.rstrip('/')}/verify/{report_id}"
    pdf = html_to_pdf(render_html(cdm, report_id, principal.name, geometry, verify_url))
    digest = hashlib.sha256(pdf).hexdigest()
    signature = sign(report_id, digest)
    key = f"reports/{report_id}.pdf"
    await get_storage().put(key, pdf, "application/pdf")
    await db.execute(
        """
        INSERT INTO landstack.reports (id, ulpin, issued_to_uid, issued_to_name, issued_at, sha256, signature, storage_key)
        VALUES (:id, :ulpin, :uid, :name, now(), :sha, :sig, :key)
        """,
        id=report_id,
        ulpin=ulpin,
        uid=principal.uid,
        name=principal.name,
        sha=digest,
        sig=signature,
        key=key,
    )
    await audit.record(db, principal, "report.issued", "report", report_id, ulpin, None, {"sha256": digest})
    return {
        "id": report_id,
        "url": f"/reports/{report_id}.pdf",
        "verify_url": verify_url,
        "sha256": digest,
        "signature": signature,
    }


async def get_report_row(db: DBLike, report_id: str) -> dict[str, Any]:
    row = await db.fetchrow("SELECT * FROM landstack.reports WHERE id = :id", id=report_id)
    if row is None:
        raise not_found("report", report_id)
    return row


async def verify_report(db: DBLike, report_id: str) -> dict[str, Any]:
    row = await get_report_row(db, report_id)
    sig_ok = verify_signature(report_id, row["sha256"], row["signature"])
    pdf = await get_storage().get(row["storage_key"])
    file_ok = pdf is not None and hashlib.sha256(pdf).hexdigest() == row["sha256"]
    issued_at = row.get("issued_at")
    parcel = None
    try:
        parcel = await db.fetchrow("SELECT survey_no, village FROM landstack.parcels WHERE ulpin = :u", u=row["ulpin"])
    except Exception:
        parcel = None
    valid = bool(sig_ok and file_ok)
    return {
        "id": report_id,
        "valid": valid,
        "reason": None if valid else ("signature mismatch" if not sig_ok else "stored PDF missing or altered"),
        "signature_ok": sig_ok,
        "file_ok": file_ok,
        "ulpin": row["ulpin"],
        "parcel": parcel,
        "issued_to": row.get("issued_to_name"),
        "issued_to_name": row.get("issued_to_name"),
        "issued_at": issued_at.isoformat() if hasattr(issued_at, "isoformat") else issued_at,
        "sha256": row["sha256"],
        "pdf_url": f"/reports/{report_id}.pdf",
    }
