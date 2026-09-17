import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={clsx(
        'rounded-2xl border border-[#176B52]/15 bg-[#F4F1E7]/45 backdrop-blur-xl shadow-[0_8px_32px_rgba(24,35,31,0.04)] text-[#18231F] transition-all duration-200',
        className,
      )}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-start justify-between gap-3 px-6 pt-6 pb-3 border-b border-[#D5D2C7]/60', className)}>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-[#18231F] tracking-tight leading-tight">{title}</h3>
        {subtitle && <p className="text-xs font-medium text-[#4B5345] mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={clsx('p-6 text-[#18231F]', className)} />;
}
