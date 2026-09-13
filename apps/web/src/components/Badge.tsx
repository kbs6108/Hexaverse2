import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export type Tone = 'neutral' | 'primary' | 'amber' | 'brick' | 'violet' | 'slate';

const tones: Record<Tone, string> = {
  neutral: 'bg-ground-2 text-ink-2 border-line',
  primary: 'bg-primary-soft text-primary border-primary/30',
  amber: 'bg-amber-soft text-amber border-amber/30',
  brick: 'bg-brick-soft text-brick border-brick/30',
  violet: 'bg-violet-soft text-violet border-violet/30',
  slate: 'bg-slate-soft text-slate border-slate/30',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
  mono?: boolean;
  hatch?: boolean;
}

export function Badge({ tone = 'neutral', icon, mono, hatch, className, children, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      className={clsx(
        'relative inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium leading-4 whitespace-nowrap overflow-hidden',
        tones[tone],
        mono && 'font-mono',
        className,
      )}
    >
      {hatch && <span aria-hidden className="absolute inset-0 opacity-15 hatch-brick pointer-events-none" />}
      {icon && <span className="shrink-0 [&>svg]:size-3">{icon}</span>}
      <span className="relative">{children}</span>
    </span>
  );
}
