/**
 * Gateway client (CONTRACTS §6). Every function is typed against src/lib/cdm.ts.
 * Errors arrive as `{ error: { code, message, details } }` and are thrown as ApiError.
 */
import { env } from './env';
import { getAuthHeaders } from './auth';
import type {
  AdapterMapping,
  ApplicationAdvice,
  AssistantReply,
  BoundaryProposalResult,
  BoundaryValidation,
  Alert,
  Application,
  ApplicationType,
  ChangeDetectionResult,
  CollectionsList,
  Connector,
  ConsistencyFinding,
  DueDiligence,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  Me,
  Notice,
  OwnedParcel,
  ParcelBrief,
  ParcelCDM,
  ParcelPrivacyPreferences,
  PlanningCheck,
  PreCheck,
  ReportIssued,
  SearchHit,
  Stats,
  TimelineEvent,
  VerifyOwnershipResult,
  VerifyReportResult,
} from './cdm';

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function qs(q?: Query): string {
  if (!q) return '';
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

interface ReqOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  auth?: boolean;
  signal?: AbortSignal;
}

// Boundary: the raw JSON is untyped here; callers pick the type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJson = any;

export async function request<T>(path: string, opts: ReqOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.auth !== false) Object.assign(headers, await getAuthHeaders());
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) body = opts.body;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${env.apiUrl}${path}${qs(opts.query)}`, {
    method: opts.method ?? 'GET',
    headers,
    body,
    signal: opts.signal,
  });
  const text = await res.text();
  let json: AnyJson = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  if (!res.ok) {
    const err = json?.error ?? {};
    throw new ApiError(
      res.status,
      String(err.code ?? res.status),
      String(err.message ?? json?.detail ?? res.statusText ?? 'Request failed'),
      err.details,
    );
  }
  return json as T;
}

export const apiUrl = (path: string) => `${env.apiUrl}${path}`;

/* ---------- Public ---------- */
export const api = {
  health: () => request<{ ok: boolean }>('/healthz', { auth: false }),
  collections: () => request<CollectionsList>('/landstack/collections', { auth: false }),
  items: <P = Record<string, unknown>>(layer: string, query?: Query) =>
    request<GeoJSONFeatureCollection<P>>(`/landstack/collections/${layer}/items`, { query, auth: false }),
  parcelFeature: (ulpin: string) =>
    request<GeoJSONFeature>(`/landstack/collections/parcels/items/${encodeURIComponent(ulpin)}`, { auth: false }),
  search: (q: string, signal?: AbortSignal) =>
    request<SearchHit[] | { items?: SearchHit[]; results?: SearchHit[] }>('/landstack/search', { query: { q }, signal }).then((r) =>
      Array.isArray(r) ? r : r.items ?? r.results ?? [],
    ),
  verifyReport: (id: string) => request<VerifyReportResult>(`/verify/${encodeURIComponent(id)}`, { auth: false }),
  reportPdfUrl: (id: string) => apiUrl(`/reports/${encodeURIComponent(id)}.pdf`),

  /* ---------- Any signed-in ---------- */
  me: () => request<Me>('/landstack/me'),
  parcel: (ulpin: string) => request<ParcelCDM>(`/landstack/parcels/${encodeURIComponent(ulpin)}`),
  verifyOwnership: (ulpin: string, claimed_name: string) =>
    request<VerifyOwnershipResult>('/landstack/verify-ownership', { method: 'POST', body: { ulpin, claimed_name } }),
  createApplication: (ulpin: string, type: ApplicationType, payload: Record<string, unknown>) =>
    request<Application>('/landstack/applications', { method: 'POST', body: { ulpin, type, payload } }),
  myApplications: () =>
    request<Application[] | { items: Application[] }>('/landstack/applications', { query: { mine: 1 } }).then(unwrapList),
  myParcels: () =>
    request<{ items: OwnedParcel[] }>('/landstack/citizen/my-parcels'),
  application: (id: string) => request<Application>(`/landstack/applications/${encodeURIComponent(id)}`),
  issueReport: (ulpin: string) => request<ReportIssued>(`/landstack/reports/${encodeURIComponent(ulpin)}`, { method: 'POST' }),
  validateBoundary: (ulpin: string, geometry: Record<string, unknown>) =>
    request<BoundaryValidation>(`/landstack/parcels/${encodeURIComponent(ulpin)}/boundary/validate`, { method: 'POST', body: { geometry } }),
  proposeBoundary: (ulpin: string, geometry: Record<string, unknown>, reason: string) =>
    request<BoundaryProposalResult>(`/landstack/parcels/${encodeURIComponent(ulpin)}/boundary`, { method: 'POST', body: { geometry, reason } }),
  requestConsent: (ulpin: string) => request<{ ok: boolean }>('/landstack/consents/request', { method: 'POST', body: { ulpin } }),
  getPrivacy: (ulpin: string) =>
    request<{ ulpin: string; preferences: ParcelPrivacyPreferences }>(`/landstack/parcels/${encodeURIComponent(ulpin)}/privacy`),
  updatePrivacy: (ulpin: string, body: ParcelPrivacyPreferences) =>
    request<{ ulpin: string; preferences: ParcelPrivacyPreferences; status: string }>(
      `/landstack/parcels/${encodeURIComponent(ulpin)}/privacy`,
      { method: 'PUT', body },
    ),
  notices: (village?: string) =>
    request<{ items: Notice[]; count: number; window_days: number }>('/landstack/notices', { query: { village }, auth: false }),
  fileObjection: (id: string, reason: string) =>
    request<{ ok: boolean; objection_count: number }>(`/landstack/applications/${encodeURIComponent(id)}/objections`, { method: 'POST', body: { reason } }),
  dueDiligence: (ulpin: string) =>
    request<DueDiligence>(`/landstack/parcels/${encodeURIComponent(ulpin)}/due-diligence`),
  assistant: (message: string, ulpin?: string | null, history?: { role: string; content: string }[]) =>
    request<AssistantReply>('/landstack/ai/assistant', {
      method: 'POST',
      body: { message, ulpin: ulpin || undefined, history: history || [] },
    }),
  preCheck: (ulpin: string, type: ApplicationType) =>
    request<PreCheck>('/landstack/ai/pre-check', { method: 'POST', body: { ulpin, type } }),

  /* ---------- Officer+ ---------- */
  timeline: (ulpin: string) =>
    request<TimelineEvent[] | { events: TimelineEvent[] }>(`/landstack/parcels/${encodeURIComponent(ulpin)}/timeline`).then(
      (r) => (Array.isArray(r) ? r : r.events ?? []),
    ),
  queue: (department?: string) =>
    request<Application[] | { items: Application[] }>('/landstack/queue', { query: { department } }).then(unwrapList),
  transition: (id: string, action: string, remark: string) =>
    request<Application>(`/landstack/applications/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      body: { action, remark },
    }),
  stats: () => request<Stats>('/landstack/stats'),
  alerts: (status?: string) => request<Alert[] | { items: Alert[] }>('/landstack/alerts', { query: { status } }).then(unwrapList),
  assignAlert: (id: number) => request<Alert>(`/landstack/alerts/${id}/assign`, { method: 'POST', body: {} }),
  resolveAlert: (id: number) => request<Alert>(`/landstack/alerts/${id}/resolve`, { method: 'POST', body: {} }),
  changeDetection: (body: { ulpin?: string; bbox?: number[]; date_a?: string; date_b?: string }) =>
    request<ChangeDetectionResult>('/landstack/ai/change-detection', { method: 'POST', body }),
  parcelBrief: (ulpin: string) => request<ParcelBrief>('/landstack/ai/parcel-brief', { method: 'POST', body: { ulpin } }),
  applicationAdvice: (id: string) => request<ApplicationAdvice>('/landstack/ai/application-advice', { method: 'POST', body: { id } }),
  draftOrder: (app_id: string, action: string) =>
    request<import('./cdm').DraftOrderResult>('/landstack/ai/draft-order', { method: 'POST', body: { app_id, action } }),
  uploadDocument: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{
      id: string;
      filename: string;
      mime: string;
      size: number;
      sha256: string;
      url: string;
    }>('/landstack/documents/upload', { method: 'POST', body: fd });
  },
  documentUrl: (docId: string) => `${env.apiUrl}/landstack/documents/${encodeURIComponent(docId)}`,
  extractDocument: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<Record<string, unknown>>('/landstack/ai/extract-document', { method: 'POST', body: fd });
  },

  /* ---------- Department sub-apps (public GETs) ---------- */
  planningCheck: (ulpin: string, use: string, floors: number) =>
    request<PlanningCheck>('/planning/check', { query: { ulpin, use, floors } }),

  /* ---------- Admin ---------- */
  consistency: () =>
    request<ConsistencyFinding[] | { items: ConsistencyFinding[] }>('/landstack/consistency').then(unwrapList),
  connectors: () => request<Connector[] | { items: Connector[] }>('/landstack/connectors').then(unwrapList),
  adapters: () =>
    request<AdapterMapping[] | { items: AdapterMapping[] } | Record<string, AdapterMapping>>('/landstack/adapters').then(
      (r) => {
        if (Array.isArray(r)) return r;
        if ('items' in r && Array.isArray((r as { items: unknown }).items)) return (r as { items: AdapterMapping[] }).items;
        return Object.entries(r as Record<string, AdapterMapping>).map(([k, v]) => ({ ...v, department: v.department ?? k }));
      },
    ),
  grantConsent: (ulpin: string, uid: string, hours: number) =>
    request<{ ok: boolean }>('/landstack/consents/grant', { method: 'POST', body: { ulpin, uid, hours } }),
  simulateDeed: (ulpin: string, claimant: string) =>
    request<Record<string, unknown>>('/landstack/admin/simulate/deed', { method: 'POST', body: { ulpin, claimant } }),
  demoReset: () => request<{ ok: boolean }>('/landstack/admin/demo-reset', { method: 'POST', body: {} }),
};

