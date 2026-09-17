import { Outlet, useRouterState } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { AccountPanel } from '@/features/auth/AccountPanel';
import { GradientBackground } from '@/components/ui/paper-shader-bg';
import { FloatingDock } from '@/components/ui/floating-dock';

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="7" fill="var(--primary)" />
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
  const mainRef = useRouteFade(pathname);

  const [accountOpen, setAccountOpen] = useState(false);

  const isCitizenHome = pathname === '/citizen' || pathname === '/citizen/';

  // The cinematic landing at `/` and `/login` and CitizenHome render without app chrome.
  if (pathname === '/' || pathname === '/login' || isCitizenHome) {
    return (
      <>
        {pathname !== '/' && <GradientBackground />}
        <main ref={mainRef} className="w-full min-h-screen flex-1 overflow-y-auto scroll-smooth left-0 ml-0">
          <Outlet />
        </main>
      </>
    );
  }

  return (
    <>
      <GradientBackground />
      <div className="flex h-full min-h-0 flex-col relative z-10 bg-transparent w-full left-0 ml-0">
        {/* Floating Limelight Dock Header */}
        <FloatingDock onOpenAccount={() => setAccountOpen(true)} />

        {/* Right-Side Half-Screen Account Panel */}
        <AccountPanel isOpen={accountOpen} onClose={() => setAccountOpen(false)} />

        {/* Main Content Area */}
        <div className="flex min-h-0 flex-1 w-full left-0 ml-0">
          <main
            ref={mainRef}
            className={clsx(
              'relative w-full flex-1 left-0 ml-0',
              isMap ? 'overflow-hidden' : 'pt-24 overflow-y-auto scroll-thin scroll-smooth',
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
