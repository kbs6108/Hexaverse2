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
            <span className="bg-[#F4F1E7]/90 backdrop-blur-xl border border-[#D5D2C7] shadow-md rounded-2xl px-3.5 py-2 flex items-center gap-3 hover:scale-105 transition-transform cursor-pointer text-left">
              <span className="w-7 h-7 rounded-full bg-[#23483A] text-[#F4F1E7] text-[11px] font-black flex items-center justify-center shadow-xs shrink-0">
                {r.code}
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-bold text-[#18231F]">{r.state}</span>
                <span className="block text-[10px] font-semibold text-[#176B52]">
                  {r.district} · {r.parcel_count} parcels
                </span>
              </span>
            </span>
            <MapPin size={16} className="-mt-0.5 text-[#176B52] drop-shadow" fill="#23483A" />
          </button>
        </Marker>
      ))}
    </>
  );
}
