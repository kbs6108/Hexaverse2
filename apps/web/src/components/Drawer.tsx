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
  className,
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
        'absolute top-0 right-0 bottom-0 z-20 flex flex-col bg-[#F4F1E7]/85 backdrop-blur-2xl border-l border-[#D5D2C7]/60 text-[#18231F] shadow-[0_8px_32px_rgba(24,35,31,0.08)] transition-transform duration-200 ease-out',
        width,
        open ? 'translate-x-0' : 'translate-x-full pointer-events-none',
        className,
      )}
    >
      <div className="flex items-start gap-2 border-b border-[#D5D2C7]/50 px-4 py-3">
        <div className="min-w-0 flex-1">{header ?? <h2 className="text-lg font-semibold text-[#18231F]">{title}</h2>}</div>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-lg p-1.5 text-[#6F7768] hover:bg-[#E9E5D8]/60 hover:text-[#18231F] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">{children}</div>
    </aside>
  );
}
