import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { api, qk } from '@/lib/api';
import { useUI } from '@/lib/store';
import { Spinner } from '@/components/Spinner';
import { maskName } from '@/lib/mask';
import { useAuth, roleAtLeast } from '@/lib/auth';
import type { SearchHit } from '@/lib/cdm';

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Fetches the parcel bbox and flies the map there; opens the drawer. */
export function useOpenParcel() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { select, requestFlyTo } = useUI();
  return async (ulpin: string, bbox?: [number, number, number, number] | null) => {
    if (pathname !== '/') await navigate({ to: '/', search: { ulpin } });
    select(ulpin);
    let b = bbox ?? null;
    if (!b) {
      try {
        const f = await api.parcelFeature(ulpin);
        b = (f.bbox as [number, number, number, number] | undefined) ?? bboxOf(f.geometry);
      } catch {
        b = null;
      }
    }
    if (b) requestFlyTo(b);
  };
}

export function bboxOf(geom: { type: string; coordinates: unknown } | null): [number, number, number, number] | null {
  if (!geom) return null;
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const walk = (c: unknown) => {
    if (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number') {
      w = Math.min(w, c[0]); e = Math.max(e, c[0]); s = Math.min(s, c[1]); n = Math.max(n, c[1]);
    } else if (Array.isArray(c)) c.forEach(walk);
  };
  walk(geom.coordinates);
  return Number.isFinite(w) ? [w, s, e, n] : null;
}

export function SearchBox() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const dq = useDebounced(q.trim(), 250);
  const listId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const openParcel = useOpenParcel();
  const { role } = useAuth();

  const results = useQuery({
    queryKey: qk.search(dq),
    queryFn: ({ signal }) => api.search(dq, signal),
    enabled: dq.length >= 2,
    staleTime: 30_000,
  });
  const hits: SearchHit[] = results.data ?? [];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  useEffect(() => setActive(0), [dq]);

  const pick = (h: SearchHit) => {
    setOpen(false);
    setQ('');
    void openParcel(h.ulpin, h.bbox ?? null);
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex h-8 items-center gap-2 rounded-md border border-line bg-ground px-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
        <Search size={15} className="shrink-0 text-ink-3" />
        <input
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && hits[active] ? `${listId}-${active}` : undefined}
          placeholder={roleAtLeast(role, 'officer') ? 'Search survey no, ULPIN, khata or owner…' : 'Search survey no, ULPIN or khata…'}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === 'Enter') { const h = hits[active]; if (h) pick(h); }
            else if (e.key === 'Escape') setOpen(false);
          }}
          className="h-full w-full bg-transparent text-sm outline-none placeholder:text-ink-3"
        />
        {results.isFetching ? <Spinner size={14} /> : q && (
          <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="text-ink-3 hover:text-ink">
            <X size={14} />
          </button>
        )}
      </div>
      {open && dq.length >= 2 && (
        <ul id={listId} role="listbox" className="fade-up absolute left-0 right-0 z-40 mt-1 max-h-80 overflow-y-auto rounded-lg border border-line bg-panel p-1 shadow-panel scroll-thin">
          {results.isError && <li className="px-2 py-2 text-xs text-brick">Search unavailable</li>}
          {!results.isError && hits.length === 0 && !results.isFetching && <li className="px-2 py-2 text-xs text-ink-3">No parcels match “{dq}”</li>}
          {hits.map((h, i) => (
            <li
              key={h.ulpin}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(h)}
              className={clsx('flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm', i === active && 'bg-primary-soft')}
            >
              <span className="min-w-0">
                <span className="font-medium">Sy. No. {h.survey_no}</span>
                <span className="text-ink-3"> · {h.village ?? 'Mangalagiri'}</span>
                {h.owner_name && <span className="block truncate text-xs text-ink-3">{roleAtLeast(role, 'officer') ? h.owner_name : maskName(h.owner_name)}</span>}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-ink-3">{h.khata_no ?? h.ulpin}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
