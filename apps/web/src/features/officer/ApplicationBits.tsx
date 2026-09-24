import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { Badge, type Tone } from '@/components/Badge';
import type { Application, HistoryEntry, NextAction } from '@/lib/cdm';
import { api, qk } from '@/lib/api';
import { roleAtLeast, useAuth } from '@/lib/auth';
import { fmtDate, titleCase } from '@/lib/format';

const STATUS_TONE: Record<string, Tone> = {
  submitted: 'slate',
  document_check: 'amber',
  field_verification: 'amber',
  field_inspection: 'amber',
  boundary_demarcation: 'amber',
  scrutiny_review: 'amber',
  planning_check: 'amber',
  site_inspection: 'amber',
  statutory_sanction: 'violet',
  open: 'slate',
  assigned: 'amber',
  in_review: 'amber',
  approved: 'primary',
  resolved: 'primary',
  returned: 'violet',
  rejected: 'brick',
  dismissed: 'brick',
};

import { t } from '@/lib/i18n';

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{t(`status.${status}`, titleCase(status))}</Badge>;
}

/** Fallback when the API does not include `next_actions` (CONTRACTS §8 transitions). */
export function fallbackActions(type: string, status: string): NextAction[] {
  const mk = (pairs: [string, string, string?][]): NextAction[] =>
    pairs.map(([to, label, des]) => ({
      action: to,
      label,
      to_status: to,
      is_terminal: ['approved', 'rejected', 'resolved', 'dismissed'].includes(to),
      allowed_designation: des ?? null,
    }));
  if (type === 'mutation') {
    if (status === 'submitted') return mk([['document_check', 'VRO Document Scrutiny', 'vro'], ['field_inspection', 'Conduct VRO Panchanama', 'vro']]);
    if (status === 'document_check') return mk([['field_inspection', 'Submit VRO Panchanama & Forward', 'vro'], ['boundary_demarcation', 'Request Demarcation', 'vro']]);
    if (status === 'field_inspection') return mk([['boundary_demarcation', 'Submit Field Panchanama to Surveyor', 'vro']]);
    if (status === 'boundary_demarcation') return mk([['scrutiny_review', 'Submit Survey & Demarcation (Surveyor)', 'surveyor']]);
    if (status === 'field_verification') return mk([['scrutiny_review', 'Submit Cadastral Survey Report', 'surveyor'], ['approved', 'Pass Statutory Approval (Tahsildar)', 'tahsildar'], ['rejected', 'Pass Statutory Rejection (Tahsildar)', 'tahsildar']]);
    if (status === 'scrutiny_review') return mk([['statutory_sanction', 'RI Endorsement to Tahsildar', 'ri'], ['approved', 'Pass Statutory Approval (Tahsildar)', 'tahsildar'], ['rejected', 'Pass Statutory Rejection (Tahsildar)', 'tahsildar']]);
    if (status === 'statutory_sanction') return mk([['approved', 'Pass Statutory Approval (Tahsildar)', 'tahsildar'], ['rejected', 'Pass Statutory Rejection (Tahsildar)', 'tahsildar'], ['returned', 'Return to Applicant (Tahsildar)', 'tahsildar']]);
  }
  if (type === 'building_permission') {
    if (status === 'submitted') return mk([['planning_check', 'Run Planning Scrutiny', 'town_planner']]);
    if (status === 'planning_check') return mk([['site_inspection', 'Schedule Site Measurement', 'town_planner'], ['rejected', 'Reject', 'town_planner']]);
    if (status === 'site_inspection') return mk([['scrutiny_review', 'Submit Measurement Report', 'surveyor'], ['approved', 'Approve Permission', 'town_planner'], ['rejected', 'Reject', 'town_planner']]);
    if (status === 'scrutiny_review') return mk([['approved', 'Grant Building Permit', 'town_planner'], ['rejected', 'Reject Permit', 'town_planner']]);
  }
  if (type === 'field_review') {
    if (status === 'open') return mk([['assigned', 'Assign', 'admin']]);
    if (status === 'assigned') return mk([['resolved', 'Resolve', 'vro']]);
  }
  if (type === 'record_correction' || type === 'succession') {
    if (status === 'submitted') return mk([['field_inspection', 'VRO Field Enquiry', 'vro'], ['document_check', 'VRO Scrutiny', 'vro']]);
    if (status === 'document_check') return mk([['field_inspection', 'Refer to VRO for Field Enquiry', 'vro']]);
    if (status === 'field_inspection') return mk([['scrutiny_review', 'Submit Ground Report to RI', 'vro']]);
    if (status === 'scrutiny_review') return mk([['statutory_sanction', 'RI Endorsement to Tahsildar', 'ri'], ['approved', 'Pass Statutory Order (Tahsildar)', 'tahsildar'], ['rejected', 'Reject (Tahsildar)', 'tahsildar']]);
    if (status === 'statutory_sanction') return mk([['approved', 'Pass Statutory Order (Tahsildar)', 'tahsildar'], ['rejected', 'Reject (Tahsildar)', 'tahsildar'], ['returned', 'Return to Applicant (Tahsildar)', 'tahsildar']]);
  }
  if (type === 'land_complaint') {
    if (status === 'submitted') return mk([['in_review', 'Take up for review']]);
    if (status === 'in_review') return mk([['resolved', 'Mark resolved'], ['dismissed', 'Dismiss']]);
  }
  if (type === 'boundary_correction') {
    if (status === 'submitted') return mk([['geometry_check', 'Start geometry check']]);
    if (status === 'geometry_check') return mk([['approved', 'Approve & apply (Surveyor / Tahsildar)'], ['returned', 'Return to proposer'], ['rejected', 'Reject']]);
  }
  if (type === 'utility_request') {
    if (status === 'submitted') return mk([['in_review', 'VRO Verify Ground Feasibility', 'vro'], ['site_inspection', 'Surveyor Verify Alignment', 'surveyor']]);
    if (status === 'in_review') return mk([['site_inspection', 'Surveyor Verify Alignment', 'surveyor'], ['approved', 'Sanction Utility Connection', 'tahsildar']]);
    if (status === 'site_inspection') return mk([['scrutiny_review', 'RI Endorsement to Competent Authority', 'ri']]);
    if (status === 'scrutiny_review') return mk([['approved', 'Sanction Utility Connection', 'tahsildar'], ['rejected', 'Reject Utility Request', 'tahsildar']]);
  }
  if (type === 'acquisition_claim') {
    if (status === 'claim_submitted' || status === 'submitted') return mk([['vro_verification', 'VRO Title & Possession Verification', 'vro'], ['hearing_scheduled', 'Schedule Statutory Hearing', 'tahsildar']]);
    if (status === 'vro_verification') return mk([['hearing_scheduled', 'Schedule Statutory Hearing (§15/§64)', 'tahsildar'], ['valuation_scrutiny', 'Verify Structural/Asset Valuation', 'surveyor']]);
    if (status === 'valuation_scrutiny') return mk([['hearing_scheduled', 'Schedule Statutory Hearing', 'tahsildar']]);
    if (status === 'hearing_scheduled') return mk([['award_finalized', 'Pass Statutory Compensation Award', 'tahsildar'], ['disbursed', 'Disburse Direct Consent Payout (DBT)', 'tahsildar'], ['rejected', 'Reject Ineligible Claim', 'tahsildar']]);
    if (status === 'award_finalized') return mk([['disbursed', 'Disburse Compensation Payout (DBT)', 'tahsildar']]);
  }
  return [];
}

