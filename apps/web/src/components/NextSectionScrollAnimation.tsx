import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function NextSectionScrollAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress exclusively through this container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Expands the curtain clip-path mask from a tight horizontal slit to full screen on scroll
  const clipPathInset = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(42% 0% 42% 0%)', 'inset(0% 0% 0% 0%)']
  );

  return (
    <div ref={containerRef} className="relative h-[250vh] w-full bg-[#030712] text-white">
      {/* Sticky viewport locks this section in place while scrolling through the 250vh height */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        
        {/* Base Layer: Dark background view */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 select-none">
          <h2 className="text-center font-black uppercase tracking-tighter text-white text-5xl sm:text-7xl lg:text-9xl leading-none">
            SIX DEPARTMENTS <br />
            ONE UNIFIED KEY
          </h2>
          <p className="mt-4 font-mono text-xs tracking-widest text-neutral-400 uppercase">
            SCROLL TO DEPLOY CADASTRE GATEWAY
          </p>
        </div>

        {/* Masked Split-Screen Overlay (Flips to Electric Cyan on scroll) */}
        <motion.div 
          style={{ clipPath: clipPathInset }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#00F0FF] px-4 z-10"
        >
          <h2 className="text-center font-black uppercase tracking-tighter text-[#030712] text-5xl sm:text-7xl lg:text-9xl leading-none">
            SIX DEPARTMENTS <br />
            ONE UNIFIED KEY
          </h2>
          <p className="mt-4 font-mono text-xs tracking-widest text-neutral-900 uppercase">
            SCROLL TO DEPLOY CADASTRE GATEWAY
          </p>
        </motion.div>

      </div>
    </div>
  );
}
