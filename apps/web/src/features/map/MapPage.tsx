import { useEffect } from 'react';
import { useSearch } from '@tanstack/react-router';
import { MapView } from './MapView';
import { LayerPanel } from './LayerPanel';
import { RegionsPanel } from './RegionsPanel';
import { BoundaryPanel } from './BoundaryEditor';
import { ParcelDrawer } from '@/features/parcel/ParcelDrawer';
import { useUI } from '@/lib/store';
import { useOpenParcel } from './SearchBox';

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

      <LayerPanel />
      <RegionsPanel />

      <BoundaryPanel />
      <ParcelDrawer onClose={() => select(null)} />
    </div>
  );
}
