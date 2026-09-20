import { Link } from '@tanstack/react-router';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { GLSLHills } from '@/components/ui/glsl-hills';
import { MapLaunch } from './MapLaunch';
import { GovBadge } from '@/features/marketing/GovStrip';
import { BorderBeam } from '@/components/BorderBeam';
import { createTopDockController } from './top-dock-controller';

const DOCK_ITEM =
  'atd-modern__item inline-flex origin-center items-center rounded-full px-3.5 py-1.5 text-[13px] text-ink-2 will-change-transform hover:bg-black/5 hover:text-ink';

/** Anchored sections the dock tracks, in page order. */
const SPY_SECTIONS = ['top', 'departments', 'how'] as const;

export function HeroSection() {
  const dockRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string>('top');

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    return createTopDockController(dock, () => ({ proximity: 140, spring: 0.22, damping: 0.55, widthGrowth: 32, heightGrowth: 32, drop: 14 }));
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
      {/* Floating Landing Dock: Outside section so it never gets trapped by section stacking contexts */}
      <div className="pointer-events-none fixed left-0 right-0 top-5 z-[99999] flex justify-center px-4" style={{ zIndex: 99999 }}>
        <header
          id="dock"
          className="atd-modern__bar pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-line bg-panel/90 px-4 py-2 text-ink shadow-panel backdrop-blur-xl"
          style={{ zIndex: 99999 }}
        >
          <a href="#top" className="flex items-center gap-2 px-2 text-ink">
            <span className="size-2 rounded-full bg-primary" />
            <span className="font-display text-sm font-bold tracking-tight">Land Stack</span>
          </a>
          <nav ref={dockRef} className="atd-modern__dock hidden items-center gap-1 rounded-full border border-line bg-ground/80 p-1 md:flex" aria-label="Primary navigation">
            <a data-dock-item data-active={active === 'top'} href="#top" className={DOCK_ITEM}>Home</a>
            <a data-dock-item data-active={active === 'departments'} href="#departments" className={DOCK_ITEM}>Departments</a>
            <a data-dock-item data-active={active === 'how'} href="#how" className={DOCK_ITEM}>How it works</a>
            <Link data-dock-item to="/help" className={DOCK_ITEM}>Guide</Link>
          </nav>
          <div className="flex items-center gap-2">
            {/* Mobile quick jump options */}
            <div className="flex items-center gap-1 md:hidden">
              <Link to="/help" className="rounded-full border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink-2">Guide</Link>
            </div>
            <MapLaunch className="cta-glow shrink-0 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white transition hover:brightness-105 active:scale-[0.98]">
              Explore Platform
            </MapLaunch>
          </div>
        </header>
      </div>

      <section className="relative flex min-h-screen w-full overflow-hidden bg-white">
        {/* 21st.dev GLSL Hills: 3D procedural wireframe hill contours framing the hero */}
        <div className="pointer-events-none absolute inset-0 z-0 size-full">
          <GLSLHills width="100%" height="100%" cameraZ={125} speed={0.35} />
        </div>
        {/* Subtle atmospheric veil ensuring high contrast and legibility for foreground text */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ground to-transparent z-1" />

        <div id="top" className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] items-center px-6 pb-16 pt-32 sm:px-10 lg:px-16">
          <div className="max-w-5xl">
            <GovBadge variant="landing" className="mb-5" />
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-ink-3">Digital Land Public Infrastructure</p>
            <h1 className="font-display text-[clamp(3.4rem,8vw,7.2rem)] font-bold leading-[0.92] tracking-[-0.05em] text-ink">
              Land, clearly
              <br />
              <span className="shimmer-text">defined.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-ink-2 sm:text-lg">
              Click any parcel and see everything government knows about it — ownership, registration, zoning, tax, disputes and utilities — assembled live from six departments through one parcel key.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <MapLaunch className="relative overflow-hidden inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-[15px] font-semibold text-white transition hover:brightness-105 active:scale-[0.98] shadow-sm">
                <BorderBeam size={160} duration={6} colorFrom="#D1A654" colorTo="#E3ECE6" />
                Open the live map <ArrowRight size={17} />
              </MapLaunch>
              <a href="#departments" className="inline-flex items-center gap-2.5 rounded-full border border-line bg-panel px-6 py-3.5 text-[15px] font-semibold text-ink-2 transition hover:bg-ground-2 hover:text-ink shadow-xs">
                See how it works
              </a>
            </div>

            {/* Quick launch real demo parcels */}
            <div className="mt-8 max-w-3xl">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                Explore real cadastre parcels live:
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {[
                  { label: 'Sy. 123/4 · Mangalagiri (AP)', tag: 'Clean Title', ulpin: 'TFCM91641E6C82', color: 'text-primary' },
                  { label: 'Sy. 124 · Mangalagiri (AP)', tag: 'Satellite Alert', ulpin: 'TFCM91D3533DD2', color: 'text-amber-700' },
                  { label: 'Sy. 45/2 · Sriperumbudur (TN)', tag: 'Patta Chitta', ulpin: 'TF2CEQ4ACED970', color: 'text-primary' },
                  { label: 'Sy. 77 · Shamshabad (TG)', tag: 'Dharani Passbook', ulpin: 'TEPDPUQC13C0D7', color: 'text-primary' },
                ].map((p) => (
                  <MapLaunch
                    key={p.ulpin}
                    ulpin={p.ulpin}
                    className="group flex items-center gap-2 rounded-full border border-line bg-panel/90 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-2xs backdrop-blur-md transition-all hover:border-primary hover:bg-ground-2 hover:shadow-xs cursor-pointer active:scale-95"
                  >
                    <span className="size-1.5 rounded-full bg-primary group-hover:scale-125 transition-transform" />
                    <span>{p.label}</span>
                    <span className="rounded-full bg-primary-soft/60 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                      {p.tag}
                    </span>
                  </MapLaunch>
                ))}
              </div>
            </div>
          </div>
          <a href="#departments" className="absolute bottom-8 left-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-ink-3 sm:left-10 lg:left-16 hover:text-primary transition-colors">
            <ArrowDown size={14} className="animate-bounce text-primary" /> Scroll to explore
          </a>
        </div>
      </section>
    </>
  );
}
