import { useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface SpotlightCardProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  borderColor?: string;
}

/**
 * 21st.dev-inspired Spotlight Card.
 * Tracks cursor coordinates using high-performance CSS variables to render
 * an ambient radial glow and luminous border reflection on hover.
 */
export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(24, 59, 43, 0.05)', // Forest green ambient glow
  borderColor = 'rgba(209, 166, 84, 0.35)', // Warm amber border highlight
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={clsx(
        'group relative overflow-hidden rounded-2xl border border-line bg-panel transition-all duration-300',
        className,
      )}
      {...props}
    >
      {/* Ambient internal spotlight glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: opacity || (isFocused ? 1 : 0),
          background: `radial-gradient(450px circle at var(--mouse-x, -200px) var(--mouse-y, -200px), ${spotlightColor}, transparent 75%)`,
        }}
        aria-hidden="true"
      />

      {/* Dynamic border highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: opacity || (isFocused ? 1 : 0),
          background: `radial-gradient(280px circle at var(--mouse-x, -200px) var(--mouse-y, -200px), ${borderColor}, transparent 80%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
        aria-hidden="true"
      />

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
