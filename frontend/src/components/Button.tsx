import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink border-transparent hover:brightness-110 active:brightness-95',
  secondary: 'bg-panel text-ink border-line hover:bg-panel-2 hover:border-line-strong',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-ground-2 hover:text-ink',
  danger: 'bg-brick text-white border-transparent hover:brightness-110',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
};

export function Button({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center rounded-md border font-medium whitespace-nowrap transition-[background,filter,border-color] disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  );
}
