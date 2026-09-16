'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function SplitScreenScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress within the 300vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Map scroll progress (0 to 1) to the clip-path inset values
  // We start at 45% top and bottom (leaving a 10% horizontal band in the middle)
  // and expand to 0% (revealing the entire black layer).
  const clipPathInset = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(45% 0% 45% 0%)', 'inset(0% 0% 0% 0%)']
  );

  return (
    <div ref={containerRef} className="relative h-[300vh] w-full bg-[#EFECE6]">
      {/* Sticky viewport that stays pinned to the screen while scrolling the 300vh container */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        
        {/* Base Layer: Cream background, Black text */}
        <div className="absolute inset-0 flex items-center justify-center bg-[#EFECE6]">
          <h1 className="text-center font-sans text-5xl font-extrabold uppercase tracking-tighter text-black sm:text-7xl md:text-8xl lg:text-[10rem] leading-none">
            WEB DESIGN<br />
            ANIMATION<br />
            SKILLS
          </h1>
        </div>

        {/* Mask Layer: Black background, White text */}
        {/* Framer Motion animates the clip-path to reveal this layer dynamically */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center bg-black"
          style={{ clipPath: clipPathInset }}
        >
          <h1 className="text-center font-sans text-5xl font-extrabold uppercase tracking-tighter text-white sm:text-7xl md:text-8xl lg:text-[10rem] leading-none">
            WEB DESIGN<br />
            ANIMATION<br />
            SKILLS
          </h1>
        </motion.div>

      </div>
    </div>
  );
}
