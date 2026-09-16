import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function ObsidianSplitScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const clipPathInset = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(45% 0% 45% 0%)', 'inset(0% 0% 0% 0%)']
  );

  return (
    <div ref={containerRef} className="relative h-[300vh] w-full bg-[#030712]">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center bg-[#030712]">
          <h1 className="text-center font-sans text-5xl font-extrabold uppercase leading-none tracking-tighter text-white sm:text-7xl md:text-8xl lg:text-[10rem]">
            OBSIDIAN<br />
            MOTION<br />
            STUDIO
          </h1>
        </div>
        <motion.div 
          className="absolute inset-0 flex items-center justify-center bg-[#00F0FF]"
          style={{ clipPath: clipPathInset }}
        >
          <h1 className="text-center font-sans text-5xl font-extrabold uppercase leading-none tracking-tighter text-[#030712] sm:text-7xl md:text-8xl lg:text-[10rem]">
            OBSIDIAN<br />
            MOTION<br />
            STUDIO
          </h1>
        </motion.div>
      </div>
    </div>
  );
}
