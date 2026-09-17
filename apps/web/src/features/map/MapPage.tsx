import { useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';
import { MapView } from './MapView';
import { LayerPanel } from './LayerPanel';
import { BoundaryPanel } from './BoundaryEditor';
import { OverviewHint } from './OverviewHint';
import { ParcelDrawer } from '@/features/parcel/ParcelDrawer';
import { useUI } from '@/lib/store';
import { SearchBox, useOpenParcel } from './SearchBox';

export function MapPage() {
  const { ulpin } = useSearch({ from: '/map' });
  const select = useUI((s) => s.select);
  const openParcel = useOpenParcel();

  // Deep link: /?ulpin=… selects + flies once on mount.
  useEffect(() => {
    if (ulpin) void openParcel(ulpin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ulpin]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapView />

      {/* Ambient Earth Warmth Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-[5] bg-[#F4F1E7]/10 mix-blend-multiply" 
      />

      <LayerPanel />

      {/* Contextual Parcel Search directly on Map canvas */}
      <SearchBox />

      <OverviewHint />
      <BoundaryPanel />
      <ParcelDrawer onClose={() => select(null)} />
    </div>
  );
}
