import { Link, Outlet } from '@tanstack/react-router';
import { ArrowRight, FileSearch, ListChecks, MapPinned, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/lib/auth';

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
  return (
    <>
      <PageTitle title={`Namaste${user ? `, ${user.name.split(' ')[0]}` : ''}`} subtitle="Citizen services for Mangalagiri revenue village" />
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
      <p className="mt-8 text-xs text-ink-3">
        Owner names are shown masked unless you are the owner or hold a consent token. Every profile section shows which department it came from and when.
      </p>
    </>
  );
}
