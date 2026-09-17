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
  primary: 'bg-[#176B52] text-[#F4F1E7] hover:bg-[#23483A] font-bold border-transparent shadow-sm transition-all',
  secondary: 'bg-[#F4F1E7]/80 backdrop-blur-md text-[#18231F] border border-[#D5D2C7] hover:bg-[#E9E5D8] hover:border-[#176B52]/50 font-semibold shadow-xs transition-all',
  ghost: 'bg-transparent text-[#23483A] border-transparent hover:bg-[#E9E5D8]/70 hover:text-[#18231F] font-semibold transition-all',
  danger: 'bg-brick text-white border-transparent hover:brightness-110 font-bold shadow-sm',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-xl',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl py-2.5',
};

export function Button({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center border font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed',
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
