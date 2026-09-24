/**
 * TypeScript mirror of the Common Data Model (CONTRACTS §5) and the other
 * JSON shapes returned by the gateway (§6). Keep in sync with landstack/cdm.py.
 */

export type Role = 'citizen' | 'officer' | 'admin';
export type Department = 'revenue' | 'registration' | 'planning';
export type SourceKey = 'revenue' | 'registration' | 'planning' | 'fiscal' | 'legal' | 'utilities';

export interface Identifiers {
  state: string;
  district: string;
  taluk: string;
  village: string;
  survey_no: string;
  khata_no?: string | null;
}

export interface Spatial {
  area_sqm: number;
  centroid: [number, number];
  crs: string;
  bbox: [number, number, number, number];
  geometry_ref: string;
}

export interface Owner {
  name: string;
  father_name?: string | null;
  share: number;
  type: string;
}

export interface Party {
  owners: Owner[];
  masked: boolean;
}

export interface Registration {
  status: 'registered' | 'unregistered';
  doc_no?: string | null;
  deed_type?: string | null;
  registered_on?: string | null;
  sro_code?: string | null;
}

export interface Nominee {
  name?: string | null;
  relation?: string | null;
  share?: number | null;
}

export interface RoR {
  khata_no?: string | null;
  classification?: string | null;
  extent_sqm?: number | null;
  ownership_type?: string | null;
  /** Recorded nominees for succession (migration 012); names masked like owners. */
  nominees?: Nominee[] | null;
}

export interface Rights {
  registration: Registration | null;
  ror: RoR | null;
}

export interface Encumbrance {
  kind: string;
  holder?: string | null;
  amount?: number | null;
  active: boolean;
  from_date?: string | null;
  to_date?: string | null;
}

export interface Dispute {
  case_no: string;
  court?: string | null;
  nature?: string | null;
  status: string;
  filed_on?: string | null;
  next_hearing?: string | null;
}

export interface RestrictionZoneRef {
  kind: string;
  name: string;
}

export interface Restrictions {
  encumbrances: Encumbrance[];
  disputes: Dispute[];
  restriction_zones: RestrictionZoneRef[];
}

export type PermissionStatus = 'approved' | 'pending' | 'rejected' | 'none';

export interface BuildingPermission {
  status: PermissionStatus;
  permit_no?: string | null;
  floors?: number | null;
  built_up_sqm?: number | null;
  conditions?: string | null;
}

export interface Planning {
  zone_code?: string | null;
  zone_name?: string | null;
  land_use?: string | null;
  building_permission: BuildingPermission | null;
}

export interface Tax {
  assessment_no?: string | null;
  annual_demand?: number | null;
  arrears?: number | null;
  paid_till?: string | null;
  last_paid_on?: string | null;
}

export interface Fiscal {
  tax: Tax | null;
  guideline_value_per_sqm?: number | null;
  estimated_value?: number | null;
  market_value_per_sqm?: number | null;
  estimated_market_value?: number | null;
  base_rate_per_sqm?: number | null;
  road_factor?: number | null;
  infra_factor?: number | null;
  zone_factor?: number | null;
  location_tier?: string | null;
}

export interface ElectricityDetails {
  consumer_no?: string;
  consumer_name?: string;
  provider?: string;
  tariff_category?: string;
  sanctioned_load_kw?: number;
  phase?: string;
  meter_no?: string;
  connection_date?: string;
  status?: string;
  last_reading_kwh?: number;
  feeder_name?: string;
  transformer_id?: string;
  nearest_pole_no?: string;
}

export interface WaterDetails {
  consumer_no?: string;
  consumer_name?: string;
  provider?: string;
  connection_type?: string;
  pipe_size_mm?: number;
  meter_no?: string;
  status?: string;
  supply_hours?: string;
  water_quality_index?: string;
  connection_date?: string;
}

export interface SewerDetails {
  connection_no?: string;
  network_type?: string;
  nearest_manhole_distance_m?: number;
  status?: string;
  chamber_inspection?: string;
  maintenance_ward?: string;
}

export interface GasDetails {
  bp_no?: string;
  consumer_name?: string;
  provider?: string;
  status?: string;
  meter_no?: string;
  connection_type?: string;
  line_pressure_bar?: number;
}

export interface BroadbandDetails {
  status?: string;
  infrastructure?: string;
  available_isps?: string[];
  max_speed_available?: string;
  nearest_junction_box?: string;
}

