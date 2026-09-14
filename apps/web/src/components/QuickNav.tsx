import { Link, useRouter, useRouterState } from '@tanstack/react-router';
import { clsx } from 'clsx';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Compass,
  HelpCircle,
  Home,
  LogIn,
  Map as MapIcon,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { roleAtLeast, useAuth } from '@/lib/auth';
import type { Role } from '@/lib/cdm';

const PAGES: { to: string; label: string; hint: string; icon: typeof MapIcon; min?: Role }[] = [
  { to: '/', label: 'Home', hint: 'Cinematic landing', icon: Home },
  { to: '/map', label: 'Map Explorer', hint: 'The live parcel map', icon: MapIcon },
  { to: '/welcome', label: 'Overview', hint: 'What Land Stack is', icon: BookOpen },
  { to: '/help', label: 'Guide', hint: 'How to drive the demo', icon: HelpCircle },
  { to: '/citizen', label: 'Citizen services', hint: 'Search · verify · track', icon: Users, min: 'citizen' },
  { to: '/officer', label: 'Officer console', hint: 'Queue · alerts · KPIs', icon: Building2, min: 'officer' },
  { to: '/admin', label: 'Admin console', hint: 'Connectors · adapters', icon: ShieldCheck, min: 'admin' },
  { to: '/login', label: 'Sign in', hint: 'Switch account', icon: LogIn },
];

/** Global quick navigation: a slim handle on the left edge that toggles a panel
 *  of every page on CLICK (no hover-open — deliberate, it got in the way).
 *  Esc, the X button, or navigating closes it. */
export function QuickNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const closeNow = () => setOpen(false);

  const isCurrent = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <div className="fixed left-0 top-1/2 z-[9990] -translate-y-1/2">
      {/* Handle — the only thing visible by default */}
      <button
        type="button"
        aria-expanded={open}
        aria-label="All pages"
        title="All pages"
        onClick={() => (open ? closeNow() : setOpen(true))}
        className={clsx(
          'absolute left-0 top-1/2 flex h-16 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-line bg-panel text-ink-3 shadow-panel transition-all duration-200 hover:w-7 hover:text-primary',
          open && 'pointer-events-none opacity-0',
        )}
      >
        <Compass size={15} />
      </button>

      {/* Panel */}
      <div
        role="navigation"
        aria-label="Quick navigation"
        aria-hidden={!open}
        className={clsx(
          'w-64 rounded-r-xl border border-l-0 border-line bg-panel shadow-panel transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'pointer-events-none -translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">All pages</p>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => router.history.back()}
              title="Back"
              aria-label="Go back"
              className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink"
            >
              <ArrowLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => router.history.forward()}
              title="Forward"
              aria-label="Go forward"
              className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink"
            >
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onClick={closeNow}
              title="Close"
              aria-label="Close quick navigation"
              className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink"
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <ul className="flex flex-col gap-0.5 p-2">
          {PAGES.filter((p) => !p.min || roleAtLeast(role, p.min)).map((p) => {
            const current = isCurrent(p.to);
            return (
              <li key={p.to}>
                <Link
                  to={p.to}
                  onClick={closeNow}
                  aria-current={current ? 'page' : undefined}
                  className={clsx(
                    'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
                    current ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:bg-ground-2 hover:text-ink',
                  )}
                >
                  <p.icon size={17} strokeWidth={current ? 2.2 : 1.8} className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium leading-tight">{p.label}</span>
                    <span className={clsx('block text-[11px] leading-tight', current ? 'text-primary/70' : 'text-ink-3')}>{p.hint}</span>
                  </span>
                  {current && <span aria-hidden className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