function unwrapList<T>(r: T[] | { items: T[] }): T[] {
  return Array.isArray(r) ? r : r.items ?? [];
}

/* ---------- Query keys ---------- */
export const qk = {
  me: (identity: string) => ['me', identity] as const,
  parcel: (ulpin: string, identity: string) => ['parcel', ulpin, identity] as const,
  parcelFeature: (ulpin: string) => ['parcelFeature', ulpin] as const,
  timeline: (ulpin: string) => ['timeline', ulpin] as const,
  search: (q: string) => ['search', q] as const,
  myApplications: (identity: string) => ['applications', 'mine', identity] as const,
  myParcels: (identity: string) => ['citizen', 'my-parcels', identity] as const,
  application: (id: string) => ['application', id] as const,
  queue: (department: string) => ['queue', department] as const,
  stats: () => ['stats'] as const,
  alerts: (status: string) => ['alerts', status] as const,
  connectors: () => ['connectors'] as const,
  adapters: () => ['adapters'] as const,
  consistency: () => ['consistency'] as const,
  villageBoundary: () => ['village_boundary'] as const,
  storyParcels: () => ['story_parcels'] as const,
  demoRegions: () => ['demo_regions'] as const,
  parcelBrief: (ulpin: string, identity: string) => ['ai_brief', ulpin, identity] as const,
  applicationAdvice: (id: string) => ['ai_advice', id] as const,
  verifyReport: (id: string) => ['verify', id] as const,
  planningCheck: (ulpin: string, use: string, floors: number) => ['planning_check', ulpin, use, floors] as const,
  preCheck: (ulpin: string, type: string, identity: string) => ['ai_precheck', ulpin, type, identity] as const,
  dueDiligence: (ulpin: string, identity: string) => ['due_diligence', ulpin, identity] as const,
  notices: (village: string) => ['notices', village] as const,
};
