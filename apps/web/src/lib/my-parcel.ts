import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useOpenParcel } from '@/features/map/SearchBox';
import { api, qk } from '@/lib/api';
import type { OwnedParcel } from '@/lib/cdm';

export type { OwnedParcel };

/**
 * Hook to retrieve the parcel(s) dynamically owned by the authenticated citizen
 * directly from statutory land records (dept_revenue.ror via GET /landstack/citizen/my-parcels).
 * Completely eliminates static dictionaries: title ownership reflects real-time database mutations.
 */
export function useMyParcel() {
  const { user } = useAuth();
  const openParcel = useOpenParcel();

  const q = useQuery({
    queryKey: qk.myParcels(user?.uid ?? 'anon'),
    queryFn: api.myParcels,
    enabled: !!user && user.role === 'citizen',
    staleTime: 10_000,
    retry: 1,
  });

  const parcels = q.data?.items ?? [];
  const parcel = parcels[0] ?? null;

  const goToMyParcel = async (targetUlpin?: string) => {
    const target = targetUlpin ? parcels.find((p) => p.ulpin === targetUlpin) ?? parcel : parcel;
    if (!target) return;
    await openParcel(target.ulpin, target.bbox ?? null);
  };

  return {
    parcels,
    parcel,
    hasOwnedLand: parcels.length > 0,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    goToMyParcel,
  };
}
