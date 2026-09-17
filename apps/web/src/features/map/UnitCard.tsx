import { Boxes, X } from 'lucide-react';

export interface UnitInfo {
  ulpin_3d?: string;
  ulpin?: string;
  building_name?: string;
  floor?: number;
  unit_no?: string;
  base_m?: number;
  height_m?: number;
  area_sqm?: number;
  owner_name?: string;
}

/** Data card for a unit clicked in the 3D view — the "vertical property" record:
 *  3D-ULPIN, level, floor area, and the true elevation band (basements are negative). */
export function UnitCard({ unit, onClose }: { unit: UnitInfo; onClose: () => void }) {
  const level = unit.floor === 0 ? 'Basement' : unit.floor != null ? `Floor ${unit.floor}` : '—';
  const rows: [string, string][] = [
    ['Level', `${level}${unit.unit_no ? ` · Unit ${unit.unit_no}` : ''}`],
    ['Floor area', unit.area_sqm != null ? `${unit.area_sqm} m²` : '—'],
    ['Elevation band', unit.base_m != null && unit.height_m != null ? `${unit.base_m} m → ${unit.height_m} m` : '—'],
    ['Occupant (record)', unit.owner_name || '—'],
  ];
  return (
    <div className="absolute right-3 top-24 z-20 w-72 rounded-2xl border border-[#D5D2C7]/50 bg-[#F4F1E7]/40 text-[#18231F] shadow-[0_8px_32px_rgba(24,35,31,0.08)] backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-[#D5D2C7]/50 px-3 py-2.5">
        <Boxes size={15} className="text-[#176B52]" />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-[#6F7768]">3D unit{unit.building_name ? ` · ${unit.building_name}` : ''}</p>
          <p className="truncate font-mono text-[12px] font-semibold text-[#18231F]">{unit.ulpin_3d ?? '—'}</p>
        </div>
        <button type="button" aria-label="Close unit card" onClick={onClose} className="ml-auto rounded-lg p-1 text-[#6F7768] hover:bg-[#E9E5D8]/60 hover:text-[#18231F] transition-colors">
          <X size={14} />
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-3 py-2.5">
        {rows.map(([k, v]) => (
          <div key={k} className={k === 'Occupant (record)' ? 'col-span-2' : ''}>
            <dt className="text-[10px] uppercase tracking-wide text-[#6F7768]">{k}</dt>
            <dd className="text-[12.5px] text-[#18231F] font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
