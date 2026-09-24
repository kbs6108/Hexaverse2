import type { ParcelCDM } from '@/lib/cdm';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { KV, SectionTitle, Callout } from '@/components/Section';
import { fmtDate, fmtINR } from '@/lib/format';
import { titleCase } from '@/lib/format';
import { t } from '@/lib/i18n';
import { TrendingUp, MapPin, Milestone, Zap, Layers } from 'lucide-react';

export function FiscalSection({ p }: { p: ParcelCDM }) {
  const tax = p.fiscal.tax;
  const f = p.fiscal;
  const gv = f.guideline_value_per_sqm;
  const mv = f.market_value_per_sqm ?? (gv ? Math.round(gv * 1.35) : null);
  const estGv = f.estimated_value;
  const estMv = f.estimated_market_value ?? (estGv ? Math.round(estGv * 1.35) : null);

  return (
    <div className="flex flex-col gap-6">
      {/* Dynamic Location-Based Land Valuation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <SectionTitle>{t('drawer.valuation', 'Valuation')}</SectionTitle>
          {f.location_tier && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <MapPin size={11} />
              {f.location_tier}
            </span>
          )}
        </div>

        {/* Dual Cards: Guideline (SRO Circle) vs Fair Market Value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Govt Guideline Rate */}
          <div className="rounded-xl border border-line bg-panel p-3.5 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
                Govt Guideline Value
              </span>
              <span className="rounded bg-ground-2 px-1.5 py-0.5 text-[10px] font-mono font-medium text-ink-3">
                Circle Rate
              </span>
            </div>
            <p className="font-mono text-xl font-bold text-ink">
              {fmtINR(estGv)}
            </p>
            <div className="text-[11.5px] text-ink-2">
              <span className="font-semibold text-ink">{gv ? fmtINR(gv) : '—'} / m²</span>
              {gv && (
                <span className="text-ink-3 font-normal ml-1">
                  ({fmtINR(Math.round(gv * 4046.8564))} / acre)
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-ink-3 pt-1 border-t border-line/60">
              Statutory base for stamp duty & registration fees under Stamp Act §47-A.
            </p>
          </div>

          {/* Dynamic Fair Market Value */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <TrendingUp size={12} /> Fair Market Value
              </span>
              <span className="rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold">
                Dynamic
              </span>
            </div>
            <p className="font-mono text-xl font-bold text-emerald-900 dark:text-emerald-200">
              {fmtINR(estMv)}
            </p>
            <div className="text-[11.5px] text-emerald-900 dark:text-emerald-300">
              <span className="font-semibold">{mv ? fmtINR(mv) : '—'} / m²</span>
              {mv && (
                <span className="opacity-80 font-normal ml-1">
                  ({fmtINR(Math.round(mv * 4046.8564))} / acre)
                </span>
              )}
            </div>
            <p className="text-[10.5px] text-emerald-800/80 dark:text-emerald-300/80 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/50">
              Adjusted for village base, highway frontage, and infrastructure rating.
            </p>
          </div>
        </div>

        {/* Dynamic Place & Factor Breakdown */}
        <div className="rounded-xl border border-line bg-ground-1/80 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-3">
              Place-Specific Pricing Drivers
            </span>
            <span className="text-[10.5px] text-ink-3">
              {p.identifiers.village}, {p.identifiers.district}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Village Base Rate */}
            <div className="rounded-lg border border-line/60 bg-panel p-2 space-y-0.5">
              <span className="text-[10px] text-ink-3 flex items-center gap-1">
                <MapPin size={10} className="text-primary" /> Village Base
              </span>
              <p className="font-semibold text-ink text-[11.5px]">
                {f.base_rate_per_sqm ? fmtINR(f.base_rate_per_sqm) : '₹12,500'}/m²
              </p>
              <p className="text-[9.5px] text-ink-3 truncate">{p.identifiers.taluk}</p>
            </div>

            {/* Road Factor */}
            <div className="rounded-lg border border-line/60 bg-panel p-2 space-y-0.5">
              <span className="text-[10px] text-ink-3 flex items-center gap-1">
                <Milestone size={10} className="text-amber-600" /> Road Frontage
              </span>
              <p className="font-semibold text-ink text-[11.5px]">
                {f.road_factor ? `${f.road_factor}x` : '1.0x'}
              </p>
              <p className="text-[9.5px] text-ink-3 truncate">
                {p.utilities?.nearest_road_class ? titleCase(p.utilities.nearest_road_class) : 'Village'} road
              </p>
            </div>

            {/* Infrastructure Factor */}
            <div className="rounded-lg border border-line/60 bg-panel p-2 space-y-0.5">
              <span className="text-[10px] text-ink-3 flex items-center gap-1">
                <Zap size={10} className="text-emerald-600" /> Infrastructure
              </span>
              <p className="font-semibold text-ink text-[11.5px]">
                {f.infra_factor ? `+${Math.round((f.infra_factor - 1.0) * 100)}%` : '+0%'}
              </p>
              <p className="text-[9.5px] text-ink-3 truncate">
                {[p.utilities?.water && 'Water', p.utilities?.electricity && 'Power', p.utilities?.sewer && 'Sewer'].filter(Boolean).join('/') || 'Basic'}
              </p>
            </div>

            {/* Zone Factor */}
            <div className="rounded-lg border border-line/60 bg-panel p-2 space-y-0.5">
              <span className="text-[10px] text-ink-3 flex items-center gap-1">
                <Layers size={10} className="text-violet-600" /> Permissibility
              </span>
              <p className="font-semibold text-ink text-[11.5px]">
                {f.zone_factor ? `${f.zone_factor}x` : '1.0x'}
              </p>
              <p className="text-[9.5px] text-ink-3 truncate">
                {p.planning.zone_code ?? p.planning.land_use}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Tax Section */}
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
    </div>
  );
}
