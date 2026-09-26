import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, CornerDownLeft, Mic, MicOff, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useVoiceSearch, LOCALE_LANG_NAMES } from '@/lib/useVoiceSearch';
import { api, qk } from '@/lib/api';
import { useUI, type RecentParcel } from '@/lib/store';
import { Spinner } from '@/components/Spinner';
import { maskName } from '@/lib/mask';
import { useAuth, roleAtLeast } from '@/lib/auth';
import type { SearchHit } from '@/lib/cdm';
import { useTranslation } from '@/lib/i18n';

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
    if (pathname !== '/map') await navigate({ to: '/map', search: { ulpin } });
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

export interface SearchBoxProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Fixed pop-down search container attached to the floating dock header.
 * Stays open while the citizen is searching and closes upon picking a parcel or pressing Esc.
 */
export function SearchBox({ isOpen = true, onClose, className }: SearchBoxProps = {}) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const dq = useDebounced(q.trim(), 220);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const openParcel = useOpenParcel();
  const { role } = useAuth();
  const { t, locale } = useTranslation();
  const recentParcels = useUI((s) => s.recentParcels);

  const voice = useVoiceSearch({
    locale,
    silenceDurationMs: 4500, // 4.5s silence duration
    onFinalTranscript: (meaningfulQuery) => {
      if (meaningfulQuery.trim()) {
        setQ(meaningfulQuery);
      }
    },
    onInterimTranscript: (interim) => {
      if (interim.trim()) {
        setQ(interim);
      }
    },
  });

  const results = useQuery({
    queryKey: qk.search(dq),
    queryFn: ({ signal }) => api.search(dq, signal),
    enabled: dq.length >= 2,
    staleTime: 30_000,
  });
  const hits: SearchHit[] = results.data ?? [];

  // Focus input automatically when search box pops down
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      setQ('');
      setActive(0);
    }
  }, [isOpen]);

  // Click outside to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        voice.cancelListening();
        onClose?.();
      }
    };
    // Delay listener slightly to prevent immediate closing on the click that opened it
    const timer = setTimeout(() => document.addEventListener('mousedown', onDoc), 20);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [isOpen, onClose]);

  useEffect(() => setActive(0), [dq]);

  const pick = (h: SearchHit) => {
    onClose?.();
    setQ('');
    void openParcel(h.ulpin, h.bbox ?? null);
  };

  const pickRecent = (r: RecentParcel) => {
    onClose?.();
    setQ('');
    void openParcel(r.ulpin, null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ type: 'spring', damping: 28, stiffness: 360 }}
          className={clsx(
            'absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[94vw] sm:w-[520px] max-w-[560px] z-50 rounded-2xl border border-line bg-panel/95 backdrop-blur-2xl shadow-xl text-ink overflow-hidden select-none',
            className,
          )}
        >
          {/* Pop-down Search Header Bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-ground-1/50">
            <Search className="text-primary w-4 h-4 shrink-0" />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={hits[active] ? `${listId}-${active}` : undefined}
              placeholder={t('nav.searchPlaceholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, hits.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === 'Enter') {
                  const h = hits[active];
                  if (h) pick(h);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  onClose?.();
                }
              }}
              className="w-full bg-transparent text-sm font-semibold text-ink placeholder-ink-3 outline-none cursor-text select-text"
            />
            {results.isFetching ? (
              <Spinner size={14} className="text-primary" />
            ) : (
              q && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQ('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-md text-ink-3 hover:text-ink hover:bg-ground-2 transition-colors cursor-pointer shrink-0"
                >
                  <X size={14} />
                </button>
              )
            )}

            {/* Voice search button & silence timer */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (voice.isListening) {
                    voice.stopListening();
                  } else {
                    voice.startListening();
                  }
                }}
                title={
                  voice.isSupported
                    ? `${t('ai.voiceSearch')} (${LOCALE_LANG_NAMES[locale]?.nativeName || locale})`
                    : t('ai.voiceNotSupported')
                }
                aria-label={t('ai.voiceSearch')}
                className={`p-1 rounded-md transition-all shrink-0 cursor-pointer ${
                  voice.isListening
                    ? 'bg-brick text-white shadow-xs animate-pulse ring-2 ring-brick/30'
                    : 'text-ink-3 hover:text-primary hover:bg-ground-2'
                }`}
              >
                {voice.isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              {voice.isListening && voice.silenceSecondsRemaining !== null && (
                <span className="text-[10px] font-mono text-brick font-semibold">
                  ⏱ {voice.silenceSecondsRemaining}s
                </span>
              )}
            </div>

            {/* Esc dismiss shortcut pill */}
            <button
              type="button"
              onClick={() => {
                voice.cancelListening();
                onClose?.();
              }}
              aria-label="Close search"
              className="flex items-center gap-1 text-[11px] font-semibold text-ink-3 hover:text-ink px-1.5 py-0.5 rounded-md border border-line bg-ground-1 hover:bg-ground-2 transition-colors cursor-pointer shrink-0"
            >
              <span>Esc</span>
            </button>
          </div>

          {/* Results & Quick Actions Body */}
          <div className="max-h-80 overflow-y-auto p-2 scroll-thin">
            {/* Active search results */}
            {dq.length >= 2 && (
              <ul id={listId} role="listbox">
                {results.isError && (
                  <li className="px-3 py-2 text-xs font-semibold text-brick">Search service temporarily unavailable</li>
                )}
                {!results.isError && hits.length === 0 && !results.isFetching && (
                  <li className="px-3 py-3 text-xs text-ink-3 text-center">
                    No parcels match <span className="font-bold text-ink">“{dq}”</span>
                  </li>
                )}
                {hits.map((h, i) => (
                  <li
                    key={h.ulpin}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(h)}
                    className={clsx(
                      'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                      i === active
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-ink hover:bg-ground-2',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">Sy. No. {h.survey_no}</span>
                        <span className={clsx('text-xs truncate', i === active ? 'text-white/80' : 'text-ink-3')}>
                          {h.village ?? ''}
                        </span>
                      </div>
                      {h.owner_name && (
                        <span className={clsx('block truncate text-[11.5px] mt-0.5', i === active ? 'text-white/85' : 'text-ink-3')}>
                          Owner: {roleAtLeast(role, 'officer') ? h.owner_name : maskName(h.owner_name)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={clsx('font-mono text-[11px] px-2 py-0.5 rounded-md border', i === active ? 'border-white/20 bg-white/10 text-white' : 'border-line bg-ground-1 text-ink-3')}>
                        {h.khata_no ?? h.ulpin}
                      </span>
                      {i === active && <CornerDownLeft size={13} className="text-white/80" />}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Quick Suggestions & Recent Parcels when query is short */}
            {dq.length < 2 && (
              <div className="space-y-3 p-1">
                {recentParcels.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-ink-3">
                      <Clock size={11} /> Recent Parcels
                    </div>
                    <div className="space-y-1">
                      {recentParcels.map((r) => (
                        <button
                          key={r.ulpin}
                          type="button"
                          onClick={() => pickRecent(r)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left rounded-xl hover:bg-ground-2 transition-colors cursor-pointer text-xs"
                        >
                          <span className="font-semibold text-ink">
                            Sy. No. {r.survey_no || '—'}{' '}
                            <span className="font-normal text-ink-3">· {r.village || ''}</span>
                          </span>
                          <span className="font-mono text-[10.5px] text-ink-3 truncate max-w-[140px]">
                            {r.ulpin}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="px-3.5 py-2.5 rounded-xl bg-ground-2/80 border border-line flex items-start gap-2.5 text-[12px] text-ink-2">
                    <Search size={14} className="text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-ink">
                        Authoritative Land Records Search
                      </p>
                      <p className="text-[11.5px] text-ink-3 leading-relaxed">
                        Search by <strong className="text-ink">14-character ULPIN</strong> (e.g. TFCM91641E6C82 or 3D strata TFCM91641E6C82-U01), <strong className="text-ink">Survey No</strong> with subdivisions (e.g. 123/4, 142), or <strong className="text-ink">Khata Passbook No</strong>.
                      </p>
                      <p className="text-[11px] text-ink-3 flex items-center gap-1">
                        <Mic size={11} className="text-primary" />
                        <span>Voice search supports English, Telugu (తెలుగు), and Hindi (हिन्दी) with speech pause auto-stop.</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="px-2 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-3">
                      Representative Demo Scenarios
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '3D Strata Unit', ulpin: 'TFCM91641E6C82', desc: 'ISO 19152 Volumetric' },
                        { label: 'Corridor Severance', ulpin: 'TFCM91KDED50FD', desc: 'RFCTLARR 2013 Take' },
                        { label: 'Satellite Alert', ulpin: 'TFCM91D3533DD2', desc: 'Sentinel-2 Built-up Surge' },
                        { label: 'Court Dispute', ulpin: 'TFCM9167B91686', desc: 'Civil Suit Injunction' },
                        { label: 'Bank Mortgage', ulpin: 'TFCM916196F0FE', desc: 'Active SBI Charge' },
                        { label: 'Pending Mutation', ulpin: 'TFCM914291996F', desc: '4-Stage Desk Review' },
                      ].map((item) => (
                        <button
                          key={item.ulpin}
                          type="button"
                          onClick={() => {
                            onClose?.();
                            setQ('');
                            void openParcel(item.ulpin, null);
                          }}
                          className="group inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel hover:bg-ground-2 hover:border-primary/40 px-2.5 py-1.5 text-xs text-left transition-all cursor-pointer shadow-2xs"
                        >
                          <span className="size-1.5 rounded-full bg-primary group-hover:scale-125 transition-transform" />
                          <span className="font-semibold text-ink">{item.label}</span>
                          <span className="text-[10px] text-ink-3 hidden sm:inline">· {item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SearchBox;
