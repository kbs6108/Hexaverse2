import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { api, qk } from '@/lib/api';
import type { ParcelCDM } from '@/lib/cdm';
import { useAuth } from '@/lib/auth';
import { Spinner } from './Spinner';

/** True when the parcel carries any flag worth an automatic AI analysis. */
export function parcelNeedsAttention(p: ParcelCDM): boolean {
  const s = p.status;
  return Boolean(
    s.has_dispute || s.has_mortgage || s.pending_mutation || s.change_alert || (s.tax_arrears ?? 0) > 0
    || p.consistency.area_match === false || p.consistency.owner_match === false,
  );
}

const SEV_ICON = {
  high: { icon: AlertTriangle, cls: 'text-brick' },
  medium: { icon: AlertTriangle, cls: 'text-amber' },
  info: { icon: Info, cls: 'text-slate' },
  ok: { icon: CheckCircle2, cls: 'text-primary' },
} as const;

/** AI risk brief for a parcel. AUTO-RUNS whenever the parcel has adverse flags; on clean
 *  parcels it stays out of the way (the caller can hide it or let the low-risk card show).
 *  Labels its engine honestly — NVIDIA model or the deterministic rule engine. */
export function AIInsight({ p, auto }: { p: ParcelCDM; auto: boolean }) {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: qk.parcelBrief(p.ulpin, user?.uid ?? 'anon'),
    queryFn: () => api.parcelBrief(p.ulpin),
    enabled: auto,
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (!auto) return null;
  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-violet/30 bg-violet-soft/40 px-3 py-2.5 text-[13px] text-violet">
        <Spinner size={14} className="text-violet" /> Analysing this parcel…
      </div>
    );
  }
  const b = q.data;
  if (!b) return null;

  const meter =
    b.risk_level === 'high' ? 'bg-brick' : b.risk_level === 'elevated' ? 'bg-amber' : 'bg-primary';

  return (
    <section aria-label="AI insight" className="rounded-lg border border-violet/30 bg-violet-soft/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles size={15} className="text-violet" />
        <h3 className="text-sm font-semibold">AI insight</h3>
        <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold text-white', meter)}>
          Risk {b.risk_level} · {b.risk_score}/100
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-3" title="How this insight was produced">
          <span
            className={clsx(
              'size-1.5 rounded-full',
              b.engine.startsWith('gemini') ? 'bg-emerald-500' : b.engine.startsWith('nvidia') ? 'bg-primary' : 'bg-ink-3'
            )}
          />
          <span>
            {b.engine.startsWith('gemini')
              ? `Gemini (${b.engine.split(':')[1] || 'Flash'})`
              : b.engine.startsWith('nvidia')
                ? 'NVIDIA Nemotron'
                : 'rule engine'}
          </span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ground-2" role="meter" aria-valuenow={b.risk_score} aria-valuemin={0} aria-valuemax={100} aria-label="Risk score">
        <div className={clsx('h-full rounded-full', meter)} style={{ width: `${Math.max(4, b.risk_score)}%` }} />
      </div>
      <p className="mt-2 text-[13px] leading-snug text-ink-2">{b.narrative}</p>
      {b.findings.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {b.findings.slice(0, 5).map((f, i) => {
            const sev = SEV_ICON[f.severity as keyof typeof SEV_ICON] ?? SEV_ICON.info;
            return (
              <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-ink-2">
                <sev.icon size={13} className={clsx('mt-0.5 shrink-0', sev.cls)} />
                {f.text}
              </li>
            );
          })}
        </ul>
      )}
      {b.recommendations.length > 0 && (
        <div className="mt-2 border-t border-violet/20 pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Recommended</p>
          <ul className="mt-1 list-disc pl-4 text-[12.5px] text-ink-2">
            {b.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
