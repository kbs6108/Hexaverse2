import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { qk } from '@/lib/api';
import type { StoryParcel } from '@/lib/cdm';
import { useOpenParcel } from './SearchBox';

/** Demo shortcuts for the §10 story parcels. Silent when /data/story_parcels.json is absent. */
export function StoryChips() {
  const q = useQuery({
    queryKey: qk.storyParcels(),
    queryFn: async (): Promise<StoryParcel[]> => {
      const r = await fetch(`/data/story_parcels.json?v=${Date.now()}`);
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
    <div className="pointer-events-none absolute top-3 left-1/2 z-10 flex max-w-[60vw] -translate-x-1/2 flex-wrap items-center justify-center gap-1.5">
      <span className="pointer-events-auto flex items-center gap-1 rounded-full bg-panel/90 px-2 py-1 text-[11px] font-medium text-ink-3 shadow-panel backdrop-blur">
        <Sparkles size={12} className="text-amber" /> Story parcels
      </span>
      {q.data.map((s) => (
        <button
          key={s.survey_no}
          type="button"
          disabled={!s.ulpin}
          title={s.note ?? (s.owner_name ? `Owner: ${s.owner_name}` : undefined)}
          onClick={() => s.ulpin && void openParcel(s.ulpin, s.bbox ?? null)}
          className="pointer-events-auto rounded-full border border-line bg-panel/90 px-2.5 py-1 text-xs shadow-panel backdrop-blur hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <span className="font-mono">{s.survey_no}</span> · {s.title ?? (s.key ? s.key.replace(/_/g, ' ') : s.land_use ?? '')}
        </button>
      ))}
    </div>
  );
}
