import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Right-hand sheet. Non-modal by default (the map stays interactive) but traps Escape
 * and moves focus into the panel when opened.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'w-[460px] max-w-[92vw]',
  className = 'top-20 right-0 sm:right-4 bottom-0 sm:bottom-4 sm:rounded-2xl border-l sm:border border-[#D5D2C7]/70',
  header,
  ariaLabel,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  width?: string;
  className?: string;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <aside
      ref={ref}
      role="dialog"
      aria-label={ariaLabel}
      aria-hidden={!open}
      className={clsx(
        'absolute z-40 flex flex-col bg-[#F4F1E7]/92 backdrop-blur-2xl text-[#18231F] shadow-[0_16px_48px_rgba(24,35,31,0.14)] transition-all duration-300 ease-out overflow-hidden',
        width,
        className,
        open ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-[calc(100%+2rem)] opacity-0 pointer-events-none',
      )}
    >
      <div className="flex items-start gap-2 border-b border-[#D5D2C7]/60 bg-[#F4F1E7]/70 px-4 py-3">
        <div className="min-w-0 flex-1">{header ?? <h2 className="text-lg font-semibold text-[#18231F]">{title}</h2>}</div>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-xl p-1.5 text-[#6F7768] hover:bg-[#E9E5D8] hover:text-[#18231F] transition-colors cursor-pointer shrink-0"
        >
          <X size={19} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">{children}</div>
    </aside>
  );
}
