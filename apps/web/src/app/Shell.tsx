import { Outlet, useRouterState } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { FloatingDock } from '@/components/ui/FloatingDock';
import { AccountPanel } from '@/features/auth/AccountPanel';

// Bhu-Sahayak loads only when the app chrome renders for a signed-in user.
const Assistant = lazy(() => import('@/features/assistant/Assistant'));

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <path d="M7 21 16 8l9 13H7z" fill="none" stroke="var(--primary-ink)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M11 21l5-8 5 8" fill="none" stroke="var(--primary-ink)" strokeWidth="1.4" opacity=".7" />
    </svg>
  );
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
    const onEnd = () => el.classList.remove('route-fade');
    el.addEventListener('animationend', onEnd, { once: true });
    return () => el.removeEventListener('animationend', onEnd);
  }, [pathname]);
  return ref;
}

export function Shell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMap = pathname === '/map';
  const minimal = pathname.startsWith('/verify/') || pathname === '/login' || pathname === '/welcome';
  const mainRef = useRouteFade(pathname);
  const [accountOpen, setAccountOpen] = useState(false);

  // The cinematic landing at `/` renders full-bleed without app chrome.
  if (pathname === '/') {
    return (
      <main className="min-h-screen w-full bg-ground">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col relative z-10 bg-ground w-full left-0 ml-0 overflow-hidden">
      {/* Floating Limelight Dock Header */}
      <FloatingDock onOpenAccount={() => setAccountOpen(true)} />

      {/* Right-Side Half-Screen Account & Identity Panel */}
      <AccountPanel isOpen={accountOpen} onClose={() => setAccountOpen(false)} />

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 w-full left-0 ml-0 h-full">
        <main
          ref={mainRef}
          className={clsx(
            'relative w-full flex-1 left-0 ml-0',
            isMap ? 'overflow-hidden h-full' : 'pt-24 overflow-y-auto scroll-thin scroll-smooth',
          )}
        >
          <Outlet />
        </main>
      </div>

      {!minimal && (
        <Suspense fallback={null}>
          <Assistant />
        </Suspense>
      )}
    </div>
  );
}
