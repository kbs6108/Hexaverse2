import type {
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  StyleSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl';
import { env } from '@/lib/env';
import type { ColourBy } from '@/lib/store';
import { C, LAND_USE, OWNERSHIP, PERMISSION, ZONES } from '../legend';
import { IMG } from '../patterns';

/* ---------- Sources ---------- */
export const SRC = {
  parcels: 'parcels',
  zones: 'zones',
  restriction: 'restriction_zones',
  roads: 'roads',
  water: 'water_lines',
  projects: 'projects',
  settlement: 'settlement_schemes',
  units: 'units',
  village: 'village_boundary',
} as const;
export const tileUrl = (layer: string) => `${env.apiUrl}/landstack/tiles/${layer}/{z}/{x}/{y}.pbf`;

/* ---------- Basemaps ---------- */
export const STREETS_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
export const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
export const FONT = ['Noto Sans Regular'];
export const FONT_BOLD = ['Noto Sans Bold'];

export function imageryStyle(key?: string): StyleSpecification {
  // With an ArcGIS Location Platform key: the metered basemap service (2M tiles/mo free).
  // Without one: Esri's public World Imagery tile endpoint — real satellite imagery,
  // no key needed, attribution required. This is why the Imagery toggle always works.
  const tiles = key
    ? [`https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${key}`]
    : ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'];
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: {
      esri: {
        type: 'raster',
        tiles,
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#0b0f12' } },
      { id: 'esri-imagery', type: 'raster', source: 'esri', paint: { 'raster-saturation': -0.1 } },
    ],
  };
}

/* ---------- Expressions ---------- */
const bool = (prop: string): ExpressionSpecification => ['to-boolean', ['get', prop]];
const str = (prop: string): ExpressionSpecification => ['downcase', ['to-string', ['coalesce', ['get', prop], '']]];
const firstLetter = (prop: string): ExpressionSpecification => ['upcase', ['slice', ['to-string', ['coalesce', ['get', prop], '']], 0, 1]];
// `match` with a spread of pairs cannot satisfy the tuple type statically; the shape is valid at runtime.
const matchOn = (input: ExpressionSpecification, pairs: { value: string; colour: string }[], fallback: string): ExpressionSpecification =>
  ['match', input, ...pairs.flatMap((p) => [p.value, p.colour]), fallback] as unknown as ExpressionSpecification;
const matchStr = (prop: string, pairs: { value: string; colour: string }[], fallback: string): ExpressionSpecification =>
  matchOn(str(prop), pairs, fallback);

export function fillColour(colourBy: ColourBy): ExpressionSpecification {
  switch (colourBy) {
    case 'land_use':
      return matchStr('land_use', LAND_USE, C.neutral);
    case 'ownership_type':
      return matchStr('ownership_type', OWNERSHIP, C.neutral);
    case 'registered':
      return ['case', bool('registered'), C.green, C.neutral];
    case 'encumbrance':
      return ['case', bool('has_mortgage'), C.violet, C.neutral];
    case 'dispute':
      return ['case', bool('has_dispute'), C.brick, C.neutral];
    case 'zone':
      return matchOn(firstLetter('zone_code'), ZONES, C.neutral);
    case 'permission':
      return matchStr('permission_status', PERMISSION, C.neutral);
    case 'tax_arrears':
      return ['step', ['to-number', ['coalesce', ['get', 'tax_arrears'], 0]], C.neutral, 1, C.amber, 10000, C.brick];
    case 'change_alert':
      return ['case', bool('change_alert'), C.brick, C.neutral];
  }
}

const selected: ExpressionSpecification = ['boolean', ['feature-state', 'selected'], false];
const hover: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false];

/* ---------- Parcel layers (Tier 1 + Tier 2 restyle) ---------- */
export function parcelFill(colourBy: ColourBy, imagery: boolean): FillLayerSpecification {
  return {
    id: 'parcels-fill',
    type: 'fill',
    source: SRC.parcels,
    'source-layer': 'parcels',
    paint: {
      'fill-color': fillColour(colourBy),
      'fill-opacity': ['case', selected, 0.75, hover, 0.6, imagery ? 0.35 : 0.42],
    },
  };
}

export const parcelDisputeHatch: FillLayerSpecification = {
  id: 'parcels-dispute-hatch',
  type: 'fill',
  source: SRC.parcels,
  'source-layer': 'parcels',
  filter: ['to-boolean', ['get', 'has_dispute']],
  paint: { 'fill-pattern': IMG.hatchBrick, 'fill-opacity': 0.7 },
};

