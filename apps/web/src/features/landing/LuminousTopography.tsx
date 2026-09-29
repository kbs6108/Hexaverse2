import { useEffect, useRef, useState } from 'react';

interface ContourLine {
  id: number;
  baseYRatio: number;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  harmonic: number;
  isIndexContour?: boolean;
  elevationLabel?: string;
}

/**
 * 21st.dev "Luminous Topography" Component (by Mehi / Motiq).
 * 
 * An animated contour-map background featuring drifting topographic elevation
 * isolines that dynamically illuminate in response to cursor movement.
 * 
 * Features:
 * - Precision cadastral elevation isolines and index contours with height markers
 * - Fluid procedural drift with harmonic breathing
 * - Real-time radial spotlight tracking cursor coordinates with emerald/gold luminescence
 * - Hardware-accelerated SVG with off-screen pause via IntersectionObserver
 * - Zero external heavy WebGL dependencies, lightweight and battery-friendly
 */
export function LuminousTopography() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1440, height: 900 });

  // Smooth lerped cursor for organic spotlight tracking
  const targetCursor = useRef({ x: 720, y: 450, active: false });
  const smoothCursor = useRef({ x: 720, y: 450 });
  const animFrameId = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const isVisible = useRef<boolean>(true);

  // SVG paths state updated via animation loop or ref
  const basePathsRef = useRef<SVGPathElement[]>([]);
  const glowPathsRef = useRef<SVGPathElement[]>([]);
  const maskCircleRef = useRef<SVGCircleElement>(null);
  const secondaryCircleRef = useRef<SVGCircleElement>(null);

  // Define 14 distinct topographic contour tiers
  const contours: ContourLine[] = [
    { id: 1, baseYRatio: 0.08, amplitude: 22, frequency: 0.0018, speed: 0.0006, phase: 0.2, harmonic: 1.8 },
    { id: 2, baseYRatio: 0.15, amplitude: 35, frequency: 0.0014, speed: 0.0007, phase: 1.1, harmonic: 2.1, isIndexContour: true, elevationLabel: '120m' },
    { id: 3, baseYRatio: 0.22, amplitude: 28, frequency: 0.0016, speed: 0.0005, phase: 2.3, harmonic: 1.6 },
    { id: 4, baseYRatio: 0.29, amplitude: 38, frequency: 0.0013, speed: 0.0008, phase: 0.7, harmonic: 2.4 },
    { id: 5, baseYRatio: 0.36, amplitude: 44, frequency: 0.0012, speed: 0.0006, phase: 3.2, harmonic: 1.9, isIndexContour: true, elevationLabel: '140m' },
    { id: 6, baseYRatio: 0.43, amplitude: 32, frequency: 0.0015, speed: 0.0007, phase: 1.8, harmonic: 2.2 },
    { id: 7, baseYRatio: 0.50, amplitude: 48, frequency: 0.0011, speed: 0.0005, phase: 4.1, harmonic: 1.7 },
    { id: 8, baseYRatio: 0.57, amplitude: 36, frequency: 0.0014, speed: 0.0009, phase: 2.6, harmonic: 2.5, isIndexContour: true, elevationLabel: '160m' },
    { id: 9, baseYRatio: 0.64, amplitude: 42, frequency: 0.0013, speed: 0.0006, phase: 0.5, harmonic: 1.8 },
    { id: 10, baseYRatio: 0.71, amplitude: 30, frequency: 0.0016, speed: 0.0008, phase: 3.7, harmonic: 2.0 },
    { id: 11, baseYRatio: 0.78, amplitude: 46, frequency: 0.0012, speed: 0.0005, phase: 1.4, harmonic: 2.3, isIndexContour: true, elevationLabel: '180m' },
    { id: 12, baseYRatio: 0.85, amplitude: 34, frequency: 0.0015, speed: 0.0007, phase: 4.8, harmonic: 1.7 },
    { id: 13, baseYRatio: 0.91, amplitude: 40, frequency: 0.0013, speed: 0.0006, phase: 2.9, harmonic: 2.1 },
    { id: 14, baseYRatio: 0.97, amplitude: 26, frequency: 0.0017, speed: 0.0008, phase: 0.9, harmonic: 1.9, isIndexContour: true, elevationLabel: '200m' },
  ];

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: Math.max(rect.width, 360),
        height: Math.max(rect.height, 600),
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // IntersectionObserver to pause animation when offscreen
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Cursor event handlers
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      targetCursor.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handlePointerLeave = () => {
      targetCursor.current.active = false;
    };

    node.addEventListener('pointermove', handlePointerMove, { passive: true });
    node.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      node.removeEventListener('pointermove', handlePointerMove);
      node.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  // Helper to generate smooth cubic Bezier path for a contour line
  const generateContourPath = (
    c: ContourLine,
    t: number,
    w: number,
    h: number
  ): string => {
    const baseY = c.baseYRatio * h;
    const pointsCount = 28;
    const stepX = w / (pointsCount - 1);
    const points: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < pointsCount; i++) {
      const x = i * stepX;
      // Multi-frequency wave calculation with phase drift
      const wave1 = Math.sin(x * c.frequency + t * c.speed + c.phase) * c.amplitude;
      const wave2 = Math.cos(x * c.frequency * c.harmonic - t * c.speed * 0.7 + c.phase * 1.5) * (c.amplitude * 0.45);
      const wave3 = Math.sin((x + baseY) * 0.0025 + t * 0.0004) * (c.amplitude * 0.25);
      
      const y = baseY + wave1 + wave2 + wave3;
      points.push({ x, y });
    }

    const first = points[0];
    if (!first) return '';

    // Build smooth Catmull-Rom or cubic Bezier path
    let d = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)] ?? first;
      const p1 = points[i] ?? first;
      const p2 = points[i + 1] ?? p1;
      const p3 = points[Math.min(points.length - 1, i + 2)] ?? p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    return d;
  };

  // Main animation loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min(now - lastTime, 48); // Cap delta to prevent huge jumps on tab switch
      lastTime = now;

      if (isVisible.current) {
        timeRef.current += dt;
        const t = timeRef.current;

        // Smooth cursor interpolation (lerp)
        const lerpFactor = 0.08;
        smoothCursor.current.x += (targetCursor.current.x - smoothCursor.current.x) * lerpFactor;
        smoothCursor.current.y += (targetCursor.current.y - smoothCursor.current.y) * lerpFactor;

        // Update spotlight mask coordinates directly in DOM for 60fps performance
        const curX = smoothCursor.current.x;
        const curY = smoothCursor.current.y;

        if (maskCircleRef.current) {
          maskCircleRef.current.setAttribute('cx', curX.toFixed(1));
          maskCircleRef.current.setAttribute('cy', curY.toFixed(1));
        }
        if (secondaryCircleRef.current) {
          secondaryCircleRef.current.setAttribute('cx', curX.toFixed(1));
          secondaryCircleRef.current.setAttribute('cy', curY.toFixed(1));
        }

        // Generate and apply contour paths to SVG path elements directly
        const w = dimensions.width;
        const h = dimensions.height;

        contours.forEach((c, idx) => {
          const d = generateContourPath(c, t, w, h);
          if (basePathsRef.current[idx]) {
            basePathsRef.current[idx].setAttribute('d', d);
          }
          if (glowPathsRef.current[idx]) {
            glowPathsRef.current[idx].setAttribute('d', d);
          }
        });
      }

      animFrameId.current = requestAnimationFrame(animate);
    };

    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [dimensions]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute inset-0 size-full overflow-hidden bg-[#FBF9F4] select-none"
      aria-hidden="true"
    >
      {/* Ambient background subtle radial warmth */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle 800px at ${smoothCursor.current.x}px ${smoothCursor.current.y}px, rgba(235, 230, 218, 0.45) 0%, transparent 70%)`,
        }}
      />

      <svg
        className="absolute inset-0 size-full"
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Luminous Spotlight Mask tracking cursor */}
          <radialGradient id="topography-spotlight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Broad subtle glow aura */}
          <radialGradient id="topography-ambient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Mask layer combining primary focus and ambient halo */}
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="#000000" />
            <circle
              ref={maskCircleRef}
              cx={dimensions.width / 2}
              cy={dimensions.height / 2}
              r="340"
              fill="url(#topography-spotlight)"
            />
            <circle
              ref={secondaryCircleRef}
              cx={dimensions.width / 2}
              cy={dimensions.height / 2}
              r="580"
              fill="url(#topography-ambient)"
            />
          </mask>

          {/* Luminous gold-emerald gradient for illuminated contour highlights */}
          <linearGradient id="luminous-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#183B2B" />
            <stop offset="30%" stopColor="#2E6B4F" />
            <stop offset="65%" stopColor="#B38A4C" />
            <stop offset="100%" stopColor="#52B788" />
          </linearGradient>

          {/* Specular golden crest gradient */}
          <linearGradient id="index-crest" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#183B2B" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#D1A654" stopOpacity="1" />
            <stop offset="100%" stopColor="#183B2B" stopOpacity="0.9" />
          </linearGradient>

          {/* Subtle soft drop-shadow filter for luminous contours */}
          <filter id="luminous-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. BASE LAYER: Resting subtle contour lines (Warm Heritage Sandstone / Cadastre ink) */}
        <g className="opacity-70 transition-opacity duration-500">
          {contours.map((c, idx) => (
            <path
              key={`base-${c.id}`}
              ref={(el) => {
                if (el) basePathsRef.current[idx] = el;
              }}
              fill="none"
              stroke={c.isIndexContour ? '#C4BCAB' : '#DFD9CD'}
              strokeWidth={c.isIndexContour ? 1.5 : 1}
              strokeDasharray={c.isIndexContour ? '8, 6' : undefined}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        {/* 2. LUMINOUS LAYER: Brilliant spotlight-revealed active contours */}
        <g mask="url(#spotlight-mask)">
          {contours.map((c, idx) => (
            <path
              key={`glow-${c.id}`}
              ref={(el) => {
                if (el) glowPathsRef.current[idx] = el;
              }}
              fill="none"
              stroke={c.isIndexContour ? 'url(#index-crest)' : 'url(#luminous-stroke)'}
              strokeWidth={c.isIndexContour ? 2.6 : 1.8}
              strokeLinecap="round"
              filter="url(#luminous-glow)"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        {/* 3. Subtle cadastral coordinate grid ticks in the corners */}
        <g className="pointer-events-none opacity-25" stroke="#A89E8D" strokeWidth="1">
          {/* Top-left tick marks */}
          <line x1="40" y1="40" x2="60" y2="40" />
          <line x1="40" y1="40" x2="40" y2="60" />
          <text x="68" y="44" fill="#8C8270" fontSize="9" fontFamily="ui-monospace, monospace" letterSpacing="0.1em">
            CADASTRE // 16°27'N
          </text>

          {/* Top-right tick marks */}
          <line x1={dimensions.width - 40} y1="40" x2={dimensions.width - 60} y2="40" />
          <line x1={dimensions.width - 40} y1="40" x2={dimensions.width - 40} y2="60" />
          <text x={dimensions.width - 160} y="44" fill="#8C8270" fontSize="9" fontFamily="ui-monospace, monospace" letterSpacing="0.1em">
            ULPIN GRID 80°32'E
          </text>
        </g>
      </svg>
    </div>
  );
}
