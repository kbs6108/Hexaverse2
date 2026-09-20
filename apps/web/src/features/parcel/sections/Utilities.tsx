import { Building2, Check, Droplets, Route, Waves, X, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import type { ParcelCDM } from '@/lib/cdm';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { KV, SectionTitle } from '@/components/Section';
import { titleCase } from '@/lib/format';
import { t } from '@/lib/i18n';

export function UtilitiesSection({ p }: { p: ParcelCDM }) {
  const u = p.utilities;
  const items = [
    { label: t('drawer.water', 'Water'), on: u?.water ?? false, icon: Droplets },
    { label: t('drawer.electricity', 'Electricity'), on: u?.electricity ?? false, icon: Zap },
    { label: t('drawer.sewer', 'Sewer'), on: u?.sewer ?? false, icon: Waves },
  ];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle right={<ProvenanceBadge source="utilities" p={p.provenance.utilities} />}>{t('drawer.connections', 'Connections')}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {items.map((it) => (
            <div key={it.label} className={clsx('flex items-center gap-2 rounded-md border px-3 py-2', it.on ? 'border-primary/25 bg-primary-soft/60 text-primary' : 'border-line bg-ground-2 text-ink-3')}>
              <it.icon size={16} />
              <span className="flex-1 text-sm font-medium">{it.label}</span>
              {it.on ? <Check size={14} aria-label="connected" /> : <X size={14} aria-label="not connected" />}
            </div>
          ))}
        </div>
        <KV
          className="mt-3"
          items={[
            { k: t('drawer.roadAccess', 'Road access'), v: u?.road_access_m !== null && u?.road_access_m !== undefined ? `${u.road_access_m} m` : '—' },
            { k: t('drawer.nearestRoadClass', 'Nearest road class'), v: <span className="inline-flex items-center gap-1"><Route size={13} />{titleCase(u?.nearest_road_class)}</span> },
          ]}
        />
      </div>

      <div>
        <SectionTitle>{t('drawer.buildingsUnits', 'Buildings & units (3D-ready)')}</SectionTitle>
        {p.buildings.length === 0 ? (
          <p className="text-sm text-ink-3">{t('drawer.noBuildingFootprint', 'No building footprint on record.')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {p.buildings.map((b) => (
              <li key={b.id} className="rounded-md border border-line">
                <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 text-sm">
                  <Building2 size={15} className="text-slate" />
                  <span className="font-medium">{b.name ?? `Building ${b.id}`}</span>
                  <span className="text-ink-3">
                    · {b.floors} floors{b.basement_floors ? ` + ${b.basement_floors} basement` : ''}
                    {b.height_m ? ` · ${b.height_m} m tall` : ''}
                    {b.width_m && b.depth_m ? ` · ${b.width_m} × ${b.depth_m} m footprint` : ''}
                  </span>
                </div>
                <ul className="max-h-48 overflow-y-auto scroll-thin">
                  {b.units.map((un) => (
                    <li key={un.ulpin_3d} className="flex items-center justify-between gap-2 px-3 py-1 text-xs odd:bg-ground-2/60">
                      <span className="font-mono">{un.ulpin_3d}</span>
                      <span className="text-right text-ink-2">
                        {un.floor === 0 ? 'Basement' : `F${un.floor}`} · {un.unit_no}
                        {un.area_sqm ? ` · ${un.area_sqm} m²` : ''}
                        {un.base_m != null && un.height_m != null ? ` · ${un.base_m}→${un.height_m} m` : ''}
                        {un.owner_name ? ` · ${un.owner_name}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