export interface SanitationDetails {
  sanitation_qr?: string;
  collection_tier?: string;
  waste_segregation?: string;
  supervisor_contact?: string;
  rwh_pit_status?: string;
  rwh_capacity_liters?: number;
}

export interface UtilityHistoryEntry {
  date: string;
  action: string;
  utility_type: string;
  consumer_name?: string;
  remark?: string;
  application_id?: string;
}

export interface Utilities {
  water: boolean;
  electricity: boolean;
  sewer: boolean;
  gas?: boolean;
  broadband?: boolean;
  rainwater_harvesting?: boolean;
  solid_waste_mgmt?: boolean;
  road_access_m?: number | null;
  nearest_road_class?: string | null;
  electricity_details?: ElectricityDetails;
  water_details?: WaterDetails;
  sewer_details?: SewerDetails;
  gas_details?: GasDetails;
  broadband_details?: BroadbandDetails;
  sanitation_details?: SanitationDetails;
  history?: UtilityHistoryEntry[];
  updated_at?: string | null;
}

export interface AcquisitionImpact {
  project_id: number;
  project_name: string;
  kind: string;
  executing_agency?: string | null;
  statutory_act?: string | null;
  notification_section?: string | null;
  gazette_no?: string | null;
  gazette_date?: string | null;
  objection_deadline?: string | null;
  days_left?: number | null;
  impact_type: string;
  total_area_sqm: number;
  affected_area_sqm: number;
  residual_area_sqm: number;
  impact_pct: number;
  guideline_rate_per_sqm: number;
  base_land_value: number;
  solatium_amount: number;
  structural_damage_estimate: number;
  total_compensation_offer: number;
  consent_settlement_total: number;
  tdr_units_offered_sqm: number;
  severance_risk: boolean;
  status: string;
  hearing_date?: string | null;
  description?: string | null;
  affected_geojson?: Record<string, unknown> | null;
}

export interface Unit {
  ulpin_3d: string;
  floor: number; // 0 = basement level
  unit_no: string;
  owner_name?: string | null;
  base_m?: number | null;
  height_m?: number | null;
  area_sqm?: number | null;
}

export interface Building {
  id: number;
  floors: number;
  height_m?: number | null;
  name?: string | null;
  width_m?: number | null;
  depth_m?: number | null;
  basement_floors?: number | null;
  units: Unit[];
}

export type AlertKind = 'change_detected' | 'inconsistency' | 'pending_mutation';
export type AlertStatus = 'open' | 'assigned' | 'resolved';

export interface Alert {
  id: number;
  ulpin?: string | null;
  kind: AlertKind;
  severity: 'low' | 'medium' | 'high' | string;
  title: string;
  detail?: Record<string, unknown> | null;
  status: AlertStatus;
  created_at?: string | null;
  assigned_to?: string | null;
  survey_no?: string | null;
  village?: string | null;
  open_application_id?: string | null;
  open_application_type?: string | null;
}

export interface ProvenanceOk {
  ok: true;
  ms: number;
  as_of: string | null;
  source: string;
}
export interface ProvenanceFailed {
  ok: false;
  error?: string | null;
  cached_as_of?: string | null;
  source?: string | null;
  ms?: number | null;
}
export type Provenance = ProvenanceOk | ProvenanceFailed;

export interface ConsistencyIssue {
  field: string;
  [source: string]: unknown;
}

export interface Consistency {
  area_match: boolean;
  owner_match: boolean;
  issues: ConsistencyIssue[];
}

export interface ParcelStatus {
  registered: boolean;
  has_dispute: boolean;
  has_mortgage: boolean;
  tax_arrears: number;
  pending_mutation: boolean;
  change_alert: boolean;
  permission_status?: PermissionStatus | null;
}

export interface ParcelPrivacyPreferences {
  public_owner_name: boolean;
  public_nominees: boolean;
  public_deed_details: boolean;
  public_building_units: boolean;
  public_utilities: boolean;
}

