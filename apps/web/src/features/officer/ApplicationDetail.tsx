import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, ExternalLink, Eye, FileText, ShieldCheck, Scale, ScrollText, XCircle, Lock, ShieldAlert, UserCheck } from 'lucide-react';
import { api, qk } from '@/lib/api';
import type { NextAction, Objection, ParcelCDM } from '@/lib/cdm';
import { Drawer } from '@/components/Drawer';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Field';
import { Badge } from '@/components/Badge';
import { Loading } from '@/components/Spinner';
import { ErrorNote } from '@/components/EmptyState';
import { KV, SectionTitle } from '@/components/Section';
import { toast } from '@/components/Toast';
import { fallbackActions, StatusBadge, StatusTimeline } from './ApplicationBits';
import { fmtArea, fmtDate, titleCase } from '@/lib/format';
import { statusChips } from '@/components/StatusChip';
import { useAuth } from '@/lib/auth';
import { useUI, type DevUserId } from '@/lib/store';
import { isDevAuth } from '@/lib/env';
import { useTranslation } from '@/lib/i18n';

export function designationLabel(des?: string | null): string {
  if (!des) return '';
  switch (des.toLowerCase()) {
    case 'vro': return 'Village Revenue Officer (VRO)';
    case 'surveyor': return 'Cadastral / Mandal Surveyor';
    case 'ri': return 'Revenue Inspector (RI)';
    case 'tahsildar': return 'Tahsildar / MRO';
    case 'sub_registrar': return 'Sub-Registrar (SRO)';
    case 'town_planner': return 'Town Planning Officer';
    default: return titleCase(des);
  }
}

const DESK_DEV_USERS: Record<string, DevUserId> = {
  vro: 'officer:revenue:vro:Ramesh',
  surveyor: 'officer:revenue:surveyor:Swathi',
  ri: 'officer:revenue:ri:Chaitanya',
  tahsildar: 'officer:revenue:tahsildar:Anitha',
  sub_registrar: 'officer:registration:Suresh',
  town_planner: 'officer:planning:Farida',
};

function getDeskChecklistItems(designation?: string | null, status?: string): { id: string; label: string }[] {
  const d = designation?.toLowerCase() || '';
  if (d === 'vro' || status === 'field_inspection') {
    return [
      { id: 'Ground Possession Verified', label: 'Verified applicant actual physical possession on ground with panchas' },
      { id: 'Neighbor Boundary Notice', label: 'Served boundary notices to adjoining survey field ryots' },
      { id: 'Classification Matched', label: 'Land classification matches wet/dry revenue records' },
    ];
  }
  if (d === 'surveyor' || status === 'boundary_demarcation') {
    return [
      { id: 'FMB Traverse Measured', label: 'FMB / Tippon field traverse measured with ETS / chain' },
      { id: 'Boundary Stones Positioned', label: 'Inspected and geo-referenced all 4 corner boundary stones' },
      { id: 'Extent In Tolerance', label: 'Ground extent matches deed & cadastre within statutory tolerance' },
    ];
  }
  if (d === 'ri' || status === 'scrutiny_review') {
    return [
      { id: 'Joint Enquiry Reconciled', label: 'Joint scrutiny of VRO Panchanama & Surveyor Demarcation completed' },
      { id: 'Title Chain Audited', label: 'Audited link deeds and 30-year encumbrance index' },
      { id: 'Statutory Recommendation', label: 'Endorsed for Tahsildar / MRO final statutory approval order' },
    ];
  }
  if (d === 'tahsildar' || status === 'document_check' || status === 'field_verification') {
    return [
      { id: 'Statutory RoR Jurisdiction', label: 'Exercising quasi-judicial authority under Record of Rights (RoR) Act' },
      { id: 'Order Mutation Decreed', label: 'Directing digital mutation in RoR and updating Pattadar Pass Book' },
    ];
  }
  return [];
}

/** One line of decision evidence, credited to the department that holds the record. */
type EvidenceRow = { tone: 'ok' | 'warn' | 'bad'; text: string; source: string };

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Auto-assembled decision evidence: everything the aggregated CDM already knows,
 *  assembled without the officer chasing six paper files. */
