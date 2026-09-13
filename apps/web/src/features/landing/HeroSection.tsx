import { Link } from '@tanstack/react-router';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ShaderAnimation } from './ShaderAnimation';
import { createTopDockController } from './top-dock-controller';

export function HeroSection() {
  const dockRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    return createTopDockController(dock, () => ({ proximity: 140, spring: 0.22, damping: 0.55, widthGrowth: 32, heightGrowth: 32, drop: 14 }));
  }, []);

  return (
    <section className="relative isolate flex min-h-screen w-full overflow-hidden bg-[#f5f5f7]">
      <ShaderAnimation />
      {/* Light veil: the shader reads as a faint animated texture behind dark ink. */}
      <div className="pointer-events-none absolute inset-0 bg-white/85" />

      <div className="pointer-events-none fixed left-0 right-0 top-5 z-[9999] flex justify-center px-4">
        <header
          id="dock"
          className="atd-modern__bar pointer-events-auto flex w-full max-w-4xl items-center justify-between rounded-full border border-black/[0.08] bg-white/[0.72] px-4 py-2 text-[#1d1d1f] shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-[25px] backdrop-saturate-[180%]"
        >
          <a href="#top" className="brand-wordmark shrink-0 px-2 text-[#1d1d1f]">
            Land Stack
          </a>
          <nav ref={dockRef} className="atd-modern__dock hidden items-center gap-1 rounded-full border border-black/[0.05] bg-black/[0.04] p-1 md:flex" aria-label="Primary navigation">
            <a data-dock-item href="#top" className="atd-modern__item inline-flex origin-center items-center rounded-full px-3.5 py-1.5 text-[13px] text-[#515154] will-change-transform hover:bg-black/5 hover:text-[#1d1d1f]">Overview</a>
            <a data-dock-item href="#system-map" className="atd-modern__item inline-flex origin-center items-center rounded-full px-3.5 py-1.5 text-[13px] text-[#515154] will-change-transform hover:bg-black/5 hover:text-[#1d1d1f]">System</a>
            <a data-dock-item href="#fragmentation" className="atd-modern__item inline-flex origin-center items-center rounded-full px-3.5 py-1.5 text-[13px] text-[#515154] will-change-transform hover:bg-black/5 hover:text-[#1d1d1f]">Land</a>
            <a data-dock-item href="#identity" className="atd-modern__item inline-flex origin-center items-center rounded-full px-3.5 py-1.5 text-[13px] text-[#515154] will-change-transform hover:bg-black/5 hover:text-[#1d1d1f]">ULPIN</a>
            <Link data-dock-item to="/help" className="atd-modern__item inline-flex origin-center items-center rounded-full px-3.5 py-1.5 text-[13px] text-[#515154] will-change-transform hover:bg-black/5 hover:text-[#1d1d1f]">Guide</Link>
          </nav>
          <Link to="/map" className="shrink-0 rounded-full bg-[#0066cc] px-4 py-2 text-[13px] font-normal text-white transition hover:bg-[#0071e3] active:scale-[0.98]">
            Explore Platform
          </Link>
        </header>
      </div>

      <div id="top" className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] items-center px-6 pb-16 pt-32 sm:px-10 lg:px-16">
        <div className="max-w-5xl">
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.25em] text-[#6e6e73]">Land Stack / Digital land infrastructure</p>
          <h1 className="font-display text-[clamp(3.4rem,8vw,7.5rem)] font-semibold leading-[0.91] tracking-[-0.07em] text-[#1d1d1f]">
            Land, clearly
            <br />
            <span className="text-[#1d1d1f]">defined.</span>
          </h1>
          <div className="mt-10 flex max-w-xl flex-col gap-8 sm:flex-row sm:items-end sm:gap-16">
            <p className="max-w-sm text-base leading-7 text-[#515154] sm:text-lg">Every parcel. One connected identity for India&apos;s land governance.</p>
            <a href="#fragmentation" className="group inline-flex shrink-0 items-center gap-3 text-sm font-semibold text-[#0066cc] transition hover:text-[#0071e3]">
              Explore Land Stack
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0066cc]/50 transition group-hover:border-[#0071e3] group-hover:bg-[#0066cc]/10">
                <ArrowRight size={16} />
              </span>
            </a>
          </div>
        </div>
        <a href="#fragmentation" className="absolute bottom-8 left-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[#86868b] sm:left-10 lg:left-16">
          <ArrowDown size={14} className="animate-bounce text-[#23613C]" /> Scroll to explore
        </a>
      </div>
    </section>
  );
}
