import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ClipboardCheck, Lock, Satellite } from 'lucide-react';
import { clsx } from 'clsx';
import type { ChangeDetectionResult, ParcelCDM } from '@/lib/cdm';
import { api } from '@/lib/api';
import { useAuth, roleAtLeast } from '@/lib/auth';
import { Button } from '@/components/Button';
import { Callout, SectionTitle } from '@/components/Section';
import { ErrorNote } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { fmtDate } from '@/lib/format';
import { Badge, type Tone } from '@/components/Badge';

const DEFAULT_THRESHOLDS = { d_ndvi: -0.15, d_ndbi: 0.1 };

function labelTone(label: string): Tone {
  const l = label.toLowerCase();
  if (l.includes('built') || l.includes('construction') || l.includes('change')) return 'brick';
  if (l.includes('vegetation') || l.includes('cleared')) return 'amber';
  return 'primary';
}

export function SatelliteSection({ p }: { p: ParcelCDM }) {
  const { role } = useAuth();
  const allowed = roleAtLeast(role, 'officer');
  const qc = useQueryClient();

  const run = useMutation({ mutationFn: () => api.changeDetection({ ulpin: p.ulpin }) });
  const review = useMutation({
    mutationFn: (r: ChangeDetectionResult) =>
      api.createApplication(p.ulpin, 'field_review', {
        reason: 'satellite_change',
        label: r.label,
        confidence: r.confidence,
        date_a: r.date_a,
        date_b: r.date_b,
        d_ndvi: r.d_ndvi,
        d_ndbi: r.d_ndbi,
      }),
    onSuccess: (a) => {
      toast.success('Sent for field review', a.id);
      void qc.invalidateQueries({ queryKey: ['queue'] });
    },
    onError: (e: Error) => toast.error('Could not create field review', e.message),
  });

  if (!allowed) {
    return (
      <div className="flex flex-col gap-3">
        <Callout tone="slate" title={<span className="flex items-center gap-1"><Lock size={14} /> Officer tool</span>}>
          Sentinel-2 change detection is run by officers. {p.status.change_alert ? 'This parcel currently carries an open change alert.' : 'No change alert is open for this parcel.'}
        </Callout>
      </div>
    );
  }

  const r = run.data;
  const rawTh = (r?.thresholds ?? {}) as Record<string, number | undefined>;
  const th = { ...DEFAULT_THRESHOLDS, ...(rawTh.d_ndvi !== undefined ? { d_ndvi: rawTh.d_ndvi } : {}), ...(rawTh.d_ndbi !== undefined ? { d_ndbi: rawTh.d_ndbi } : {}),
    ...(rawTh.d_ndvi_loss !== undefined ? { d_ndvi: rawTh.d_ndvi_loss } : {}), ...(rawTh.d_ndbi_builtup !== undefined ? { d_ndbi: rawTh.d_ndbi_builtup } : {}) };
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <SectionTitle>Sentinel-2 change detection</SectionTitle>
          <p className="-mt-1 text-xs text-ink-3">NDVI / NDBI difference between two cloud-free dates over the parcel footprint.</p>
        </div>
        <Button variant="primary" icon={<Satellite size={15} />} loading={run.isPending} onClick={() => run.mutate()}>
          {r ? 'Re-run' : 'Run'}
        </Button>
      </div>
      {run.isError && <ErrorNote error={run.error} retry={() => run.mutate()} />}

      {r && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <DateCard title="Before" date={r.date_a} url={r.image_a_url} ndvi={r.ndvi_a} ndbi={r.ndbi_a} />
            <DateCard title="After" date={r.date_b} url={r.image_b_url} ndvi={r.ndvi_b} ndbi={r.ndbi_b} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Delta name="Δ NDVI" value={r.d_ndvi} threshold={th.d_ndvi} direction="below" hint="Vegetation loss" />
            <Delta name="Δ NDBI" value={r.d_ndbi} threshold={th.d_ndbi} direction="above" hint="Built-up gain" />
          </div>

          <div className="rounded-md border border-line p-3">
            <div className="flex items-center justify-between">
              <Badge tone={labelTone(r.label)} className="text-sm">{r.label}</Badge>
              <span className="text-xs text-ink-3">{r.mode === 'offline' ? 'Offline COG' : r.mode === 'online' ? 'STAC live' : ''}</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-ink-3"><span>Confidence</span><span>{Math.round(r.confidence * 100)}%</span></div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ground-2" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.confidence * 100)} aria-label="Confidence">
                <div className={clsx('h-full rounded-full', r.confidence > 0.75 ? 'bg-brick' : r.confidence > 0.5 ? 'bg-amber' : 'bg-primary')} style={{ width: `${Math.round(r.confidence * 100)}%` }} />
              </div>
            </div>
            {r.recommendation && <p className="mt-3 text-sm"><span className="font-medium">Recommendation:</span> {r.recommendation}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Button icon={<ClipboardCheck size={15} />} loading={review.isPending} disabled={review.isSuccess} onClick={() => review.mutate(r)}>
              {review.isSuccess ? `Field review ${review.data.id} created` : 'Send for field review'}
            </Button>
            <span className="text-xs text-ink-3">Creates a <code>field_review</code> application for assignment.</span>
          </div>
        </>
      )}
    </div>
  );
}

