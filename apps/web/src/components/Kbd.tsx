import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
}

/**
 * Tactile, embossed keyboard shortcut badge inspired by Shadcn UI & Linear.
 * Matches Land Stack's warm sandstone & ink palette.
 */
export function Kbd({ children, className, ...rest }: KbdProps) {
  return (
    <kbd
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-ink-2',
        'bg-[#E9E5D8] border border-[#D5D2C7] shadow-[0_1px_0_0.5px_rgba(24,35,31,0.08),inset_0_1px_0_0_rgba(255,255,255,0.8)] select-none',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
