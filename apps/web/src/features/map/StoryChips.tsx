import { useQuery } from '@tanstack/react-query';
import { MapPin, Sparkles } from 'lucide-react';
import { qk } from '@/lib/api';
import type { StoryParcel } from '@/lib/cdm';
import { useOpenParcel } from './SearchBox';
import { useMyParcel } from '@/lib/my-parcel';

/** Demo shortcuts for the §10 story parcels. Silent when /data/story_parcels.json is absent. */
export function StoryChips() {
  const { parcel: myParcel, hasOwnedLand, goToMyParcel } = useMyParcel();
  const q = useQuery({
    queryKey: qk.storyParcels(),
    queryFn: async (): Promise<StoryParcel[]> => {
      const r = await fetch('/data/story_parcels.json');
      if (!r.ok) return [];
      const j: unknown = await r.json();
      const arr = Array.isArray(j) ? j : (j as { parcels?: unknown }).parcels;
      return Array.isArray(arr) ? (arr as StoryParcel[]) : [];
    },
    staleTime: Infinity,
    retry: false,
  });
  const openParcel = useOpenParcel();
  if (!q.data || q.data.length === 0) return null;
  return (
    <div className="pointer-events-none absolute top-3 left-1/2 z-10 flex max-w-[65vw] -translate-x-1/2 items-center gap-1.5 overflow-x-auto scroll-thin py-0.5 px-2">
      {hasOwnedLand && myParcel && (
        <button
          type="button"
          onClick={goToMyParcel}
          title={`Your owned parcel (${myParcel.village}): Survey ${myParcel.survey_no}`}
          className="pointer-events-auto shrink-0 flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary-soft/95 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur-md hover:bg-primary hover:text-white transition-all cursor-pointer"
        >
          <MapPin size={12} className="shrink-0" />
          <span>My Land ({myParcel.survey_no})</span>
        </button>
      )}
      <span className="pointer-events-auto shrink-0 flex items-center gap-1.5 rounded-full border border-line bg-panel/95 px-3 py-1 text-[11px] font-semibold text-ink shadow-panel backdrop-blur-md">
        <Sparkles size={12} className="text-amber" /> Story parcels:
      </span>
      {q.data.map((s) => (
        <button
          key={s.survey_no}
          type="button"
          disabled={!s.ulpin}
          title={s.note ?? (s.owner_name ? `Owner: ${s.owner_name}` : undefined)}
          onClick={() => s.ulpin && void openParcel(s.ulpin, s.bbox ?? null)}
          className="pointer-events-auto shrink-0 rounded-full border border-line bg-panel/95 px-3 py-1 text-xs font-medium text-ink-2 shadow-panel backdrop-blur-md hover:border-primary hover:text-primary hover:bg-ground-2 transition-all disabled:opacity-50"
        >
          <span className="font-mono font-semibold text-ink">{s.survey_no}</span> · {s.title ?? (s.key ? s.key.replace(/_/g, ' ') : s.land_use ?? '')}
        </button>
      ))}
    </div>
  );
}
