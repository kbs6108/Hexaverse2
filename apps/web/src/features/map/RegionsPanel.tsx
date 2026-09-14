import { Globe2 } from 'lucide-react';
import { useUI } from '@/lib/store';
import { INDIA_BBOX, useDemoRegions } from './regions';

/** Compact region index (bottom-left): jump between the three state clusters or back to
 *  the all-India overview. Complements the on-map cluster markers, which only show at
 *  national zoom — this panel works from any zoom. */
export function RegionsPanel() {
  const regions = useDemoRegions();
  const requestFlyTo = useUI((s) => s.requestFlyTo);
  if (!regions.data || regions.data.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-10 left-3 z-10 flex flex-col gap-1">
      <div className="pointer-events-auto flex flex-col overflow-hidden rounded-lg border border-line bg-panel/95 shadow-panel backdrop-blur">
        <span className="border-b border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-3">Regions</span>
        {regions.data.map((r) => (
          <button
            key={r.code}
            type="button"
            onClick={() => requestFlyTo(r.bbox)}
            className="flex items-center justify-between gap-3 px-2.5 py-1.5 text-left text-[12px] hover:bg-primary-soft/50"
          >
            <span className="font-medium text-ink">
              <span className="mr-1.5 font-mono text-[10px] text-primary">{r.code}</span>
              {r.district}
            </span>
            <span className="text-[10.5px] text-ink-3">{r.parcel_count}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => requestFlyTo(INDIA_BBOX)}
          className="flex items-center gap-1.5 border-t border-line px-2.5 py-1.5 text-left text-[12px] font-medium text-primary hover:bg-primary-soft/50"
        >
          <Globe2 size={13} /> All India
        </button>
      </div>
    </div>
  );
}
