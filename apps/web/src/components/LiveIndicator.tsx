import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

export type LiveTone = 'emerald' | 'amber' | 'brick' | 'violet' | 'slate';

export interface LiveIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: LiveTone;
  size?: 'sm' | 'md';
  ping?: boolean;
  label?: string;
  className?: string;
}

const toneMap: Record<LiveTone, { dot: string; ping: string; text: string }> = {
  emerald: { dot: 'bg-emerald-500', ping: 'bg-emerald-400', text: 'text-emerald-700 dark:text-emerald-400' },
  amber: { dot: 'bg-amber-500', ping: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-400' },
  brick: { dot: 'bg-brick', ping: 'bg-brick/80', text: 'text-brick' },
  violet: { dot: 'bg-violet', ping: 'bg-violet/80', text: 'text-violet' },
  slate: { dot: 'bg-slate', ping: 'bg-slate/80', text: 'text-slate' },
};

/**
 * Minimalist, breathing live indicator dot inspired by Manus.im & KokonutUI.
 * Used for live statutory notices, satellite sync, and real-time database state.
 */
export function LiveIndicator({
  tone = 'emerald',
  size = 'md',
  ping = true,
  label,
  className,
  ...rest
}: LiveIndicatorProps) {
  const colors = toneMap[tone];
  const dotSize = size === 'sm' ? 'size-1.5' : 'size-2';
  const pingSize = size === 'sm' ? 'size-1.5' : 'size-2';

  return (
    <span {...rest} className={clsx('inline-flex items-center gap-1.5 select-none', className)}>
      <span className="relative flex items-center justify-center">
        {ping && (
          <span
            className={clsx(
              'absolute inline-flex rounded-full opacity-75 animate-ping',
              pingSize,
              colors.ping,
            )}
          />
        )}
        <span className={clsx('relative inline-flex rounded-full shadow-2xs', dotSize, colors.dot)} />
      </span>
      {label && <span className={clsx('text-[11px] font-medium leading-none', colors.text)}>{label}</span>}
    </span>
  );
}
