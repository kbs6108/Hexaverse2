import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import { ArrowLeft, Building2, HelpCircle, Map as MapIcon, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { roleAtLeast } from '@/lib/auth';
import { SearchBox } from '@/features/map/SearchBox';
import { UserMenu } from '@/features/auth/UserMenu';
import { QuickNav } from '@/components/QuickNav';
import { GovBadge } from '@/features/marketing/GovStrip';
import type { Role } from '@/lib/cdm';

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="7" fill="var(--primary)" />
      <path d="M7 21 16 8l9 13H7z" fill="none" stroke="var(--primary-ink)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M11 21l5-8 5 8" fill="none" stroke="var(--primary-ink)" strokeWidth="1.4" opacity=".7" />
    </svg>
  );
}

const NAV: { to: string; label: string; icon: typeof MapIcon; min: Role }[] = [
  { to: '/map', label: 'Map', icon: MapIcon, min: 'citizen' },
  { to: '/citizen', label: 'Citizen', icon: Users, min: 'citizen' },
  { to: '/officer', label: 'Officer', icon: Building2, min: 'officer' },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, min: 'admin' },
];

/** Quiet "you are here" label shown next to the wordmark. */
function routeLabel(pathname: string): string | null {
  if (pathname.startsWith('/map')) return 'Map Explorer';
  if (pathname.startsWith('/citizen')) return 'Citizen services';
  if (pathname.startsWith('/officer')) return 'Officer console';
  if (pathname.startsWith('/admin')) return 'Admin console';
  if (pathname === '/welcome') return 'Overview';
  if (pathname === '/help') return 'Guide';
  if (pathname === '/login') return 'Sign in';
  if (pathname.startsWith('/verify/')) return 'Report verification';
  return null;
}

/** Re-triggers a subtle fade on the content area on every route change (no remount). */
function useRouteFade(pathname: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('route-fade');
    void el.offsetWidth; // restart the animation
    el.classList.add('route-fade');
  }, [pathname]);
  return ref;
}

export function Shell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();
  const minimal = pathname.startsWith('/verify/') || pathname === '/login' || pathname === '/welcome' || pathname === '/help';
  const isMap = pathname === '/map';
  const label = routeLabel(pathname);
  const mainRef = useRouteFade(pathname);

  // The cinematic landing at `/` renders full-bleed without app chrome.
  // scroll-smooth keeps dock anchor jumps gentle (scoped here so app-side
  // scrolling is untouched).
  if (pathname === '/') {
    return (
      <>
        <main ref={mainRef} className="h-full overflow-y-auto scroll-smooth">
          <Outlet />
        </main>
        <QuickNav />
      </>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="z-30 flex h-12 shrink-0 items-center gap-3 border-b border-line bg-panel px-3">
        <Link
          to="/"
          className="flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink"
          title="Back to landing"
          aria-label="Back to landing"
        >
          <ArrowLeft size={17} />
        </Link>
        <Link to="/" className="flex items-center gap-2 rounded-md pr-2 text-ink hover:opacity-90" aria-label="Land Stack home">
          <LogoMark />
          <span className="font-display text-[17px] font-semibold tracking-tight">Land Stack</span>
          <span className="hidden rounded-sm border border-line px-1 font-mono text-[10px] uppercase text-ink-3 lg:inline">Mangalagiri AOI</span>
        </Link>
        {label && (
          <span className="hidden items-center gap-1.5 text-[12px] text-ink-3 sm:flex" aria-current="page">
            <span aria-hidden>/</span> {label}
          </span>
        )}
        {!minimal && (
          <div className="mx-auto w-full max-w-xl">
            <SearchBox />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <GovBadge className="mr-0.5" />
          {!minimal && (
            <Link
              to="/help"
              title="Help & guide"
              aria-label="Help & guide"
              className="flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-ground-2 hover:text-ink"
            >
              <HelpCircle size={18} />
            </Link>
          )}
          <UserMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {!minimal && (
          <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-line bg-panel py-2">
            {NAV.filter((n) => roleAtLeast(role, n.min)).map((n) => {
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'flex w-14 flex-col items-center gap-0.5 rounded-md px-1 py-2 text-[11px] font-medium transition-colors',
                    active ? 'bg-primary-soft text-primary' : 'text-ink-3 hover:bg-ground-2 hover:text-ink',
                  )}
                >
                  <n.icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
        <main ref={mainRef} className={clsx('relative min-w-0 flex-1', isMap ? 'overflow-hidden' : 'overflow-y-auto scroll-thin scroll-smooth')}>
          <Outlet />
        </main>
      </div>
      <QuickNav />
    </div>
  );
}
