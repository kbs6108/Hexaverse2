import type { ColourBy } from '@/lib/store';

/** Map colours are fixed hex (canvas cannot read CSS variables). Chosen to read on both basemaps. */
export const C = {
  green: '#0E6B54',
  amber: '#9A6B12',
  brick: '#A63A2B',
  violet: '#6B4E9A',
  slate: '#2F5D9E',
  neutral: '#B9B5A6',
  neutralDark: '#7A807B',
  water: '#4C8DC9',
};

export interface LegendEntry {
  value: string;
  label: string;
  colour: string;
  hatch?: boolean;
  icon?: 'alert';
}

export const LAND_USE: LegendEntry[] = [
  { value: 'residential', label: 'Residential', colour: '#D8A24A' },
  { value: 'commercial', label: 'Commercial', colour: '#C4574A' },
  { value: 'agricultural', label: 'Agricultural', colour: '#5E9E52' },
  { value: 'industrial', label: 'Industrial', colour: '#8C7DB0' },
  { value: 'government', label: 'Government', colour: C.slate },
  { value: 'open_space', label: 'Open space', colour: '#9CC27A' },
  { value: 'water_body', label: 'Water body', colour: C.water },
  { value: 'mixed', label: 'Mixed use', colour: '#C98A6B' },
  { value: 'vacant', label: 'Vacant', colour: '#B9B5A6' },
  { value: 'public', label: 'Public / semi-public', colour: C.slate },
];

export const OWNERSHIP: LegendEntry[] = [
  { value: 'patta', label: 'Patta (private)', colour: C.green },
  { value: 'government', label: 'Government', colour: C.slate },
  { value: 'govt', label: 'Government', colour: C.slate },
  { value: 'assigned', label: 'Assigned', colour: C.amber },
  { value: 'inam', label: 'Inam / endowment', colour: C.violet },
  { value: 'joint', label: 'Joint', colour: '#5E9E52' },
];

export const ZONES: LegendEntry[] = [
  { value: 'R', label: 'Residential (R*)', colour: '#D8A24A' },
  { value: 'C', label: 'Commercial (C*)', colour: '#C4574A' },
  { value: 'I', label: 'Industrial (I*)', colour: '#8C7DB0' },
  { value: 'A', label: 'Agricultural (A*)', colour: '#5E9E52' },
  { value: 'G', label: 'Green / open (G*)', colour: '#9CC27A' },
  { value: 'P', label: 'Public / semi-public (P*)', colour: C.slate },
];

export const PERMISSION: LegendEntry[] = [
  { value: 'approved', label: 'Approved', colour: C.green },
  { value: 'pending', label: 'Pending', colour: C.amber },
  { value: 'rejected', label: 'Rejected', colour: C.brick },
  { value: 'none', label: 'No permission on file', colour: C.neutral },
];

export const LEGENDS: Record<ColourBy, { title: string; entries: LegendEntry[] }> = {
  land_use: { title: 'Land use', entries: LAND_USE },
  ownership_type: { title: 'Ownership type', entries: OWNERSHIP },
  registered: {
    title: 'Registration',
    entries: [
      { value: 'true', label: 'Registered', colour: C.green },
      { value: 'false', label: 'Unregistered', colour: C.neutral },
    ],
  },
  encumbrance: {
    title: 'Encumbrance',
    entries: [
      { value: 'true', label: 'Mortgaged', colour: C.violet, hatch: true },
      { value: 'false', label: 'Clear', colour: C.neutral },
    ],
  },
  dispute: {
    title: 'Dispute',
    entries: [
      { value: 'true', label: 'Under dispute (hatched)', colour: C.brick, hatch: true },
      { value: 'false', label: 'No dispute', colour: C.neutral },
    ],
  },
  zone: { title: 'Master-plan zone', entries: ZONES },
  permission: { title: 'Building permission', entries: PERMISSION },
  tax_arrears: {
    title: 'Property-tax arrears',
    entries: [
      { value: '0', label: 'Nil', colour: C.neutral },
      { value: '1', label: 'Up to ₹10,000', colour: C.amber },
      { value: '10000', label: 'Above ₹10,000', colour: C.brick },
    ],
  },
  change_alert: {
    title: 'Satellite change alert',
    entries: [
      { value: 'true', label: 'Change detected', colour: C.brick, icon: 'alert' },
      { value: 'false', label: 'No change flagged', colour: C.neutral },
    ],
  },
};

export const COLOUR_BY_OPTIONS: { value: ColourBy; label: string; tier: 'essential' | 'usecase' }[] = [
  { value: 'land_use', label: 'Land use', tier: 'essential' },
  { value: 'ownership_type', label: 'Ownership type', tier: 'essential' },
  { value: 'registered', label: 'Registered / unregistered', tier: 'essential' },
  { value: 'encumbrance', label: 'Encumbrance (mortgage)', tier: 'essential' },
  { value: 'dispute', label: 'Dispute', tier: 'essential' },
  { value: 'zone', label: 'Master-plan zone', tier: 'essential' },
  { value: 'permission', label: 'Building permission', tier: 'essential' },
  { value: 'tax_arrears', label: 'Tax arrears', tier: 'usecase' },
  { value: 'change_alert', label: 'Change alerts', tier: 'usecase' },
];
