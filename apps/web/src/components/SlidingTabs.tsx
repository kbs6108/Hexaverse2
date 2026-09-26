import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export interface SlidingTabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  count?: number | string;
  badge?: ReactNode;
}

export interface SlidingTabsProps<T extends string = string> {
  items: SlidingTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  layoutId?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Animated Segmented Control with a gliding background pill inspired by Motion.dev & Linear.
 * Seamless spring physics on tab changes.
 */
export function SlidingTabs<T extends string = string>({
  items,
  value,
  onChange,
  layoutId = 'sliding-tab-pill',
  className,
  size = 'md',
}: SlidingTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={clsx(
        'relative inline-flex items-center gap-1 rounded-xl bg-ground-2 p-1 border border-line select-none max-w-full overflow-x-auto',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={clsx(
              'relative z-10 flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors cursor-pointer text-center whitespace-nowrap shrink-0',
              size === 'sm' ? 'py-1 px-2.5 text-xs' : 'py-1.5 px-3.5 text-xs',
              isActive ? 'text-primary font-bold' : 'text-ink-3 hover:text-ink',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 z-[-1] rounded-lg bg-panel shadow-xs border border-line/60"
              />
            )}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={clsx(
                  'rounded px-1.5 py-0.2 text-[10px] font-mono',
                  isActive ? 'bg-primary-soft text-primary' : 'bg-ground text-ink-3',
                )}
              >
                {item.count}
              </span>
            )}
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
