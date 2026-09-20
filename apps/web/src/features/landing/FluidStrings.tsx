import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  vy: number;
}

interface FluidString {
  points: Point[];
  baseY: number;
  amplitude: number;
  speed: number;
  frequency: number;
  phase: number;
  lineWidth: number;
  color: string;
}

/**
 * Interactive Fluid Strings Animation
 * 
 * Inspired by 21st.dev interactive canvas strings & wave physics.
 * - Pristine white background
 * - Organic black fluid strings running horizontally across the screen
 * - Real-time cursor interaction: reacts, plucks, and ripples as cursor sweeps through
 * - Idle harmonic breathing wave dynamics
 */
export function FluidStrings() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking with velocity
    const mouse = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      vx: 0,
      vy: 0,
      radius: 120,
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (mouse.prevX !== -1000) {
        mouse.vx = (x - mouse.prevX) * 0.6;
        mouse.vy = (y - mouse.prevY) * 0.6;
      }
      mouse.prevX = x;
      mouse.prevY = y;
      mouse.x = x;
      mouse.y = y;
    };

    const handlePointerLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.prevX = -1000;
      mouse.prevY = -1000;
      mouse.vx = 0;
      mouse.vy = 0;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('touchend', handlePointerLeave);

    const POINT_COUNT = 70;
    const STRING_COUNT = 24;
    const strings: FluidString[] = [];

    const initStrings = () => {
      strings.length = 0;
      const startY = height * 0.10;
      const endY = height * 0.90;
      const stepY = (endY - startY) / (STRING_COUNT - 1);

      for (let i = 0; i < STRING_COUNT; i++) {
        const baseY = startY + i * stepY;
        const points: Point[] = [];
        const stepX = width / (POINT_COUNT - 1);

        for (let j = 0; j < POINT_COUNT; j++) {
          points.push({
            x: j * stepX,
            y: baseY,
            vy: 0,
          });
        }

        // Palette: deep black to rich graphite tones
        const alpha = 0.25 + ((i % 6) / 5) * 0.55; // 0.25 to 0.80 contrast
        const isAccent = i % 4 === 0;

        strings.push({
          points,
          baseY,
          amplitude: 6 + (i % 5) * 3,
          speed: 0.0012 + (i % 4) * 0.0003,
          frequency: 0.0018 + (i % 3) * 0.0006,
          phase: i * 0.5,
          lineWidth: isAccent ? 1.8 : 1.1,
          color: `rgba(15, 17, 21, ${alpha})`,
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      initStrings();
    };

    resize();
    window.addEventListener('resize', resize);

    // Wave equation & spring damping constants
    const C_SQUARED = 0.18; // Wave speed squared (tension propagation along string)
    const SPRING_K = 0.035;  // Pull toward harmonic equilibrium
    const DAMPING = 0.92;   // Fluid viscosity damping

    let time = 0;

    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // Damp mouse velocity
      mouse.vx *= 0.82;
      mouse.vy *= 0.82;

      for (let s = 0; s < strings.length; s++) {
        const str = strings[s];
        const points = str.points;

        // 1. Physics update: Wave equation + cursor pluck/repulsion
        for (let i = 1; i < points.length - 1; i++) {
          const p = points[i];
          const prev = points[i - 1];
          const next = points[i + 1];

          // Resting harmonic wave height (breathing layout)
          const targetY =
            str.baseY +
            Math.sin(p.x * str.frequency + time * str.speed * 20 + str.phase) * str.amplitude +
            Math.cos(p.x * str.frequency * 0.6 + time * str.speed * 14) * (str.amplitude * 0.35);

          // Wave propagation acceleration from neighbors: c^2 * d^2y/dx^2
          const waveAcc = C_SQUARED * (prev.y + next.y - 2 * p.y);

          // Spring force pulling back to target breathing equilibrium
          const springAcc = -SPRING_K * (p.y - targetY);

          // Cursor interaction
          let mouseForce = 0;
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const proximity = 1 - dist / mouse.radius;
            const pushDirection = dy >= 0 ? 1 : -1;
            // Pluck string away from cursor, augmented by cursor velocity
            mouseForce = pushDirection * proximity * proximity * 16 + mouse.vy * proximity * 0.75;
          }

          // Total acceleration
          p.vy += waveAcc + springAcc + mouseForce;
          p.vy *= DAMPING;
          p.y += p.vy;
        }

        // Ensure boundary endpoints stay pinned
        points[0].y =
          str.baseY +
          Math.sin(time * str.speed * 20 + str.phase) * str.amplitude;
        points[points.length - 1].y =
          str.baseY +
          Math.sin((width) * str.frequency + time * str.speed * 20 + str.phase) * str.amplitude;

        // 2. Render smooth fluid string curve with Bezier splines
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
          const p0 = points[i];
          const p1 = points[i + 1];
          const midX = (p0.x + p1.x) * 0.5;
          const midY = (p0.y + p1.y) * 0.5;
          ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
        }

        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);

        ctx.strokeStyle = str.color;
        ctx.lineWidth = str.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      style={{ display: 'block', background: 'transparent' }}
    />
  );
}
