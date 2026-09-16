import { Link } from '@tanstack/react-router';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ShaderAnimation } from './ShaderAnimation';
import { MapLaunch } from './MapLaunch';
import { GovBadge } from '@/features/marketing/GovStrip';
import { createTopDockController } from './top-dock-controller';
import { FaintTelemetry } from './FaintTelemetry';

const DOCK_ITEM =
  'atd-modern__item inline-flex origin-center items-center rounded-full px-3.5 py-1.5 text-[13px] text-ink-2 will-change-transform hover:bg-black/5 hover:text-ink';

/** Anchored sections the dock tracks, in page order. */
const SPY_SECTIONS = ['top', 'departments', 'how', 'stories'] as const;

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
    <section className="relative isolate flex min-h-screen w-full overflow-hidden bg-ground">
      <ShaderAnimation />
      {/* Light veil: the emerald shader reads as a faint aurora behind dark ink. */}
      <div className="pointer-events-none absolute inset-0 bg-white/80" />
      {/* Faint, borderless coordinates & places that randomly appear and fade */}
      <FaintTelemetry />

      <div className="pointer-events-none fixed left-0 right-0 top-5 z-[9999] flex justify-center px-4">
        <header
          id="dock"
          className="atd-modern__bar pointer-events-auto flex w-full max-w-4xl items-center justify-between rounded-full border border-black/[0.08] bg-white/[0.72] px-4 py-2 text-ink shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-[25px] backdrop-saturate-[180%]"
        >
          <a href="#top" className="brand-wordmark shrink-0 px-2 text-ink">
            Land Stack
          </a>
          <nav ref={dockRef} className="atd-modern__dock hidden items-center gap-1 rounded-full border border-black/[0.05] bg-black/[0.04] p-1 md:flex" aria-label="Primary navigation">
            <a data-dock-item data-active={active === 'top'} href="#top" className={DOCK_ITEM}>Overview</a>
            <a data-dock-item data-active={active === 'departments'} href="#departments" className={DOCK_ITEM}>Departments</a>
            <a data-dock-item data-active={active === 'how'} href="#how" className={DOCK_ITEM}>How it works</a>
            <a data-dock-item data-active={active === 'stories'} href="#stories" className={DOCK_ITEM}>Stories</a>
            <Link data-dock-item to="/help" className={DOCK_ITEM}>Guide</Link>
          </nav>
          <MapLaunch className="cta-glow shrink-0 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-white transition hover:brightness-110 active:scale-[0.98]">
            Explore Platform
          </MapLaunch>
        </header>
      </div>

      <div id="top" className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] items-center px-6 pb-16 pt-32 sm:px-10 lg:px-16">
        <div className="max-w-5xl">
          <GovBadge variant="landing" className="mb-5" />
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.25em] text-ink-3">Land Stack / Digital land infrastructure</p>
          <h1 className="font-display text-[clamp(3.4rem,8vw,7.5rem)] font-semibold leading-[0.91] tracking-[-0.07em] text-ink">
            Land, clearly
            <br />
            defined.
          </h1>
          <p className="mt-10 max-w-xl text-base leading-7 text-ink-2 sm:text-lg">
            Click any parcel and see everything government knows about it — ownership, registration, zoning, tax, disputes and utilities — assembled live from six departments through one parcel key.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <MapLaunch className="cta-glow inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-[15px] font-semibold text-white transition hover:brightness-110 active:scale-[0.98]">
              Open the live map <ArrowRight size={17} />
            </MapLaunch>
            <a href="#departments" className="inline-flex items-center gap-2.5 rounded-full border border-primary/35 px-6 py-3.5 text-[15px] font-semibold text-primary transition hover:border-primary hover:bg-primary/5">
              See how it works
            </a>
          </div>
        </div>
        <a href="#departments" className="absolute bottom-8 left-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[#86868b] sm:left-10 lg:left-16">
          <ArrowDown size={14} className="animate-bounce text-primary" /> Scroll to explore
        </a>
      </div>
    </section>
  );
}