export interface ParcelCDM {
  ulpin: string;
  identifiers: Identifiers;
  spatial: Spatial;
  party: Party;
  rights: Rights;
  restrictions: Restrictions;
  planning: Planning;
  fiscal: Fiscal;
  utilities: Utilities | null;
  acquisition?: AcquisitionImpact[];
  buildings: Building[];
  alerts: Alert[];
  provenance: Partial<Record<SourceKey, Provenance>>;
  consistency: Consistency;
  status: ParcelStatus;
  privacy_preferences?: ParcelPrivacyPreferences | null;
  viewer_is_owner?: boolean;
  /** Raw parcel flags (seeded + system): story key, settlement resurvey phase, ... */
  status_flags?: { story?: string; resurvey?: 'completed' | 'in_progress' | 'pending' } & Record<string, unknown>;
}

/* ---------- Other gateway shapes (§6) ---------- */

export interface Me {
  uid: string;
  name: string;
  role: Role;
  department?: Department | null;
  email?: string | null;
  consents?: string[];
}

export interface SearchHit {
  ulpin: string;
  survey_no: string;
  village?: string | null;
  khata_no?: string | null;
  owner_name?: string | null;
  match?: string | null;
  land_use?: string | null;
  centroid?: [number, number] | null;
  bbox?: [number, number, number, number] | null;
}

export interface VerifyOwnershipResult {
  match: boolean;
  score: number;
  compared: string[];
}

export type ApplicationType =
  | 'mutation'
  | 'building_permission'
  | 'ownership_verification'
  | 'field_review'
  | 'boundary_correction'
  | 'record_correction'
  | 'land_complaint'
  | 'succession'
  | 'utility_request'
  | 'acquisition_claim';

/* ---------- Boundary correction (bounded parcel editing, CONTRACTS §6/§8) ---------- */

export interface BoundaryCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface BoundaryValidation {
  valid: boolean;
  checks: BoundaryCheck[];
  metrics: {
    old_area_sqm: number;
    new_area_sqm: number;
    delta_pct: number;
    overlaps: { ulpin: string; survey_no?: string | null; overlap_sqm: number }[];
  };
  suggestion?: { geometry: Record<string, unknown>; area_sqm: number; reason: string };
}

export interface AIFinding {
  severity: 'high' | 'medium' | 'info' | 'ok' | string;
  text: string;
  action?: string | null;
}

export interface ParcelBrief {
  ulpin: string;
  engine: string; // 'nvidia:<model>' | 'rules'
  risk_score: number;
  risk_level: 'low' | 'elevated' | 'high' | string;
  findings: AIFinding[];
  narrative: string;
  recommendations: string[];
}

export interface PreCheckItem {
  text: string;
  action?: string | null;
}

export interface PreCheck {
  ulpin: string;
  type: string;
  engine: string;
  risk_score: number;
  risk_level: 'low' | 'elevated' | 'high' | string;
  blockers: PreCheckItem[];
  warnings: PreCheckItem[];
  notes: PreCheckItem[];
  ok_to_submit: boolean;
  ror_owner?: string | null;
}

export interface DueDiligenceCheck {
  name: string;
  status: 'pass' | 'caution' | 'fail' | string;
  text: string;
}

export interface DueDiligence {
  ulpin: string;
  engine: string;
  verdict: 'clear' | 'caution' | 'high_risk' | string;
  checks: DueDiligenceCheck[];
  estimated_value?: number | null;
  summary?: string | null;
}

export interface AssistantSource {
  kind: 'parcel' | 'application' | string;
  id: string;
  label?: string;
}

export interface AssistantReply {
  reply: string;
  engine: string;
  intent: string;
  sources: AssistantSource[];
  suggestions: string[];
}

export interface ApplicationAdvice {
  application_id: string;
  engine: string;
  suggested_action: string | null;
  rationale: string | null;
  allowed_actions: string[];
  parcel_risk: { score: number; level: string };
}
export interface DraftOrderResult {
  order_text: string;
  act: string;
  officer_role: string;
  subject: string;
  references: string[];
  conditions: string[];
}

export interface BoundaryProposalResult {
  accepted: boolean;
  application?: Application;
  validation: BoundaryValidation;
  error?: string;
}

export interface HistoryEntry {
  ts: string;
  from_status?: string | null;
  to_status: string;
  action?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  actor_designation?: string | null;
  remark?: string | null;
}

export interface NextAction {
  action: string;
  label: string;
  to_status: string;
  is_terminal?: boolean;
  allowed_designation?: string | null;
}

