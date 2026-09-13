import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { api, qk } from '@/lib/api';
import type { NextAction } from '@/lib/cdm';
import { Drawer } from '@/components/Drawer';
import { Button } from '@/components/Button';
import { Field, Textarea } from '@/components/Field';
import { Loading } from '@/components/Spinner';
import { ErrorNote } from '@/components/EmptyState';
import { KV, SectionTitle } from '@/components/Section';
import { toast } from '@/components/Toast';
import { StatusBadge, StatusTimeline } from './ApplicationBits';
import { fmtDate, titleCase } from '@/lib/format';
import { statusChips } from '@/components/StatusChip';
import { useAuth } from '@/lib/auth';

/** Fallback when the API does not include `next_actions` (CONTRACTS §8 transitions). */
function fallbackActions(type: string, status: string): NextAction[] {
  const mk = (pairs: [string, string][]): NextAction[] => pairs.map(([to, label]) => ({ action: to, label, to_status: to, is_terminal: ['approved', 'rejected', 'resolved'].includes(to) }));
  if (type === 'mutation') {
    if (status === 'submitted') return mk([['document_check', 'Start document check']]);
    if (status === 'document_check') return mk([['field_verification', 'Send for field verification'], ['returned', 'Return to applicant']]);
    if (status === 'field_verification') return mk([['approved', 'Approve'], ['returned', 'Return'], ['rejected', 'Reject']]);
  }
  if (type === 'building_permission') {
    if (status === 'submitted') return mk([['planning_check', 'Run planning check']]);
    if (status === 'planning_check') return mk([['site_inspection', 'Schedule site inspection'], ['rejected', 'Reject']]);
    if (status === 'site_inspection') return mk([['approved', 'Approve'], ['rejected', 'Reject']]);
  }
  if (type === 'field_review') {
    if (status === 'open') return mk([['assigned', 'Assign']]);
    if (status === 'assigned') return mk([['resolved', 'Resolve']]);
  }
  return [];
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
              <SectionTitle right={<Link to="/" search={{ ulpin: app.ulpin }} className="flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline">Open on map <ExternalLink size={12} /></Link>}>Parcel</SectionTitle>
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
              {app.payload.precheck !== undefined && app.payload.precheck !== null && (
                <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-ground-2 p-2 font-mono text-[11px] text-ink-2">{JSON.stringify(app.payload.precheck, null, 2)}</pre>
              )}
            </div>

            <div>
              <SectionTitle>History</SectionTitle>
              <StatusTimeline app={app} />
            </div>

            {actions.length > 0 && (
              <div className="rounded-lg border border-line bg-panel-2 p-3">
                <SectionTitle>Next action</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <Button key={a.action} variant={pending?.action === a.action ? tone(a) : 'secondary'} size="sm" onClick={() => setPending(a)} aria-pressed={pending?.action === a.action}>
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