function evidenceRows(p: ParcelCDM, appType: string): EvidenceRow[] {
  const rows: EvidenceRow[] = [];
  const reg = p.rights.registration;
  const transferLike = appType === 'mutation' || appType === 'record_correction';

  const ror = p.rights.ror;
  if (ror) {
    rows.push({
      tone: 'ok',
      text: `RoR: khata ${ror.khata_no ?? '—'} · ${ror.classification ?? '—'} · ${fmtArea(ror.extent_sqm)} (${ror.ownership_type ?? '—'})`,
      source: 'revenue',
    });
  }
  if (ror?.nominees?.length) {
    rows.push({
      tone: 'ok',
      text: `Nominees on record: ${ror.nominees.map((n) => `${n.name} (${n.relation})`).join(', ')}`,
      source: 'revenue',
    });
  } else if (appType === 'succession') {
    rows.push({ tone: 'warn', text: 'No nominee recorded — heirship rests on the certificates attached', source: 'revenue' });
  }
  if (reg?.status === 'registered') {
    rows.push({ tone: 'ok', text: `Registered ${reg.deed_type ?? 'deed'} ${reg.doc_no ?? ''} on ${reg.registered_on ?? '—'}`, source: 'registration' });
  } else {
    rows.push({ tone: transferLike ? 'warn' : 'ok', text: 'No registered deed on record', source: 'registration' });
  }
  if (p.consistency.area_match === false) {
    rows.push({ tone: 'warn', text: 'Extent differs between the revenue and registration records', source: 'consistency' });
  }
  if (p.consistency.owner_match === false) {
    rows.push({ tone: 'warn', text: 'Owner name differs between the RoR and the latest deed', source: 'consistency' });
  }
  for (const e of p.restrictions.encumbrances.filter((e) => e.active)) {
    rows.push({
      tone: 'warn',
      text: `Active ${e.kind}${e.holder ? ` · ${e.holder}` : ''}${e.amount ? ` · ${fmtINR(e.amount)}` : ''}`,
      source: 'registration',
    });
  }
  for (const d of p.restrictions.disputes) {
    rows.push({
      tone: 'bad',
      text: `Court case ${d.case_no} (${d.status})${d.next_hearing ? ` · next hearing ${d.next_hearing}` : ''}`,
      source: 'legal',
    });
  }
  const tax = p.fiscal.tax;
  if (tax) {
    rows.push(
      (tax.arrears ?? 0) > 0
        ? { tone: 'warn', text: `Property tax arrears of ${fmtINR(tax.arrears!)}`, source: 'fiscal' }
        : { tone: 'ok', text: `Tax paid till ${tax.paid_till ?? '—'}`, source: 'fiscal' },
    );
  }
  if (p.status.pending_mutation) {
    rows.push({ tone: 'warn', text: 'Another mutation is already pending on this parcel', source: 'revenue' });
  }
  for (const a of p.alerts.filter((a) => a.status !== 'resolved')) {
    rows.push({ tone: a.severity === 'high' ? 'bad' : 'warn', text: `Open alert: ${a.title}`, source: a.kind === 'change_detected' ? 'satellite' : 'system' });
  }
  return rows;
}

const EVIDENCE_ICON = {
  ok: { icon: CheckCircle2, cls: 'text-primary' },
  warn: { icon: AlertTriangle, cls: 'text-amber' },
  bad: { icon: XCircle, cls: 'text-brick' },
} as const;

