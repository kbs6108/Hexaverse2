import type { ReactNode } from 'react';
import { clsx } from 'clsx';

/** Key/value grid used throughout the profile drawer. */
export function KV({ items, cols = 2, className }: { items: { k: ReactNode; v: ReactNode; mono?: boolean }[]; cols?: 1 | 2 | 3; className?: string }) {
  return (
    <dl className={clsx('grid gap-x-4 gap-y-2', cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3', className)}>
      {items.map((it, i) => (
        <div key={i} className="min-w-0">
          <dt className="text-[11px] uppercase tracking-wide text-ink-3">{it.k}</dt>
          <dd className={clsx('text-sm text-ink break-words', it.mono && 'font-mono text-[13px]')}>{it.v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-semibold">{children}</h3>
      {right}
    </div>
  );
}

export function Callout({ tone = 'amber', title, children }: { tone?: 'amber' | 'brick' | 'primary' | 'slate'; title: ReactNode; children?: ReactNode }) {
  const map = {
    amber: 'border-amber/30 bg-amber-soft text-amber',
    brick: 'border-brick/30 bg-brick-soft text-brick',
    primary: 'border-primary/30 bg-primary-soft text-primary',
    slate: 'border-slate/30 bg-slate-soft text-slate',
  } as const;
  return (
    <div className={clsx('rounded-md border px-3 py-2 text-sm', map[tone])}>
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-[13px] opacity-90">{children}</div>}
    </div>
  );
}
