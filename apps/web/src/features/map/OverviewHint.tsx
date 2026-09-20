import { MousePointerClick, X } from 'lucide-react';
import { useUI } from '@/lib/store';

/** One-time, dismissible orientation hint on the national overview. Remembered per browser. */
export function OverviewHint() {
  const seen = useUI((s) => s.seenOverviewHint);
  const dismiss = useUI((s) => s.dismissOverviewHint);
  if (seen) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-24 z-10 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#D5D2C7]/50 bg-[#F4F1E7]/40 py-1.5 pl-3 pr-1.5 shadow-[0_8px_32px_rgba(24,35,31,0.08)] backdrop-blur-xl text-[#18231F]">
        <MousePointerClick size={14} className="shrink-0 text-[#176B52]" />
        <p className="text-[12.5px] text-[#6F7768]">
          <span className="font-medium text-[#18231F]">Click a state card to fly in</span> — parcels appear once you're zoomed into a cluster.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss hint"
          className="flex size-6 items-center justify-center rounded-full text-[#6F7768] hover:bg-[#E9E5D8]/60 hover:text-[#18231F] transition-colors cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
