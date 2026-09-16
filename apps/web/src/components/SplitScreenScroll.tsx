import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function SplitScreenScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const clipPathInset = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(42% 0% 42% 0%)', 'inset(0% 0% 0% 0%)']
  );

  return (
    <div ref={containerRef} className="relative h-[250vh] w-full bg-[#090D16] text-white">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        
        {/* Base Layer */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 select-none">
          <h2 className="text-center font-sans text-5xl font-extrabold uppercase tracking-tighter sm:text-7xl lg:text-9xl leading-none">
            SIX DEPARTMENTS <br />
            ONE UNIFIED KEY
          </h2>
          <p className="mt-4 font-mono text-xs tracking-widest text-neutral-400 uppercase">
            SCROLL TO DEPLOY CADASTRE GATEWAY
          </p>
        </div>

        {/* Masked Overlay Layer */}
        <motion.div 
          style={{ clipPath: clipPathInset }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#00F0FF] px-4 z-10 text-[#030712]"
        >
          <h2 className="text-center font-sans text-5xl font-extrabold uppercase tracking-tighter sm:text-7xl lg:text-9xl leading-none">
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