/** The one-click queue action: the next FORWARD, non-terminal step (terminal decisions —
 *  approve/reject/return — deliberately require the detail drawer and a written remark). */
export function quickAdvanceAction(app: Application): NextAction | null {
  const actions = app.next_actions && app.next_actions.length > 0 ? app.next_actions : fallbackActions(app.type, app.status);
  const forward = actions.filter((a) => !a.is_terminal && a.to_status !== 'returned');
  return forward[0] ?? null;
}

/**
 * Status history. Uses `app.history` when the API provides it; officers fall back to the parcel
 * timeline filtered to this application; citizens fall back to a two-point derived history.
 */
export function StatusTimeline({ app }: { app: Application }) {
  const { role } = useAuth();
  const canTimeline = roleAtLeast(role, 'officer') && !app.history;
  const tl = useQuery({ queryKey: qk.timeline(app.ulpin), queryFn: () => api.timeline(app.ulpin), enabled: canTimeline });

  let entries: HistoryEntry[] = app.history ?? [];
  if (entries.length === 0 && tl.data) {
    entries = tl.data
      .filter((e) => JSON.stringify(e.detail ?? {}).includes(app.id) || e.title.includes(app.id))
      .map((e) => ({
        ts: e.ts,
        to_status: String(e.detail?.to_status ?? e.kind),
        actor_name: e.actor ?? null,
        actor_designation: typeof e.detail?.designation === 'string' ? e.detail.designation : null,
        remark: typeof e.detail?.remark === 'string' ? e.detail.remark : null,
        action: e.title,
      }));
  }
  if (entries.length === 0) {
    entries = [{ ts: app.created_at, to_status: 'submitted', actor_name: app.applicant_name ?? null }];
    if (app.status !== 'submitted') entries.push({ ts: app.updated_at, to_status: app.status });
  }

  return (
    <>
    <ol className="relative ml-1.5 border-l border-line pl-5" aria-label="Status history">
      {entries.map((h, i) => {
        const last = i === entries.length - 1;
        return (
          <li key={i} className="relative pb-3 last:pb-0">
            <span className={`absolute -left-[25px] top-1 size-3 rounded-full border-2 border-panel ${last ? 'bg-primary' : 'bg-line-strong'}`} aria-hidden />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={h.to_status} />
              <span className="text-xs text-ink-3">{fmtDate(h.ts, true)}</span>
              {h.actor_name && (
                <span className="text-xs text-ink-3">
                  · {h.actor_name}
                  {h.actor_designation ? ` (${titleCase(h.actor_designation)})` : h.actor_role ? ` (${h.actor_role})` : ''}
                </span>
              )}
            </div>
            {h.remark && <p className="mt-0.5 text-sm text-ink-2">“{h.remark}”</p>}
          </li>
        );
      })}
    </ol>
    <SideEffectNote app={app} />
    </>
  );
}