function DateCard({ title, date, url, ndvi, ndbi }: { title: string; date: string; url?: string | null; ndvi: number; ndbi: number }) {
  const isVegetative = ndvi > 0.35;
  const isBuiltUp = ndbi > 0.05;
  const fillColor = isBuiltUp ? '#B84A39' : isVegetative ? '#3B7E48' : '#738A5A';

  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-ground-2 shadow-2xs">
      <div className="relative aspect-[4/3] bg-[#121A15] overflow-hidden">
        {url ? (
          <img src={url} alt={`${title} imagery ${date}`} className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 160 120" className="h-full w-full select-none" role="img" aria-label={`${title} Sentinel-2 spectral preview`}>
            <defs>
              <pattern id={`grid-${title}`} width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#223328" strokeWidth="0.5" />
              </pattern>
              <radialGradient id={`rad-${title}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={fillColor} stopOpacity="0.45" />
                <stop offset="85%" stopColor={fillColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor="#121A15" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Background Grid */}
            <rect width="160" height="120" fill={`url(#grid-${title})`} />
            
            {/* Spectral Heatmap Footprint */}
            <circle cx="80" cy="58" r="42" fill={`url(#rad-${title})`} />
            <rect x="36" y="26" width="88" height="64" rx="4" fill="none" stroke={fillColor} strokeWidth="1" strokeDasharray="3 2" opacity="0.65" />

            {/* Corner Crosshairs */}
            <path d="M 8 8 L 14 8 M 8 8 L 8 14" stroke="#4A6552" strokeWidth="0.8" fill="none" />
            <path d="M 152 8 L 146 8 M 152 8 L 152 14" stroke="#4A6552" strokeWidth="0.8" fill="none" />
            <path d="M 8 112 L 14 112 M 8 112 L 8 106" stroke="#4A6552" strokeWidth="0.8" fill="none" />
            <path d="M 152 112 L 146 112 M 152 112 L 152 106" stroke="#4A6552" strokeWidth="0.8" fill="none" />

            {/* Center Reticle */}
            <circle cx="80" cy="58" r="3" fill="none" stroke="#A8C8B0" strokeWidth="0.6" opacity="0.7" />
            <line x1="74" y1="58" x2="86" y2="58" stroke="#A8C8B0" strokeWidth="0.6" opacity="0.7" />
            <line x1="80" y1="52" x2="80" y2="64" stroke="#A8C8B0" strokeWidth="0.6" opacity="0.7" />

            {/* Metadata overlay */}
            <text x="80" y="52" textAnchor="middle" fontSize="8.5" fill="#E2EBE5" fontFamily="IBM Plex Mono, monospace" fontWeight="600" opacity="0.9">
              {title === 'After' ? 'T2 RECENT' : 'T1 BASELINE'}
            </text>
            <text x="80" y="68" textAnchor="middle" fontSize="9.5" fill="#FFFFFF" fontFamily="IBM Plex Mono, monospace" fontWeight="bold">
              {date}
            </text>
            <text x="80" y="80" textAnchor="middle" fontSize="7" fill="#84A890" fontFamily="IBM Plex Mono, monospace">
              ESA S2-MSI L2A (10m)
            </text>
          </svg>
        )}
        <span className="absolute top-1.5 left-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white tracking-wide border border-white/10">
          {title}
        </span>
      </div>
      <figcaption className="flex items-center justify-between px-2.5 py-1.5 text-xs bg-ground-1 border-t border-line">
        <span className="font-semibold text-ink">{fmtDate(date)}</span>
        <span className="font-mono text-[11px] text-ink-3">
          NDVI <strong className="text-ink">{ndvi.toFixed(2)}</strong> · NDBI <strong className="text-ink">{ndbi.toFixed(2)}</strong>
        </span>
      </figcaption>
    </figure>
  );
}

function Delta({ name, value, threshold, direction, hint }: { name: string; value: number; threshold: number; direction: 'above' | 'below'; hint: string }) {
  const crossed = direction === 'above' ? value >= threshold : value <= threshold;
  return (
    <div className={clsx('rounded-md border px-3 py-2', crossed ? 'border-brick/30 bg-brick-soft/60' : 'border-line')}>
      <div className="flex items-center justify-between text-xs text-ink-3">
        <span>{name}</span>
        <span className="flex items-center gap-1">threshold {direction === 'above' ? '≥' : '≤'} {threshold.toFixed(2)}</span>
      </div>
      <p className={clsx('font-mono text-xl font-medium', crossed ? 'text-brick' : 'text-ink')}>
        {value > 0 ? '+' : ''}{value.toFixed(3)}
      </p>
      <p className="flex items-center gap-1 text-xs text-ink-3">
        {crossed && <ArrowRight size={12} />} {crossed ? hint : 'Within normal variation'}
      </p>
    </div>
  );
}
