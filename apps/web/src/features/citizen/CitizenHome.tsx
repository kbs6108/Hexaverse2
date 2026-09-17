import { useState } from 'react';
import { Link, Outlet } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, FileSearch, ListChecks, MapPinned, Megaphone, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Field';
import { toast } from '@/components/Toast';
import { api, qk, ApiError } from '@/lib/api';
import type { Notice } from '@/lib/cdm';
import { useAuth } from '@/lib/auth';
import { StatusBadge } from '@/features/officer/ApplicationBits';
import { relTime, titleCase } from '@/lib/format';

export function CitizenLayout() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-6">
      <Outlet />
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const CARDS = [
  { to: '/map', label: 'Search parcel', body: 'Find a parcel by survey number, ULPIN or khata and see its aggregated profile on the map.', icon: MapPinned },
  { to: '/citizen/verify', label: 'Verify ownership', body: 'Check whether a name matches the record of rights and latest registered deed — without exposing the owner.', icon: ShieldCheck },
  { to: '/citizen/track', label: 'Track application', body: 'Follow mutation, building-permission and verification requests through each department step.', icon: ListChecks },
  { to: '/citizen/request', label: 'Apply', body: 'Transfer ownership, fix a record mistake, seek building permission or raise a complaint — checked against the record before you submit.', icon: FileSearch },
] as const;

const NOTICE_LABEL: Record<string, string> = {
  mutation: 'Ownership transfer',
  succession: 'Succession',
  boundary_correction: 'Boundary correction',
};

/** Village notice board — the statutory board outside the tahsildar office, on the home page.
 *  Pending transfers of rights are published for objection while their window is open. */
function NoticeBoard() {
  const q = useQuery({ queryKey: qk.notices(''), queryFn: () => api.notices(), staleTime: 60_000 });
  const items = q.data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <Card className="mt-4 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Megaphone size={15} className="text-ink-3" />
        <h2 className="text-sm font-semibold">Public notices</h2>
        <span className="text-xs text-ink-3">· pending transfers of rights, open for objection for {q.data?.window_days} days</span>
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.slice(0, 6).map((n) => <NoticeRow key={n.id} n={n} />)}
      </ul>
    </Card>
  );
}

function NoticeRow({ n }: { n: Notice }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const m = useMutation({
    mutationFn: () => api.fileObjection(n.id, reason.trim()),
    onSuccess: (r) => {
      toast.success('Objection recorded', `${r.objection_count} objection(s) on ${n.id}`);
      setOpen(false);
      setReason('');
      void qc.invalidateQueries({ queryKey: ['notices'] });
    },
    onError: (e) => toast.error('Could not record objection', e instanceof ApiError ? e.message : String(e)),
  });
  return (
    <li className="rounded-md border border-line px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{NOTICE_LABEL[n.type] ?? titleCase(n.type)}</span>
        <span className="text-ink-2">Sy. No. {n.survey_no ?? '—'} · {n.village ?? '—'}</span>
        <span className="ml-auto text-xs text-ink-3">
          {n.days_left} day{n.days_left === 1 ? '' : 's'} left{n.objection_count > 0 ? ` · ${n.objection_count} objection(s)` : ''}
        </span>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Cancel' : 'Object'}
        </Button>
      </div>
      {open && (
        <form
          className="mt-2 flex flex-col gap-2"
          onSubmit={(e) => { e.preventDefault(); if (reason.trim().length >= 10) m.mutate(); }}
        >
          <Textarea rows={2} required minLength={10} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Why do you object? (at least 10 characters — recorded with your name and shown to the deciding officer)" />
          <Button type="submit" size="sm" variant="primary" loading={m.isPending} disabled={reason.trim().length < 10} className="self-start">
            Submit objection
          </Button>
        </form>
      )}
    </li>
  );
}

export function CitizenHome() {
  const { user } = useAuth();
  const mine = useQuery({
    queryKey: qk.myApplications(user?.uid ?? 'anon'),
    queryFn: api.myApplications,
    enabled: !!user,
    staleTime: 30_000,
  });
  return (
    <>
      <PageTitle title={`Namaste${user ? `, ${user.name.split(' ')[0]}` : ''}`} subtitle="Citizen services across the demo regions (AP · TN · TG)" />
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.to} to={c.to} className="group rounded-lg focus-visible:outline-2">
            <Card className="h-full p-5 transition-colors group-hover:border-primary">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><c.icon size={22} /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="flex items-center gap-1 text-[17px] font-semibold">
                    {c.label} <ArrowRight size={16} className="text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </h2>
                  <p className="mt-1 text-sm text-ink-2">{c.body}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      {mine.data && mine.data.length > 0 && (
        <Card className="mt-4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Your applications</h2>
            <Link to="/citizen/track" className="text-xs font-medium text-primary underline-offset-2 hover:underline">View all</Link>
          </div>
          <ul className="flex flex-col gap-1.5">
            {mine.data.slice(0, 4).map((a) => (
              <li key={a.id}>
                <Link to="/citizen/track/$id" params={{ id: a.id }} className="flex flex-wrap items-center gap-2 rounded-md border border-line px-3 py-2 text-sm transition-colors hover:border-primary">
                  <span className="font-mono text-[12.5px]">{a.id}</span>
                  <span className="text-ink-2">{titleCase(a.type)}</span>
                  <StatusBadge status={a.status} />
                  <span className="ml-auto text-xs text-ink-3">{relTime(a.updated_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <NoticeBoard />
      <p className="mt-8 text-xs text-ink-3">
        Owner names are shown masked unless you are the owner or hold a consent token. Every profile section shows which department it came from and when.
      </p>
    </>
  );
}
