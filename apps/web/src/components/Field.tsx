import { clsx } from 'clsx';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[#18231F]">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs font-medium text-brick">{error}</p> : hint ? <p className="text-xs font-medium text-[#4B5345]">{hint}</p> : null}
    </div>
  );
}

const control =
  'w-full bg-[#E9E5D8]/70 border border-[#D5D2C7] text-[#18231F] placeholder-[#6F7768] rounded-xl px-3.5 py-2 text-sm focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] focus:outline-none transition-all disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }>(function Input(
  { className, mono, ...rest },
  ref,
) {
  return <input ref={ref} {...rest} className={clsx(control, mono && 'font-mono', className)} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} {...rest} className={clsx(control, 'min-h-20', className)} />;
});

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={clsx(control, 'pr-8 appearance-none bg-no-repeat', className)} style={{
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2323483A' stroke-width='2.5'><path d='m6 9 6 6 6-6'/></svg>\")",
      backgroundPosition: 'right 12px center',
    }}>
      {children}
    </select>
  );
}

export function Checkbox({ label, hint, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode; className?: string }) {
  const id = useId();
  return (
    <label htmlFor={rest.id ?? id} className="flex cursor-pointer items-start gap-2.5 text-sm text-[#18231F] w-full">
      <input
        id={rest.id ?? id}
        type="checkbox"
        {...rest}
        className={clsx(
          'mt-0.5 w-4 h-4 rounded accent-[#176B52] text-[#176B52] focus:ring-[#176B52]/40 focus:ring-offset-0 border-[#D5D2C7] cursor-pointer shrink-0',
          className,
        )}
      />
      <span className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-[#18231F] block">{label}</span>
        {hint && <span className="block text-[11px] text-[#4B5345] mt-0.5 leading-snug">{hint}</span>}
      </span>
    </label>
  );
}
