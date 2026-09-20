import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Box, ChevronDown, Layers, PanelLeftClose, PanelLeftOpen, Satellite, TriangleAlert } from 'lucide-react';
import { env } from '@/lib/env';
import { useUI, type ColourBy, type LayerId } from '@/lib/store';
import { roleAtLeast, useAuth } from '@/lib/auth';
import { Checkbox, Field } from '@/components/Field';
import { C, COLOUR_BY_OPTIONS, LEGENDS, type LegendEntry } from './legend';
import { useTranslation } from '@/lib/i18n';

interface LayerDef {
  id: LayerId;
  labelKey: string;
  defaultLabel: string;
  hint?: string;
  legend?: LegendEntry[];
}

export function LayerPanel() {
  const { layers, toggleLayer, colourBy, setColourBy, basemap, setBasemap, show3D, setShow3D, layerPanelOpen, setLayerPanelOpen, usecaseTierOpen, setUsecaseTierOpen } = useUI();
  const { role } = useAuth();
  const { t } = useTranslation();
  const usecaseOpen = usecaseTierOpen ?? roleAtLeast(role, 'officer');

  const tiers: { key: string; title: string; layers: LayerDef[] }[] = [
    {
      key: 'base',
      title: t('map.base'),
      layers: [
        { id: 'parcels', labelKey: 'map.cadastralParcels', defaultLabel: 'Cadastral parcels', hint: 'Fill + outline · hover and click' },
        { id: 'survey_labels', labelKey: 'map.surveyNumbers', defaultLabel: 'Survey numbers', hint: 'Zoom 16 and closer' },
        { id: 'village_boundary', labelKey: 'map.villageBoundary', defaultLabel: 'Village boundary', legend: [{ value: 'v', label: 'Revenue village limit', colour: '#1D2320' }] },
      ],
    },
    {
      key: 'essential',
      title: t('map.essential'),
      layers: [{ id: 'zones', labelKey: 'map.masterPlanZones', defaultLabel: 'Master-plan zones', hint: 'Planning department', legend: LEGENDS.zone.entries }],
    },
    {
      key: 'usecase',
      title: t('map.usecase'),
      layers: [
        { id: 'roads', labelKey: 'map.roads', defaultLabel: 'Roads', hint: 'Width by class', legend: [{ value: 'r', label: 'National → village', colour: '#9A6B12' }] },
        { id: 'water_lines', labelKey: 'map.waterLines', defaultLabel: 'Water lines / canals / drains', legend: [{ value: 'w', label: 'Canal, drain', colour: C.water }] },
        {
          id: 'restriction_zones',
          labelKey: 'map.restrictionZones',
          defaultLabel: 'Restriction zones',
          hint: 'Dashed outline',
          legend: [
            { value: 'flood', label: t('map.floodPlain'), colour: C.slate },
            { value: 'buffer', label: t('map.bufferZone'), colour: C.amber },
            { value: 'heritage', label: t('map.heritageZone'), colour: C.violet },
          ],
        },
        { id: 'projects', labelKey: 'map.govtProjects', defaultLabel: 'Government projects', legend: [{ value: 'p', label: 'Project footprint', colour: C.violet }] },
        {
          id: 'settlement_schemes',
          labelKey: 'map.settlementSchemes',
          defaultLabel: 'Settlement / resurvey',
          hint: 'Dotted outline · per state',
          legend: [
            { value: 'completed', label: 'Resurvey completed', colour: C.green },
            { value: 'in_progress', label: 'Resurvey in progress', colour: C.amber },
          ],
        },
        { id: 'change_alerts', labelKey: 'map.satelliteAlerts', defaultLabel: 'Satellite change alerts', hint: 'Sentinel-2 · NDVI / NDBI', legend: LEGENDS.change_alert.entries.slice(0, 1) },
      ],
    },
  ];

  if (!layerPanelOpen) {
    return (
      <button
        type="button"
        onClick={() => setLayerPanelOpen(true)}
        aria-label={t('map.openLayers')}
        className="absolute top-20 left-4 z-40 flex items-center gap-2 rounded-2xl border border-[#D5D2C7] bg-[#F4F1E7]/85 px-4 py-2.5 text-sm font-bold tracking-tight text-[#18231F] shadow-[0_12px_40px_rgba(24,35,31,0.08)] backdrop-blur-2xl hover:bg-[#F4F1E7] transition-all cursor-pointer select-none"
      >
        <PanelLeftOpen size={16} className="text-[#176B52]" /> {t('map.layers')}
      </button>
    );
  }

  return (
    <aside aria-label={t('map.layers')} className="absolute top-20 left-4 z-40 w-[320px] max-h-[calc(100vh-6.5rem)] overflow-y-auto bg-[#F4F1E7]/85 backdrop-blur-2xl border border-[#D5D2C7] shadow-[0_12px_40px_rgba(24,35,31,0.08)] rounded-2xl p-4 text-[#18231F] scroll-thin flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D5D2C7]/60">
        <div className="flex items-center gap-2">
          <Layers size={17} className="text-[#176B52]" />
          <h2 className="text-[#18231F] font-black text-sm tracking-tight uppercase">{t('map.layers')}</h2>
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
          <Field label={<span className="text-xs font-semibold text-[#18231F]">{t('map.colourBy')}</span>} htmlFor="colour-by">
            <select
              id="colour-by"
              value={colourBy}
              onChange={(e) => setColourBy(e.target.value as ColourBy)}
              className="w-full bg-[#E9E5D8]/70 border border-[#D5D2C7] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#18231F] focus:ring-2 focus:ring-[#176B52]/40 outline-none cursor-pointer"
            >
              <optgroup label={t('map.essential')}>
                {COLOUR_BY_OPTIONS.filter((o) => o.tier === 'essential').map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
              <optgroup label={t('map.usecase')}>
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

        {tiers.map((tier) => (
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
                  label={<span className="text-xs font-medium text-[#18231F]">{t(l.labelKey, l.defaultLabel)}</span>}
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
            {t('map.streets')}
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
            <Satellite size={12} /> {t('map.satellite')}
          </button>
        </div>

        {/* 3D Units Toggle Button */}
        <button
          type="button"
          onClick={() => setShow3D(!show3D)}
          className={clsx(
            'flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
            show3D
              ? 'bg-[#23483A] text-[#F4F1E7] border-[#23483A] shadow-xs'
              : 'bg-[#E9E5D8]/70 text-[#18231F] border-[#D5D2C7] hover:bg-[#E9E5D8]'
          )}
        >
          <div className="flex items-center gap-1.5">
            <Box size={14} className={show3D ? 'text-[#B38A4C]' : 'text-[#6F7768]'} />
            <span>{t('map.3dTerrain')}</span>
          </div>
          <span className={clsx('text-[10.5px] px-1.5 py-0.5 rounded font-mono', show3D ? 'bg-[#176B52] text-[#F4F1E7]' : 'bg-[#D5D2C7] text-[#6F7768]')}>
            {show3D ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </aside>
  );
}

function Tier({
  title,
  defaultOpen = true,
  open: controlledOpen,
  onToggle,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (next: boolean) => void;
  children: ReactNode;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolled;
  const toggle = () => {
    if (onToggle) onToggle(!open);
    else setUncontrolled(!open);
  };
  return (
    <div className="border-t border-[#D5D2C7]/60 pt-2 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-[#6F7768] hover:text-[#18231F] cursor-pointer"
      >
        <span>{title}</span>
        <ChevronDown size={14} className={clsx('transition-transform', !open && '-rotate-90')} />
      </button>
      {open && <div className="mt-1 flex flex-col gap-1">{children}</div>}
    </div>
  );
}

function Legend({ entries, className }: { entries: LegendEntry[]; className?: string }) {
  return (
    <ul className={clsx('flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[#4B5345]', className)}>
      {entries.map((e) => (
        <li key={e.value} className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full shrink-0" style={{ backgroundColor: e.colour }} />
          <span>{e.label}</span>
        </li>
      ))}
    </ul>
  );
}
