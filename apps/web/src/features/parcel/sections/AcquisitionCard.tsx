import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  Banknote,
  Building,
  CheckCircle2,
  Clock,
  FileCheck,
  FileSignature,
  HelpCircle,
  Landmark,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import type { AcquisitionImpact } from '@/lib/cdm';
import { fmtArea, fmtINR } from '@/lib/format';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

interface Props {
  impact: AcquisitionImpact;
  ulpin: string;
  isOwner?: boolean;
}

export function AcquisitionCard({ impact, ulpin, isOwner = false }: Props) {
  const [showLegalGuide, setShowLegalGuide] = useState(false);

  const totalArea = impact.total_area_sqm || 1;
  const affectedArea = impact.affected_area_sqm;
  const residualArea = impact.residual_area_sqm || Math.max(0, totalArea - affectedArea);
  const impactPct = impact.impact_pct || Math.round((affectedArea / totalArea) * 1000) / 10;
  const residualPct = Math.max(0, 100 - impactPct);

  return (
    <>
      <div className="rounded-lg border border-line bg-panel p-3.5 text-xs text-ink shadow-2xs">
        {/* Header: Official Project & Statutory Notification */}
        <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-line">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <Badge tone="brick" icon={<ShieldAlert />}>
                Statutory Notice · {impact.notification_section || 'Section 11'}
              </Badge>
              {impact.executing_agency && (
                <Badge tone="slate" icon={<Landmark />}>
                  {impact.executing_agency}
                </Badge>
              )}
              {impact.days_left !== null && impact.days_left !== undefined && (
                <span className="inline-flex items-center gap-1 rounded border border-amber/40 bg-amber-soft px-1.5 py-0.5 text-[10.5px] font-medium text-amber">
                  <Clock size={11} />
                  {impact.days_left > 0 ? `${impact.days_left}d window to respond` : 'Window Closed'}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-ink leading-snug">
              {impact.project_name}
            </h3>
            <p className="text-[11px] text-ink-3 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span>{impact.statutory_act || 'RFCTLARR Act, 2013'}</span>
              {impact.gazette_no && (
                <>
                  <span>·</span>
                  <span className="font-mono text-ink-2">Gazette: {impact.gazette_no}</span>
                </>
              )}
              <span>·</span>
              <span>CALA: Competent Authority for Land Acquisition</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLegalGuide(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer shrink-0"
          >
            <HelpCircle size={13} />
            <span>Statutory Procedure & Rights</span>
          </button>
        </div>

        {/* Spatial Impact: Affected Right-of-Way Cut vs. Residual Land */}
        <div className="mt-2.5 rounded border border-line bg-ground-1 p-2.5">
          <div className="flex items-center justify-between text-[11.5px] mb-1.5">
            <span className="font-medium text-ink flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-amber-600" />
              Right-of-Way Acquisition Extent
            </span>
            <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">
              {impactPct}% Acquisition
            </span>
          </div>

          {/* Simple Area Proportion Bar */}
          <div className="h-2 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-700 flex">
            <div
              style={{ width: `${Math.min(100, Math.max(5, impactPct))}%` }}
              className="bg-amber-600 dark:bg-amber-500"
              title={`Acquired Strip: ${fmtArea(affectedArea)}`}
            />
            <div
              style={{ width: `${Math.min(100, Math.max(5, residualPct))}%` }}
              className="bg-primary/40"
              title={`Residual Retained Plot: ${fmtArea(residualArea)}`}
            />
          </div>

          {/* Area Metrics */}
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[11px]">
            <div className="rounded border border-line bg-panel p-1.5">
              <p className="text-ink-3">Total Parcel Area</p>
              <p className="font-semibold font-mono text-ink">{fmtArea(totalArea)}</p>
            </div>
            <div className="rounded border border-amber/30 bg-amber-soft/40 p-1.5">
              <p className="text-amber-800 dark:text-amber-300 font-medium">Acquired Strip</p>
              <p className="font-semibold font-mono text-amber-900 dark:text-amber-200">
                {fmtArea(affectedArea)} ({impactPct}%)
              </p>
            </div>
            <div className="rounded border border-line bg-panel p-1.5">
              <p className="text-ink-3">Residual Retained</p>
              <p className="font-semibold font-mono text-ink">
                {fmtArea(residualArea)} ({residualPct}%)
              </p>
            </div>
          </div>

          {/* Severance Risk Alert (§94) */}
          {impact.severance_risk && (
            <div className="mt-2 flex items-start gap-2 rounded border border-amber/40 bg-amber-soft/40 p-2 text-[11px] text-amber-900 dark:text-amber-200">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400" />
              <div>
                <span className="font-semibold">Severance Risk (§94 RFCTLARR Act): </span>
                <span>
                  The residual plot ({fmtArea(residualArea)}) is severely fragmented or lacks viable road frontage.
                  The titleholder can legally petition the government to acquire <strong>100% of the parcel</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Statutory Compensation Assessment Breakdown */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1 text-[11px]">
            <span className="font-semibold text-ink-2 flex items-center gap-1 uppercase tracking-wider">
              <Scale size={12} />
              Statutory Compensation Assessment (RFCTLARR 2013)
            </span>
            <span className="text-ink-3 font-mono">Circle Rate: ₹{impact.guideline_rate_per_sqm.toLocaleString('en-IN')}/m²</span>
          </div>

          <div className="rounded border border-line bg-panel p-2 divide-y divide-line/60 text-[11.5px]">
            <div className="flex items-center justify-between pb-1">
              <span className="text-ink-2">Base Land Value ({fmtArea(affectedArea)} @ ₹{impact.guideline_rate_per_sqm.toLocaleString('en-IN')}/m²)</span>
              <span className="font-mono text-ink">{fmtINR(impact.base_land_value)}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-ink-2 flex items-center gap-1">
                <span>Mandatory 100% Solatium (§30)</span>
                <span className="rounded bg-primary-soft px-1 text-[9.5px] text-primary font-medium">Statutory</span>
              </span>
              <span className="font-mono text-ink">+{fmtINR(impact.solatium_amount)}</span>
            </div>
            {impact.structural_damage_estimate > 0 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-ink-2">Structural, Tree & Asset Damages (§29)</span>
                <span className="font-mono text-ink">+{fmtINR(impact.structural_damage_estimate)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 font-semibold text-ink">
              <span>Standard Statutory Award Offer</span>
              <span className="font-mono text-primary text-xs">{fmtINR(impact.total_compensation_offer)}</span>
            </div>
          </div>
        </div>

        {/* Settlement Entitlement Options (Consent Cash vs TDR) */}
        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Option A: Fast-track direct consent */}
          <div className="rounded border border-line bg-ground-1 p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink flex items-center gap-1">
                <FileSignature size={12} className="text-primary" />
                Direct Consent Award (§23A)
              </span>
              <span className="font-mono font-bold text-ink">
                {fmtINR(impact.consent_settlement_total)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-3">
              Includes 25% statutory consent incentive. Disbursed via treasury e-Kuber DBT upon VRO title verification.
            </p>
          </div>

          {/* Option B: TDR Credits */}
          <div className="rounded border border-line bg-ground-1 p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink flex items-center gap-1">
                <Building size={12} className="text-primary" />
                TDR Surrender Credits
              </span>
              <span className="font-mono font-bold text-ink">
                {impact.tdr_units_offered_sqm ? `${impact.tdr_units_offered_sqm.toLocaleString('en-IN')} m² DRC` : `${(affectedArea * 2).toFixed(1)} m² DRC`}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-3">
              2.0x Development Rights Certificate issued by Planning Authority, tradable on open market or for higher FSI.
            </p>
          </div>
        </div>

        {/* Statutory Rights & Official Application Pathways */}
        <div className="mt-3 border-t border-line pt-2.5">
          {!isOwner ? (
            /* NON-OWNER / THIRD-PARTY VIEW: Restrict action buttons */
            <div className="rounded border border-line bg-ground-1 p-3 text-xs">
              <div className="flex items-start gap-2 text-ink-2">
                <ShieldCheck size={16} className="text-ink-3 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-ink">Titleholder Standing Restriction</p>
                  <p className="text-[11.5px] text-ink-3 leading-relaxed">
                    Under Section 11 & Section 15 of the RFCTLARR Act, 2013, statutory consent applications,
                    valuation representations, and objection petitions may only be submitted by the verified
                    registered Pattadar (titleholder) or a legally authorized attorney.
                  </p>
                  <p className="text-[11px] pt-1">
                    <Link
                      to="/citizen/verify"
                      search={{ ulpin }}
                      className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Are you the registered owner of this parcel? Verify Land Ownership →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* VERIFIED TITLEHOLDER VIEW: Official Application Submissions */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold uppercase tracking-wider text-ink-3 flex items-center gap-1">
                  <FileCheck size={12} />
                  Titleholder Statutory Actions (Official Applications)
                </span>
                <span className="text-[10.5px] text-ink-3">Official Verification Workflow</span>
              </div>

              <p className="text-[11px] text-ink-3 leading-tight">
                Submissions are registered as formal applications and forwarded to the Village Revenue Officer (VRO)
                and Competent Authority (CALA / RDO) for ground verification and title scrutiny.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {/* 1. Apply for Consent Award */}
                <Link
                  to="/citizen/request"
                  search={{
                    type: 'acquisition_claim',
                    ulpin,
                    response_mode: 'accept_consent',
                  }}
                  className="w-full"
                >
                  <button
                    type="button"
                    className="w-full text-left rounded border border-primary/40 bg-primary/10 hover:bg-primary/15 text-primary p-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-xs">
                      <span>Apply for Consent Award</span>
                      <CheckCircle2 size={13} className="shrink-0" />
                    </div>
                    <p className="text-[10.5px] text-ink-3 mt-0.5">
                      §23A Consent with +25% bonus; direct DBT upon VRO check
                    </p>
                  </button>
                </Link>

                {/* 2. File Valuation Representation */}
                <Link
                  to="/citizen/request"
                  search={{
                    type: 'acquisition_claim',
                    ulpin,
                    response_mode: 'negotiate_value',
                  }}
                  className="w-full"
                >
                  <button
                    type="button"
                    className="w-full text-left rounded border border-line bg-panel hover:bg-ground-1 text-ink p-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-xs">
                      <span>Valuation Representation</span>
                      <TrendingUp size={13} className="shrink-0 text-amber-600" />
                    </div>
                    <p className="text-[10.5px] text-ink-3 mt-0.5">
                      §64 Reference petition for rate enhancement before LARRA
                    </p>
                  </button>
                </Link>

                {/* 3. File Statutory Objection */}
                <Link
                  to="/citizen/request"
                  search={{
                    type: 'acquisition_claim',
                    ulpin,
                    response_mode: 'decline_objection',
                  }}
                  className="w-full"
                >
                  <button
                    type="button"
                    className="w-full text-left rounded border border-line bg-panel hover:bg-ground-1 text-ink p-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-xs">
                      <span>File Statutory Objection</span>
                      <XCircle size={13} className="shrink-0 text-brick" />
                    </div>
                    <p className="text-[10.5px] text-ink-3 mt-0.5">
                      §15 Collector hearing for realignment or §94 buyout
                    </p>
                  </button>
                </Link>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-ink-3">
                <span>
                  Authority: <strong>Competent Authority for Land Acquisition (CALA) / RDO</strong>
                </span>
                <Link
                  to="/citizen/request"
                  search={{
                    type: 'acquisition_claim',
                    ulpin,
                    response_mode: 'opt_tdr',
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Apply for TDR Surrender Certificate →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legal Explainer Modal */}
      {showLegalGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => e.target === e.currentTarget && setShowLegalGuide(false)}
        >
          <div className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-line bg-panel text-ink shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-ground-2/70">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Scale size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold">Statutory Land Acquisition & Compensation Guide</h2>
                  <p className="text-xs text-ink-3">
                    Governed by RFCTLARR Act 2013 & National Highways Act 1956
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLegalGuide(false)}
                className="rounded-lg p-1.5 text-ink-3 hover:bg-ground-2 hover:text-ink transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-ink-2">
              <section className="rounded-lg border border-line bg-ground-1 p-3">
                <h4 className="font-bold text-ink text-sm flex items-center gap-1.5 text-primary mb-1">
                  <Banknote size={15} />
                  1. How Compensation is Calculated by Law
                </h4>
                <p>
                  Under the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act (RFCTLARR) 2013:
                </p>
                <ul className="mt-1.5 list-disc pl-4 space-y-1">
                  <li>
                    <strong>Base Market Value (§26):</strong> Determined by the highest of: circle/guideline rates, average of top 50% sale deeds in the area over the last 3 years, or mutually consented price.
                  </li>
                  <li>
                    <strong>Multiplication Factor:</strong> 1.0x in urban zones; 1.0x to 2.0x in rural areas depending on distance from urban centers.
                  </li>
                  <li>
                    <strong>Mandatory 100% Solatium (§30):</strong> The law mandates an additional 100% bonus over the market value in recognition of the compulsory nature of the acquisition. This is completely non-taxable under Section 96.
                  </li>
                  <li>
                    <strong>Asset Damages (§29):</strong> Separate compensation evaluated by certified engineers for any borewells, compound walls, trees, or residential structures falling inside the right-of-way line.
                  </li>
                </ul>
              </section>

              <section className="rounded-lg border border-line bg-ground-1 p-3">
                <h4 className="font-bold text-ink text-sm flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                  <CheckCircle2 size={15} />
                  2. Your 4 Legal Options
                </h4>
                <div className="mt-2 space-y-2">
                  <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2">
                    <strong className="text-emerald-700 dark:text-emerald-300">Option 1: Accept Award (Consent Settlement):</strong>
                    <p className="mt-0.5">
                      Fast-track settlement under Section 23A. Grants an extra 25% direct consent bonus. Direct Benefit Transfer (DBT) is credited to your bank account within 30 days without court proceedings.
                    </p>
                  </div>

                  <div className="rounded border border-amber/30 bg-amber-soft/20 p-2">
                    <strong className="text-amber-700 dark:text-amber-300">Option 2: Negotiate / File Claim for Enhancement (§64):</strong>
                    <p className="mt-0.5">
                      If the circle rate undervalues your land, you can accept the base award <em>"under protest"</em> and file for legal enhancement with the Land Acquisition, Rehabilitation and Resettlement Authority (LARRA) within 60 days. You receive the government check immediately while your claim for more money is evaluated.
                    </p>
                  </div>

                  <div className="rounded border border-brick/30 bg-brick-soft/20 p-2">
                    <strong className="text-brick">Option 3: Decline / File Statutory Objection (§15):</strong>
                    <p className="mt-0.5">
                      File a formal objection within 60 days of preliminary notification challenging: alignment realignment to protect your homestead, environmental illegality, or lack of genuine public purpose. The Collector is legally bound to conduct a personal hearing before issuing a final declaration.
                    </p>
                  </div>

                  <div className="rounded border border-violet-500/30 bg-violet-500/5 p-2">
                    <strong className="text-violet-700 dark:text-violet-300">Option 4: Transferable Development Rights (TDR):</strong>
                    <p className="mt-0.5">
                      Instead of cash compensation, receive a 200% Development Rights Certificate (DRC) issued by the urban development authority (APCRDA / HMDA / CMDA). You can sell this certificate to commercial developers or use it to add floors to other properties.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-line bg-ground-1 p-3">
                <h4 className="font-bold text-ink text-sm flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                  <AlertTriangle size={15} />
                  3. Partial Road Widening & Severance Rights (§94)
                </h4>
                <p>
                  For road projects, only a narrow strip along the front of the parcel is typically acquired. However, if this leaves your residual plot too small to build on or cuts off legal road access, Section 94 guarantees that:
                </p>
                <p className="mt-1 font-semibold text-ink">
                  You can insist that the government acquire the entire parcel at full statutory compensation rates, rather than leaving you with an unviable residual parcel.
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-line px-5 py-3 bg-ground-2/50">
              <Button variant="primary" onClick={() => setShowLegalGuide(false)}>
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
