import { ShieldAlert } from 'lucide-react';
import type { ParcelCDM } from '@/lib/cdm';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { KV, SectionTitle } from '@/components/Section';
import { titleCase } from '@/lib/format';
import { Badge, type Tone } from '@/components/Badge';

const permTone: Record<string, Tone> = { approved: 'primary', pending: 'amber', rejected: 'brick', none: 'neutral' };

export function PlanningSection({ p }: { p: ParcelCDM }) {
  const bp = p.planning.building_permission;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle right={<ProvenanceBadge source="planning" p={p.provenance.planning} />}>Master plan</SectionTitle>
        <KV
          items={[
            { k: 'Zone', v: p.planning.zone_code ?? '—', mono: true },
            { k: 'Zone name', v: p.planning.zone_name ?? '—' },
            { k: 'Current land use', v: titleCase(p.planning.land_use) },
          ]}
          cols={3}
        />
      </div>
      <div>
        <SectionTitle>Building permission</SectionTitle>
        <div className="flex items-center gap-2">
          <Badge tone={permTone[bp?.status ?? 'none'] ?? 'neutral'}>{titleCase(bp?.status ?? 'none')}</Badge>
          {bp?.permit_no && <span className="font-mono text-sm">{bp.permit_no}</span>}
        </div>
        {bp && bp.status !== 'none' && (
          <KV
            className="mt-3"
            items={[
              { k: 'Floors', v: bp.floors ?? '—' },
              { k: 'Built-up', v: bp.built_up_sqm ? `${bp.built_up_sqm} m²` : '—' },
              { k: 'Conditions', v: bp.conditions ?? '—' },
            ]}
            cols={3}
          />
        )}
      </div>
      <div>
        <SectionTitle>Restriction zones</SectionTitle>
        {p.restrictions.restriction_zones.length === 0 ? (
          <p className="text-sm text-ink-3">Parcel does not intersect any restriction zone.</p>
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
