import type { ParcelCDM } from '@/lib/cdm';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { KV, SectionTitle, Callout } from '@/components/Section';
import { fmtDate, fmtINR } from '@/lib/format';

export function FiscalSection({ p }: { p: ParcelCDM }) {
  const t = p.fiscal.tax;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle right={<ProvenanceBadge source="fiscal" p={p.provenance.fiscal} />}>Property tax</SectionTitle>
        {t && (t.arrears ?? 0) > 0 && <Callout tone="amber" title={`Arrears of ${fmtINR(t.arrears)}`}>Last payment {fmtDate(t.last_paid_on)}. Arrears block mutation approval until cleared.</Callout>}
        <KV
          className="mt-3"
          items={[
            { k: 'Assessment no.', v: t?.assessment_no ?? '—', mono: true },
            { k: 'Annual demand', v: fmtINR(t?.annual_demand) },
            { k: 'Arrears', v: fmtINR(t?.arrears ?? 0) },
            { k: 'Paid till', v: t?.paid_till ?? '—' },
          ]}
        />
      </div>
      <div>
        <SectionTitle>Valuation</SectionTitle>
        <KV
          items={[
            { k: 'Guideline value', v: p.fiscal.guideline_value_per_sqm ? `${fmtINR(p.fiscal.guideline_value_per_sqm)} / m² (${fmtINR(Math.round(p.fiscal.guideline_value_per_sqm * 4046.8564))} / acre)` : '—' },
            { k: 'Estimated parcel value', v: fmtINR(p.fiscal.estimated_value) },
          ]}
        />
      </div>
    </div>
  );
}
