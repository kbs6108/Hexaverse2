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
  return (
    <figure className="overflow-hidden rounded-md border border-line">
      <div className="relative aspect-[4/3] bg-[#1f2a24]">
        {url ? (
          <img src={url} alt={`${title} imagery ${date}`} className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 160 120" className="h-full w-full" role="img" aria-label={`${title} placeholder`}>
            <defs>
              <pattern id={`g-${title}`} width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M16 0H0v16" fill="none" stroke="#2f3d35" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="160" height="120" fill={`url(#g-${title})`} />
            <rect x="40" y="30" width="80" height="60" fill={title === 'After' ? '#A63A2B' : '#5E9E52'} opacity="0.35" rx="3" />
            <text x="80" y="66" textAnchor="middle" fontSize="11" fill="#E6E8E4" fontFamily="IBM Plex Mono, monospace">{date}</text>
          </svg>
        )}
        <span className="absolute top-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10.5px] font-medium text-white">{title}</span>
      </div>
      <figcaption className="flex items-center justify-between px-2 py-1.5 text-xs">
        <span>{fmtDate(date)}</span>
        <span className="font-mono text-ink-3">NDVI {ndvi.toFixed(2)} · NDBI {ndbi.toFixed(2)}</span>
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
