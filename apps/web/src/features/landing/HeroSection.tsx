import { Link } from '@tanstack/react-router';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ShaderAnimation } from './ShaderAnimation';
import { MapLaunch } from './MapLaunch';
import { GovBadge } from '@/features/marketing/GovStrip';
import { createTopDockController } from './top-dock-controller';

const DOCK_ITEM =
  'atd-modern__item inline-flex origin-center items-center rounded-xs px-3 py-1 text-xs font-semibold text-ink-2 will-change-transform hover:bg-black/5 hover:text-ink transition-colors';

/** Anchored sections the dock tracks, in page order. */
const SPY_SECTIONS = ['top', 'departments', 'how'] as const;

export function HeroSection() {
  const dockRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string>('top');

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    return createTopDockController(dock, () => ({ proximity: 140, spring: 0.22, damping: 0.55, widthGrowth: 24, heightGrowth: 24, drop: 10 }));
  }, []);

  // Scrollspy: mark the dock item whose section currently occupies mid-viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    const els = SPY_SECTIONS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Global Fixed Header Dock: Root viewport level to guarantee stacking above all cards and sections */}
      <div className="pointer-events-none fixed left-0 right-0 top-5 z-50 flex justify-center px-4">
        <header
          id="dock"
          className="atd-modern__bar pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-sm border border-line bg-panel/95 px-4 py-2 text-ink shadow-sm backdrop-blur-md"
        >
          <a href="#top" className="flex items-center gap-2 px-1 text-ink">
            <span className="size-2 rounded-xs bg-primary" />
            <span className="font-display text-sm font-bold tracking-tight">Land Stack</span>
          </a>
          <nav ref={dockRef} className="atd-modern__dock hidden items-center gap-1 rounded-xs border border-line bg-ground/80 p-0.5 md:flex" aria-label="Primary navigation">
            <a data-dock-item data-active={active === 'top'} href="#top" className={DOCK_ITEM}>Home</a>
            <a data-dock-item data-active={active === 'departments'} href="#departments" className={DOCK_ITEM}>Departments</a>
            <a data-dock-item data-active={active === 'how'} href="#how" className={DOCK_ITEM}>How it works</a>
            <Link data-dock-item to="/help" className={DOCK_ITEM}>Guide</Link>
          </nav>
          <div className="flex items-center gap-2">
            {/* Mobile quick jump options */}
            <div className="flex items-center gap-1 md:hidden">
              <Link to="/help" className="rounded-xs border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink-2">Guide</Link>
            </div>
            <MapLaunch className="shrink-0 rounded-xs bg-primary px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90 active:scale-[0.99] shadow-2xs">
              Explore Platform
            </MapLaunch>
          </div>
        </header>
      </div>

      <section className="relative isolate flex min-h-screen w-full overflow-hidden bg-ground">
        {/* Background Shader Lines animation: Living topographic contours & elevation waves */}
        <ShaderAnimation />
        {/* Subtle atmospheric veil ensuring high contrast and legibility for foreground text */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ground/25 via-ground/10 to-ground/85" />

        <div id="top" className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] items-center px-6 pb-16 pt-32 sm:px-10 lg:px-16">
        <div className="max-w-5xl">
          <GovBadge variant="landing" className="mb-5" />
          <p className="mb-6 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink-3">Digital Land Public Infrastructure</p>
          <h1 className="font-display text-[clamp(3.2rem,7.5vw,6.5rem)] font-bold leading-[0.94] tracking-[-0.04em] text-ink">
            Land, clearly
            <br />
            <span className="text-primary italic font-serif">defined.</span>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-ink-2 sm:text-lg">
            Click any parcel and see everything government knows about it — ownership, registration, zoning, tax, disputes and utilities — assembled live from six departments through one parcel key.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <MapLaunch className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.99] shadow-xs cursor-pointer">
              Open the live map <ArrowRight size={16} />
            </MapLaunch>
            <a href="#how" className="inline-flex items-center gap-2 rounded-sm border border-line bg-panel px-5 py-3 text-sm font-semibold text-ink-2 transition hover:bg-ground-2 hover:text-ink shadow-2xs">
              See how it works
            </a>
          </div>

          {/* Quick launch real demo parcels */}
          <div className="mt-10 max-w-3xl border-t border-line/70 pt-6">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-3">
              Explore georeferenced cadastre records:
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {[
                { label: 'Sy. 123/4 · Mangalagiri (AP)', tag: 'Clean Title', ulpin: 'TFCM91641E6C82' },
                { label: 'Sy. 124 · Mangalagiri (AP)', tag: 'Satellite Alert', ulpin: 'TFCM91D3533DD2' },
                { label: 'Sy. 45/2 · Sriperumbudur (TN)', tag: 'Patta Chitta', ulpin: 'TF2CEQ4ACED970' },
                { label: 'Sy. 77 · Shamshabad (TG)', tag: 'Dharani Passbook', ulpin: 'TEPDPUQC13C0D7' },
              ].map((p) => (
                <MapLaunch
                  key={p.ulpin}
                  ulpin={p.ulpin}
                  className="group flex items-center gap-2 rounded-xs border border-line bg-panel px-3 py-1.5 text-xs font-mono text-ink shadow-2xs transition-all hover:border-primary hover:bg-ground-2 cursor-pointer active:scale-98"
                >
                  <span className="size-1.5 rounded-none bg-primary" />
                  <span>{p.label}</span>
                  <span className="border-l border-line pl-2 font-mono text-[10px] font-bold uppercase text-primary">
                    {p.tag}
                  </span>
                </MapLaunch>
              ))}
            </div>
          </div>
        </div>
        <a href="#departments" className="absolute bottom-8 left-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3 sm:left-10 lg:left-16 hover:text-primary transition-colors">
          <ArrowDown size={13} className="text-primary" /> Scroll to explore
        </a>
      </div>
    </section>
    </>
  );
}
