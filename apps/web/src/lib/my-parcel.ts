import { useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useOpenParcel } from '@/features/map/SearchBox';

export interface OwnedParcel {
  ulpin: string;
  survey_no: string;
  khata_no: string;
  village: string;
  district?: string;
  state: string;
  land_use: string;
  area_sqm: number;
  ownership_type: string;
  bbox?: [number, number, number, number];
  centroid?: [number, number];
  description?: string;
}

/**
 * Authoritative demo parcel records mapped to citizen user identities.
 * For Ravi Kumar, mirrors story parcel 123/4 (seed 42, clean residential in Mangalagiri).
 */
const KNOWN_USER_PARCELS: Record<string, OwnedParcel> = {
  'Ravi Kumar': {
    ulpin: 'TFCM91641E6C82',
    survey_no: '123/4',
    khata_no: 'K-0421',
    village: 'Mangalagiri (R)',
    district: 'Guntur',
    state: 'AP',
    land_use: 'residential',
    area_sqm: 874.3,
    ownership_type: 'Patta (Clean Residential)',
    centroid: [80.555839, 16.443343],
    bbox: [80.555669, 16.443216, 80.556011, 16.44346],
    description: 'Ancestral residential plot with clear single-title patta and up-to-date property taxes.',
  },
  'Robert Kuruvilla': {
    ulpin: 'TF2CEQ4ACED970',
    survey_no: '45/2',
    khata_no: 'K-2196',
    village: 'Sriperumbudur (R)',
    district: 'Kancheepuram',
    state: 'TN',
    land_use: 'residential',
    area_sqm: 976.14,
    ownership_type: 'Patta',
    centroid: [79.951045, 12.953393],
    bbox: [79.950891, 12.953254, 79.951204, 12.95354],
  },
  'Pardhasaradhi Naik': {
    ulpin: 'TEPDPUQC13C0D7',
    survey_no: '77',
    khata_no: 'K-4061',
    village: 'Shamshabad (R)',
    district: 'Ranga Reddy',
    state: 'TG',
    land_use: 'agricultural',
    area_sqm: 8822.36,
    ownership_type: 'Pattadar Passbook',
    centroid: [78.397004, 17.250247],
    bbox: [78.396541, 17.24981, 78.397456, 17.250678],
  },
};

/**
 * Hook to retrieve the parcel owned by the authenticated citizen and provide a direct fly-to action.
 */
export function useMyParcel() {
  const { user } = useAuth();
  const openParcel = useOpenParcel();

  const parcel = useMemo<OwnedParcel | null>(() => {
    if (!user) return null;
    // Citizens with registered titles
    if (user.name && KNOWN_USER_PARCELS[user.name]) {
      return KNOWN_USER_PARCELS[user.name];
    }
    // Default fallback for dev citizen testing if username matches Ravi
    if (user.role === 'citizen' && (user.name?.includes('Ravi') || user.uid?.includes('ravi'))) {
      return KNOWN_USER_PARCELS['Ravi Kumar'];
    }
    return null;
  }, [user]);

  const goToMyParcel = async () => {
    if (!parcel) return;
    await openParcel(parcel.ulpin, parcel.bbox ?? null);
  };

  return {
    parcel,
    hasOwnedLand: !!parcel,
    goToMyParcel,
  };
}
