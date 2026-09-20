import type { ParcelCDM } from '@/lib/cdm';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { KV, SectionTitle, Callout } from '@/components/Section';
import { fmtDate, fmtINR } from '@/lib/format';
import { t } from '@/lib/i18n';

export function FiscalSection({ p }: { p: ParcelCDM }) {
  const tax = p.fiscal.tax;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle right={<ProvenanceBadge source="fiscal" p={p.provenance.fiscal} />}>{t('drawer.propertyTax', 'Property tax')}</SectionTitle>
        {tax && (tax.arrears ?? 0) > 0 && (
          <Callout tone="amber" title={`${t('drawer.taxArrears', 'Arrears')} ${fmtINR(tax.arrears)}`}>
            Last payment {fmtDate(tax.last_paid_on)}. {t('drawer.taxBlockMutation', 'Arrears block mutation approval until cleared.')}
          </Callout>
        )}
        <KV
          className="mt-3"
          items={[
            { k: t('drawer.assessmentNo', 'Assessment no.'), v: tax?.assessment_no ?? '—', mono: true },
            { k: t('drawer.annualDemand', 'Annual demand'), v: fmtINR(tax?.annual_demand) },
            { k: t('drawer.taxArrears', 'Arrears'), v: fmtINR(tax?.arrears ?? 0) },
            { k: t('drawer.paidTill', 'Paid till'), v: tax?.paid_till ?? '—' },
          ]}
        />
      </div>
      <div>
        <SectionTitle>{t('drawer.valuation', 'Valuation')}</SectionTitle>
        <KV
          items={[
            { k: t('drawer.guidelineValue', 'Guideline value'), v: p.fiscal.guideline_value_per_sqm ? `${fmtINR(p.fiscal.guideline_value_per_sqm)} / m² (${fmtINR(Math.round(p.fiscal.guideline_value_per_sqm * 4046.8564))} / acre)` : '—' },
            { k: t('drawer.estimatedValue', 'Estimated parcel value'), v: fmtINR(p.fiscal.estimated_value) },
          ]}
        />
      </div>
    </div>
  );
}
