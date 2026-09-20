import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Box, ChevronDown, Layers, PanelLeftClose, PanelLeftOpen, Satellite, TriangleAlert } from 'lucide-react';
import { env } from '@/lib/env';
import { useUI, type ColourBy, type LayerId } from '@/lib/store';
import { roleAtLeast, useAuth } from '@/lib/auth';
import { Checkbox, Field } from '@/components/Field';
import { C, COLOUR_BY_OPTIONS, LEGENDS, type LegendEntry } from './legend';

interface LayerDef {
  id: LayerId;
  label: string;
  hint?: string;
  legend?: LegendEntry[];
}

const TIERS: { key: string; title: string; layers: LayerDef[] }[] = [
  {
    key: 'base',
    title: 'Base',
    layers: [
      { id: 'parcels', label: 'Cadastral parcels', hint: 'Fill + outline · hover and click' },
      { id: 'survey_labels', label: 'Survey numbers', hint: 'Zoom 16 and closer' },
      { id: 'village_boundary', label: 'Village boundary', legend: [{ value: 'v', label: 'Revenue village limit', colour: '#1D2320' }] },
    ],
  },
  {
    key: 'essential',
    title: 'Essential governance',
    layers: [{ id: 'zones', label: 'Master-plan zones', hint: 'Planning department', legend: LEGENDS.zone.entries }],
  },
  {
    key: 'usecase',
    title: 'Use-case',
    layers: [
      { id: 'roads', label: 'Roads', hint: 'Width by class', legend: [{ value: 'r', label: 'National → village', colour: '#9A6B12' }] },
      { id: 'water_lines', label: 'Water lines / drains', legend: [{ value: 'w', label: 'Canal, drain', colour: C.water }] },
      {
        id: 'restriction_zones',
        label: 'Restriction zones',
        hint: 'Dashed outline',
        legend: [
          { value: 'flood', label: 'Flood plain', colour: C.slate },
          { value: 'buffer', label: 'Buffer', colour: C.amber },
          { value: 'heritage', label: 'Heritage', colour: C.violet },
        ],
      },
      { id: 'projects', label: 'Government projects', legend: [{ value: 'p', label: 'Project footprint', colour: C.violet }] },
      {
        id: 'settlement_schemes',
        label: 'Settlement / resurvey',
        hint: 'Dotted outline · per state',
        legend: [
          { value: 'completed', label: 'Resurvey completed', colour: C.green },
          { value: 'in_progress', label: 'Resurvey in progress', colour: C.amber },
        ],
      },
      { id: 'change_alerts', label: 'Satellite change alerts', hint: 'Sentinel-2 · NDVI / NDBI', legend: LEGENDS.change_alert.entries.slice(0, 1) },
    ],
  },
];

