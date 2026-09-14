import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColourBy =
  | 'land_use'
  | 'ownership_type'
  | 'registered'
  | 'encumbrance'
  | 'dispute'
  | 'zone'
  | 'permission'
  | 'tax_arrears'
  | 'change_alert';

export type Basemap = 'streets' | 'imagery';

/** Layer ids per CONTRACTS §9 tiers. */
export const TIER_LAYERS = {
  base: ['parcels', 'survey_labels', 'village_boundary'] as const,
  essential: ['zones'] as const,
  usecase: ['roads', 'water_lines', 'restriction_zones', 'projects', 'settlement_schemes', 'change_alerts'] as const,
};
export type LayerId =
  | (typeof TIER_LAYERS.base)[number]
  | (typeof TIER_LAYERS.essential)[number]
  | (typeof TIER_LAYERS.usecase)[number];

export type LayerToggles = Record<LayerId, boolean>;

const defaultLayers: LayerToggles = {
  parcels: true,
  survey_labels: true,
  village_boundary: true,
  zones: false,
  roads: true,
  water_lines: false,
  restriction_zones: false,
  projects: false,
  settlement_schemes: false,
  change_alerts: true,
};

/** Dev-mode identities (CONTRACTS §10). Value is the exact X-Dev-User header string. */
export const DEV_USERS = [
  { id: 'citizen::Ravi Kumar', label: 'Ravi Kumar', role: 'citizen', hint: 'Citizen' },
  { id: 'citizen::Lakshmi Devi', label: 'Lakshmi Devi', role: 'citizen', hint: 'Citizen' },
  { id: 'officer:revenue:Anitha', label: 'Anitha', role: 'officer', hint: 'Officer · Revenue' },
  { id: 'officer:registration:Suresh', label: 'Suresh', role: 'officer', hint: 'Officer · Registration' },
  { id: 'officer:planning:Farida', label: 'Farida', role: 'officer', hint: 'Officer · Planning' },
  { id: 'admin::Admin', label: 'Admin', role: 'admin', hint: 'Administrator' },
] as const;
export type DevUserId = (typeof DEV_USERS)[number]['id'];

interface UIState {
  selectedUlpin: string | null;
  hoverUlpin: string | null;
  drawerOpen: boolean;
  layers: LayerToggles;
  colourBy: ColourBy;
  basemap: Basemap;
  show3D: boolean;
  layerPanelOpen: boolean;
  devUser: DevUserId;
  flyTo: { bbox: [number, number, number, number]; nonce: number } | null;

  select: (ulpin: string | null) => void;
  setHover: (ulpin: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
  toggleLayer: (id: LayerId, on?: boolean) => void;
  setColourBy: (c: ColourBy) => void;
  setBasemap: (b: Basemap) => void;
  setShow3D: (on: boolean) => void;
  setLayerPanelOpen: (open: boolean) => void;
  setDevUser: (u: DevUserId) => void;
  requestFlyTo: (bbox: [number, number, number, number]) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      selectedUlpin: null,
      hoverUlpin: null,
      drawerOpen: false,
      layers: defaultLayers,
      colourBy: 'land_use',
      basemap: 'streets',
      show3D: false,
      layerPanelOpen: true,
      devUser: 'citizen::Ravi Kumar',
      flyTo: null,

      select: (ulpin) => set({ selectedUlpin: ulpin, drawerOpen: ulpin !== null }),
      setHover: (ulpin) => set({ hoverUlpin: ulpin }),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      toggleLayer: (id, on) => set((s) => ({ layers: { ...s.layers, [id]: on ?? !s.layers[id] } })),
      setColourBy: (colourBy) => set({ colourBy }),
      setBasemap: (basemap) => set({ basemap }),
      setShow3D: (show3D) => set({ show3D }),
      setLayerPanelOpen: (layerPanelOpen) => set({ layerPanelOpen }),
      setDevUser: (devUser) => set({ devUser }),
      requestFlyTo: (bbox) => set({ flyTo: { bbox, nonce: Date.now() } }),
    }),
    {
      name: 'landstack-ui',
      partialize: (s) => ({
        layers: s.layers,
        colourBy: s.colourBy,
        basemap: s.basemap,
        devUser: s.devUser,
        layerPanelOpen: s.layerPanelOpen,
      }),
    },
  ),
);
