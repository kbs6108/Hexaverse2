import { ShieldAlert } from 'lucide-react';
import type { ParcelCDM } from '@/lib/cdm';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { KV, SectionTitle } from '@/components/Section';
import { titleCase } from '@/lib/format';
import { Badge, type Tone } from '@/components/Badge';
import { t } from '@/lib/i18n';

const permTone: Record<string, Tone> = { approved: 'primary', pending: 'amber', rejected: 'brick', none: 'neutral' };

export function PlanningSection({ p }: { p: ParcelCDM }) {
  const bp = p.planning.building_permission;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle right={<ProvenanceBadge source="planning" p={p.provenance.planning} />}>{t('drawer.masterPlan', 'Master plan')}</SectionTitle>
        <KV
          items={[
            { k: t('drawer.zone', 'Zone'), v: p.planning.zone_code ?? '—', mono: true },
            { k: t('drawer.zoneName', 'Zone name'), v: p.planning.zone_name ?? '—' },
            { k: t('drawer.currentLandUse', 'Current land use'), v: titleCase(p.planning.land_use) },
          ]}
          cols={3}
        />
      </div>
      <div>
        <SectionTitle>{t('drawer.buildingPermission', 'Building permission')}</SectionTitle>
        <div className="flex items-center gap-2">
          <Badge tone={permTone[bp?.status ?? 'none'] ?? 'neutral'}>{titleCase(bp?.status ?? 'none')}</Badge>
          {bp?.permit_no && <span className="font-mono text-sm">{bp.permit_no}</span>}
        </div>
        {bp && bp.status !== 'none' && (
          <KV
            className="mt-3"
            items={[
              { k: t('drawer.floors', 'Floors'), v: bp.floors ?? '—' },
              { k: t('drawer.builtUp', 'Built-up'), v: bp.built_up_sqm ? `${bp.built_up_sqm} m²` : '—' },
              { k: t('drawer.conditions', 'Conditions'), v: bp.conditions ?? '—' },
            ]}
            cols={3}
          />
        )}
      </div>
      <div>
        <SectionTitle>{t('drawer.restrictionZones', 'Restriction zones')}</SectionTitle>
        {p.restrictions.restriction_zones.length === 0 ? (
          <p className="text-sm text-ink-3">{t('drawer.noRestrictionZones', 'Parcel does not intersect any restriction zone.')}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {p.restrictions.restriction_zones.map((z, i) => (
              <li key={i}>
                <Badge tone="slate" icon={<ShieldAlert />}>{titleCase(z.kind)} · {z.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