export function parcelOutline(imagery: boolean): LineLayerSpecification {
  return {
    id: 'parcels-line',
    type: 'line',
    source: SRC.parcels,
    'source-layer': 'parcels',
    paint: {
      'line-color': ['case', selected, '#0E6B54', imagery ? '#FFFFFF' : '#3C4440'],
      // camera (zoom) expressions must be TOP-level interpolate/step in line-width;
      // data expressions (case/feature-state) are legal inside the stop outputs.
      'line-width': [
        'interpolate', ['linear'], ['zoom'],
        13, ['case', selected, 3, hover, 2, 0.3],
        16, ['case', selected, 3, hover, 2, 0.8],
        18, ['case', selected, 3.5, hover, 2.4, 1.4],
      ],
      'line-opacity': imagery ? 0.85 : 0.7,
    },
  };
}

export const parcelSelectedGlow: LineLayerSpecification = {
  id: 'parcels-selected-glow',
  type: 'line',
  source: SRC.parcels,
  'source-layer': 'parcels',
  paint: { 'line-color': '#0E6B54', 'line-width': ['case', selected, 10, 0], 'line-opacity': 0.25, 'line-blur': 4 },
};

export const changeAlertOutline: LineLayerSpecification = {
  id: 'parcels-change-outline',
  type: 'line',
  source: SRC.parcels,
  'source-layer': 'parcels',
  filter: ['to-boolean', ['get', 'change_alert']],
  paint: { 'line-color': C.brick, 'line-width': 2, 'line-dasharray': [2, 1.5] },
};

export const changeAlertIcon: SymbolLayerSpecification = {
  id: 'parcels-change-icon',
  type: 'symbol',
  source: SRC.parcels,
  'source-layer': 'parcels',
  filter: ['to-boolean', ['get', 'change_alert']],
  minzoom: 13,
  layout: {
    'icon-image': IMG.alert,
    'icon-size': ['interpolate', ['linear'], ['zoom'], 13, 0.6, 17, 1],
    'icon-allow-overlap': true,
    'symbol-placement': 'point',
  },
};

export function surveyLabels(imagery: boolean): SymbolLayerSpecification {
  return {
    id: 'parcels-labels',
    type: 'symbol',
    source: SRC.parcels,
    'source-layer': 'parcels',
    minzoom: 16,
    layout: {
      'text-field': ['to-string', ['get', 'survey_no']],
      'text-font': FONT,
      'text-size': ['interpolate', ['linear'], ['zoom'], 16, 10, 19, 14],
      'symbol-placement': 'point',
      'text-padding': 4,
    },
    paint: {
      'text-color': imagery ? '#FFFFFF' : '#1D2320',
      'text-halo-color': imagery ? 'rgba(0,0,0,0.7)' : 'rgba(246,245,240,0.9)',
      'text-halo-width': 1.2,
    },
  };
}

/* ---------- Tier 2: zones ---------- */
const zoneColour: ExpressionSpecification = matchOn(firstLetter('zone_code'), ZONES, C.neutral);
export const zonesFill: FillLayerSpecification = {
  id: 'zones-fill',
  type: 'fill',
  source: SRC.zones,
  'source-layer': 'zones',
  paint: { 'fill-color': zoneColour, 'fill-opacity': 0.18 },
};
export const zonesLine: LineLayerSpecification = {
  id: 'zones-line',
  type: 'line',
  source: SRC.zones,
  'source-layer': 'zones',
  paint: { 'line-color': C.neutralDark, 'line-width': 1.2, 'line-dasharray': [4, 2] },
};
export const zonesLabel: SymbolLayerSpecification = {
  id: 'zones-label',
  type: 'symbol',
  source: SRC.zones,
  'source-layer': 'zones',
  minzoom: 14,
  layout: {
    'text-field': ['concat', ['coalesce', ['get', 'zone_code'], ''], ' · ', ['coalesce', ['get', 'name'], '']],
    'text-font': FONT_BOLD,
    'text-size': 11,
    'symbol-placement': 'point',
  },
  paint: { 'text-color': '#3C4440', 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1.2 },
};

/* ---------- Tier 3: use-case ---------- */
const restrictionColour: ExpressionSpecification = [
  'match', str('kind'),
  'flood', C.slate, 'eco_sensitive', C.green, 'buffer', C.amber, 'heritage', C.violet, 'airport', C.brick, 'coastal', C.water,
  C.brick,
];
export const restrictionFill: FillLayerSpecification = {
  id: 'restriction-fill',
  type: 'fill',
  source: SRC.restriction,
  'source-layer': 'restriction_zones',
  paint: { 'fill-color': restrictionColour, 'fill-opacity': 0.16 },
};
export const restrictionLine: LineLayerSpecification = {
  id: 'restriction-line',
  type: 'line',
  source: SRC.restriction,
  'source-layer': 'restriction_zones',
  paint: { 'line-color': restrictionColour, 'line-width': 1.8, 'line-dasharray': [3, 2] },
};