export interface Application {
  id: string;
  ulpin: string;
  type: ApplicationType;
  applicant_uid?: string | null;
  applicant_name?: string | null;
  status: string;
  payload: Record<string, unknown>;
  assigned_department?: Department | null;
  created_at: string;
  updated_at: string;
  history?: HistoryEntry[];
  next_actions?: NextAction[];
  survey_no?: string | null;
  village?: string | null;
}

/* ---------- Public notices + objections (CONTRACTS §6/§8) ---------- */

export interface Notice {
  id: string;
  ulpin: string;
  type: ApplicationType;
  status: string;
  survey_no?: string | null;
  village?: string | null;
  published_on: string;
  window_closes: string;
  days_left: number;
  objection_count: number;
}

export interface Objection {
  ts: string;
  by_uid?: string | null;
  by_name?: string | null;
  reason: string;
}

export interface ReportIssued {
  id: string;
  url: string;
}

export interface VerifyReportResult {
  valid: boolean;
  id?: string;
  issued_to?: string | null;
  issued_at?: string | null;
  ulpin?: string | null;
  parcel?: { survey_no?: string | null; village?: string | null } | null;
  reason?: string | null;
}

export interface TimelineEvent {
  ts: string;
  source: string;
  kind: string;
  title: string;
  detail?: Record<string, unknown> | null;
  actor?: string | null;
}

export interface Stats {
  total_parcels: number;
  registered_pct: number;
  disputed: number;
  mortgaged: number;
  tax_arrears: number;
  pending_applications: number;
  open_alerts: number;
  land_use: Record<string, number>;
  applications_by_status: Record<string, number>;
  alerts_by_kind: Record<string, number>;
}

export interface ChangeDetectionResult {
  ulpin?: string | null;
  bbox?: [number, number, number, number] | null;
  date_a: string;
  date_b: string;
  ndvi_a: number;
  ndvi_b: number;
  ndbi_a: number;
  ndbi_b: number;
  d_ndvi: number;
  d_ndbi: number;
  label: string;
  confidence: number;
  thresholds?: { d_ndvi?: number; d_ndbi?: number; d_ndvi_loss?: number; d_ndbi_builtup?: number; d_ndbi_new?: number } | null;
  recommendation?: string | null;
  image_a_url?: string | null;
  image_b_url?: string | null;
  mode?: 'offline' | 'online' | string;
}

export interface PlanningCheck {
  permissible: boolean;
  reasons: string[];
  zone_code?: string | null;
  zone_name?: string | null;
  as_of?: string | null;
}

export interface Connector {
  name: string;
  ok: boolean;
  latency_ms?: number | null;
  last_sync?: string | null;
  note?: string | null;
}

export interface AdapterFieldMapping {
  cdm_field: string;
  source_field: string;
  transform?: string | null;
}

export interface AdapterMapping {
  department: string;
  /** Which state's vocabulary this mapping translates (AP/TN/TG); one department can have several. */
  state?: string | null;
  source_system: string;
  endpoint?: string | null;
  fields: AdapterFieldMapping[];
}

export interface ConsistencyFinding {
  ulpin: string;
  survey_no?: string | null;
  field: string;
  severity?: string | null;
  values: Record<string, unknown>;
  detected_at?: string | null;
}

export interface CollectionsList {
  collections: { id: string; title?: string; itemType?: string; links?: unknown[] }[];
}

export type Position = number[];
export interface GeoJSONGeometry {
  type: string;
  coordinates: unknown;
}
export interface GeoJSONFeature<P = Record<string, unknown>> {
  type: 'Feature';
  id?: string | number;
  geometry: GeoJSONGeometry | null;
  properties: P;
  bbox?: number[];
}
export interface GeoJSONFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<P>[];
  numberMatched?: number;
  numberReturned?: number;
}

export interface StoryParcel {
  survey_no: string;
  ulpin?: string;
  /** seed JSON carries `key` (e.g. clean_residential); `title` is optional. */
  key?: string;
  title?: string;
  note?: string;
  owner_name?: string;
  land_use?: string;
  state?: string;
  village?: string;
  centroid?: [number, number];
  bbox?: [number, number, number, number];
}

export interface OwnedParcel {
  ulpin: string;
  survey_no: string;
  khata_no: string;
  village: string;
  district?: string;
  state: string;
  land_use: string;
  area_sqm: number;
  owner_name: string;
  ownership_type: string;
  centroid?: [number, number];
  bbox?: [number, number, number, number];
}

