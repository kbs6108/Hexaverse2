import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Spinner } from '@/components/Spinner';

/** Button that plays a short transition, then navigates to the map.
 *  Instead of covering the screen, it strongly blurs the current page and shows
 *  a small centred loader — so it reads as "this page is loading", not as a new
 *  screen. The destination (/map) renders un-blurred once we navigate. */
export function MapLaunch({ ulpin, className, children }: { ulpin?: string; className?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [launching, setLaunching] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const launch = () => {
    if (launching) return;
    setLaunching(true);
    timer.current = window.setTimeout(() => {
      void navigate({ to: '/map', search: ulpin ? { ulpin } : {} });
    }, 850);
  };

  return (
    <>
      <button type="button" onClick={launch} className={className}>
        {children}
      </button>
      {launching && (
        <div
          className="map-launch-overlay fixed inset-0 z-[10000] flex items-center justify-center bg-ground/40"
          role="status"
          aria-live="polite"
          style={{ backdropFilter: 'blur(24px) saturate(1.08)', WebkitBackdropFilter: 'blur(24px) saturate(1.08)' }}
        >
          <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-line bg-panel/85 px-6 py-4 shadow-panel">
            <div className="flex items-center gap-2.5">
              <Spinner size={16} className="text-primary" />
              <span className="text-[13px] font-medium text-ink">Opening the live map…</span>
            </div>
            <div className="h-0.5 w-40 overflow-hidden rounded-full bg-line">
              <div className="h-full w-1/3 rounded-full bg-primary animate-[launch-bar_900ms_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
