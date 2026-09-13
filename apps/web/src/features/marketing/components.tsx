import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { Tone } from '@/components/Badge';
import type { IconType } from './pitch';

const iconTone: Record<Tone, string> = {
  neutral: 'bg-ground-2 text-ink-2',
  primary: 'bg-primary-soft text-primary',
  amber: 'bg-amber-soft text-amber',
  brick: 'bg-brick-soft text-brick',
  violet: 'bg-violet-soft text-violet',
  slate: 'bg-slate-soft text-slate',
};

/** Icon + title + blurb card, used across the landing highlights and department grid. */
export function FeatureCard({
  icon: Icon,
  title,
  children,
  tone = 'primary',
  className,
}: {
  icon: IconType;
  title: ReactNode;
  children?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col gap-2 rounded-lg border border-line bg-panel p-4 shadow-panel', className)}>
      <span className={clsx('inline-flex size-9 items-center justify-center rounded-md', iconTone[tone])}>
        <Icon size={18} strokeWidth={1.9} />
      </span>
      <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>
      {children && <p className="text-[13px] leading-snug text-ink-2">{children}</p>}
    </div>
  );
}

/** Single label/value stat for the landing "at a glance" strip. */
export function PitchStat({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-4 py-1 text-center">
      <span className="font-display text-2xl font-semibold tracking-tight text-ink">{value}</span>
      <span className="text-[11px] uppercase tracking-wide text-ink-3">{label}</span>
    </div>
  );
}
