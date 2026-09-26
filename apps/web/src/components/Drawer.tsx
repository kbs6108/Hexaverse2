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
  className = 'top-20 right-0 sm:right-4 bottom-0 sm:bottom-4 sm:rounded-2xl border-l sm:border border-line shadow-elevated',
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
        'absolute z-40 flex flex-col bg-panel/95 backdrop-blur-2xl text-ink transition-all duration-300 ease-out overflow-hidden',
        width,
        className,
        open ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-[calc(100%+2rem)] opacity-0 pointer-events-none',
      )}
    >
      <div className="flex items-start gap-2 border-b border-line bg-panel/80 px-4 py-3">
        <div className="min-w-0 flex-1">{header ?? <h2 className="text-lg font-semibold text-ink">{title}</h2>}</div>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-xl p-1.5 text-ink-3 hover:bg-ground-2 hover:text-ink transition-colors cursor-pointer shrink-0"
        >
          <X size={19} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">{children}</div>
    </aside>
  );
}