const settlementColour: ExpressionSpecification = [
  'match', str('phase'),
  'completed', C.green, 'in_progress', C.amber, 'notified', C.slate,
  C.slate,
];
export const settlementFill: FillLayerSpecification = {
  id: 'settlement-fill',
  type: 'fill',
  source: SRC.settlement,
  'source-layer': 'settlement_schemes',
  paint: { 'fill-color': settlementColour, 'fill-opacity': 0.10 },
};
export const settlementLine: LineLayerSpecification = {
  id: 'settlement-line',
  type: 'line',
  source: SRC.settlement,
  'source-layer': 'settlement_schemes',
  paint: { 'line-color': settlementColour, 'line-width': 1.6, 'line-dasharray': [1.5, 1.5] },
};

const roadClass = str('road_class');
export const roadsLine: LineLayerSpecification = {
  id: 'roads-line',
  type: 'line',
  source: SRC.roads,
  'source-layer': 'roads',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': ['match', roadClass, 'national', '#7A4E12', 'state', '#9A6B12', 'district', '#B08A3E', C.neutralDark],
    // top-level interpolate over zoom (required), road-class factor inside the outputs
    'line-width': [
      'interpolate', ['linear'], ['zoom'],
      13, ['*', ['match', roadClass, 'national', 5, 'state', 4, 'district', 3, 'village', 2, 1.5], 0.5],
      17, ['*', ['match', roadClass, 'national', 5, 'state', 4, 'district', 3, 'village', 2, 1.5], 1.4],
    ],
    'line-opacity': 0.85,
  },
};
export const roadsLabel: SymbolLayerSpecification = {
  id: 'roads-label',
  type: 'symbol',
  source: SRC.roads,
  'source-layer': 'roads',
  minzoom: 15,
  layout: { 'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name'], ''], 'text-font': FONT, 'text-size': 10 },
  paint: { 'text-color': '#5B4A1E', 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1 },
};

export const waterLine: LineLayerSpecification = {
  id: 'water-line',
  type: 'line',
  source: SRC.water,
  'source-layer': 'water_lines',
  paint: { 'line-color': C.water, 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 17, 3], 'line-opacity': 0.9 },
};

const projectColour: ExpressionSpecification = [
  'match', str('kind'),
  'road', '#7A4E12', 'housing', '#D8A24A', 'industrial', '#8C7DB0', 'utility', C.slate,
  C.violet,
];
export const projectsFill: FillLayerSpecification = {
  id: 'projects-fill',
  type: 'fill',
  source: SRC.projects,
  'source-layer': 'projects',
  paint: { 'fill-color': projectColour, 'fill-opacity': 0.2 },
};
export const projectsLine: LineLayerSpecification = {
  id: 'projects-line',
  type: 'line',
  source: SRC.projects,
  'source-layer': 'projects',
  paint: { 'line-color': projectColour, 'line-width': 2 },
};
export const projectsLabel: SymbolLayerSpecification = {
  id: 'projects-label',
  type: 'symbol',
  source: SRC.projects,
  'source-layer': 'projects',
  minzoom: 14,
  layout: { 'text-field': ['coalesce', ['get', 'name'], ''], 'text-font': FONT_BOLD, 'text-size': 11, 'symbol-placement': 'point' },
  paint: { 'text-color': '#4B3A6B', 'text-halo-color': 'rgba(255,255,255,0.85)', 'text-halo-width': 1.2 },
};

export const villageCasing: LineLayerSpecification = {
  id: 'village-casing',
  type: 'line',
  source: SRC.village,
  paint: { 'line-color': '#FFFFFF', 'line-width': 5, 'line-opacity': 0.6 },
};
export const villageLine: LineLayerSpecification = {
  id: 'village-line',
  type: 'line',
  source: SRC.village,
  paint: { 'line-color': '#1D2320', 'line-width': 2.5, 'line-dasharray': [6, 3], 'line-opacity': 0.7 },
};

/* ---------- 3D preview: units ---------- */
export const unitsExtrusion: FillExtrusionLayerSpecification = {
  id: 'units-3d',
  type: 'fill-extrusion',
  source: SRC.units,
  'source-layer': 'units',
  minzoom: 14,
  paint: {
    // Basements (floor 0) live below datum in the DATA (base_m −3.2 → 0 m); MapLibre has no
    // underground camera, so render them as a thin brick slab at grade to stay visible.
    'fill-extrusion-base': ['case', ['<=', ['to-number', ['coalesce', ['get', 'floor'], 1]], 0], 0,
      ['to-number', ['coalesce', ['get', 'base_m'], 0]]],
    'fill-extrusion-height': ['case', ['<=', ['to-number', ['coalesce', ['get', 'floor'], 1]], 0], 0.5,
      ['to-number', ['coalesce', ['get', 'height_m'], 3]]],
    'fill-extrusion-color': ['case', ['<=', ['to-number', ['coalesce', ['get', 'floor'], 1]], 0], '#A63A2B',
      ['interpolate', ['linear'], ['to-number', ['coalesce', ['get', 'floor'], 0]],
        1, '#CFE3DA', 2, '#5FB39A', 4, '#0E6B54', 8, '#2F5D9E']],
    'fill-extrusion-opacity': 0.85,
    'fill-extrusion-vertical-gradient': true,
  },
};
