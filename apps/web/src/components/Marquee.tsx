import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: ReactNode;
  vertical?: boolean;
  repeat?: number;
  duration?: number; // duration in seconds for a full loop
  gap?: string;
  fadeEdges?: boolean;
}

/**
 * 21st.dev / Magic UI Marquee Component.
 * Continuous horizontal scrolling marquee animation with hardware acceleration,
 * pause-on-hover, seamless loop cloning, and optional edge gradient mask.
 */
export function Marquee({
  className,
  reverse = false,
  pauseOnHover = true,
  children,
  vertical = false,
  repeat = 3,
  duration = 32,
  gap = '1.25rem',
  fadeEdges = true,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      style={
        {
          '--duration': `${duration}s`,
          '--gap': gap,
          ...props.style,
        } as React.CSSProperties
      }
      className={clsx(
        'group relative flex overflow-hidden p-1 select-none',
        fadeEdges && [
          '[mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]',
          '[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]',
        ],
        vertical ? 'flex-col' : 'flex-row',
        className,
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={clsx('flex shrink-0 justify-around [gap:var(--gap)]', {
            'animate-marquee flex-row': !vertical,
            'animate-marquee-vertical flex-col': vertical,
            'group-hover:[animation-play-state:paused]': pauseOnHover,
            '[animation-direction:reverse]': reverse,
          })}
          aria-hidden={i > 0}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
