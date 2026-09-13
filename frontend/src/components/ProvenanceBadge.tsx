import { CheckCircle2, CloudOff } from 'lucide-react';
import type { Provenance, SourceKey } from '@/lib/cdm';
import { fmtTime } from '@/lib/format';

export const SOURCE_LABEL: Record<SourceKey, string> = {
  revenue: 'Revenue · RoR',
  registration: 'Registration · SRO',
  planning: 'Planning · UDA',
  fiscal: 'Fiscal · Property tax',
  legal: 'Legal · Courts',
  utilities: 'Utilities',
};

/**
 * Source badge + as-of time. A failed source shows
 * "Source unavailable · cached HH:MM" (or "· no cache") instead of an error.
 */
export function ProvenanceBadge({ source, p }: { source: SourceKey; p: Provenance | undefined }) {
  if (!p) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-line px-2 py-0.5 text-[11px] text-ink-3">
        {SOURCE_LABEL[source]} · no data
      </span>
    );
  }
  if (p.ok) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary-soft px-2 py-0.5 text-[11px] text-primary"
        title={`${p.source} · fetched in ${p.ms} ms`}
      >
        <CheckCircle2 size={12} aria-hidden />
        <span className="font-medium">{p.source || SOURCE_LABEL[source]}</span>
        <span className="text-primary/70">· as of {fmtTime(p.as_of)} · {p.ms} ms</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-amber/30 bg-amber-soft px-2 py-0.5 text-[11px] text-amber"
      title={p.error ?? 'Source unavailable'}
    >
      <CloudOff size={12} aria-hidden />
      <span className="font-medium">{p.source || SOURCE_LABEL[source]}</span>
      <span>· Source unavailable · {p.cached_as_of ? `cached ${fmtTime(p.cached_as_of)}` : 'no cache'}</span>
    </span>
  );
}
