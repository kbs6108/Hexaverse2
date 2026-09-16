import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function HeroSplitAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Tracks scroll progress through this specific 250vh wrapper
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Expands the clip-path inset mask from a centered slit (42%) to full screen (0%) on scroll
  const clipPathInset = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(42% 0% 42% 0%)', 'inset(0% 0% 0% 0%)']
  );

  return (
    <div ref={containerRef} className="relative h-[250vh] w-full bg-[#030712] text-white">
      {/* Sticky Hero Viewport: Locks to the screen while you scroll through the 250vh height */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        
        {/* Layer 1: Base Dark State */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 select-none">
          <h1 className="text-center font-black uppercase tracking-tighter text-white text-6xl sm:text-8xl lg:text-[11rem] leading-none">
            LAND, CLEARLY <br />
            DEFINED.
          </h1>
          <p className="mt-4 font-mono text-xs tracking-widest text-neutral-400 uppercase">
            ULPIN-1403-PB-889 · SIX DEPARTMENTS UNIFIED
          </p>
        </div>

        {/* Layer 2: Masked Split-Screen Overlay (Flips colors to Electric Cyan background on scroll) */}
        <motion.div 
          style={{ clipPath: clipPathInset }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#00F0FF] px-4 z-10"
        >
          <h1 className="text-center font-black uppercase tracking-tighter text-[#030712] text-6xl sm:text-8xl lg:text-[11rem] leading-none">
            LAND, CLEARLY <br />
            DEFINED.
          </h1>
          <p className="mt-4 font-mono text-xs tracking-widest text-neutral-900 uppercase">
            ULPIN-1403-PB-889 · SIX DEPARTMENTS UNIFIED
          </p>
        </motion.div>

      </div>
    </div>
  );
}
