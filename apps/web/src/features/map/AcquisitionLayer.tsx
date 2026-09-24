import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';
import { useQuery } from '@tanstack/react-query';
import type { FeatureCollection } from 'geojson';
import { api, qk } from '@/lib/api';
import { useUI } from '@/lib/store';
import { useAuth } from '@/lib/auth';

/** Renders the statutory acquisition strip / project cut polygon directly on the map
 *  for the currently selected parcel.
 */
export function AcquisitionLayer() {
  const selectedUlpin = useUI((s) => s.selectedUlpin);
  const { user } = useAuth();
  const identity = user?.uid ?? 'anon';

  const q = useQuery({
    queryKey: qk.parcel(selectedUlpin ?? '', identity),
    queryFn: () => api.parcel(selectedUlpin!),
    enabled: !!selectedUlpin,
    staleTime: 60_000,
  });

  const p = q.data;
  const impacts = p?.acquisition ?? [];

  const fc = useMemo<FeatureCollection | null>(() => {
    if (!impacts.length) return null;
    const features = impacts
      .filter((imp) => imp.affected_geojson && Object.keys(imp.affected_geojson).length > 0)
      .map((imp) => ({
        type: 'Feature' as const,
        geometry: imp.affected_geojson as never,
        properties: {
          project_name: imp.project_name,
          affected_area_sqm: imp.affected_area_sqm,
          impact_pct: imp.impact_pct,
          impact_type: imp.impact_type,
        },
      }));

    if (!features.length) return null;
    return {
      type: 'FeatureCollection',
      features,
    };
  }, [impacts]);

  if (!fc) return null;

  return (
    <Source id="acquisition-impact" type="geojson" data={fc}>
      {/* High-visibility amber-crimson warning fill */}
      <Layer
        id="acquisition-impact-fill"
        type="fill"
        paint={{
          'fill-color': '#ea580c',
          'fill-opacity': 0.42,
        }}
      />
      {/* Bold dashed hazard boundary border */}
      <Layer
        id="acquisition-impact-line"
        type="line"
        paint={{
          'line-color': '#b91c1c',
          'line-width': 2.8,
          'line-dasharray': [3, 2],
        }}
      />
    </Source>
  );
}
