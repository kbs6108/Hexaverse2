import { EyeOff, UserRound } from 'lucide-react';
import type { ParcelCDM } from '@/lib/cdm';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { KV, SectionTitle, Callout } from '@/components/Section';
import { fmtArea, titleCase } from '@/lib/format';
import { Badge } from '@/components/Badge';

export function Ownership({ p }: { p: ParcelCDM }) {
  const ror = p.rights.ror;
  return (
    <div className="flex flex-col gap-5">
      <div>
        <SectionTitle right={<ProvenanceBadge source="revenue" p={p.provenance.revenue} />}>Record of Rights</SectionTitle>
        {p.party.masked && (
          <Callout tone="slate" title={<span className="flex items-center gap-1"><EyeOff size={14} /> Names are masked</span>}>
            Full owner details require consent from the owner or officer access. Use “Verify ownership” to check a name without revealing it.
          </Callout>
        )}
        <ul className="mt-3 flex flex-col gap-2">
          {p.party.owners.length === 0 && <li className="text-sm text-ink-3">No owner on record.</li>}
          {p.party.owners.map((o, i) => (
            <li key={i} className="flex items-center gap-3 rounded-md border border-line px-3 py-2">
              <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-primary"><UserRound size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{o.name}</p>
                <p className="text-xs text-ink-3">{o.father_name ? `S/o ${o.father_name} · ` : ''}{titleCase(o.type)}</p>
              </div>
              <Badge>{Math.round(o.share * 100)}% share</Badge>
            </li>
          ))}
        </ul>
      </div>
      {(ror?.nominees?.length ?? 0) > 0 && (
        <div>
          <SectionTitle>Recorded nominees</SectionTitle>
          <ul className="mt-1 flex flex-col gap-1">
            {ror!.nominees!.map((n, i) => (
              <li key={i} className="flex items-center justify-between rounded-md border border-line px-3 py-1.5 text-sm">
                <span>{n.name ?? '—'}<span className="text-ink-3"> · {titleCase(n.relation)}</span></span>
                {n.share != null && <Badge>{Math.round(n.share * 100)}%</Badge>}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-ink-3">Nominees take effect only through an approved succession application — nothing is automatic.</p>
        </div>
      )}
      <KV
        items={[
          { k: 'Khata no.', v: ror?.khata_no ?? p.identifiers.khata_no ?? '—', mono: true },
          { k: 'Classification', v: titleCase(ror?.classification) },
          { k: 'Extent (RoR)', v: fmtArea(ror?.extent_sqm) },
          { k: 'Ownership type', v: titleCase(ror?.ownership_type) },
        ]}
      />
    </div>
  );
}
