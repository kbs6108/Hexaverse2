import { Link, Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileSearch, ListChecks, MapPinned, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/Card';
import { api, qk } from '@/lib/api';
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
  { to: '/citizen/request', label: 'Request a service', body: 'Apply for a mutation or a building permission with an instant planning pre-check.', icon: FileSearch },
] as const;

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
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-xs text-ink-3">
        Owner names are shown masked unless you are the owner or hold a consent token. Every profile section shows which department it came from and when.
      </p>
    </>
  );
}