/** Cross-department consequence of an approval (payload.side_effect, written by the workflow
 *  engine after run_side_effects). Shown to citizen and officer alike — the interoperability
 *  story, visible in one line. */
function SideEffectNote({ app }: { app: Application }) {
  const side = app.payload?.side_effect as { department?: string; ok?: boolean; error?: string } | undefined;
  if (!side || typeof side !== 'object') return null;
  if (side.ok === false) {
    return (
      <div className="mt-3 rounded-xl border border-amber/40 bg-amber-soft/40 p-3 text-[12.5px] text-ink-2 space-y-1">
        <p className="flex items-center gap-1.5 font-semibold text-amber">
          <AlertTriangle size={14} /> Cross-Department Sync Pending
        </p>
        <p className="text-xs text-ink-3">
          The follow-up update in the other department did not go through{side.error ? ` (${side.error})` : ''}. An officer will retry it.
        </p>
      </div>
    );
  }
  const text =
    app.type === 'mutation' || app.type === 'succession'
      ? 'Record of Rights (RoR) title was officially transferred in the Revenue Department, and the pending mutation flag was cleared.'
      : app.type === 'boundary_correction'
        ? 'New PostGIS boundary coordinates were applied to the cadastral map and the recorded extent was synchronized in the Revenue department.'
        : app.type === 'building_permission'
          ? 'Official Building Sanction was recorded in the Planning department’s system.'
          : app.type === 'acquisition_claim'
            ? 'Statutory compensation award and hearing determination were recorded in the Land Acquisition Registry and treasury disbursement mandate created.'
            : `Approved and automatically updated the ${titleCase(side.department ?? 'other')} department’s records.`;
  return (
    <div className="mt-3 rounded-xl border border-primary/30 bg-primary-soft/40 p-3 text-[12.5px] text-ink-2 space-y-1.5 shadow-xs">
      <div className="flex items-center gap-1.5 font-semibold text-primary">
        <ArrowRightLeft size={14} />
        <span>Statutory Record Update Executed</span>
      </div>
      <p className="text-xs text-ink leading-relaxed">
        {text}
      </p>
      <div className="pt-0.5">
        <a href={`/map?ulpin=${encodeURIComponent(app.ulpin)}`} className="text-xs text-primary font-medium underline-offset-2 hover:underline">
          View updated parcel on map →
        </a>
      </div>
    </div>
  );
}
