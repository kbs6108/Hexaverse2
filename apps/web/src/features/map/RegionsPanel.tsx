import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe2, MapPin, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useUI } from '@/lib/store';
import { INDIA_BBOX, useDemoRegions, type DemoRegion } from './regions';

/** Minimalist, compact dropdown for jumping between the 3 pilot state clusters or All India */
export function RegionsPanel() {
  const regions = useDemoRegions();
  const requestFlyTo = useUI((s) => s.requestFlyTo);
  const [open, setOpen] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Close dropdown on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  const isDrawerOpen = useUI((s) => s.drawerOpen && !!s.selectedUlpin);

  if (!regions.data || regions.data.length === 0) return null;

  const activeRegion = regions.data.find((r) => r.code === activeCode);

  const handleSelect = (r: DemoRegion) => {
    setActiveCode(r.code);
    requestFlyTo(r.bbox);
    setOpen(false);
  };

  const handleAllIndia = () => {
    setActiveCode(null);
    requestFlyTo(INDIA_BBOX);
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        'absolute top-20 z-30 select-none transition-all duration-300 ease-out',
        isDrawerOpen ? 'right-4 sm:right-[488px] max-sm:hidden' : 'right-4',
      )}
    >
      {/* Trigger Pill */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={clsx(
          'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-2xl transition-all cursor-pointer shadow-xs',
          open
            ? 'border-primary bg-primary text-white ring-2 ring-primary/20'
            : 'border-line bg-panel/90 text-ink hover:bg-ground-2'
        )}
      >
        <MapPin size={13} className={open ? 'text-amber' : 'text-primary'} />
        <span>
          {activeRegion ? `${activeRegion.code} · ${activeRegion.village}` : 'Regions'}
        </span>
        <ChevronDown
          size={13}
          className={clsx('transition-transform duration-200', open ? '-rotate-180 text-amber' : 'text-ink-3')}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1.5 w-64 origin-top-right rounded-2xl border border-line bg-panel/95 p-1.5 shadow-lg backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-3 border-b border-line">
            Pilot Cadastral Clusters
          </div>

          <div className="py-1 space-y-0.5">
            {regions.data.map((r) => {
              const isSelected = activeCode === r.code;
              return (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className={clsx(
                    'flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-primary text-white'
                      : 'text-ink hover:bg-ground-2'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={clsx(
                        'inline-flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold',
                        isSelected ? 'bg-white/20 text-white' : 'bg-primary-soft text-primary'
                      )}
                    >
                      {r.code}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold leading-tight">{r.village}</div>
                      <div className={clsx('text-[10px]', isSelected ? 'text-white/70' : 'text-ink-3')}>
                        {r.district} · {r.state}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span
                      className={clsx(
                        'rounded px-1.5 py-0.5 font-mono text-[9.5px]',
                        isSelected ? 'bg-white/20 text-white' : 'bg-ground-2 text-ink-2'
                      )}
                    >
                      {r.parcel_count}
                    </span>
                    {isSelected && <Check size={12} className="text-white ml-0.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* All India Overview */}
          <div className="border-t border-line pt-1">
            <button
              type="button"
              onClick={handleAllIndia}
              className={clsx(
                'flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer',
                activeCode === null
                  ? 'bg-primary text-white'
                  : 'text-ink hover:bg-ground-2'
              )}
            >
              <div className="flex items-center gap-2">
                <Globe2 size={13} className={activeCode === null ? 'text-amber' : 'text-primary'} />
                <span className="font-semibold">All India (Overview)</span>
              </div>
              {activeCode === null && <Check size={12} className="text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
