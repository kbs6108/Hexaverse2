import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/api';

/** One demo cluster (state), from the seed's story_parcels.json `regions` array. */
export interface DemoRegion {
  code: string; // AP | TN | TG
  state: string;
  district: string;
  village: string;
  bbox: [number, number, number, number];
  parcel_count: number;
}

/** Framing for the whole-of-India entry view (all three clusters + national context). */
export const INDIA_BBOX: [number, number, number, number] = [68.0, 6.5, 97.5, 36.0];
/** Below this zoom the map is in "national overview" mode: cluster markers, no parcels. */
export const OVERVIEW_MAX_ZOOM = 8;

export function useDemoRegions() {
  return useQuery({
    queryKey: qk.demoRegions(),
    queryFn: async (): Promise<DemoRegion[]> => {
      const r = await fetch(`/data/story_parcels.json?v=${Date.now()}`);
      if (!r.ok) return [];
      const j: unknown = await r.json();
      const arr = (j as { regions?: unknown }).regions;
      return Array.isArray(arr) ? (arr as DemoRegion[]) : [];
    },
    staleTime: Infinity,
    retry: false,
  });
}
