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
  shine?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink border-transparent shadow-xs hover:brightness-110 active:brightness-95 specular-border',
  secondary: 'bg-panel text-ink border-line shadow-xs hover:bg-panel-2 hover:border-line-strong',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-ground-2 hover:text-ink',
  danger: 'bg-brick text-white border-transparent shadow-xs hover:brightness-110',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-xl',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  icon,
  shine = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center border font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none',
        variants[variant],
        sizes[size],
        shine && 'button-shine',
        className,
      )}
    >
      {loading ? <Spinner size={14} /> : icon}
      {children}
    </button>
  );
}
