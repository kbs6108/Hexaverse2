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
        { id: 'parcels', labelKey: 'map.cadastralParcels', defaultLabel: 'Cadastral parcels', hint: 'ISO 19152 cadastral fabric · click to inspect profile' },
        { id: 'survey_labels', labelKey: 'map.surveyNumbers', defaultLabel: 'Survey numbers', hint: 'Authoritative field numbers at zoom 16+' },
        { id: 'village_boundary', labelKey: 'map.villageBoundary', defaultLabel: 'Village boundary', legend: [{ value: 'v', label: 'Revenue village statutory limit', colour: '#1D2320' }] },
      ],
    },
    {
      key: 'essential',
      title: t('map.essential'),
      layers: [{ id: 'zones', labelKey: 'map.masterPlanZones', defaultLabel: 'Master-plan zones', hint: 'Town planning permissible use covenants & FAR', legend: LEGENDS.zone.entries }],
    },
    {
      key: 'usecase',
      title: t('map.usecase'),
      layers: [
        { id: 'roads', labelKey: 'map.roads', defaultLabel: 'Roads & Rights-of-Way', hint: 'Hierarchy by class (National Highway → Village track)', legend: [{ value: 'r', label: 'National → village', colour: '#9A6B12' }] },
        { id: 'water_lines', labelKey: 'map.waterLines', defaultLabel: 'Water lines / canals / drains', hint: 'Ayacut canals, irrigation channels & waterbodies', legend: [{ value: 'w', label: 'Canal, drain', colour: C.water }] },
        {
          id: 'restriction_zones',
          labelKey: 'map.restrictionZones',
          defaultLabel: 'Restriction zones',
          hint: 'Floodplain buffer (500m), waterbody buffer (30m), heritage conservation',
          legend: [
            { value: 'flood', label: t('map.floodPlain'), colour: C.slate },
            { value: 'buffer', label: t('map.bufferZone'), colour: C.amber },
            { value: 'heritage', label: t('map.heritageZone'), colour: C.violet },
          ],
        },
        { id: 'projects', labelKey: 'map.govtProjects', defaultLabel: 'Infrastructure Corridors & Projects', hint: 'NHAI / Metro / Rail ROW & RFCTLARR acquisition severance', legend: [{ value: 'p', label: 'Corridor take buffer', colour: C.violet }] },
        {
          id: 'settlement_schemes',
          labelKey: 'map.settlementSchemes',
          defaultLabel: 'Settlement / resurvey',
          hint: 'DGPS / ETS resurvey status under State Boundaries Act',
          legend: [
            { value: 'completed', label: 'Resurvey completed', colour: C.green },
            { value: 'in_progress', label: 'Resurvey in progress', colour: C.amber },
          ],
        },
        { id: 'change_alerts', labelKey: 'map.satelliteAlerts', defaultLabel: 'Satellite change alerts', hint: 'Sentinel-2 10m NDVI vegetative drop & NDBI built-up surge', legend: LEGENDS.change_alert.entries.slice(0, 1) },
      ],
    },
  ];

  if (!layerPanelOpen) {
    return (
      <button
        type="button"
        onClick={() => setLayerPanelOpen(true)}
        aria-label={t('map.openLayers')}
        className="absolute top-20 left-4 z-40 flex items-center gap-2 rounded-2xl border border-line bg-panel/90 px-4 py-2.5 text-sm font-bold tracking-tight text-ink shadow-elevated backdrop-blur-2xl hover:bg-panel transition-all cursor-pointer select-none"
      >
        <PanelLeftOpen size={16} className="text-primary" /> {t('map.layers')}
      </button>
    );
  }

  return (
    <aside aria-label={t('map.layers')} className="absolute top-20 left-4 z-40 w-[320px] max-h-[calc(100vh-6.5rem)] overflow-y-auto bg-panel/95 backdrop-blur-2xl border border-line shadow-elevated rounded-2xl p-4 text-ink scroll-thin flex flex-col select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <Layers size={17} className="text-primary" />
          <h2 className="text-ink font-black text-sm tracking-tight uppercase">{t('map.layers')}</h2>
        </div>
        <button
          type="button"
          onClick={() => setLayerPanelOpen(false)}
          aria-label="Collapse layer panel"
          className="text-ink-3 hover:text-ink p-1.5 rounded-lg hover:bg-ground-2 transition-colors cursor-pointer"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin pt-3 space-y-3">
        {/* Colour-by Dropdown */}
        <div className="space-y-1.5">
          <Field label={<span className="text-xs font-semibold text-ink">{t('map.colourBy')}</span>} htmlFor="colour-by">
            <select
              id="colour-by"
              value={colourBy}
              onChange={(e) => setColourBy(e.target.value as ColourBy)}
              className="w-full bg-ground-2 border border-line rounded-xl px-3 py-1.5 text-xs font-semibold text-ink focus:ring-2 focus:ring-primary/40 outline-none cursor-pointer"
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
          <div className="mt-2 space-y-1 rounded-lg bg-ground-1 p-2 text-[10.5px] text-ink-3 border border-line/60">
            <p className="flex items-center gap-1 text-ink-2 font-medium">
              <TriangleAlert size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Multi-attribute visual cartography</span>
            </p>
            <p className="leading-tight">
              Disputed parcels are hatched; satellite change alerts display pulse markers; infrastructure corridors show statutory severance boundaries.
            </p>
          </div>
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
              <div key={l.id} className="hover:bg-ground-2/70 p-1.5 rounded-xl transition-colors cursor-pointer">
                <Checkbox
                  label={<span className="text-xs font-medium text-ink">{t(l.labelKey, l.defaultLabel)}</span>}
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
      <div className="flex flex-col gap-2 border-t border-line pt-3 mt-3">
        <div role="radiogroup" aria-label="Basemap" className="bg-ground-2 p-1 rounded-xl border border-line flex gap-1">
          <button
            type="button"
            role="radio"
            aria-checked={basemap === 'streets'}
            onClick={() => setBasemap('streets')}
            className={clsx(
              'flex-1 text-center transition-colors cursor-pointer rounded-lg py-1 px-3 text-xs',
              basemap === 'streets'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-ink-3 hover:text-ink font-medium'
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
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-ink-3 hover:text-ink font-medium'
            )}
          >
            <Satellite size={12} /> {t('map.satellite')}
          </button>
        </div>

        {/* 3D Units Toggle Button */}
        <div>
          <button
            type="button"
            onClick={() => setShow3D(!show3D)}
            className={clsx(
              'w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
              show3D
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-ground-2 text-ink border-line hover:bg-ground-3'
            )}
          >
            <div className="flex items-center gap-1.5">
              <Box size={14} className={show3D ? 'text-white' : 'text-ink-3'} />
              <span>{t('map.3dTerrain', '3D Volumetric Cadastre')}</span>
            </div>
            <span className={clsx('text-[10.5px] px-1.5 py-0.5 rounded font-mono', show3D ? 'bg-primary-soft text-primary' : 'bg-ground-3 text-ink-3')}>
              {show3D ? 'ON' : 'OFF'}
            </span>
          </button>
          <p className="mt-1 px-1 text-[10px] text-ink-3 leading-tight">
            ISO 19152 volumetric strata envelopes (AGL / BGL floors & utility easements).
          </p>
        </div>
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
    <div className="border-t border-line pt-2 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-ink-3 hover:text-ink cursor-pointer"
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
    <ul className={clsx('flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-ink-2', className)}>
      {entries.map((e) => (
        <li key={e.value} className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full shrink-0" style={{ backgroundColor: e.colour }} />
          <span>{e.label}</span>
        </li>
      ))}
    </ul>
  );
}
