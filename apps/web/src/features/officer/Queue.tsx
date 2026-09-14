import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { api, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Application } from '@/lib/cdm';
import { Card } from '@/components/Card';
import { Field, Input, Select } from '@/components/Field';
import { Loading } from '@/components/Spinner';
import { EmptyState, ErrorNote } from '@/components/EmptyState';
import { StatusBadge } from './ApplicationBits';
import { ApplicationDetail } from './ApplicationDetail';
import { fmtDate, relTime, titleCase } from '@/lib/format';
import { PageTitle } from '@/features/citizen/CitizenHome';

const TYPES = ['mutation', 'building_permission', 'field_review', 'ownership_verification'];
const DEPTS = ['revenue', 'registration', 'planning'];

export function QueuePage() {
  const { user } = useAuth();
  const search = useSearch({ from: '/officer/queue' });
  const navigate = useNavigate();
  const department = search.department ?? (user?.role === 'officer' ? user.department ?? '' : '');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [text, setText] = useState(search.q ?? '');

  const q = useQuery({ queryKey: qk.queue(department), queryFn: () => api.queue(department || undefined), refetchInterval: 20_000 });

  const rows = useMemo(() => {
    const t = text.trim().toLowerCase();
    return (q.data ?? []).filter(
      (a) => (!type || a.type === type) && (!status || a.status === status) && (!t || a.id.toLowerCase().includes(t) || a.ulpin.toLowerCase().includes(t) || (a.applicant_name ?? '').toLowerCase().includes(t) || (a.survey_no ?? '').toLowerCase().includes(t)),
    );
  }, [q.data, type, status, text]);
  const statuses = useMemo(() => Array.from(new Set((q.data ?? []).map((a) => a.status))).sort(), [q.data]);

  const setDept = (d: string) => void navigate({ to: '/officer/queue', search: { ...(d ? { department: d } : {}), ...(search.app ? { app: search.app } : {}) } });
  const openApp = (a: Application | null) => void navigate({ to: '/officer/queue', search: { ...(department ? { department } : {}), ...(a ? { app: a.id } : {}) } });

  return (
    <>
      <PageTitle title="Work queue" subtitle="Applications awaiting action, oldest first" />
      <Card className="mb-3 flex flex-wrap items-end gap-3 p-3">
        <Field label="Department" htmlFor="q-dept" className="w-44">
          <Select id="q-dept" value={department} onChange={(e) => setDept(e.target.value)} disabled={user?.role === 'officer'}>
            <option value="">All departments</option>
            {DEPTS.map((d) => <option key={d} value={d}>{titleCase(d)}</option>)}
          </Select>
        </Field>
        <Field label="Type" htmlFor="q-type" className="w-48">
          <Select id="q-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </Select>
        </Field>
        <Field label="Status" htmlFor="q-status" className="w-44">
          <Select id="q-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            {statuses.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </Field>
        <Field label="Find" htmlFor="q-text" className="min-w-56 flex-1">
          <Input id="q-text" placeholder="Application id, ULPIN, survey no or applicant" value={text} onChange={(e) => setText(e.target.value)} />
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
                  <th className="px-3 py-2 font-medium">Application</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Parcel</th>
                  <th className="px-3 py-2 font-medium">Applicant</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Dept</th>
                  <th className="px-3 py-2 font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    tabIndex={0}
                    onClick={() => openApp(a)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openApp(a))}
                    className={clsx('cursor-pointer border-t border-line hover:bg-ground-2 focus-visible:bg-ground-2', a.id === search.app && 'bg-primary-soft/50')}
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
                  </tr>
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
