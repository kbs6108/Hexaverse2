import { useState } from 'react';
import { clsx } from 'clsx';
import {
  FileText,
  Radar,
  PenTool,
  CheckCircle2,
  X,
  ArrowRight,
  BookOpen,
  Info,
  ShieldCheck,
  AlertTriangle,
  GitPullRequest,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';

interface Props {
  open: boolean;
  onClose: () => void;
  initialTab?: 'registration' | 'alerts_vs_apps' | 'satellite' | 'boundary' | 'revenue_hierarchy';
}

export function MechanismExplainerModal({ open, onClose, initialTab = 'registration' }: Props) {
  const [tab, setTab] = useState<'registration' | 'alerts_vs_apps' | 'satellite' | 'boundary' | 'revenue_hierarchy'>(initialTab);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mechanism-guide-title"
    >
      <div className="relative flex flex-col w-full max-w-3xl max-h-[88vh] rounded-2xl border border-line bg-panel text-ink shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-ground-2/60">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 id="mechanism-guide-title" className="text-base font-semibold">
                How Land Stack Mechanisms Work
              </h2>
              <p className="text-xs text-ink-3">
                Ground Reality in India vs. Land Stack Automated Interoperability
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="rounded-lg p-1.5 text-ink-3 hover:bg-ground-2 hover:text-ink transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-line px-5 bg-ground-1/50 overflow-x-auto">
          {[
            { id: 'registration', label: '1. Deed & Title Mutation', icon: FileText },
            { id: 'alerts_vs_apps', label: '2. Alerts vs. Applications', icon: GitPullRequest },
            { id: 'satellite', label: '3. Earth Observation & Field Review', icon: Radar },
            { id: 'boundary', label: '4. Resurvey & Boundary Fix', icon: PenTool },
            { id: 'revenue_hierarchy', label: '5. Stage-Gated Statutory Desks', icon: Scale },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as typeof tab)}
                className={clsx(
                  'flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer',
                  active
                    ? 'border-primary text-primary bg-primary-soft/30'
                    : 'border-transparent text-ink-2 hover:text-ink hover:bg-ground-2/40'
                )}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-sm">
          {tab === 'registration' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <ShieldCheck size={16} /> The Core Interoperability Problem & Solution
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-2">
                  Why does registering a deed not immediately change the owner in government land records?
                  Because in Indian administrative law, <strong>Registration</strong> and <strong>Revenue (Title)</strong> are two completely separate departments with distinct statutory mandates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-brick/30 bg-brick-soft/40 p-4">
                  <div className="flex items-center gap-2 text-brick font-semibold text-xs uppercase tracking-wide">
                    <AlertTriangle size={14} /> Ground Reality (India Today)
                  </div>
                  <ul className="mt-2.5 space-y-2 text-xs text-ink-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-brick font-bold">•</span>
                      <span><strong>Sub-Registrar (IGRS)</strong> registers sale deeds between buyer & seller, but has no authority to alter the land record.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-brick font-bold">•</span>
                      <span>Buyer must physically visit the <strong>Tahsildar / Mandal Revenue Office</strong> to apply for Mutation (Patta transfer).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-brick font-bold">•</span>
                      <span>Average delay: <strong>6 to 24 months</strong>. Many buyers never apply, allowing sellers to fraudulently resell the same plot multiple times.</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary-soft/40 p-4">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wide">
                    <CheckCircle2 size={14} /> Hexaverse / Land Stack Automation
                  </div>
                  <ul className="mt-2.5 space-y-2 text-xs text-ink-2">
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span><strong>Event-Driven Ingest:</strong> When Sub-Registrar logs deed, gateway webhook automatically intercepts the registered claimant.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span><strong>Discrepancy Caught:</strong> If deed claimant ≠ RoR owner, Land Stack raises an Alert AND opens a <strong>System-Initiated Mutation Application</strong>.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span><strong>Dual Scrutiny & Instant Sync:</strong> Revenue Officer reviews in Queue $\to$ clicks Approve $\to$ updates <code>dept_revenue.ror</code> in real-time!</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Visual Pipeline Diagram */}
              <div className="rounded-xl border border-line bg-ground-2/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-3">
                  Step-by-Step Lifecycle Flow
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
                  <div className="flex-1 rounded-lg border border-line bg-panel p-2.5 text-center">
                    <span className="block font-semibold text-ink">1. Deed Registered</span>
                    <span className="text-[11px] text-ink-3">IGRS Sub-Registrar</span>
                  </div>
                  <ArrowRight size={14} className="self-center text-ink-3 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="flex-1 rounded-lg border border-amber/30 bg-amber-soft/30 p-2.5 text-center">
                    <span className="block font-semibold text-amber">2. Alert Dispatched</span>
                    <span className="text-[11px] text-ink-3">Pending Mutation Notice</span>
                  </div>
                  <ArrowRight size={14} className="self-center text-ink-3 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="flex-1 rounded-lg border border-primary/30 bg-primary-soft/30 p-2.5 text-center">
                    <span className="block font-semibold text-primary">3. Queue Application</span>
                    <span className="text-[11px] text-ink-3">Officer Work Queue</span>
                  </div>
                  <ArrowRight size={14} className="self-center text-ink-3 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="flex-1 rounded-lg border border-primary bg-primary text-primary-ink p-2.5 text-center shadow-sm">
                    <span className="block font-semibold">4. RoR Mutated</span>
                    <span className="text-[11px] opacity-80">Title Legally Changed</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'alerts_vs_apps' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber/30 bg-amber-soft/30 p-4">
                <h3 className="text-sm font-semibold text-amber flex items-center gap-2">
                  <Info size={16} /> Why Clicking “Resolve” on an Alert Does Not Update Title
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-2">
                  Understanding this distinction is key to testing and evaluating Land Stack. In government administration, notifications have no statutory power to alter ownership registers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-line bg-panel p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-ink">Alert (Sensor / Audit Flag)</span>
                    <Badge tone="amber">Diagnostic</Badge>
                  </div>
                  <p className="text-xs text-ink-2">
                    An automated red flag raised when satellite change detection spots new construction, or when the system detects an owner mismatch between deeds and revenue records.
                  </p>
                  <div className="rounded-lg bg-ground-2 p-2.5 text-[11.5px] text-ink-3 space-y-1 border border-line">
                    <p><strong>Action:</strong> Assign to officer or click “Resolve”.</p>
                    <p><strong>Effect:</strong> Sets alert status to <code>resolved</code> (dismisses the notification bell).</p>
                    <p className="text-brick font-medium">⚠️ Does NOT modify the Record of Rights (RoR), Khata, or property boundaries.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary-soft/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-primary">Application (Statutory Workflow)</span>
                    <Badge tone="primary">Legal Order</Badge>
                  </div>
                  <p className="text-xs text-ink-2">
                    A formal quasi-judicial administrative case (e.g. <code>APP-2026-000001</code>) governed by civil procedure rules, public notice periods, and officer scrutiny.
                  </p>
                  <div className="rounded-lg bg-ground-2 p-2.5 text-[11.5px] text-ink-3 space-y-1 border border-line">
                    <p><strong>Action:</strong> Multi-step transition: Document Check $\to$ Field Inspection $\to$ Final Approval.</p>
                    <p><strong>Effect:</strong> Executes database side-effects: updates <code>dept_revenue.ror</code>, re-computes Khata, and synchronizes parcel CDM.</p>
                    <p className="text-primary font-medium">✅ Legally confers title and updates official government records.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-ground-2/50 p-3.5 text-xs text-ink-2">
                <p className="font-semibold text-ink mb-1">How to complete the full loop in your test:</p>
                <ol className="list-decimal pl-4 space-y-1 text-[12px] text-ink-3">
                  <li>In <strong>Admin Console</strong>: Register the deed under a new claimant name.</li>
                  <li>In <strong>Officer $\to$ Alerts</strong>: Note the pending mutation alert. Click <strong>“Open Application in Queue”</strong> directly on the card.</li>
                  <li>In <strong>Officer $\to$ Work Queue</strong>: Open the application, review the pre-assembled multi-department evidence, and click <strong>Approve</strong>.</li>
                  <li>Open the <strong>Map</strong>: Inspect the parcel — the RoR Owner will now show the new claimant!</li>
                </ol>
              </div>
            </div>
          )}

          {tab === 'satellite' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-panel p-4">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Radar size={16} className="text-primary" /> Earth Observation & Field Review Loop
                </h3>
                <p className="mt-1 text-xs text-ink-2">
                  Hexaverse continuously monitors land parcels via Sentinel-2 & high-resolution optical observation to detect encroachment, vegetation loss, and unauthorized construction.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-line bg-ground-2/50 p-3.5 space-y-1.5">
                  <span className="font-semibold text-ink">1. Detection</span>
                  <p className="text-ink-3 text-[11.5px]">
                    Automated change detection pipelines run NDVI and radiometric analysis across temporal imagery, flagging anomalous structures.
                  </p>
                </div>
                <div className="rounded-xl border border-amber/30 bg-amber-soft/30 p-3.5 space-y-1.5">
                  <span className="font-semibold text-amber">2. Alert $\to$ Queue</span>
                  <p className="text-ink-3 text-[11.5px]">
                    Officer clicks <strong>“Field review”</strong> on the alert. This automatically files a formal field review application in the Queue.
                  </p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-3.5 space-y-1.5">
                  <span className="font-semibold text-primary">3. Ground Verification</span>
                  <p className="text-ink-3 text-[11.5px]">
                    Village Revenue Officer (VRO) conducts site inspection, verifies building permits, and marks resolved in the audit trail.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'boundary' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-panel p-4">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <PenTool size={16} className="text-primary" /> PostGIS Topological Cadastral Resurvey
                </h3>
                <p className="mt-1 text-xs text-ink-2">
                  Boundary editing enforces strict PostGIS spatial validation to prevent common survey errors that cause decades of litigation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-line bg-ground-2/50 p-3 space-y-1">
                  <p className="font-semibold text-ink">5 Automated Spatial Checks</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-ink-3 text-[11.5px]">
                    <li><strong>Self-intersection</strong>: Polygon must be valid (<code>ST_IsValid</code>).</li>
                    <li><strong>No Overlaps</strong>: Cannot intrude on neighbours (<code>ST_Overlaps</code>).</li>
                    <li><strong>Area Delta</strong>: Edit bounded within $\pm 15\%$ of original extent.</li>
                    <li><strong>No Slivers</strong>: Must touch neighbour edges cleanly (<code>ST_Touches</code>).</li>
                    <li><strong>Village Boundary</strong>: Must sit inside revenue limit (<code>ST_Within</code>).</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-3 space-y-1">
                  <p className="font-semibold text-primary">Assisted Fix & Dual Control</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-ink-3 text-[11.5px]">
                    <li><strong>Automated Cadastral Snapping</strong>: Automatically snaps vertex drifts to existing cadastral corner stones.</li>
                    <li><strong>Dual Control</strong>: Proposing surveyor cannot self-approve. A 2nd Revenue Officer must approve the application.</li>
                    <li><strong>Automatic Extent Sync</strong>: Approval updates the PostGIS layer AND posts new extent to Revenue RoR!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {tab === 'revenue_hierarchy' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Scale size={16} /> Quasi-Judicial Hierarchy & Automated Speaking Orders
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-2">
                  In Indian revenue administration, title changes cannot occur through single-click officer approvals without statutory due process. Land Stack enforces a four-stage administrative gate ending in formal, legally binding speaking orders.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-line bg-panel p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">Stage 1: VRO Panchanama</span>
                    <Badge tone="slate">Ground Inquiry</Badge>
                  </div>
                  <p className="text-ink-3 text-[11.5px]">
                    Village Revenue Officer inspects actual possession on site in presence of village elders and neighboring pattadars, generating an attested Panchanama report.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-panel p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">Stage 2: Mandal Surveyor Demarcation</span>
                    <Badge tone="amber">FMB Demarcation</Badge>
                  </div>
                  <p className="text-ink-3 text-[11.5px]">
                    Technical boundary verification against Field Measurement Book (FMB) traverse records, validating sub-division stone pillars and road alignment buffers.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-panel p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">Stage 3: Revenue Inspector (RI) Scrutiny</span>
                    <Badge tone="violet">Legal Scrutiny</Badge>
                  </div>
                  <p className="text-ink-3 text-[11.5px]">
                    Cross-verification of registered deeds, 30-year encumbrance certificates, tax clearance, and absence of Section 22A prohibited property flags.
                  </p>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">Stage 4: Tahsildar Speaking Order</span>
                    <Badge tone="primary">Quasi-Judicial</Badge>
                  </div>
                  <p className="text-ink-3 text-[11.5px]">
                    Tahsildar / Mandal Revenue Officer (MRO) conducts final proceedings under §5(1) of the Pattadar Pass Books Act, generating an automated statutory Speaking Order with digital seal.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-ground-2/50 p-3.5 text-xs text-ink-2">
                <p className="font-semibold text-ink mb-1">Why Speaking Orders Matter:</p>
                <p className="text-[12px] text-ink-3 leading-relaxed">
                  A speaking order contains findings of fact, evidence cited, and statutory grounds under the Rights in Land & Pattadar Pass Books Act. This quasi-judicial document shields government officers from arbitrary challenge and provides unassailable title certainty to landowners and banks.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-3.5 bg-ground-2/60">
          <span className="text-xs text-ink-3">
            Tip: You can reopen this guide anytime from the Officer or Admin console.
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Got it, thanks
          </Button>
        </div>
      </div>
    </div>
  );
}
