import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, ExternalLink, Sparkles, XCircle } from 'lucide-react';
import { api, qk } from '@/lib/api';
import type { NextAction, ParcelCDM } from '@/lib/cdm';
import { Drawer } from '@/components/Drawer';
import { Button } from '@/components/Button';
import { Field, Textarea } from '@/components/Field';
import { Loading } from '@/components/Spinner';
import { ErrorNote } from '@/components/EmptyState';
import { KV, SectionTitle } from '@/components/Section';
import { toast } from '@/components/Toast';
import { fallbackActions, StatusBadge, StatusTimeline } from './ApplicationBits';
import { fmtDate, titleCase } from '@/lib/format';
import { statusChips } from '@/components/StatusChip';
import { useAuth } from '@/lib/auth';

/** One line of decision evidence, credited to the department that holds the record. */
type EvidenceRow = { tone: 'ok' | 'warn' | 'bad'; text: string; source: string };

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Auto-assembled decision evidence: everything the aggregated CDM already knows,
 *  flattened to per-source lines so the officer never has to open six systems. */
function evidenceRows(p: ParcelCDM, appType: string): EvidenceRow[] {
  const rows: EvidenceRow[] = [];
  const reg = p.rights.registration;
  const transferLike = appType === 'mutation' || appType === 'record_correction';

  const ror = p.rights.ror;
  if (ror) {
    rows.push({
      tone: 'ok',
      text: `RoR: khata ${ror.khata_no ?? '—'} · ${ror.classification ?? '—'} · ${ror.extent_sqm ?? '—'} m² (${ror.ownership_type ?? '—'})`,
      source: 'revenue',
    });
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

export function ApplicationDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useQuery({ queryKey: qk.application(id ?? ''), queryFn: () => api.application(id!), enabled: !!id });
  const parcel = useQuery({ queryKey: qk.parcel(q.data?.ulpin ?? '', user?.uid ?? ''), queryFn: () => api.parcel(q.data!.ulpin), enabled: !!q.data?.ulpin });
  const [remark, setRemark] = useState('');
  const [pending, setPending] = useState<NextAction | null>(null);

  const t = useMutation({
    mutationFn: (a: NextAction) => api.transition(id!, a.action, remark.trim()),
    onSuccess: (app) => {
      toast.success(`Moved to ${titleCase(app.status)}`, app.id);
      setRemark('');
      setPending(null);
      void qc.invalidateQueries({ queryKey: ['queue'] });
      void qc.invalidateQueries({ queryKey: qk.application(app.id) });
      void qc.invalidateQueries({ queryKey: ['parcel', app.ulpin] });
      void qc.invalidateQueries({ queryKey: qk.stats() });
    },
    onError: (e: Error) => toast.error('Transition failed', e.message),
  });

  const app = q.data;
  const actions = app ? app.next_actions ?? fallbackActions(app.type, app.status) : [];
  const tone = (a: NextAction) => (a.to_status === 'rejected' ? 'danger' : a.to_status === 'approved' || a.to_status === 'resolved' ? 'primary' : 'secondary');
  // Auto-run AI advice whenever the officer has a decision to make.
  const advice = useQuery({
    queryKey: qk.applicationAdvice(id ?? ''),
    queryFn: () => api.applicationAdvice(id!),
    enabled: !!id && !!app && actions.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return (
    <Drawer open={!!id} onClose={onClose} ariaLabel="Application detail" width="w-[520px] max-w-[94vw]" className="fixed top-12"
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
              <SectionTitle right={<Link to="/map" search={{ ulpin: app.ulpin }} className="flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline">Open on map <ExternalLink size={12} /></Link>}>Parcel</SectionTitle>
              {parcel.data ? (
                <>
                  <KV items={[
                    { k: 'Survey no.', v: parcel.data.identifiers.survey_no },
                    { k: 'ULPIN', v: app.ulpin, mono: true },
                    { k: 'Owner (RoR)', v: parcel.data.party.owners.map((o) => o.name).join(', ') || '—' },
                    { k: 'Area', v: `${parcel.data.spatial.area_sqm} m²` },
                  ]} />
                  <div className="mt-2 flex flex-wrap gap-1">{statusChips(parcel.data.status)}</div>
                </>
              ) : (
                <p className="font-mono text-sm">{app.ulpin}</p>
              )}
            </div>

            <div>
              <SectionTitle>Applicant & payload</SectionTitle>
              <KV items={[
                { k: 'Applicant', v: app.applicant_name ?? '—' },
                { k: 'Submitted', v: fmtDate(app.created_at, true) },
                ...Object.entries(app.payload).filter(([, v]) => v !== null && typeof v !== 'object').map(([k, v]) => ({ k: titleCase(k), v: String(v) })),
              ]} />
              {app.payload.precheck !== undefined && app.payload.precheck !== null && <PrecheckLine pc={app.payload.precheck} />}
            </div>

            {parcel.data && (
              <div>
                <SectionTitle>Evidence</SectionTitle>
                <EvidencePanel p={parcel.data} appType={app.type} />
              </div>
            )}

            <div>
              <SectionTitle>History</SectionTitle>
              <StatusTimeline app={app} />
            </div>

            {actions.length > 0 && (
              <div className="rounded-lg border border-line bg-panel-2 p-3">
                <SectionTitle>Next action</SectionTitle>
                {advice.data?.suggested_action && (
                  <div className="mb-2 flex items-start gap-2 rounded-md border border-violet/30 bg-violet-soft/40 px-2.5 py-2 text-[12.5px]">
                    <Sparkles size={14} className="mt-0.5 shrink-0 text-violet" />
                    <span className="text-ink-2">
                      <span className="font-semibold text-ink">Suggests “{titleCase(advice.data.suggested_action)}”.</span>{' '}
                      {advice.data.rationale}
                      <span className="ml-1 font-mono text-[10px] text-ink-3">
                        {advice.data.engine === 'rules' ? 'rule engine' : advice.data.engine}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <Button
                      key={a.action}
                      variant={pending?.action === a.action ? tone(a) : 'secondary'}
                      size="sm"
                      onClick={() => setPending(a)}
                      aria-pressed={pending?.action === a.action}
                      className={clsx(advice.data?.suggested_action === a.action && 'ring-2 ring-violet/50')}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
                {pending && (
                  <form
                    className="mt-3 flex flex-col gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (remark.trim().length < 3) return;
                      t.mutate(pending);
                    }}
                  >
                    <Field label={`Remark for “${pending.label}” (required)`} htmlFor="tr-remark">
                      <Textarea id="tr-remark" required minLength={3} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Recorded in the audit log and shown to the applicant" />
                    </Field>
                    <div className="flex gap-2">
                      <Button type="submit" variant={tone(pending)} loading={t.isPending} disabled={remark.trim().length < 3}>Confirm · {pending.label}</Button>
                      <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
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
