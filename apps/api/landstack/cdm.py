"""Common Data Model (CONTRACTS §5) as Pydantic models.

Every leaf model allows extra fields so department adapters can contribute source-specific extras
without breaking validation; every field is optional so partial fragments merge cleanly.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class _Leaf(BaseModel):
    model_config = ConfigDict(extra="allow")


class Identifiers(_Leaf):
    state: str | None = None
    district: str | None = None
    taluk: str | None = None
    village: str | None = None
    survey_no: str | None = None
    sub_division: str | None = None
    khata_no: str | None = None


class Spatial(_Leaf):
    area_sqm: float | None = None
    centroid: list[float] | None = None
    crs: str = "EPSG:4326"
    bbox: list[float] | None = None
    geometry_ref: str | None = None


class Owner(_Leaf):
    name: str | None = None
    father_name: str | None = None
    share: float | None = 1.0
    type: str | None = None


class Party(_Leaf):
    owners: list[Owner] = Field(default_factory=list)
    masked: bool = False


class Registration(_Leaf):
    status: str = "unregistered"
    doc_no: str | None = None
    deed_type: str | None = None
    registered_on: str | None = None
    sro_code: str | None = None
    claimant: str | None = None
    executant: str | None = None
    consideration: float | None = None
    extent_sqm: float | None = None


class ROR(_Leaf):
    khata_no: str | None = None
    classification: str | None = None
    extent_sqm: float | None = None
    ownership_type: str | None = None


class Rights(_Leaf):
    registration: Registration = Field(default_factory=Registration)
    ror: ROR = Field(default_factory=ROR)


class Encumbrance(_Leaf):
    kind: str | None = None
    holder: str | None = None
    amount: float | None = None
    active: bool | None = None
    from_date: str | None = None
    to_date: str | None = None


class Dispute(_Leaf):
    case_no: str | None = None
    court: str | None = None
    nature: str | None = None
    status: str | None = None
    filed_on: str | None = None
    next_hearing: str | None = None


class RestrictionZone(_Leaf):
    kind: str | None = None
    name: str | None = None


class Restrictions(_Leaf):
    encumbrances: list[Encumbrance] = Field(default_factory=list)
    disputes: list[Dispute] = Field(default_factory=list)
    restriction_zones: list[RestrictionZone] = Field(default_factory=list)


class BuildingPermission(_Leaf):
    status: str = "none"

    @field_validator("status", mode="before")
    @classmethod
    def _none_status(cls, v: object) -> object:
        return "none" if v is None or v == "" else v

    permit_no: str | None = None
    floors: int | None = None
    built_up_sqm: float | None = None
    applied_on: str | None = None
    approved_on: str | None = None
    conditions: str | None = None


class Planning(_Leaf):
    zone_code: str | None = None
    zone_name: str | None = None
    land_use: str | None = None
    permissible_uses: list[str] | None = None
    building_permission: BuildingPermission = Field(default_factory=BuildingPermission)


class Tax(_Leaf):
    assessment_no: str | None = None
    annual_demand: float | None = None
    arrears: float | None = None
    paid_till: str | None = None
    last_paid_on: str | None = None


class Fiscal(_Leaf):
    tax: Tax = Field(default_factory=Tax)
    guideline_value_per_sqm: float | None = None
    estimated_value: float | None = None
    market_value_per_sqm: float | None = None
    estimated_market_value: float | None = None
    base_rate_per_sqm: float | None = None
    road_factor: float | None = None
    infra_factor: float | None = None
    zone_factor: float | None = None
    location_tier: str | None = None


class Utilities(_Leaf):
    water: bool | None = None
    electricity: bool | None = None
    sewer: bool | None = None
    road_access_m: float | None = None
    nearest_road_class: str | None = None


class Unit(_Leaf):
    id: int | None = None
    ulpin_3d: str | None = None
    floor: int | None = None  # 0 = basement level
    unit_no: str | None = None
    owner_name: str | None = None
    base_m: float | None = None
    height_m: float | None = None
    area_sqm: float | None = None


class Building(_Leaf):
    id: int | None = None
    name: str | None = None
    floors: int | None = None
    height_m: float | None = None
    width_m: float | None = None
    depth_m: float | None = None
    basement_floors: int | None = None
    units: list[Unit] = Field(default_factory=list)


class Alert(_Leaf):
    id: int | None = None
    kind: str | None = None
    severity: str | None = None
    title: str | None = None
    status: str | None = None
    detail: dict[str, Any] | None = None
    created_at: str | None = None


class Provenance(_Leaf):
    ok: bool = False
    ms: int | None = None
    as_of: str | None = None
    source: str | None = None
    error: str | None = None
    cached_as_of: str | None = None


class ConsistencyIssue(_Leaf):
    field: str
    severity: str = "medium"
    revenue: Any = None
    registration: Any = None
    parcel: Any = None
    note: str | None = None


class Consistency(_Leaf):
    area_match: bool = True
    owner_match: bool = True
    issues: list[ConsistencyIssue] = Field(default_factory=list)


class Status(_Leaf):
    registered: bool = False
    has_dispute: bool = False
    has_mortgage: bool = False
    tax_arrears: float = 0
    pending_mutation: bool = False
    change_alert: bool = False
    permission_status: str | None = None


class PrivacyPreferences(_Leaf):
    public_owner_name: bool = False
    public_nominees: bool = False
    public_deed_details: bool = False
    public_building_units: bool = True
    public_utilities: bool = True


class ParcelCDM(_Leaf):
    """The aggregated per-parcel profile served by `GET /landstack/parcels/{ulpin}`."""

    ulpin: str
    identifiers: Identifiers = Field(default_factory=Identifiers)
    spatial: Spatial = Field(default_factory=Spatial)
    party: Party = Field(default_factory=Party)
    rights: Rights = Field(default_factory=Rights)
    restrictions: Restrictions = Field(default_factory=Restrictions)
    planning: Planning = Field(default_factory=Planning)
    fiscal: Fiscal = Field(default_factory=Fiscal)
    utilities: Utilities = Field(default_factory=Utilities)
    buildings: list[Building] = Field(default_factory=list)
    alerts: list[Alert] = Field(default_factory=list)
    provenance: dict[str, Provenance] = Field(default_factory=dict)
    consistency: Consistency = Field(default_factory=Consistency)
    status: Status = Field(default_factory=Status)
    privacy_preferences: PrivacyPreferences | None = None
    viewer_is_owner: bool = False
    generated_at: str | None = None


def empty_cdm(ulpin: str) -> dict[str, Any]:
    """A fully-shaped CDM dict with defaults, ready for fragment merging."""
    return ParcelCDM(ulpin=ulpin).model_dump()
