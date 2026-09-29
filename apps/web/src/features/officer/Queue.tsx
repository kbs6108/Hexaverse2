import { memo, useMemo, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { ChevronRight, BookOpen, Scale } from 'lucide-react';
import { api, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Application } from '@/lib/cdm';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Field, Input, Select } from '@/components/Field';
import { Loading } from '@/components/Spinner';
import { EmptyState, ErrorNote } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { quickAdvanceAction, StatusBadge } from './ApplicationBits';
import { ApplicationDetail } from './ApplicationDetail';
import { fmtDate, relTime, titleCase } from '@/lib/format';
import { PageTitle } from '@/features/citizen/CitizenHome';
import { MechanismExplainerModal } from '@/components/MechanismExplainerModal';
import { useTranslation } from '@/lib/i18n';

const TYPES = [
  'mutation',
  'succession',
  'record_correction',
  'building_permission',
  'boundary_correction',
  'utility_request',
  'acquisition_claim',
  'land_complaint',
  'field_review',
  'ownership_verification',
];
const DEPTS = ['revenue', 'registration', 'planning', 'utilities', 'survey'];

/** One queue row, memoized */
const QueueRow = memo(
  function QueueRow({ a, selected, quickPending, onOpen, onQuick, userDesignation, isAdmin }: {
    a: Application;
    selected: boolean;
    quickPending: boolean;
    onOpen: (a: Application | null) => void;
    onQuick: (a: Application, action: string) => void;
    userDesignation?: string | null;
    isAdmin: boolean;
  }) {
    const next = quickAdvanceAction(a);
    const isNextAllowed = isAdmin || (Boolean(next?.allowed_designation) && Boolean(userDesignation) && userDesignation!.toLowerCase() === next!.allowed_designation!.toLowerCase());

    return (
      <tr
        tabIndex={0}
        onClick={() => onOpen(a)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(a))}
        className={clsx('cursor-pointer border-t border-line hover:bg-ground-2 focus-visible:bg-ground-2', selected && 'bg-primary-soft/50')}
      >
        <td className="px-3 py-2 font-mono text-[13px]">{a.id}</td>
        <td className="px-3 py-2">{titleCase(a.type)}{(a.payload as { system_initiated?: boolean }).system_initiated && <span className="ml-1 rounded bg-violet-soft px-1 text-[10px] text-violet">system</span>}</td>
        <td className="px-3 py-2">
          <Link to="/map" search={{ ulpin: a.ulpin }} onClick={(e) => e.stopPropagation()} className="text-primary underline-offset-2 hover:underline">{a.survey_no ? `Sy. ${a.survey_no}` : a.ulpin}</Link>
        </td>
        <td className="px-3 py-2">{a.applicant_name ?? '—'}</td>
        <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
        <td className="px-3 py-2 text-ink-2">{titleCase(a.assigned_department)}</td>
        <td className="px-3 py-2 text-ink-3" title={fmtDate(a.created_at, true)}>{relTime(a.created_at)}</td>
        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
          {next && isNextAllowed ? (
            <Button size="sm" icon={<ChevronRight size={13} />} loading={quickPending} onClick={() => onQuick(a, next.action)}>
              {next.label}
            </Button>
          ) : next?.allowed_designation ? (
            <span className="inline-flex items-center gap-1 rounded bg-amber/10 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
              Awaiting {next.allowed_designation.toUpperCase()}
            </span>
          ) : (
            <span className="text-xs text-ink-3">open to decide</span>
          )}
        </td>
      </tr>
    );
  },
  (prev, next) =>
    prev.a.id === next.a.id &&
    prev.a.status === next.a.status &&
    prev.a.updated_at === next.a.updated_at &&
    prev.selected === next.selected &&
    prev.userDesignation === next.userDesignation &&
    prev.isAdmin === next.isAdmin &&
    prev.quickPending === next.quickPending,
);

