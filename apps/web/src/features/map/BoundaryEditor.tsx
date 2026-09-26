import { useMemo, useState } from 'react';
import { Layer, Marker, Source } from 'react-map-gl/maplibre';
import { useMutation } from '@tanstack/react-query';
import type { FeatureCollection } from 'geojson';
import { CheckCircle2, PenLine, Scale, Send, X, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { BoundaryValidation } from '@/lib/cdm';
import { useUI } from '@/lib/store';
import { Button } from '@/components/Button';
import { Field, Textarea } from '@/components/Field';
import { toast } from '@/components/Toast';

function closeRing(ring: [number, number][]): [number, number][] {
  return ring.length ? [...ring, ring[0]!] : ring;
}

function toGeometry(ring: [number, number][]): Record<string, unknown> {
  return { type: 'Polygon', coordinates: [closeRing(ring)] };
}

/** Map-side of the boundary editor: the proposed polygon + one draggable marker per vertex.
 *  MUST be rendered inside <Map>. The control panel is the separate BoundaryPanel. */
export function BoundaryEditLayers() {
  const edit = useUI((s) => s.boundaryEdit);
  const moveVertex = useUI((s) => s.moveBoundaryVertex);

  const fc = useMemo<FeatureCollection | null>(() => {
    if (!edit) return null;
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: toGeometry(edit.ring) as never, properties: {} }],
    };
  }, [edit]);

  if (!edit || !fc) return null;
  return (
    <>
      <Source id="boundary-edit" type="geojson" data={fc}>
        <Layer id="boundary-edit-fill" type="fill" paint={{ 'fill-color': '#0f766e', 'fill-opacity': 0.16 }} />
        <Layer id="boundary-edit-line" type="line" paint={{ 'line-color': '#0f766e', 'line-width': 2.4, 'line-dasharray': [2, 1.5] }} />
      </Source>
      {edit.ring.map((v, i) => (
        <Marker
          key={i}
          longitude={v[0]}
          latitude={v[1]}
          draggable
          onDrag={(e) => moveVertex(i, [e.lngLat.lng, e.lngLat.lat])}
        >
          <span className="block size-3.5 cursor-grab rounded-full border-2 border-white bg-primary shadow active:cursor-grabbing" />
        </Marker>
      ))}
    </>
  );
}

