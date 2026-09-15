import { Link, Outlet } from '@tanstack/react-router';
import { ArrowRight, FileSearch, ListChecks, MapPinned, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/lib/auth';

export function CitizenLayout() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <Outlet />
    </div>
  );
}

const SECONDARY_ACTIONS = [
  { to: '/citizen/verify', label: 'Verify ownership', body: 'Check whether a name matches the record of rights and latest registered deed.', icon: ShieldCheck },
  { to: '/citizen/request', label: 'Land services', body: 'Apply for a mutation or a building permission with an instant planning pre-check.', icon: FileSearch },
  { to: '/citizen/track', label: 'Track application', body: 'Follow requests through each department step.', icon: ListChecks },
] as const;

export function CitizenHome() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      
      {/* TENREC / Platform context & "What do you want to do?" */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          {user ? `Namaste, ${user.name.split(' ')[0]}` : 'TENREC Platform'}
        </h1>
        <p className="text-[17px] text-ink-2">What do you want to do with land?</p>
      </div>

      {/* Primary Action: FIND LAND */}
      <section aria-labelledby="primary-action-heading">
        <h2 id="primary-action-heading" className="sr-only">Primary Action</h2>
        <Link to="/map" className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <Card className="relative overflow-hidden border-2 border-primary/20 bg-primary-soft/10 p-6 sm:p-8 transition-colors group-hover:border-primary/40 group-hover:bg-primary-soft/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-ink shadow-md">
                  <MapPinned size={24} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-ink">Find Land</h3>
                  <p className="mt-1 text-[15px] text-ink-2">Search and explore a land parcel by survey number, ULPIN, or khata.</p>
                </div>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-ink shadow-sm transition-transform group-hover:scale-105">
                  Open Map <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </Card>
        </Link>
      </section>

      {/* Secondary Actions */}
      <section aria-labelledby="secondary-actions-heading">
        <h2 id="secondary-actions-heading" className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-3">
          Other Services
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {SECONDARY_ACTIONS.map((c) => (
            <Link key={c.to} to={c.to} className="group rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <Card className="flex h-full flex-col p-5 transition-colors group-hover:border-primary/50">
                <span className="mb-3 grid size-10 shrink-0 place-items-center rounded-lg bg-ground-2 text-ink-2 transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                  <c.icon size={20} />
                </span>
                <h3 className="flex items-center justify-between text-base font-semibold text-ink">
                  {c.label}
                  <ArrowRight size={14} className="text-ink-3 opacity-0 transition-all group-hover:translate-x-1 group-hover:text-primary group-hover:opacity-100" />
                </h3>
                <p className="mt-1.5 text-[13px] text-ink-2">{c.body}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Small Product Context */}
      <section aria-labelledby="context-heading" className="mt-4 flex flex-col gap-4 rounded-xl border border-line bg-panel-2 p-6 sm:flex-row sm:items-start sm:gap-6">
        <div className="shrink-0 text-primary">
          <MapIcon size={32} strokeWidth={1.5} />
        </div>
        <div>
          <h2 id="context-heading" className="text-base font-semibold text-ink">One parcel. One identity. Connected records.</h2>
          <p className="mt-1.5 text-sm text-ink-2 leading-relaxed">
            TENREC connects relevant land records through a unified parcel-centric experience. Every profile section shows which department it came from and when, ensuring provenance is always preserved.
          </p>
        </div>
      </section>

      {/* State Context */}
      <section aria-labelledby="state-context-heading" className="border-t border-line pt-6">
        <h2 id="state-context-heading" className="sr-only">State Context</h2>
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-primary" aria-hidden />
            <span className="font-medium text-ink">Mangalagiri, Andhra Pradesh</span>
          </div>
          <span className="text-ink-3">Currently viewing pilot region</span>
        </div>
      </section>

    </div>
  );
}
