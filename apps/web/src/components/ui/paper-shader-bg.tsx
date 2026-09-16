"use client";

import { GrainGradient } from '@paper-design/shaders-react';

export function GradientBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <GrainGradient
        style={{ height: '100%', width: '100%' }}
        colorBack="#E9E5D8"
        softness={0.8}
        intensity={0.4}
        noise={0.02}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={1.2}
        rotation={0}
        speed={0.5}
        colors={['#D5D2C7', '#B38A4C', '#E1E6DE']}
      />
    </div>
  );
}
