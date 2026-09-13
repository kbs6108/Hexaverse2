import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LogoMark } from '@/app/Shell';

/** Button that plays a short branded transition, then navigates to the map.
 *  Landing-side only — the map itself is untouched; the overlay simply covers
 *  the first moments of tile loading so entry feels intentional. */
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
        <div className="map-launch-overlay fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-5 bg-[#0d1a13]" role="status" aria-live="polite">
          <div className="map-launch-mark">
            <LogoMark size={56} />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#86EFAC]">Opening the live map…</p>
          <div className="h-px w-40 overflow-hidden rounded bg-[#86EFAC]/20">
            <div className="h-full w-1/2 animate-[launch-bar_900ms_ease-in-out_infinite] bg-[#86EFAC]" />
          </div>
        </div>
      )}
    </>
  );
}