function EvidencePanel({ p, appType }: { p: ParcelCDM; appType: string }) {
  const rows = evidenceRows(p, appType);
  if (rows.length === 0) return <p className="text-sm text-ink-3">Nothing on record for this parcel.</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((r, i) => {
        const ic = EVIDENCE_ICON[r.tone];
        return (
          <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-ink-2">
            <ic.icon size={13} className={clsx('mt-0.5 shrink-0', ic.cls)} />
            <span className="flex-1">{r.text}</span>
            <span className="mt-0.5 font-mono text-[10px] text-ink-3">{r.source}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** The planning pre-check the applicant ran before submitting (stored in payload.precheck).
 *  Rendered as one readable line instead of raw JSON; unknown shapes fall back to the dump. */
function PrecheckLine({ pc }: { pc: unknown }) {
  if (typeof pc === 'object' && pc !== null && 'permissible' in pc) {
    const c = pc as { permissible: boolean; zone_code?: string | null; reasons?: string[] };
    const ic = c.permissible ? EVIDENCE_ICON.ok : EVIDENCE_ICON.bad;
    return (
      <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-ink-2">
        <ic.icon size={13} className={clsx('mt-0.5 shrink-0', ic.cls)} />
        <span>
          Applicant’s zoning check: {c.permissible ? 'permissible' : 'not permissible'}
          {c.zone_code ? ` in zone ${c.zone_code}` : ''}
          {c.reasons && c.reasons.length > 0 ? ` — ${c.reasons.join('; ')}` : ''}
        </span>
      </p>
    );
  }
  return <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-ground-2 p-2 font-mono text-[11px] text-ink-2">{JSON.stringify(pc, null, 2)}</pre>;
}

function StatutoryImpactCard({ app, pending }: { app: { type: string; status: string; payload: Record<string, unknown>; assigned_department?: string | null; id: string }; pending: NextAction | null }) {
  const { t } = useTranslation();
  const isTerminalApproval = pending?.to_status === 'approved' || pending?.to_status === 'resolved';
  const toOwner = (app.payload?.to_owner || app.payload?.new_owner_name || app.payload?.nominee_name || app.payload?.applicant_name) as string | undefined;

  let title = t('officer.statutoryImpact', 'Statutory Record Impact Upon Approval');
  let details: { dept: string; impact: string; records: string }[] = [];

  if (app.type === 'mutation' || app.type === 'succession') {
    details = [
      {
        dept: 'Revenue Department (RoR / Jamabandi / Patta)',
        impact: `Confers legal ownership title to ${toOwner ? `“${toOwner}”` : 'the claimant'}`,
        records: 'dept_revenue.ror · Updates owner_name, issues new mutation entry, clears pending mutation flag',
      },
      {
        dept: 'Cadastral & Common Data Model',
        impact: 'Synchronizes Master Parcel Registry across all state portals',
        records: 'landstack.parcels & CDM cache invalidated and updated in real-time',
      },
    ];
  } else if (app.type === 'boundary_correction') {
    details = [
      {
        dept: 'Survey & Land Records (GIS)',
        impact: 'Commits high-precision PostGIS polygon coordinates to official Cadastral map',
        records: 'landstack.parcels.geom · Replaces boundary vertices after 5 spatial topology checks',
      },
      {
        dept: 'Revenue Department (Extent)',
        impact: 'Synchronizes updated land area with revenue Record of Rights',
        records: 'dept_revenue.ror.extent_sqm updated via POST /revenue/extent',
      },
    ];
  } else if (app.type === 'building_permission') {
    details = [
      {
        dept: 'Urban Planning / Local Body',
        impact: 'Issues official Building Sanction & construction permission',
        records: `dept_planning.permissions · Sanctions ${app.payload?.floors ?? 1} floor(s), ${app.payload?.built_up_sqm ?? 0} m²`,
      },
    ];
  } else if (app.type === 'field_review') {
    details = [
      {
        dept: 'Ground Enforcement & Earth Observation',
        impact: 'Concludes site inspection and dismisses satellite change detection alert',
        records: 'landstack.alerts marked resolved with officer inspection remarks',
      },
    ];
  } else if (app.type === 'utility_request') {
    const uAct = titleCase((app.payload?.action as string) || 'Service Sanction');
    const uType = titleCase((app.payload?.utility_type as string) || 'Utility');
    details = [
      {
        dept: 'Municipal Utilities & Infrastructure Desk',
        impact: `${uAct} for ${uType} (${(app.payload?.consumer_name as string) || 'Applicant'})`,
        records: 'dept_utilities.connections · Updates service connection, load/pipe parameters, and appends to audit history',
      },
      {
        dept: 'Master Parcel Registry & CDM',
        impact: 'Invalidates CDM cache; synchronizes live utility status for citizen and municipal GIS',
        records: 'dept_utilities.connections & aggregator cache updated in real time',
      },
    ];
  } else if (app.type === 'acquisition_claim') {
    const claimType = titleCase(String(app.payload?.claim_type || 'Statutory Claim'));
    const claimant = String(app.payload?.claimant_name || 'Landowner');
    details = [
      {
        dept: 'Competent Authority (Land Acquisition) & Revenue Division',
        impact: `${claimType} by ${claimant} · Statutory Assessment under RFCTLARR Act 2013`,
        records: 'gis.acquisition_claims · gis.project_parcel_impacts · updates compensation award, consent bonus, and hearing schedule',
      },
      {
        dept: 'Treasury / Urban Planning Authority (TDR & DBT Disbursement)',
        impact: app.payload?.tdr_opted
          ? `Issuance of ${app.payload?.tdr_zone || 'Municipal'} Transferable Development Rights (DRC)`
          : `Direct Benefit Transfer (DBT) to claimant bank account (${app.payload?.bank_ifsc || 'e-Kuber Mandate'})`,
        records: 'Direct e-Treasury mandate or TDR registry issuance',
      },
    ];
  } else {
    details = [
      {
        dept: titleCase(app.assigned_department),
        impact: `Resolves application #${app.id} and records statutory order`,
        records: 'Audit log & department registers updated',
      },
    ];
  }

  return (
    <div
      className={clsx(
        'rounded-xl border p-3 text-xs space-y-2 transition-all',
        isTerminalApproval ? 'border-primary/50 bg-primary-soft/40 shadow-xs ring-1 ring-primary/30' : 'border-line bg-ground-1'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          <ShieldCheck size={14} className="text-primary" />
          {title}
        </span>
        <Badge tone={isTerminalApproval ? 'primary' : 'neutral'}>
          {isTerminalApproval ? 'Approval Target' : 'Record Impact'}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {details.map((d, i) => (
          <div key={i} className="rounded-lg bg-panel p-2 border border-line/60 space-y-0.5">
            <span className="font-semibold text-ink text-[11.5px] block">{d.dept}</span>
            <p className="text-ink-2 font-medium text-[11px]">{d.impact}</p>
            <p className="font-mono text-[10px] text-ink-3">{d.records}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentVerificationPanel({ app }: { app: { payload: Record<string, unknown> } }) {
  const doc = app.payload.document as { id?: string; filename?: string; mime?: string; size?: number; sha256?: string; url?: string } | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ver = app.payload.document_verification as Record<string, any> | undefined;
  const [showAllFields, setShowAllFields] = useState(true);
  const [showConditions, setShowConditions] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!doc && !ver && !app.payload.document_name) return null;

  const docId = doc?.id || ver?.doc_id;
  const filename = doc?.filename || ver?.filename || (app.payload.document_name as string) || 'Supporting Document';
  const sha256 = doc?.sha256 || ver?.sha256;
  const docUrl = docId ? api.documentUrl(docId) : null;
  const isPdf = filename.toLowerCase().endsWith('.pdf') || doc?.mime?.includes('pdf');

  const copyHash = () => {
    if (sha256) {
      void navigator.clipboard.writeText(sha256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('SHA-256 fingerprint copied');
    }
  };

  const cross = ver?.cross_verification;
  const anchors = ver?.core_anchors;
  const dynamic = ver?.dynamic_fields;
  const tamper = ver?.tamper_check;
  const flags = cross?.flags as Array<{ id: string; severity: 'ok' | 'warn' | 'bad'; title: string; summary: string; statutory_ref?: string }> | undefined;
  const conditions = cross?.statutory_conditions as Array<{ id: string; title: string; desc: string; mandatory?: boolean }> | undefined;
  const disclaimer = cross?.disclaimer as string | undefined;

  return (
    <div className="rounded-xl border border-line bg-panel p-3 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-line pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={clsx('flex size-7 shrink-0 items-center justify-center rounded-lg text-white text-[11px] font-bold', isPdf ? 'bg-rose-600' : 'bg-primary')}>
            {isPdf ? 'PDF' : <FileText size={14} />}
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-ink truncate leading-tight">{filename}</h4>
            <p className="text-[10.5px] text-ink-3">
              {ver?.document_type || 'Land Record Instrument'}
              {doc?.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ''}
            </p>
          </div>
        </div>
        {docUrl ? (
          <a
            href={docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-line bg-ground-1 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary-soft transition-colors shadow-2xs"
          >
            <Eye size={12} /> View File
          </a>
        ) : (
          <span className="text-[10px] text-ink-3 italic">Verified on submission</span>
        )}
      </div>

      {sha256 && (
        <div className="flex items-center justify-between gap-2 rounded bg-ground-2/70 px-2 py-1 text-[10.5px]">
          <div className="flex items-center gap-1.5 text-ink-2 truncate">
            <ShieldCheck size={13} className="shrink-0 text-emerald-600" />
            <span className="font-semibold text-ink">SHA-256:</span>
            <span className="font-mono text-[9.5px] text-ink-3 truncate">{sha256}</span>
          </div>
          <button
            type="button"
            onClick={copyHash}
            className="shrink-0 text-ink-3 hover:text-ink text-[10px] font-semibold cursor-pointer"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {cross && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">Automated Cadastral Cross-Check</span>
            <span className={clsx('inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full', cross.overall_status === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
              {cross.overall_status === 'verified' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
              {cross.overall_status === 'verified' ? 'Automated Match' : 'Flagged for Review'}
            </span>
          </div>

          {/* Structured High-Density Flags */}
          {flags && flags.length > 0 ? (
            <div className="space-y-1">
              {flags.map((f) => (
                <div
                  key={f.id}
                  className={clsx(
                    'flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] leading-tight',
                    f.severity === 'ok'
                      ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                      : f.severity === 'bad'
                      ? 'border-rose-300 bg-rose-50 text-rose-950'
                      : 'border-amber-300 bg-amber-50 text-amber-950'
                  )}
                >
                  {f.severity === 'ok' ? (
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                  ) : f.severity === 'bad' ? (
                    <XCircle size={13} className="mt-0.5 shrink-0 text-rose-600" />
                  ) : (
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <strong className="font-semibold text-ink">{f.title}</strong>
                      {f.statutory_ref && (
                        <span className="font-mono text-[9px] text-ink-3 uppercase">{f.statutory_ref}</span>
                      )}
                    </div>
                    <p className="text-[10.5px] text-ink-2 mt-0.5">{f.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-line/60 bg-ground-1 p-2 space-y-1">
                <span className="text-[9.5px] uppercase font-semibold text-ink-3 block">Area Consistency</span>
                <p className="font-bold text-ink truncate text-[11px]">{cross.area_check?.deed_extent_raw || '—'}</p>
                <p className="text-[10px] text-ink-2 truncate">GIS: {cross.area_check?.cadastre_sqm ? `${cross.area_check.cadastre_sqm.toLocaleString()} sqm` : '—'}</p>
              </div>
              <div className="rounded-lg border border-line/60 bg-ground-1 p-2 space-y-1">
                <span className="text-[9.5px] uppercase font-semibold text-ink-3 block">Title & Parties</span>
                <p className="font-bold text-ink truncate text-[11px]">{cross.owner_check?.matched_party || '—'}</p>
                <p className="text-[10px] text-ink-2 truncate">RoR: {cross.owner_check?.ror_owner || '—'}</p>
              </div>
            </div>
          )}

          {/* Statutory Title Chain Discrepancy Notice */}
          {cross.owner_check && cross.owner_check.status !== 'matched' && (
            <div className="rounded-lg border border-amber-300/80 bg-amber-50/80 p-2.5 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="font-bold text-[11.5px] text-amber-950">
                      Title Chain Continuity Scrutiny
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded font-semibold border border-amber-300/60">
                      §32 Registration Act
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-1 leading-snug">
                    Deed Executant <strong className="text-amber-950 font-bold">({cross.owner_check.matched_party || 'Seller on Instrument'})</strong> does not match recorded 1-B RoR Title Holder <strong className="text-amber-950 font-bold">({cross.owner_check.ror_owner || 'Record Owner'})</strong>.
                  </p>
                  <p className="text-[10px] text-amber-800/90 mt-1 border-t border-amber-200/80 pt-1 leading-normal">
                    Applicant must produce registered link deed (parent title chain) or legal heirship order before quasi-judicial mutation sanction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statutory Conditions Checklist */}
          {conditions && conditions.length > 0 && (
            <div className="rounded-lg border border-line/70 bg-panel-2 p-2 text-xs space-y-1">
              <button
                type="button"
                onClick={() => setShowConditions(!showConditions)}
                className="flex w-full items-center justify-between font-semibold text-ink cursor-pointer text-left text-[11px]"
              >
                <span className="flex items-center gap-1.5">
                  <Scale size={12} className="text-primary" />
                  Statutory Preconditions ({conditions.length})
                </span>
                {showConditions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showConditions && (
                <div className="pt-1.5 border-t border-line/60 space-y-1">
                  {conditions.map((c) => (
                    <div key={c.id} className="flex items-start gap-1.5 rounded bg-ground-1 p-1.5 text-[10.5px]">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-600" />
                      <div>
                        <strong className="text-ink">{c.title}:</strong> <span className="text-ink-2">{c.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Official AI Disclaimer */}
          {disclaimer && (
            <div className="rounded bg-ground-2/50 px-2 py-1 text-[9.5px] text-ink-3 leading-normal border border-line/40">
              ⚖️ <em>{disclaimer}</em>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Fields Inspector */}
      {anchors && (
        <div className="rounded-lg border border-line/80 bg-panel-2 p-2 text-xs space-y-1">
          <button
            type="button"
            onClick={() => setShowAllFields(!showAllFields)}
            className="flex w-full items-center justify-between font-semibold text-ink cursor-pointer text-left text-[11px]"
          >
            <span className="flex items-center gap-1.5">
              <ScrollText size={13} className="text-primary" />
              Registered Instrument Covenants & Anchors
            </span>
            {showAllFields ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showAllFields && (
            <div className="pt-1.5 border-t border-line/60 space-y-1.5 text-[11px]">
              {anchors.registration?.document_no && (
                <div>
                  <span className="font-bold text-ink">Registration: </span>
                  <span className="text-ink-2">Doc #{anchors.registration.document_no} ({anchors.registration.date ?? '—'}) · {anchors.registration.sub_registrar_office ?? '—'}</span>
                </div>
              )}
              {anchors.boundaries && (
                <div className="grid grid-cols-2 gap-1 rounded bg-ground-1 p-1.5 text-[10.5px]">
                  <span><strong>N:</strong> {anchors.boundaries.north ?? '—'}</span>
                  <span><strong>S:</strong> {anchors.boundaries.south ?? '—'}</span>
                  <span><strong>E:</strong> {anchors.boundaries.east ?? '—'}</span>
                  <span><strong>W:</strong> {anchors.boundaries.west ?? '—'}</span>
                </div>
              )}
              {dynamic && Object.keys(dynamic).length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-ink block text-[10.5px]">Dynamic Clauses Found:</span>
                  {Object.entries(dynamic).map(([k, v]) => (
                    <div key={k} className="rounded bg-ground-1 px-2 py-0.5 text-[10.5px]">
                      <span className="font-semibold text-ink">{titleCase(k)}: </span>
                      <span className="text-ink-2">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
              {tamper && (
                <div className="rounded border border-line/70 bg-ground-1 p-1.5 space-y-0.5 text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-ink">Forensic Tamper Check:</span>
                    <Badge tone={tamper.risk_level === 'clean' ? 'primary' : 'amber'}>
                      {tamper.risk_level}
                    </Badge>
                  </div>
                  <p className="text-ink-3 leading-tight">{tamper.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ApplicationDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useQuery({ queryKey: qk.application(id ?? ''), queryFn: () => api.application(id!), enabled: !!id });
  const parcel = useQuery({ queryKey: qk.parcel(q.data?.ulpin ?? '', user?.uid ?? ''), queryFn: () => api.parcel(q.data!.ulpin), enabled: !!q.data?.ulpin });
  const [remark, setRemark] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<NextAction | null>(null);

  const mutateTransition = useMutation({
    mutationFn: (a: NextAction) => {
      const checkedNotes = Object.entries(checklist)
        .filter(([_, v]) => v)
        .map(([k, _]) => `[${k}]`)
        .join(' ');
      const finalRemark = checkedNotes ? `${checkedNotes} ${remark.trim()}`.trim() : remark.trim();
      return api.transition(id!, a.action, finalRemark);
    },
    onSuccess: (app) => {
      toast.success(`Moved to ${titleCase(app.status)}`, app.id);
      setRemark('');
      setChecklist({});
      setPending(null);
      void qc.invalidateQueries({ queryKey: ['queue'] });
      void qc.invalidateQueries({ queryKey: ['applications'] });
      void qc.invalidateQueries({ queryKey: qk.application(app.id) });
      void qc.invalidateQueries({ queryKey: ['parcel'] });
      void qc.invalidateQueries({ queryKey: ['citizen', 'my-parcels'] });
      void qc.invalidateQueries({ queryKey: qk.stats() });
    },
    onError: (e: Error) => toast.error('Transition failed', e.message),
  });

  const app = q.data;
  const actions = app ? app.next_actions ?? fallbackActions(app.type, app.status) : [];
  const tone = (a: NextAction) => (a.to_status === 'rejected' ? 'danger' : a.to_status === 'approved' || a.to_status === 'resolved' ? 'primary' : 'secondary');
  // Auto-run statutory advice whenever the officer has a decision to make.
  const advice = useQuery({
    queryKey: qk.applicationAdvice(id ?? ''),
    queryFn: () => api.applicationAdvice(id!),
    enabled: !!id && !!app && actions.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const draftOrderMutation = useMutation({
    mutationFn: () => api.draftOrder(id!, pending?.action || 'approve'),
    onSuccess: (res) => {
      setRemark(res.order_text);
      toast.success(`Drafted statutory order under ${res.act}`);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => toast.error('Could not draft statutory order', err?.message || 'Statutory drafting service unavailable'),
  });

  return (
    <Drawer open={!!id} onClose={onClose} ariaLabel="Application detail" width="w-[520px] max-w-[94vw]" className="fixed top-14 bottom-0 right-0 border-l border-line rounded-none"
      header={
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-3">Application</p>
          <h2 className="font-mono text-lg font-semibold">{id}</h2>
          {app && <div className="mt-1 flex items-center gap-2"><StatusBadge status={app.status} /><span className="text-xs text-ink-3">{titleCase(app.type)} · {titleCase(app.assigned_department)}</span></div>}
        </div>
      }
    >
      <div className="flex flex-col gap-5 p-4">
        {q.isLoading && <Loading />}
        {q.isError && <ErrorNote error={q.error} retry={() => void q.refetch()} />}
        {app && (
          <>
            <div>
              <SectionTitle right={<Link to="/map" search={{ ulpin: app.ulpin }} className="flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline">{t('common.viewOnMap', 'Open on map')} <ExternalLink size={12} /></Link>}>{t('officer.colParcel', 'Parcel')}</SectionTitle>
              {parcel.data ? (
                <>
                  <KV items={[
                    { k: t('common.surveyNo', 'Survey no.'), v: parcel.data.identifiers.survey_no },
                    { k: t('common.ulpin', 'ULPIN'), v: app.ulpin, mono: true },
                    { k: t('common.owner', 'Owner (RoR)'), v: parcel.data.party.owners.map((o) => o.name).join(', ') || '—' },
                    { k: t('common.extent', 'Area / Extent'), v: fmtArea(parcel.data.spatial.area_sqm) },
                  ]} />
                  <div className="mt-2 flex flex-wrap gap-1">{statusChips(parcel.data.status, t)}</div>
                </>
              ) : (
                <p className="font-mono text-sm">{app.ulpin}</p>
              )}
            </div>

            <div>
              <SectionTitle>{t('officer.applicantPayload', 'Applicant & payload')}</SectionTitle>
              <KV items={[
                { k: t('officer.colApplicant', 'Applicant'), v: app.applicant_name ?? '—' },
                { k: t('status.submitted', 'Submitted'), v: fmtDate(app.created_at, true) },
                ...Object.entries(app.payload).filter(([k, v]) => !['document', 'document_verification'].includes(k) && v !== null && typeof v !== 'object').map(([k, v]) => ({ k: titleCase(k), v: String(v) })),
              ]} />
              {app.payload.precheck !== undefined && app.payload.precheck !== null && <PrecheckLine pc={app.payload.precheck} />}
            </div>

            {(Boolean(app.payload.document || app.payload.document_verification || app.payload.document_name)) && (
              <div>
                <SectionTitle>{t('officer.extractedDataTitle', 'Instrument Scrutiny & Extracted Covenants')}</SectionTitle>
                <DocumentVerificationPanel app={app} />
              </div>
            )}

            {parcel.data && (
              <div>
                <SectionTitle>{t('officer.evidenceTitle', 'Evidence')}</SectionTitle>
                <EvidencePanel p={parcel.data} appType={app.type} />
              </div>
            )}

            {Array.isArray(app.payload.objections) && app.payload.objections.length > 0 && (
              <div>
                <SectionTitle>{t('officer.objectionsTitle', 'Objections')} ({(app.payload.objections as Objection[]).length})</SectionTitle>
                <ul className="flex flex-col gap-1.5">
                  {(app.payload.objections as Objection[]).map((o, i) => (
                    <li key={i} className="rounded-md border border-amber/40 bg-amber-soft/40 px-2.5 py-2 text-[12.5px]">
                      <p className="text-ink-2">“{o.reason}”</p>
                      <p className="mt-0.5 text-[11px] text-ink-3">{o.by_name ?? 'Anonymous'} · {fmtDate(o.ts, true)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <SectionTitle>{t('officer.historyTitle', 'History')}</SectionTitle>
              <StatusTimeline app={app} />
            </div>

            {actions.length > 0 && (
              <div className="rounded-lg border border-line bg-panel-2 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-line/60 pb-2">
                  <SectionTitle>{t('officer.nextAction', 'Next action')}</SectionTitle>
                  <span className="text-[11px] font-medium text-ink-3">
                    Active: <strong className="text-ink">{user?.name}</strong> ({user?.designation ? designationLabel(user.designation) : titleCase(user?.role || 'Officer')})
                  </span>
                </div>
                <StatutoryImpactCard app={app} pending={pending} />
                {advice.data?.suggested_action && (
                  <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-line bg-panel p-2.5 text-xs shadow-2xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary border border-primary/20 mt-0.5">
                        <Scale size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-ink text-[12px]">Statutory Desk Guidance:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const target = actions.find((a) => a.action === advice.data?.suggested_action);
                              if (target) {
                                setPending(target);
                                const items = getDeskChecklistItems(target.allowed_designation || user?.designation, app.status);
                                const initial: Record<string, boolean> = {};
                                items.forEach((it) => { initial[it.id] = true; });
                                setChecklist(initial);
                              }
                            }}
                            title="Click to select this recommended action"
                            className="inline-flex items-center gap-1 rounded bg-primary text-white hover:bg-primary-hover px-2 py-0.5 font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                          >
                            <span>{titleCase(advice.data.suggested_action)}</span>
                            <ChevronRight size={11} />
                          </button>
                        </div>
                        <p className="text-[11px] text-ink-2 leading-tight mt-1">{advice.data.rationale}</p>
                      </div>
                    </div>
                    <span className="rounded bg-ground-1 border border-line px-1.5 py-0.5 font-mono text-[9px] font-semibold text-ink-3 shrink-0 uppercase tracking-wide">
                      {advice.data.engine === 'rules' ? 'Rules §14' : 'Cadastral Scrutiny'}
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => {
                    const isAllowed = user?.role === 'admin' || (Boolean(a.allowed_designation) && user?.designation?.toLowerCase() === a.allowed_designation!.toLowerCase());
                    return (
                      <Button
                        key={a.action}
                        variant={pending?.action === a.action ? tone(a) : 'secondary'}
                        size="sm"
                        disabled={!isAllowed}
                        onClick={() => {
                          if (!isAllowed) return;
                          setPending(a);
                          const items = getDeskChecklistItems(a.allowed_designation || user?.designation, app.status);
                          const initial: Record<string, boolean> = {};
                          items.forEach((it) => { initial[it.id] = true; });
                          setChecklist(initial);
                        }}
                        aria-pressed={pending?.action === a.action}
                        className={clsx(
                          advice.data?.suggested_action === a.action && isAllowed && 'ring-2 ring-primary/40',
                          !isAllowed && 'opacity-60 cursor-not-allowed bg-ground-2 text-ink-3'
                        )}
                      >
                        {!isAllowed && <Lock size={12} className="mr-1 text-ink-3 shrink-0" />}
                        {a.label}
                        {a.allowed_designation && (
                          <span className={clsx(
                            'ml-1.5 rounded px-1 py-0.2 text-[10px] font-bold uppercase tracking-wider',
                            isAllowed ? 'bg-primary/10 text-primary' : 'bg-amber/15 text-amber-800'
                          )}>
                            {a.allowed_designation}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* If any action is locked due to hierarchy, explain and provide 1-click switch in dev */}
                {actions.some((a) => user?.role !== 'admin' && a.allowed_designation && user?.designation?.toLowerCase() !== a.allowed_designation.toLowerCase()) && (
                  <div className="rounded-lg border border-amber/30 bg-amber-soft/30 p-2.5 text-xs text-ink-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                      <ShieldAlert size={14} className="text-amber-700" />
                      <span>Stage-Gated Statutory Desk Authority</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-ink-2">
                      In statutory revenue governance, duties are separated by designation (VRO, Surveyor, RI, Tahsildar).
                      You are signed in as <strong className="text-ink">{user?.name}</strong> ({user?.designation ? designationLabel(user.designation) : user?.role}).
                    </p>
                    {isDevAuth && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-amber/20">
                        {actions
                          .filter((a) => a.allowed_designation && user?.designation?.toLowerCase() !== a.allowed_designation.toLowerCase())
                          .map((a) => {
                            const des = a.allowed_designation!.toLowerCase();
                            const targetDevId = DESK_DEV_USERS[des];
                            if (!targetDevId) return null;
                            return (
                              <button
                                key={des}
                                type="button"
                                onClick={() => {
                                  useUI.getState().setDevUser(targetDevId);
                                  toast.success(`Switched active desk to ${designationLabel(des)}`);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer bg-white/80 px-2 py-0.5 rounded border border-line"
                              >
                                <UserCheck size={12} /> Switch to {designationLabel(des)} →
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {pending && (
                  <form
                    className="mt-3 flex flex-col gap-2.5 rounded-lg border border-line/80 bg-panel p-3 shadow-2xs"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (remark.trim().length < 3) return;
                      mutateTransition.mutate(pending);
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <span className="font-semibold text-xs text-ink flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-primary" />
                        Desk Verification & Action: {pending.label}
                      </span>
                      {pending.allowed_designation && (
                        <Badge tone="neutral">{designationLabel(pending.allowed_designation)}</Badge>
                      )}
                    </div>

                    {/* Statutory Checklist */}
                    {getDeskChecklistItems(pending.allowed_designation || user?.designation, app.status).length > 0 && (
                      <div className="rounded-lg bg-ground-1 p-2.5 space-y-2 border border-line/60">
                        <span className="text-[10.5px] uppercase tracking-wider font-bold text-ink-3 block">
                          Statutory Verification Checklist
                        </span>
                        <div className="space-y-1.5">
                          {getDeskChecklistItems(pending.allowed_designation || user?.designation, app.status).map((it) => (
                            <label key={it.id} className="flex items-start gap-2 text-xs text-ink-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={checklist[it.id] ?? false}
                                onChange={(e) => setChecklist({ ...checklist, [it.id]: e.target.checked })}
                                className="mt-0.5 rounded border-line text-primary focus:ring-primary"
                              />
                              <span className="leading-snug">{it.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <label htmlFor="tr-remark" className="text-xs font-semibold text-ink">
                          {t('officer.remarkLabel', 'Official Finding / Remarks (required)')} · “{pending.label}”
                        </label>
                        <button
                          type="button"
                          disabled={draftOrderMutation.isPending}
                          onClick={() => draftOrderMutation.mutate()}
                          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel hover:bg-ground-1 px-2.5 py-1 text-[11px] font-semibold text-ink transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          <Scale size={12} className={draftOrderMutation.isPending ? 'animate-spin text-primary' : 'text-primary'} />
                          {draftOrderMutation.isPending ? 'Preparing Statutory Order...' : 'Generate Draft Speaking Order'}
                        </button>
                      </div>
                      <Textarea
                        id="tr-remark"
                        required
                        minLength={3}
                        rows={4}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Detail the ground enquiry findings, survey measurements, or statutory order specifics..."
                      />
                      <p className="text-[10.5px] text-ink-3 italic">
                        Speaking orders cite statutory state Acts (AP Pattadar Pass Books Act 1971 / TN Patta Pass Book Act 1983 / TG ROR Act 2020) and are permanently recorded in the quasi-judicial audit trail.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" variant={tone(pending)} loading={mutateTransition.isPending} disabled={remark.trim().length < 3}>
                        {t('officer.confirmAction', 'Confirm')} · {pending.label}
                      </Button>
                      <Button variant="ghost" onClick={() => { setPending(null); setChecklist({}); }}>
                        {t('common.cancel', 'Cancel')}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}
