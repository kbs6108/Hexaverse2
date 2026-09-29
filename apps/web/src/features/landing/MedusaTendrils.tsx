import { useEffect, useRef } from 'react';

interface TendrilNode {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
}

interface Tendril {
  nodes: TendrilNode[];
  length: number;
  segmentLength: number;
  baseSpeedX: number;
  baseSpeedY: number;
  oscSpeed: number;
  oscAmplitude: number;
  oscPhase: number;
  lineWidth: number;
  color: string;
  depth: number; // 0 (far/submerged) to 1 (near/crisp)
}

/**
 * MedusaTendrils — Viscous Liquid Strands Animation
 * 
 * Simulates organic gossamer tendrils floating weightlessly inside a viscous
 * liquid medium against a pristine white background.
 * 
 * Mechanics:
 * - Verlet integration with hydrodynamic drag & relaxation constraints
 * - Autonomous buoyancy and multi-octave liquid current drift
 * - Real-time fluid stirring: cursor velocity induces hydrodynamic vortices and flow displacement
 * - Layered fluid depth with variable line weights and translucent ink tones
 * - Hardware-accelerated Canvas with automatic offscreen pause
 */
export function MedusaTendrils() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;

    // Mouse tracking with velocity & hydrodynamic radius
    const mouse = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      vx: 0,
      vy: 0,
      radius: 180,
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (mouse.prevX !== -1000) {
        // Fluid momentum transfer
        mouse.vx = (x - mouse.prevX) * 0.7;
        mouse.vy = (y - mouse.prevY) * 0.7;
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

    // Visibility observer to pause animation when offscreen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const TENDRIL_COUNT = 18;
    const NODES_PER_TENDRIL = 42;
    const tendrils: Tendril[] = [];

    const initTendrils = () => {
      tendrils.length = 0;

      for (let t = 0; t < TENDRIL_COUNT; t++) {
        // Distribute origins naturally across and slightly above the canvas
        const originX = (width / (TENDRIL_COUNT + 1)) * (t + 1) + (Math.random() - 0.5) * 80;
        const originY = Math.random() * (height * 0.75) + 50;

        const segmentLength = 12 + Math.random() * 8;
        const depth = 0.2 + Math.random() * 0.8; // 0.2 (submerged/faint) to 1.0 (foreground/crisp)

        const nodes: TendrilNode[] = [];
        for (let i = 0; i < NODES_PER_TENDRIL; i++) {
          const ny = originY + i * segmentLength;
          nodes.push({
            x: originX,
            y: ny,
            oldX: originX,
            oldY: ny,
          });
        }

        // Palette: deep charcoal & heritage forest ink with depth translucency over pure white
        const isHeritageTone = t % 3 === 0;
        const alpha = 0.15 + depth * 0.65;
        const color = isHeritageTone
          ? `rgba(24, 59, 43, ${alpha.toFixed(2)})` // Forest Green ink
          : `rgba(17, 24, 39, ${alpha.toFixed(2)})`; // Deep Charcoal

        tendrils.push({
          nodes,
          length: NODES_PER_TENDRIL,
          segmentLength,
          baseSpeedX: (Math.random() - 0.5) * 0.35,
          baseSpeedY: -(0.2 + Math.random() * 0.4), // Gentle upward buoyancy drift
          oscSpeed: 0.0008 + Math.random() * 0.0006,
          oscAmplitude: 14 + Math.random() * 18,
          oscPhase: Math.random() * Math.PI * 2,
          lineWidth: 0.8 + depth * 1.5,
          color,
          depth,
        });
      }
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initTendrils();
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    let time = 0;
    const DRAG = 0.94; // Viscous liquid damping
    const CONSTRAINT_ITERATIONS = 4; // Multi-pass relaxation for realistic rope stiffness

    const animate = (now: number) => {
      time = now;

      if (isVisible) {
        ctx.clearRect(0, 0, width, height);

        // Hydrodynamic mouse velocity decay
        mouse.vx *= 0.85;
        mouse.vy *= 0.85;

        for (let t = 0; t < tendrils.length; t++) {
          const tendril = tendrils[t];
          if (!tendril) continue;
          const nodes = tendril.nodes;
          const head = nodes[0];
          if (!head) continue;

          // 1. HEAD MOTION: Slow buoyancy, harmonic lateral sway, and liquid convection
          const sway = Math.sin(time * tendril.oscSpeed + tendril.oscPhase) * tendril.oscAmplitude;
          const driftX = tendril.baseSpeedX + Math.cos(time * tendril.oscSpeed * 0.7 + tendril.oscPhase) * 0.25;
          const driftY = tendril.baseSpeedY + Math.sin(time * tendril.oscSpeed * 0.5) * 0.15;

          // Compute head velocity
          const headVx = (head.x - head.oldX) * DRAG;
          const headVy = (head.y - head.oldY) * DRAG;

          head.oldX = head.x;
          head.oldY = head.y;

          head.x += headVx + driftX + (sway * 0.04);
          head.y += headVy + driftY;

          // Wrap-around screen bounds smoothly to keep infinite swimming loop
          if (head.y < -150) {
            const dy = height + 300;
            for (let j = 0; j < nodes.length; j++) {
              const n = nodes[j];
              if (n) {
                n.y += dy;
                n.oldY += dy;
              }
            }
          } else if (head.y > height + 200) {
            const dy = -(height + 350);
            for (let j = 0; j < nodes.length; j++) {
              const n = nodes[j];
              if (n) {
                n.y += dy;
                n.oldY += dy;
              }
            }
          }
          if (head.x < -100) {
            const dx = width + 200;
            for (let j = 0; j < nodes.length; j++) {
              const n = nodes[j];
              if (n) {
                n.x += dx;
                n.oldX += dx;
              }
            }
          } else if (head.x > width + 100) {
            const dx = -(width + 200);
            for (let j = 0; j < nodes.length; j++) {
              const n = nodes[j];
              if (n) {
                n.x += dx;
                n.oldX += dx;
              }
            }
          }

          // 2. VERLET INTEGRATION: Update trailing nodes with fluid drag and liquid current
          for (let i = 1; i < nodes.length; i++) {
            const node = nodes[i];
            if (!node) continue;

            const vx = (node.x - node.oldX) * DRAG;
            const vy = (node.y - node.oldY) * DRAG;

            node.oldX = node.x;
            node.oldY = node.y;

            // Fluid agitation from cursor: vortex swirl and wake displacement
            let fluidForceX = 0;
            let fluidForceY = 0;

            const dx = node.x - mouse.x;
            const dy = node.y - mouse.y;
            const distSq = dx * dx + dy * dy;
            const radiusSq = mouse.radius * mouse.radius;

            if (distSq < radiusSq && distSq > 1) {
              const dist = Math.sqrt(distSq);
              const factor = (1 - dist / mouse.radius);
              const factorSq = factor * factor;

              // Tangential vortex swirl around cursor
              const normalX = -dy / dist;
              const normalY = dx / dist;
              const swirlMagnitude = (mouse.vx * normalX + mouse.vy * normalY) * 1.6;

              fluidForceX = (mouse.vx * 0.45 + normalX * swirlMagnitude) * factorSq * tendril.depth;
              fluidForceY = (mouse.vy * 0.45 + normalY * swirlMagnitude) * factorSq * tendril.depth;
            }

            // Gentle micro-wave along the tendril length (traveling undulation)
            const undulatePhase = time * 0.0015 - i * 0.18 + tendril.oscPhase;
            const undulateForceX = Math.sin(undulatePhase) * (0.08 * i * 0.1);

            node.x += vx + fluidForceX + undulateForceX;
            node.y += vy + fluidForceY;
          }

          // 3. CONSTRAINT SOLVER: Enforce segment length constraints (relaxation loop)
          for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
            for (let i = 0; i < nodes.length - 1; i++) {
              const n1 = nodes[i];
              const n2 = nodes[i + 1];
              if (!n1 || !n2) continue;

              const cdx = n2.x - n1.x;
              const cdy = n2.y - n1.y;
              const curDist = Math.sqrt(cdx * cdx + cdy * cdy);

              if (curDist > 0.001) {
                const diff = (curDist - tendril.segmentLength) / curDist;
                // Distribute correction: head (i=0) has higher mass, tail flexes more
                const w1 = i === 0 ? 0.2 : 0.45;
                const w2 = 1.0 - w1;

                n1.x += cdx * diff * w1;
                n1.y += cdy * diff * w1;
                n2.x -= cdx * diff * w2;
                n2.y -= cdy * diff * w2;
              }
            }
          }

          // 4. RENDER: Smooth Catmull-Rom spline curves through the nodes
          ctx.beginPath();
          ctx.moveTo(head.x, head.y);

          for (let i = 0; i < nodes.length - 1; i++) {
            const p0 = nodes[i];
            const p1 = nodes[i + 1];
            if (!p0 || !p1) continue;

            const midX = (p0.x + p1.x) * 0.5;
            const midY = (p0.y + p1.y) * 0.5;
            ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
          }

          const tail = nodes[nodes.length - 1];
          if (tail) {
            ctx.lineTo(tail.x, tail.y);
          }

          ctx.strokeStyle = tendril.color;
          ctx.lineWidth = tendril.lineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Subtle droplet node at the leading head
          ctx.beginPath();
          ctx.arc(head.x, head.y, tendril.lineWidth * 1.4, 0, Math.PI * 2);
          ctx.fillStyle = tendril.color;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('touchend', handlePointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-auto absolute inset-0 size-full overflow-hidden bg-white select-none"
      aria-hidden="true"
    >
      {/* Subtle soft fluid vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(245,242,235,0.35)_100%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
