import { useState } from 'react';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { ArrowRight, FileSearch, ListChecks, MapPin, MapPinned, Megaphone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/Button';
import { Textarea } from '@/components/Field';
import { toast } from '@/components/Toast';
import { SpotlightCard } from '@/components/SpotlightCard';
import { Marquee } from '@/components/Marquee';
import { api, qk, ApiError } from '@/lib/api';
import type { Notice } from '@/lib/cdm';
import { useAuth } from '@/lib/auth';
import { useMyParcel } from '@/lib/my-parcel';
import { StatusBadge } from '@/features/officer/ApplicationBits';
import { relTime, titleCase } from '@/lib/format';

const CITIZEN_SUBNAV = [
  { to: '/citizen', label: 'Services Overview', exact: true },
  { to: '/citizen/verify', label: 'Verify Ownership', exact: false },
  { to: '/citizen/request', label: 'Apply & Request', exact: false },
  { to: '/citizen/track', label: 'Track Application', exact: false },
] as const;

export function CitizenLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-6">
      <nav aria-label="Citizen sections" className="mb-6 flex flex-wrap gap-2 border-b border-line pb-3">
        {CITIZEN_SUBNAV.map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              search={{}}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-all shadow-xs',
                active ? 'bg-primary text-white shadow-sm' : 'border border-line bg-panel text-ink-2 hover:bg-ground-2 hover:text-ink',
              )}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const CARDS = [
  { to: '/map', label: 'Parcel Search & Explorer', body: 'Find parcels by survey number, ULPIN or khata and inspect aggregated records on the map.', icon: MapPinned },
  { to: '/citizen/verify', label: 'Verify Ownership', body: 'Compare claimed names against authoritative revenue records and deeds without exposing owner data.', icon: ShieldCheck },
  { to: '/citizen/request', label: 'Apply & Request Services', body: 'Apply for mutations, record corrections, building permissions or raise objections with AI pre-check.', icon: FileSearch },
  { to: '/citizen/track', label: 'Track Application', body: 'Follow mutation, building permission, and verification requests live through each department step.', icon: ListChecks },
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
    <div className="mt-6 rounded-2xl border border-line bg-panel p-5 shadow-panel">
      <div className="mb-3 flex items-center gap-2 border-b border-line pb-2.5">
        <Megaphone size={16} className="text-primary" />
        <h2 className="font-display text-sm font-bold text-ink">Public statutory notices</h2>
        <span className="text-xs text-ink-3">· pending transfers open for objection ({q.data?.window_days} day window)</span>
      </div>
      <ul className="flex flex-col gap-2">
        {items.slice(0, 6).map((n) => <NoticeRow key={n.id} n={n} />)}
      </ul>
    </div>
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
    <li className="rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-sm shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-ink">{NOTICE_LABEL[n.type] ?? titleCase(n.type)}</span>
        <span className="text-ink-2">Sy. No. {n.survey_no ?? '—'} · {n.village ?? '—'}</span>
        <span className="ml-auto text-xs text-ink-3 font-mono">
          {n.days_left} day{n.days_left === 1 ? '' : 's'} left{n.objection_count > 0 ? ` · ${n.objection_count} objection(s)` : ''}
        </span>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Cancel' : 'Object'}
        </Button>
      </div>
      {open && (
        <form
          className="mt-3 flex flex-col gap-2 border-t border-line pt-2"
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

const CITIZEN_SIGNALS = [
  '🟢 Andhra Pradesh Meebhoomi Gateway online',
  '🟢 Tamil Nadu Patta Chitta Gateway online',
  '🟢 Telangana Dharani Gateway online',
  '✨ AI Pre-check active on all service applications',
  '🛡️ DPDP 2023 Consent-Driven Owner Masking enforced',
  '📄 Instant Land Information Report (LIR) with Verification QR active',
  '🛰️ Sentinel-2 Satellite Land Observation Synced',
];

export function CitizenHome() {
  const { user } = useAuth();
  const { parcel, hasOwnedLand, goToMyParcel } = useMyParcel();
  const mine = useQuery({
    queryKey: qk.myApplications(user?.uid ?? 'anon'),
    queryFn: api.myApplications,
    enabled: !!user,
    staleTime: 30_000,
  });
  return (
    <>
      <PageTitle title={`Namaste${user ? `, ${user.name.split(' ')[0]}` : ''}`} subtitle="Citizen digital land governance portal (AP · TN · TG)" />

      {/* Live System Status Marquee */}
      <div className="mb-6 overflow-hidden rounded-full border border-line bg-panel py-1.5 shadow-xs">
        <Marquee duration={32} pauseOnHover={true} gap="2.5rem">
          {CITIZEN_SIGNALS.map((s, idx) => (
            <span key={idx} className="flex items-center gap-2 font-mono text-xs font-semibold text-ink-2">
              <span>{s}</span>
              <span className="text-line-strong">·</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* Registered Land Holding Card with direct "Go to My Land" */}
      {hasOwnedLand && parcel && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary-soft/50 via-panel to-panel p-5 shadow-panel flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
              <MapPin size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-base font-bold text-ink">
                  Your Land: Survey {parcel.survey_no}
                </span>
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
                  {parcel.village}, {parcel.state}
                </span>
                <span className="text-xs text-ink-3">·</span>
                <span className="font-mono text-xs text-ink-2 font-medium">
                  ULPIN: {parcel.ulpin}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-2">
                Khata <span className="font-mono font-medium text-ink">{parcel.khata_no}</span> · Extent <span className="font-medium text-ink">{parcel.area_sqm} m²</span> · {parcel.ownership_type}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => goToMyParcel()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 hover:shadow transition-all cursor-pointer"
          >
            <MapPin size={14} />
            <span>Go to My Land</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {user?.role === 'citizen' && !hasOwnedLand && (
        <div className="mb-6 rounded-2xl border border-line bg-panel p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-ink-2">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ground-2 text-ink-3">
              <MapPin size={18} />
            </span>
            <div>
              <p className="text-xs font-medium text-ink">No active land parcels currently registered under this profile</p>
              <p className="text-[11px] text-ink-3">If you recently transferred or purchased property, track your mutation application below.</p>
            </div>
          </div>
          <Link
            to="/citizen/request"
            search={{ type: 'mutation' }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-ground-2 px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary/50 transition-colors"
          >
            <span>Register Transfer</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link key={c.to} to={c.to} className="group rounded-2xl focus-visible:outline-2">
            <SpotlightCard className="flex h-full flex-col p-6 shadow-panel transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <c.icon size={22} strokeWidth={1.8} />
                </span>
                <ArrowRight size={18} className="text-ink-3 -rotate-45 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </div>
              <h2 className="mt-5 font-display text-[18px] font-bold text-ink">
                {c.label}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-ink-2">{c.body}</p>
            </SpotlightCard>
          </Link>
        ))}
      </div>
      <NoticeBoard />
      {mine.data && mine.data.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-panel p-5 shadow-panel">
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
        </div>
      )}
      <p className="mt-8 text-xs text-ink-3">
        Owner names are shown masked unless you are the owner or hold a consent token. Every profile section shows which department it came from and when.
      </p>
    </>
  );
}
