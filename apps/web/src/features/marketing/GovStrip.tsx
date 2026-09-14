import { clsx } from 'clsx';
import { Landmark } from 'lucide-react';

/**
 * Quiet government-identity footer — credits the real problem sponsor and gives
 * the app a govtech register, WITHOUT claiming official endorsement. Deliberately
 * muted (footer only, small type). No official State Emblem is used; the tricolor
 * swatch is a decorative accent, and the data is labelled a synthetic prototype.
 *
 * `variant="token"` (default) themes with the app design tokens (light + dark) for
 * the /welcome and /help pages; `variant="landing"` uses fixed light greys to match
 * the always-light cinematic landing.
 */
const CHIPS = ['Digital Public Infrastructure', 'OGC API Features', 'Consent-aware access', 'MeitY MDDS'];

function TricolorMark() {
  return (
    <span aria-hidden className="inline-flex h-3.5 w-3.5 flex-col overflow-hidden rounded-[3px] border border-black/10">
      <span className="flex-1" style={{ background: '#FF9933' }} />
      <span className="flex-1 bg-white" />
      <span className="flex-1" style={{ background: '#138808' }} />
    </span>
  );
}

/** Compact header signifier: tricolor accent + muted "Government of India", with the
 *  full ministry attribution in the tooltip. Text collapses to just the swatch on
 *  small screens so it never crowds the header. */
export function GovBadge({
  variant = 'token',
  compact = false,
  className,
}: {
  variant?: 'token' | 'landing';
  /** Single-line form that fits inside the slim h-12 app header. */
  compact?: boolean;
  className?: string;
}) {
  const strong = variant === 'landing' ? 'text-[#1d1d1f]' : 'text-ink-2';
  const faint = variant === 'landing' ? 'text-[#6e6e73]' : 'text-ink-3';
  const title =
    'Government of India · Ministry of Rural Development · Department of Land Resources · Built for Smart India Hackathon 2026 (SIH26014)';
  if (compact) {
    return (
      <span title={title} className={clsx('inline-flex select-none items-center gap-1.5', className)}>
        <TricolorMark />
        <span className={clsx('hidden whitespace-nowrap text-[10.5px] font-medium leading-none md:inline', strong)}>
          <span className={clsx('text-[8.5px] font-semibold uppercase tracking-[0.08em]', faint)}>Built for </span>
          Govt. of India · MoRD
        </span>
      </span>
    );
  }
  return (
    <span title={title} className={clsx('inline-flex select-none items-center gap-2', className)}>
      <TricolorMark />
      <span className="hidden flex-col leading-tight sm:flex">
        <span className={clsx('text-[8px] font-semibold uppercase tracking-[0.1em]', faint)}>Built for</span>
        <span className={clsx('text-[11px] font-semibold tracking-tight', strong)}>Government of India</span>
        <span className={clsx('hidden text-[9.5px] leading-tight lg:block', faint)}>
          Ministry of Rural Development · Dept. of Land Resources
        </span>
      </span>
    </span>
  );
}

export function GovStrip({ variant = 'token' }: { variant?: 'token' | 'landing' }) {
  const c =
    variant === 'landing'
      ? { border: 'border-[#e5e5ea]', faint: 'text-[#8a8a8f]', mid: 'text-[#6e6e73]', strong: 'text-[#1d1d1f]', chip: 'border-[#e5e5ea] text-[#6e6e73]' }
      : { border: 'border-line', faint: 'text-ink-3', mid: 'text-ink-2', strong: 'text-ink', chip: 'border-line text-ink-3' };

  return (
    <footer className={clsx('border-t', c.border)}>
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center">
        <div className="flex items-center gap-2">
          <TricolorMark />
          <Landmark size={15} className={c.mid} />
          <span className={clsx('text-[12px] font-semibold tracking-tight', c.strong)}>Government of India</span>
        </div>
        <p className={clsx('text-[12px]', c.mid)}>Ministry of Rural Development · Department of Land Resources</p>
        <p className={clsx('max-w-xl text-[11px] leading-relaxed', c.faint)}>
          Built for Smart India Hackathon 2026 · Problem SIH26014. A prototype of an integrated GIS-based Digital Public
          Infrastructure for land governance — running on synthetic demo data, not a source of official land records.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {CHIPS.map((t) => (
            <span key={t} className={clsx('rounded-full border px-2 py-0.5 text-[10.5px]', c.chip)}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