export function LayerPanel() {
  const { layers, toggleLayer, colourBy, setColourBy, basemap, setBasemap, show3D, setShow3D, layerPanelOpen, setLayerPanelOpen, usecaseTierOpen, setUsecaseTierOpen } = useUI();
  const { role } = useAuth();
  const usecaseOpen = usecaseTierOpen ?? roleAtLeast(role, 'officer');

  if (!layerPanelOpen) {
    return (
      <button
        type="button"
        onClick={() => setLayerPanelOpen(true)}
        aria-label="Open layer panel"
        className="absolute top-20 left-4 z-40 flex items-center gap-2 rounded-2xl border border-[#D5D2C7] bg-[#F4F1E7]/85 px-4 py-2.5 text-sm font-bold tracking-tight text-[#18231F] shadow-[0_12px_40px_rgba(24,35,31,0.08)] backdrop-blur-2xl hover:bg-[#F4F1E7] transition-all cursor-pointer select-none"
      >
        <PanelLeftOpen size={16} className="text-[#176B52]" /> Layers
      </button>
    );
  }

  return (
    <aside aria-label="Layers" className="absolute top-20 left-4 z-40 w-[320px] max-h-[calc(100vh-6.5rem)] overflow-y-auto bg-[#F4F1E7]/85 backdrop-blur-2xl border border-[#D5D2C7] shadow-[0_12px_40px_rgba(24,35,31,0.08)] rounded-2xl p-4 text-[#18231F] scroll-thin flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D5D2C7]/60">
        <div className="flex items-center gap-2">
          <Layers size={17} className="text-[#176B52]" />
          <h2 className="text-[#18231F] font-black text-sm tracking-tight uppercase">Layers</h2>
        </div>
        <button
          type="button"
          onClick={() => setLayerPanelOpen(false)}
          aria-label="Collapse layer panel"
          className="text-[#6F7768] hover:text-[#18231F] p-1.5 rounded-lg hover:bg-[#E9E5D8]/60 transition-colors cursor-pointer"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin pt-3 space-y-3">
        {/* Colour-by Dropdown */}
        <div className="space-y-1.5">
          <Field label={<span className="text-xs font-semibold text-[#18231F]">Colour parcels by</span>} htmlFor="colour-by">
            <select
              id="colour-by"
              value={colourBy}
              onChange={(e) => setColourBy(e.target.value as ColourBy)}
              className="w-full bg-[#E9E5D8]/70 border border-[#D5D2C7] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#18231F] focus:ring-2 focus:ring-[#176B52]/40 outline-none cursor-pointer"
            >
              <optgroup label="Essential governance">
                {COLOUR_BY_OPTIONS.filter((o) => o.tier === 'essential').map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
              <optgroup label="Use-case">
                {COLOUR_BY_OPTIONS.filter((o) => o.tier === 'usecase').map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
            </select>
          </Field>
          <Legend entries={LEGENDS[colourBy].entries} className="mt-2" />
          <p className="mt-2 flex items-center gap-1 text-[10.5px] text-[#4B5345]">
            <TriangleAlert size={11} className="text-[#9A6B12] shrink-0" /> Disputed parcels are always hatched, change alerts always carry a marker.
          </p>
        </div>

        {TIERS.map((tier) => (
          <Tier
            key={tier.key}
            title={tier.title}
            defaultOpen={tier.key !== 'usecase'}
            open={tier.key === 'usecase' ? usecaseOpen : undefined}
            onToggle={tier.key === 'usecase' ? setUsecaseTierOpen : undefined}
          >
            {tier.layers.map((l) => (
              <div key={l.id} className="hover:bg-[#E9E5D8]/50 p-1.5 rounded-xl transition-colors cursor-pointer">
                <Checkbox
                  label={<span className="text-xs font-medium text-[#18231F]">{l.label}</span>}
                  hint={l.hint}
                  checked={!!layers[l.id]}
                  onChange={(e) => toggleLayer(l.id, e.target.checked)}
                />
                {l.legend && layers[l.id] && <Legend entries={l.legend} className="ml-6 mt-1" />}
              </div>
            ))}
          </Tier>
        ))}
      </div>

      {/* Basemap Switcher + 3D Units */}
      <div className="flex flex-col gap-2 border-t border-[#D5D2C7]/60 pt-3 mt-3">
        <div role="radiogroup" aria-label="Basemap" className="bg-[#E9E5D8]/80 p-1 rounded-xl border border-[#D5D2C7]/70 flex gap-1">
          <button
            type="button"
            role="radio"
            aria-checked={basemap === 'streets'}
            onClick={() => setBasemap('streets')}
            className={clsx(
              'flex-1 text-center transition-colors cursor-pointer rounded-lg py-1 px-3 text-xs',
              basemap === 'streets'
                ? 'bg-[#23483A] text-[#F4F1E7] font-bold shadow-xs'
                : 'text-[#6F7768] hover:text-[#18231F] font-medium'
            )}
          >
            Streets
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={basemap === 'imagery'}
            onClick={() => setBasemap('imagery')}
            title={env.esriApiKey ? 'Esri World Imagery (keyed basemap service)' : 'Esri World Imagery (public tiles)'}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1 transition-colors cursor-pointer rounded-lg py-1 px-3 text-xs',
              basemap === 'imagery'
                ? 'bg-[#23483A] text-[#F4F1E7] font-bold shadow-xs'
                : 'text-[#6F7768] hover:text-[#18231F] font-medium'
            )}
          >
            <Satellite size={12} /> Imagery
          </button>
        </div>
        <div className="hover:bg-[#E9E5D8]/50 p-1.5 rounded-xl transition-colors cursor-pointer">
          <Checkbox
            label={
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#18231F]">
                <Box size={13} className="text-[#176B52]" /> 3D units · preview
              </span>
            }
            hint="Extrudes unit footprints (base_m / height_m) and pitches camera"
            checked={show3D}
            onChange={(e) => setShow3D(e.target.checked)}
          />
        </div>
      </div>
    </aside>
  );
}

function Tier({ title, defaultOpen, open: controlledOpen, onToggle, children }: {
  title: string;
  defaultOpen: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  const setOpen = (next: boolean) => (onToggle ? onToggle(next) : setLocalOpen(next));
  return (
    <section className="border-t border-[#D5D2C7]/60 pt-2.5 mt-2.5 first:border-t-0 first:pt-0 first:mt-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-left text-[10px] font-black tracking-widest uppercase text-[#6F7768] hover:text-[#18231F] transition-colors cursor-pointer"
      >
        {title}
        <ChevronDown size={13} className={clsx('transition-transform text-[#6F7768]', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-1 space-y-0.5">{children}</div>}
    </section>
  );
}

export function Legend({ entries, className }: { entries: LegendEntry[]; className?: string }) {
  return (
    <ul className={clsx('grid grid-cols-1 gap-x-3 gap-y-1', className)}>
      {entries.map((e) => (
        <li key={e.value} className="flex items-center gap-2 text-xs text-[#18231F] font-medium">
          <span
            aria-hidden
            className="relative inline-block size-3 shrink-0 rounded-xs border border-black/20 overflow-hidden"
            style={{ background: e.colour + (e.hatch ? '55' : '') }}
          >
            {e.hatch && <span className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(135deg, ${e.colour} 0 1.5px, transparent 1.5px 4px)` }} />}
            {e.icon === 'alert' && <span className="absolute inset-0 grid place-items-center text-[8px] font-bold text-white">!</span>}
          </span>
          <span className="text-[11.5px]">{e.label}</span>
        </li>
      ))}
    </ul>
  );
}
