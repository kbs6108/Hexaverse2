import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Box, ChevronDown, Layers, PanelLeftClose, PanelLeftOpen, Satellite, TriangleAlert } from 'lucide-react';
import { env } from '@/lib/env';
import { useUI, type ColourBy, type LayerId } from '@/lib/store';
import { roleAtLeast, useAuth } from '@/lib/auth';
import { Checkbox, Field, Select } from '@/components/Field';
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
        className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-2 text-sm shadow-panel hover:bg-panel-2"
      >
        <PanelLeftOpen size={16} /> Layers
      </button>
    );
  }

  return (
    <aside aria-label="Layers" className="absolute top-3 bottom-3 left-3 z-10 flex w-72 flex-col rounded-lg border border-line bg-panel/95 shadow-panel backdrop-blur">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <Layers size={16} className="text-primary" />
        <h2 className="text-sm font-semibold">Layers</h2>
        <button type="button" onClick={() => setLayerPanelOpen(false)} aria-label="Collapse layer panel" className="ml-auto rounded-md p-1 text-ink-3 hover:bg-ground-2 hover:text-ink">
          <PanelLeftClose size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
        {/* Colour-by */}
        <div className="border-b border-line px-3 py-3">
          <Field label="Colour parcels by" htmlFor="colour-by">
            <Select id="colour-by" value={colourBy} onChange={(e) => setColourBy(e.target.value as ColourBy)}>
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
            </Select>
          </Field>
          <Legend entries={LEGENDS[colourBy].entries} className="mt-2" />
          <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-3">
            <TriangleAlert size={11} /> Disputed parcels are always hatched, change alerts always carry a marker.
          </p>
        </div>

        {TIERS.map((tier) => (
          <Tier
            key={tier.key}
            title={tier.title}
            defaultOpen={tier.key !== 'usecase'}
            // Use-case: officers/admin get it expanded by default (their daily layers);
            // citizens/first-timers get it folded. Either way the user's choice sticks.
            open={tier.key === 'usecase' ? usecaseOpen : undefined}
            onToggle={tier.key === 'usecase' ? setUsecaseTierOpen : undefined}
          >
            {tier.layers.map((l) => (
              <div key={l.id} className="py-1">
                <Checkbox label={l.label} hint={l.hint} checked={!!layers[l.id]} onChange={(e) => toggleLayer(l.id, e.target.checked)} />
                {l.legend && layers[l.id] && <Legend entries={l.legend} className="ml-6 mt-1" />}
              </div>
            ))}
          </Tier>
        ))}
      </div>

      {/* Basemap + 3D */}
      <div className="flex flex-col gap-2 border-t border-line px-3 py-2.5">
        <div role="radiogroup" aria-label="Basemap" className="grid grid-cols-2 gap-1 rounded-md bg-ground-2 p-1">
          <button
            type="button"
            role="radio"
            aria-checked={basemap === 'streets'}
            onClick={() => setBasemap('streets')}
            className={clsx('rounded px-2 py-1 text-xs font-medium', basemap === 'streets' ? 'bg-panel shadow-sm' : 'text-ink-3 hover:text-ink')}
          >
            Streets
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={basemap === 'imagery'}
            onClick={() => setBasemap('imagery')}
            title={env.esriApiKey ? 'Esri World Imagery (keyed basemap service)' : 'Esri World Imagery (public tiles)'}
            className={clsx('flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium', basemap === 'imagery' ? 'bg-panel shadow-sm' : 'text-ink-3 hover:text-ink')}
          >
            <Satellite size={12} /> Imagery
          </button>
        </div>
        <Checkbox
          label={
            <span className="flex items-center gap-1.5">
              <Box size={14} /> 3D units · preview
            </span>
          }
          hint="Extrudes unit footprints (base_m / height_m) and pitches the camera"
          checked={show3D}
          onChange={(e) => setShow3D(e.target.checked)}
        />
      </div>
    </aside>
  );
}

function Tier({ title, defaultOpen, open: controlledOpen, onToggle, children }: {
  title: string;
  defaultOpen: boolean;
  /** Controlled mode (used for the Use-case tier so the choice is remembered). */
  open?: boolean;
  onToggle?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? localOpen;
  const setOpen = (next: boolean) => (onToggle ? onToggle(next) : setLocalOpen(next));
  return (
    <section className="border-b border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-2 hover:bg-ground-2"
      >
        {title}
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="px-3 pb-2">{children}</div>}
    </section>
  );
}

export function Legend({ entries, className }: { entries: LegendEntry[]; className?: string }) {
  return (
    <ul className={clsx('grid grid-cols-1 gap-x-3 gap-y-1', className)}>
      {entries.map((e) => (
        <li key={e.value} className="flex items-center gap-2 text-xs text-ink-2">
          <span
            aria-hidden
            className="relative inline-block size-3.5 shrink-0 rounded-sm border border-black/20 overflow-hidden"
            style={{ background: e.colour + (e.hatch ? '55' : '') }}
          >
            {e.hatch && <span className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(135deg, ${e.colour} 0 1.5px, transparent 1.5px 4px)` }} />}
            {e.icon === 'alert' && <span className="absolute inset-0 grid place-items-center text-[9px] font-bold text-white">!</span>}
          </span>
          {e.label}
        </li>
      ))}
    </ul>
  );
}
