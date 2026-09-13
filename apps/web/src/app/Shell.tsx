import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { Building2, Landmark, Map as MapIcon, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { roleAtLeast } from '@/lib/auth';
import { SearchBox } from '@/features/map/SearchBox';
import { UserMenu } from '@/features/auth/UserMenu';
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
  { to: '/', label: 'Overview', icon: Landmark, min: 'citizen' },
  { to: '/map', label: 'GIS Map', icon: MapIcon, min: 'citizen' },
  { to: '/citizen', label: 'Citizen', icon: Users, min: 'citizen' },
  { to: '/officer', label: 'Officer', icon: Building2, min: 'officer' },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, min: 'admin' },
];

export function Shell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();
  const minimal = pathname.startsWith('/verify/') || pathname === '/login';
  const isMap = pathname === '/';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="h-1 w-full flex shrink-0">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>
      <header className="z-30 flex h-12 shrink-0 items-center gap-3 border-b border-line bg-panel px-3">
        <Link to="/" className="flex items-center gap-2.5 rounded-md pr-2 text-ink hover:opacity-90" aria-label="Tenrec home">
          <LogoMark />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display text-[16px] font-bold tracking-tight text-ink">Tenrec</span>
              <span className="rounded-xs bg-primary-soft px-1 py-0.5 text-[8px] font-semibold text-primary uppercase">DoLR · SIH 2026</span>
            </div>
            <span className="text-[9px] text-ink-3 font-medium leading-tight">Govt. of India</span>
          </div>
        </Link>
        {!minimal && (
          <div className="mx-auto w-full max-w-xl">
            <SearchBox />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <UserMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {!minimal && (
          <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-line bg-panel py-2">
            {NAV.filter((n) => roleAtLeast(role, n.min)).map((n) => {
              const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to);
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
        <main className={clsx('relative min-w-0 flex-1', isMap ? 'overflow-hidden' : 'overflow-y-auto scroll-thin ground-texture')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