export function QueuePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const search = useSearch({ from: '/officer/queue' });
  const navigate = useNavigate();
  const department = search.department ?? (user?.role === 'officer' ? user.department ?? '' : '');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [text, setText] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);

  const q = useQuery({ queryKey: qk.queue(department), queryFn: () => api.queue(department || undefined), refetchInterval: 20_000 });
  const qc = useQueryClient();

  const quick = useMutation({
    mutationFn: ({ app, action }: { app: Application; action: string }) =>
      api.transition(app.id, action, 'Advanced from the work queue'),
    onSuccess: (app) => {
      toast.success(`Moved to ${titleCase(app.status)}`, app.id);
      void qc.invalidateQueries({ queryKey: ['queue'] });
      void qc.invalidateQueries({ queryKey: qk.stats() });
    },
    onError: (e: Error) => toast.error('Quick action failed', e.message),
  });

  const rows = useMemo(() => {
    const term = text.trim().toLowerCase();
    return (q.data ?? []).filter(
      (a) => (!type || a.type === type) && (!status || a.status === status) && (!term || a.id.toLowerCase().includes(term) || a.ulpin.toLowerCase().includes(term) || (a.applicant_name ?? '').toLowerCase().includes(term) || (a.survey_no ?? '').toLowerCase().includes(term)),
    );
  }, [q.data, type, status, text]);
  const statuses = useMemo(() => Array.from(new Set((q.data ?? []).map((a) => a.status))).sort(), [q.data]);

  const setDept = (d: string) => void navigate({ to: '/officer/queue', search: { ...(d ? { department: d } : {}), ...(search.app ? { app: search.app } : {}) } });
  const openApp = (a: Application | null) => void navigate({ to: '/officer/queue', search: { ...(department ? { department } : {}), ...(a ? { app: a.id } : {}) } });

  return (
    <>
      <PageTitle
        title={t('officer.queueTitle')}
        subtitle={t('officer.queueSubtitle')}
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={<BookOpen size={14} className="text-primary" />}
            onClick={() => setGuideOpen(true)}
          >
            How mechanisms work
          </Button>
        }
      />
      <MechanismExplainerModal open={guideOpen} onClose={() => setGuideOpen(false)} initialTab="registration" />

      {/* Statutory Desk Guidance Banner */}
      <div className="mb-4 rounded-2xl border border-line bg-panel p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Scale size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-ink text-sm">Stage-Gated Statutory Work Queue</span>
              <span className="font-mono text-[10px] text-primary uppercase font-bold bg-primary-soft px-1.5 py-0.5 rounded border border-primary/20">
                ROR Act 1971 / 2020 §5
              </span>
            </div>
            <p className="text-[11.5px] text-ink-3 mt-0.5 leading-relaxed">
              Statutory duties are sequentially separated (VRO Panchanama → Mandal Surveyor FMB → Revenue Inspector Scrutiny → Tahsildar Speaking Order). Quick advances are active when signed in with matching desk designation.
            </p>
          </div>
        </div>
      </div>
      <Card className="mb-3 flex flex-wrap items-end gap-3 p-3">
        <Field label={t('account.department')} htmlFor="q-dept" className="w-44">
          <Select id="q-dept" value={department} onChange={(e) => setDept(e.target.value)} disabled={user?.role === 'officer'}>
            <option value="">All departments</option>
            {DEPTS.map((d) => <option key={d} value={d}>{titleCase(d)}</option>)}
          </Select>
        </Field>
        <Field label={t('officer.colType')} htmlFor="q-type" className="w-48">
          <Select id="q-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{t('officer.filterAll')}</option>
            {TYPES.map((it) => <option key={it} value={it}>{titleCase(it)}</option>)}
          </Select>
        </Field>
        <Field label={t('officer.colStatus')} htmlFor="q-status" className="w-44">
          <Select id="q-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('officer.filterAll')}</option>
            {statuses.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </Field>
        <Field label={t('common.search')} htmlFor="q-text" className="min-w-56 flex-1">
          <Input id="q-text" placeholder={t('officer.searchQueue')} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <span className="pb-2 text-xs text-ink-3">{rows.length} of {q.data?.length ?? 0}</span>
      </Card>

      <Card className="overflow-hidden">
        {q.isLoading && <Loading />}
        {q.isError && <div className="p-4"><ErrorNote error={q.error} retry={() => void q.refetch()} /></div>}
        {q.data && rows.length === 0 && <EmptyState className="m-4" title="Queue is clear" body="No applications match the current filters." />}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ground-2 text-left text-[11px] uppercase tracking-wide text-ink-3">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('officer.colId')}</th>
                  <th className="px-3 py-2 font-medium">{t('officer.colType')}</th>
                  <th className="px-3 py-2 font-medium">{t('officer.colParcel')}</th>
                  <th className="px-3 py-2 font-medium">{t('officer.colApplicant')}</th>
                  <th className="px-3 py-2 font-medium">{t('officer.colStatus')}</th>
                  <th className="px-3 py-2 font-medium">{t('officer.colDept')}</th>
                  <th className="px-3 py-2 font-medium">{t('officer.colCreated')}</th>
                  <th className="px-3 py-2 font-medium">{t('officer.colAction')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <QueueRow
                    key={a.id}
                    a={a}
                    selected={a.id === search.app}
                    quickPending={quick.isPending && quick.variables?.app.id === a.id}
                    onOpen={openApp}
                    onQuick={(app, action) => quick.mutate({ app, action })}
                    userDesignation={user?.designation}
                    isAdmin={user?.role === 'admin'}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ApplicationDetail id={search.app ?? null} onClose={() => openApp(null)} />
    </>
  );
}
