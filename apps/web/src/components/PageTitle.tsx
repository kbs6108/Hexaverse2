import type React from 'react';

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 w-full">
      <div>
        <h1 className="text-[#18231F] font-black text-2xl sm:text-3xl tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[#4B5345] text-xs sm:text-sm font-medium leading-relaxed">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
