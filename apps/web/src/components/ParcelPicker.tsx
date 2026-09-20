import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, History, Sparkles } from 'lucide-react';
import { qk } from '@/lib/api';
import type { StoryParcel } from '@/lib/cdm';
import { useUI } from '@/lib/store';
import { Input } from './Field';

/** ULPIN input with a picker of recently opened parcels and the demo story parcels,
 *  so nobody has to retype a 14-character id. Purely a convenience over the Input —
 *  callers keep full control of the value. */
export function ParcelPicker({ id, value, onChange }: { id: string; value: string; onChange: (ulpin: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const recent = useUI((s) => s.recentParcels);
  const story = useQuery({
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

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (ulpin: string) => {
    onChange(ulpin);
    setOpen(false);
  };

  const stories = (story.data ?? []).filter((s) => s.ulpin);
  const hasMenu = recent.length > 0 || stories.length > 0;

  return (
    <div ref={wrap} className="relative">
      <div className="flex gap-1.5">
        <Input id={id} mono required value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} placeholder="TFCM91641E6C82" />
        {hasMenu && (
          <button
            type="button"
            aria-expanded={open}
            aria-label="Pick a parcel"
            onClick={() => setOpen((o) => !o)}
            className="flex shrink-0 items-center gap-1 rounded-md border border-line bg-panel px-2 text-xs font-medium text-ink-2 hover:border-line-strong hover:bg-panel-2"
          >
            Pick <ChevronDown size={13} className={open ? 'rotate-180' : ''} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto scroll-thin rounded-md border border-line bg-panel shadow-panel">
          {recent.length > 0 && (
            <>
              <p className="flex items-center gap-1 border-b border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-3"><History size={11} /> Recently opened</p>
              {recent.map((r) => (
                <button key={r.ulpin} type="button" onClick={() => pick(r.ulpin)} className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[13px] hover:bg-primary-soft/50">
                  <span className="font-medium">{r.survey_no ? `Sy. ${r.survey_no}` : r.ulpin}{r.village ? <span className="ml-1 text-[11px] text-ink-3">{r.village}</span> : null}</span>
                  <span className="font-mono text-[10.5px] text-ink-3">{r.ulpin}</span>
                </button>
              ))}
            </>
          )}
          {stories.length > 0 && (
            <>
              <p className="flex items-center gap-1 border-b border-t border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-3 first:border-t-0"><Sparkles size={11} /> Demo parcels</p>
              {stories.map((s) => (
                <button
                  key={s.ulpin}
                  type="button"
                  onClick={() => pick(s.ulpin!)}
                  className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[13px] hover:bg-primary-soft/50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 flex items-center gap-1.5 truncate">
                    <span className="font-medium shrink-0">Sy. {s.survey_no}</span>
                    <span className="text-[11px] text-ink-3 truncate">
                      {(s.title ?? s.key ?? '').toString().replace(/_/g, ' ')}
                      {s.owner_name ? ` · ${s.owner_name}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {s.state && (
                      <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-ground-2 text-ink-3 font-semibold">{s.state}</span>
                    )}
                    <span className="font-mono text-[10.5px] text-ink-3">{s.ulpin}</span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
