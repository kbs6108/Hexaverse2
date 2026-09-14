import { useEffect, useState } from 'react';
import { Marker, useMap } from 'react-map-gl/maplibre';
import { MapPin } from 'lucide-react';
import { useUI } from '@/lib/store';
import { OVERVIEW_MAX_ZOOM, useDemoRegions, type DemoRegion } from './regions';

/** Cluster cards shown at national zoom — one per demo state; click flies into the cluster.
 *  Rendered as MapLibre markers (children of <Map>); they fade out once the user is zoomed
 *  into a cluster and the normal parcel interaction takes over. */
export function RegionMarkers() {
  const { current: map } = useMap();
  const [zoom, setZoom] = useState<number>(() => map?.getZoom() ?? 4);
  const requestFlyTo = useUI((s) => s.requestFlyTo);
  const regions = useDemoRegions();

  useEffect(() => {
    if (!map) return;
    const onMove = () => setZoom(map.getZoom());
    map.on('move', onMove);
    onMove();
    return () => {
      map.off('move', onMove);
    };
  }, [map]);

  if (!regions.data || regions.data.length === 0 || zoom >= OVERVIEW_MAX_ZOOM) return null;

  const fly = (r: DemoRegion) => requestFlyTo(r.bbox);

  return (
    <>
      {regions.data.map((r) => (
        <Marker key={r.code} longitude={(r.bbox[0] + r.bbox[2]) / 2} latitude={(r.bbox[1] + r.bbox[3]) / 2} anchor="bottom">
          <button
            type="button"
            onClick={() => fly(r)}
            aria-label={`Zoom to ${r.state} cluster (${r.parcel_count} parcels)`}
            className="fade-up group flex flex-col items-center"
          >
            <span className="flex items-center gap-2 rounded-lg border border-line bg-panel/95 px-2.5 py-1.5 text-left shadow-panel backdrop-blur transition-colors group-hover:border-primary">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary-soft font-mono text-[10px] font-semibold text-primary">
                {r.code}
              </span>
              <span className="leading-tight">
                <span className="block text-[12px] font-semibold text-ink">{r.state}</span>
                <span className="block text-[10.5px] text-ink-3">
                  {r.district} · {r.parcel_count} parcels
                </span>
              </span>
            </span>
            <MapPin size={16} className="-mt-0.5 text-primary drop-shadow" fill="var(--primary-soft)" />
          </button>
        </Marker>
      ))}
    </>
  );
}
