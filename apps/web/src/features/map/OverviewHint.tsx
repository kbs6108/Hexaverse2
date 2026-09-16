import { MousePointerClick, X } from 'lucide-react';
import { useUI } from '@/lib/store';

/** One-time, dismissible orientation hint on the national overview. Remembered per browser. */
export function OverviewHint() {
  const seen = useUI((s) => s.seenOverviewHint);
  const dismiss = useUI((s) => s.dismissOverviewHint);
  if (seen) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-primary/30 bg-panel/95 py-1.5 pl-3 pr-1.5 shadow-panel backdrop-blur">
        <MousePointerClick size={14} className="shrink-0 text-primary" />
        <p className="text-[12.5px] text-ink-2">
          <span className="font-medium text-ink">Click a state card to fly in</span> — parcels appear once you're zoomed into a cluster.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss hint"
          className="flex size-6 items-center justify-center rounded-full text-ink-3 hover:bg-ground-2 hover:text-ink"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
