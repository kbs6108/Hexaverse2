import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe2, MapPin, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useUI } from '@/lib/store';
import { INDIA_BBOX, useDemoRegions, type DemoRegion } from './regions';
import { useTranslation } from '@/lib/i18n';

/** Minimalist, compact dropdown for jumping between the 3 pilot state clusters or All India */
export function RegionsPanel() {
  const regions = useDemoRegions();
  const requestFlyTo = useUI((s) => s.requestFlyTo);
  const { t } = useTranslation();
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
            ? 'border-[#23483A] bg-[#23483A] text-[#F4F1E7] ring-2 ring-[#23483A]/20'
            : 'border-[#D5D2C7] bg-[#F4F1E7]/90 text-[#18231F] hover:bg-[#E9E5D8]'
        )}
      >
        <MapPin size={13} className={open ? 'text-[#B38A4C]' : 'text-[#176B52]'} />
        <span>
          {activeRegion ? `${activeRegion.code} · ${activeRegion.village}` : 'Regions'}
        </span>
        <ChevronDown
          size={13}
          className={clsx('transition-transform duration-200', open ? '-rotate-180 text-[#B38A4C]' : 'text-[#6F7768]')}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1.5 w-64 origin-top-right rounded-2xl border border-[#D5D2C7] bg-[#F4F1E7]/95 p-1.5 shadow-[0_12px_36px_rgba(24,35,31,0.12)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6F7768] border-b border-[#D5D2C7]/60">
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
                      ? 'bg-[#176B52] text-[#F4F1E7]'
                      : 'text-[#18231F] hover:bg-[#E9E5D8]/80'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={clsx(
                        'inline-flex size-5 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold',
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#176B52]/10 text-[#176B52]'
                      )}
                    >
                      {r.code}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold leading-tight">{r.village}</div>
                      <div className={clsx('text-[10px]', isSelected ? 'text-white/70' : 'text-[#6F7768]')}>
                        {r.district} · {r.state}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span
                      className={clsx(
                        'rounded px-1.5 py-0.5 font-mono text-[9.5px]',
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#D5D2C7]/70 text-[#4B5345]'
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
          <div className="border-t border-[#D5D2C7]/60 pt-1">
            <button
              type="button"
              onClick={handleAllIndia}
              className={clsx(
                'flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer',
                activeCode === null
                  ? 'bg-[#176B52] text-[#F4F1E7]'
                  : 'text-[#18231F] hover:bg-[#E9E5D8]/80'
              )}
            >
              <div className="flex items-center gap-2">
                <Globe2 size={13} className={activeCode === null ? 'text-[#B38A4C]' : 'text-[#176B52]'} />
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