/** Overlay panel: validate → (optional cadastral snap) → reason → submit. Rendered outside <Map>. */
export function BoundaryPanel() {
  const edit = useUI((s) => s.boundaryEdit);
  const setRing = useUI((s) => s.setBoundaryRing);
  const cancel = useUI((s) => s.cancelBoundaryEdit);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<BoundaryValidation | null>(null);

  const validate = useMutation({
    mutationFn: () => api.validateBoundary(edit!.ulpin, toGeometry(edit!.ring)),
    onSuccess: setResult,
    onError: (e: Error) => toast.error('Validation failed', e.message),
  });
  const propose = useMutation({
    mutationFn: () => api.proposeBoundary(edit!.ulpin, toGeometry(edit!.ring), reason.trim()),
    onSuccess: (r) => {
      if (r.accepted && r.application) {
        toast.success('Boundary correction filed', `${r.application.id} · awaiting geometry check`);
        cancel();
        setResult(null);
        setReason('');
      } else {
        setResult(r.validation);
        toast.error('Proposal not accepted', r.error ?? 'validation failed');
      }
    },
    onError: (e: Error) => toast.error('Could not file proposal', e.message),
  });

  if (!edit) return null;

  const applySuggestion = () => {
    const g = result?.suggestion?.geometry as { coordinates?: number[][][] | number[][][][] } | undefined;
    if (!g?.coordinates) return;
    // first ring of the (Multi)Polygon, dropping the closing duplicate
    const ring = (Array.isArray(g.coordinates[0]?.[0]?.[0]) ? (g.coordinates as number[][][][])[0]![0]! : (g.coordinates as number[][][])[0]!) as [number, number][];
    setRing(ring.slice(0, -1));
    setResult(null);
    toast.success('Suggestion applied', 'Re-validate to confirm the fix');
  };

  return (
    <div className="absolute bottom-4 left-1/2 z-20 w-[420px] max-w-[92vw] -translate-x-1/2 rounded-2xl border border-line bg-panel/95 text-ink shadow-lg backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
        <PenLine size={15} className="text-primary" />
        <p className="text-sm font-semibold text-ink">Boundary correction · {edit.survey_no ? `Sy. ${edit.survey_no}` : edit.ulpin}</p>
        <button type="button" aria-label="Cancel boundary edit" onClick={() => { cancel(); setResult(null); }} className="ml-auto rounded-lg p-1 text-ink-3 hover:bg-ground-2 hover:text-ink transition-colors cursor-pointer">
          <X size={15} />
        </button>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
            <Scale size={13} />
            <span>Survey & Boundaries Act Statutory Resurvey</span>
          </div>
          <p className="text-[11.5px] text-ink-3 leading-relaxed">
            Drag the vertex handles to align with the FMB traverse ground truth. <strong className="text-ink">Topological norms:</strong> strict ±15% area variance bound, zero overlaps with adjacent fields, and within revenue village limits.
          </p>
          <p className="text-[10.5px] text-ink-3 italic">
            Requires two-officer ratification: Field Surveyor proposes → Tahsildar / MRO counter-signs to update PostGIS cadastre & RoR extent.
          </p>
        </div>
        {result && (
          <ul className="flex flex-col gap-1 rounded-xl border border-line bg-ground-1 p-2.5 text-ink">
            {result.checks.map((c) => (
              <li key={c.name} className="flex items-start gap-1.5 text-[12px]">
                {c.ok ? <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" /> : <XCircle size={13} className="mt-0.5 shrink-0 text-brick" />}
                <span><span className="font-semibold text-ink">{c.name.replace(/_/g, ' ')}</span> — {c.detail}</span>
              </li>
            ))}
            <li className="mt-1 pt-1 border-t border-line/60 text-[11.5px] text-ink-3 font-mono">
              Recorded Extent: {result.metrics.old_area_sqm.toFixed(0)} m² → Corrected: {result.metrics.new_area_sqm.toFixed(0)} m² ({result.metrics.delta_pct > 0 ? '+' : ''}{result.metrics.delta_pct}%)
            </li>
          </ul>
        )}
        {result?.suggestion && (
          <button type="button" onClick={applySuggestion} className="flex items-start gap-2 rounded-xl border border-primary/40 bg-primary-soft/40 p-2.5 text-left text-[12px] text-ink hover:border-primary cursor-pointer shadow-2xs transition-colors">
            <Scale size={14} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <span className="font-semibold text-primary block">Apply Cadastral Snap Assistant</span>
              <span className="text-ink-2 text-[11px] leading-tight block mt-0.5">{result.suggestion.reason} (snapped area: {result.suggestion.area_sqm.toFixed(0)} m²)</span>
            </div>
          </button>
        )}
        {result?.valid && (
          <Field label="Statutory Reason for Correction (recorded in quasi-judicial audit trail)" htmlFor="be-reason">
            <Textarea id="be-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Field Measurement Book (FMB) traverse verification confirms northeast tri-junction stone situated 3.8m east." />
          </Field>
        )}
        <div className="flex gap-2 pt-1">
          <Button size="sm" loading={validate.isPending} onClick={() => validate.mutate()}>Verify Norms</Button>
          <Button size="sm" variant="primary" icon={<Send size={13} />} loading={propose.isPending} disabled={!result?.valid || reason.trim().length < 3} onClick={() => propose.mutate()}>
            Submit for Tahsildar Ratification
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { cancel(); setResult(null); }}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
