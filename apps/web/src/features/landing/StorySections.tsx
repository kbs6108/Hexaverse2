import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import {
  ArrowDown,
  ArrowRight,
  Boxes,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Droplets,
  EyeOff,
  FileText,
  Landmark,
  PenLine,
  QrCode,
  Receipt,
  Satellite,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { TIERS } from '@/features/marketing/pitch';
import { GovStrip } from '@/features/marketing/GovStrip';
import { MapLaunch } from './MapLaunch';
import { SpotlightCard } from '@/components/SpotlightCard';
import { NumberTicker } from '@/components/NumberTicker';
import { BorderBeam } from '@/components/BorderBeam';
import { Marquee } from '@/components/Marquee';

/* =========================================================================
   1. CINEMATIC NARRATIVE SCENES (System & Land Scenes)
   ========================================================================= */

function SystemScene({
  chapter,
  kicker = 'The System',
  title,
  caption,
  points,
  children,
  id,
}: {
  chapter: string;
  kicker?: string;
  title: React.ReactNode;
  caption: string;
  points?: { head: string; sub: string }[];
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="landing-section relative flex min-h-[75vh] items-center overflow-hidden bg-ground py-20 text-ink">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 sm:px-12 lg:grid-cols-[.9fr_1.1fr] lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-xl"
        >
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            {chapter} / {kicker}
          </p>
          <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{title}</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-ink-2">{caption}</p>
          {points && (
            <ul className="mt-7 space-y-3">
              {points.map((p) => (
                <li key={p.head} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                  <p className="text-sm leading-6 text-ink-2">
                    <span className="font-semibold text-ink">{p.head}</span> — {p.sub}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

function LandScene({
  kicker = 'The Land · Human Reality',
  statement,
  detail,
  className = '',
  id,
}: {
  kicker?: string;
  statement: React.ReactNode;
  detail?: string;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`landing-section relative flex min-h-[45vh] items-center overflow-hidden border-y border-line bg-panel-2 px-6 py-20 text-ink sm:px-12 lg:px-24 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true, amount: 0.3 }} className="mx-auto w-full max-w-5xl">
        <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">{kicker}</p>
        <h2 className="max-w-4xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-ink">{statement}</h2>
        {detail && <p className="mt-6 max-w-xl border-l-2 border-primary pl-5 text-base leading-7 text-ink-2">{detail}</p>}
      </motion.div>
    </section>
  );
}

function ParcelMap() {
  return (
    <div className="relative h-96 w-full overflow-hidden rounded-2xl border border-line bg-panel p-6 shadow-panel">
      <div className="absolute inset-0 [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:40px_40px] opacity-40" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="relative h-full w-full">
        <div className="absolute left-[15%] top-[18%] h-44 w-64 -rotate-6 rounded-xl border-2 border-primary bg-primary-soft/40 shadow-xs" />
        <div className="absolute left-[45%] top-[42%] h-48 w-64 rotate-12 rounded-xl border border-primary/40 bg-primary-soft/20" />
        <div className="absolute left-[54%] top-[12%] h-32 w-44 rotate-3 rounded-xl border border-primary/25 bg-panel-2" />
        <div className="absolute left-[33%] top-[30%] flex items-center gap-2 rounded-full border border-primary/20 bg-panel px-3 py-1 shadow-xs">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[11px] font-bold text-primary">TFCM91641E6C82</span>
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================================
   2. STATS & STANDARDS TICKER STRIPS
   ========================================================================= */

const STATS_DATA = [
  { value: 3, suffix: '', label: 'States · AP, TN & TG' },
  { value: 575, suffix: '+', label: 'Cadastral parcels indexed' },
  { value: 6, suffix: '', label: 'Department gateways unified' },
  { value: 100, suffix: '%', label: 'Verifiable provenance' },
];

function StatsStrip() {
  return (
    <section className="border-y border-line bg-panel px-6 py-12 sm:px-12">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        {STATS_DATA.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-primary">
              <NumberTicker value={s.value} />
              {s.suffix}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-3">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const STANDARDS = [
  'NDSLI Standard Compliant',
  'ISO 19152 LADM 3D Cadastre',
  'OGC Features API Open Spec',
  'DPDP Act 2023 Consent Architecture',
  'NIC Meebhoomi RoR-1B Gateway',
  'C-DAC Dharani Passbook Gateway',
  'TNREGINET Encumbrance Portal',
  'PostGIS 3.4 Spatial Cadastre',
];

function StandardsMarqueeStrip() {
  return (
    <div className="border-b border-line bg-panel-2 py-3.5 overflow-hidden">
      <Marquee pauseOnHover className="[--duration:36s]">
        {STANDARDS.map((std) => (
          <div key={std} className="mx-6 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-2">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>{std}</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}

/* =========================================================================
   3. PROBLEM & BREAKTHROUGH: INTERACTIVE LIVE PARCEL INSPECTION
   ========================================================================= */

interface ParcelCheck {
  id: string;
  dept: string;
  label: string;
  status: 'clean' | 'warn' | 'info';
  badge: string;
  detail: string;
  source: string;
  icon: typeof FileText;
}

const LIVE_PARCEL_CHECKS: ParcelCheck[] = [
  {
    id: 'ror',
    dept: 'Revenue Dept',
    label: 'Record of Rights (RoR)',
    status: 'clean',
    badge: 'Verified Clear Title',
    detail: 'Khata No. 412 · Extent: 3.44 acres (13,929 m²) · Dry Agricultural. No pending mutation backlog.',
    source: 'Meebhoomi RoR-1B Gateway',
    icon: Landmark,
  },
  {
    id: 'deeds',
    dept: 'Registration & Stamps',
    label: 'Deeds & Encumbrance (EC)',
    status: 'clean',
    badge: 'Nil Encumbrance 30 Yrs',
    detail: 'Doc No. 1842/2019 registered. Zero active mortgages, lis pendens or attachment notices on record.',
    source: 'IGRS Deed Registry',
    icon: FileText,
  },
  {
    id: 'planning',
    dept: 'Urban Planning (CRDA)',
    label: 'Zoning & Master Plan',
    status: 'clean',
    badge: 'R-1 Low Density Residential',
    detail: 'Master Plan 2035 zoning: R-1 Low-Density Residential. Permitted FSI: 1.50. 0m buffer encroachment.',
    source: 'CRDA Geo-Planning Gateway',
    icon: Building2,
  },
  {
    id: 'tax',
    dept: 'Gram Panchayat / Tax',
    label: 'Property Assessment & Tax',
    status: 'clean',
    badge: 'Paid Up to FY 2026',
    detail: 'Annual assessment ₹1,840 paid in full. Guideline valuation: ₹14,200/sqm (Market ref: ₹18,500/sqm).',
    source: 'Panchayat Raj Fiscal Gateway',
    icon: Receipt,
  },
  {
    id: 'court',
    dept: 'Judicial & Courts',
    label: 'Dispute & Litigation',
    status: 'clean',
    badge: 'Clear · Zero Active Stays',
    detail: 'District Munsif Court registry scanned. Suit OS 42/2018 disposed with final decree. No active stays.',
    source: 'e-Courts National Portal',
    icon: Scale,
  },
  {
    id: 'utils',
    dept: 'Utilities & Irrigation',
    label: 'Public Rights-of-Way',
    status: 'info',
    badge: 'Irrigation Canal Buffer Clear',
    detail: 'Secondary feeder canal 28m east (15m mandatory buffer respected). 11kV distribution easement registered.',
    source: 'APCPDCL & Water Resources Dept',
    icon: Droplets,
  },
];

function InteractiveParcelCard() {
  const [activeCheckId, setActiveCheckId] = useState<string>('ror');
  const [copied, setCopied] = useState(false);
  const activeCheck = LIVE_PARCEL_CHECKS.find((c) => c.id === activeCheckId) ?? LIVE_PARCEL_CHECKS[0]!;

  const handleCopy = () => {
    navigator.clipboard?.writeText('TFCM91641E6C82');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-panel p-6 sm:p-7 shadow-panel">
      <BorderBeam size={220} duration={8} colorFrom="#176B52" colorTo="#B38A4C" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              Live Assembled Cadastral Record
            </span>
          </div>
          <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-ink">
            Survey No. 123/4 · Mangalagiri
          </h3>
          <p className="text-xs text-ink-3">Village: Mangalagiri · Guntur District · Andhra Pradesh</p>
        </div>

        {/* ULPIN Key with copy */}
        <div className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary-soft/40 px-3 py-1.5 shadow-2xs">
          <span className="font-mono text-xs font-bold text-primary">TFCM91641E6C82</span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded p-1 text-primary/70 hover:text-primary transition-colors cursor-pointer"
            title="Copy 14-digit ULPIN"
            aria-label="Copy ULPIN"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs">
        <div className="rounded-xl border border-line bg-panel-2/60 p-2.5">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">Total Area</span>
          <p className="font-bold text-ink text-[13px] mt-0.5">13,929.1 m²</p>
          <p className="text-[10.5px] text-ink-2">3.44 acres · 344 cents</p>
        </div>
        <div className="rounded-xl border border-line bg-panel-2/60 p-2.5">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">Classification</span>
          <p className="font-bold text-ink text-[13px] mt-0.5">Dry Agricultural</p>
          <p className="text-[10.5px] text-ink-2">Passbook Khata #412</p>
        </div>
        <div className="rounded-xl border border-line bg-panel-2/60 p-2.5">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">DPDP Privacy</span>
          <p className="font-bold text-ink text-[13px] mt-0.5">R*** K***</p>
          <p className="text-[10.5px] text-primary">Masked by default</p>
        </div>
        <div className="rounded-xl border border-line bg-panel-2/60 p-2.5">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">Overall Status</span>
          <p className="font-bold text-emerald-700 text-[13px] mt-0.5">Clean Title</p>
          <p className="text-[10.5px] text-ink-2">9/9 checks passed</p>
        </div>
      </div>

      {/* 6 Department Check Pills */}
      <div className="mt-5">
        <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-ink-3 mb-2">
          Click any department to inspect live source provenance:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LIVE_PARCEL_CHECKS.map((c) => {
            const isSelected = activeCheckId === c.id;
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCheckId(c.id)}
                className={clsx(
                  'flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all cursor-pointer select-none',
                  isSelected
                    ? 'border-primary bg-primary-soft/60 shadow-xs ring-1 ring-primary/40'
                    : 'border-line bg-panel-2/40 hover:bg-panel-2 hover:border-line-strong'
                )}
              >
                <span
                  className={clsx(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg',
                    isSelected ? 'bg-primary text-white' : 'bg-ground-2 text-ink-2'
                  )}
                >
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{c.label}</p>
                  <p className="truncate font-mono text-[10px] text-primary font-semibold">{c.badge}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Department Inspector Box */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCheck.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="mt-4 rounded-2xl border border-primary/25 bg-panel-2/80 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                {activeCheck.dept}
              </span>
              <span className="text-xs font-bold text-ink">{activeCheck.label}</span>
            </div>
            <span className="font-mono text-[10.5px] text-ink-3">Source: {activeCheck.source}</span>
          </div>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-2">{activeCheck.detail}</p>
        </motion.div>
      </AnimatePresence>

      {/* Direct launch link */}
      <div className="mt-5 flex items-center justify-between pt-2">
        <span className="text-xs text-ink-3 font-medium">Ready to inspect on the map?</span>
        <MapLaunch
          ulpin="TFCM91641E6C82"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-2xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
        >
          Open Sy. 123/4 in Map Explorer <ArrowRight size={14} />
        </MapLaunch>
      </div>
    </div>
  );
}

function ProblemBreakthroughSection() {
  return (
    <section id="breakthrough" className="landing-section bg-ground px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="max-w-xl"
        >
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            02 / The Core Breakthrough
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.08]">
            The 6-office maze,
            <br />
            <span className="text-primary">unified in one key.</span>
          </h2>
          <p className="mt-5 text-base leading-7 text-ink-2">
            A citizen buying land, a bank sanctioning an agricultural loan, or an officer vetting a title must run between six isolated departments with zero cross-visibility. A court injunction or tax arrear only surfaces after money changes hands.
          </p>

          <div className="mt-7 space-y-3.5">
            {[
              {
                head: 'Traditional approach',
                sub: '6 physical office visits, paper deed queues, weeks waiting for Encumbrance Certificates, unrecorded boundary disputes.',
                bad: true,
              },
              {
                head: 'With Land Stack',
                sub: 'One 14-digit ULPIN queries Revenue, Registration, Court, Planning, Tax, and Utilities live through an open gateway.',
                bad: false,
              },
            ].map((item) => (
              <div
                key={item.head}
                className={clsx(
                  'rounded-2xl border p-4 transition-all',
                  item.bad ? 'border-line/70 bg-panel/50' : 'border-primary/40 bg-primary-soft/30 shadow-2xs'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      item.bad ? 'bg-amber-100 text-amber-800' : 'bg-primary text-white'
                    )}
                  >
                    {item.bad ? '✕' : '✓'}
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink">{item.head}</p>
                </div>
                <p className="mt-1.5 pl-7 text-xs sm:text-sm text-ink-2 leading-relaxed">{item.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live interactive cadastral parcel card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <InteractiveParcelCard />
        </motion.div>
      </div>
    </section>
  );
}

/* =========================================================================
   4. 6-DEPARTMENT OPEN FEDERATION MATRIX
   ========================================================================= */

const DEPT_GATEWAYS = [
  {
    name: 'Revenue',
    tag: 'RECORD OF RIGHTS',
    icon: Landmark,
    desc: 'Ownership, khata, extent and classification (RoR) plus mutations.',
    fields: ['Khata No.', 'Pattadar Name', 'Extent (Acres)', 'Mutation History'],
    gateway: 'Meebhoomi / Dharani / Patta Chitta',
  },
  {
    name: 'Registration',
    tag: 'DEEDS & ENCUMBRANCES',
    icon: FileText,
    desc: 'Registered deeds and financial/legal charges such as mortgages.',
    fields: ['Doc No. / Year', 'SRO Office', '30-Yr Encumbrance', 'Stamp Duty Paid'],
    gateway: 'IGRS Deed & EC Registry',
  },
  {
    name: 'Planning',
    tag: 'ZONING & PERMITS',
    icon: Building2,
    desc: 'Zone codes, permissible uses and building-permission status.',
    fields: ['Master Plan Zone', 'Permitted FSI', 'Layout Sanction', 'Setback Norms'],
    gateway: 'Urban Development & Geo-Planning',
  },
  {
    name: 'Tax & Valuation',
    tag: 'TAX & VALUATION',
    icon: Receipt,
    desc: 'Property assessment, annual demand, arrears and guideline values.',
    fields: ['Assessment No.', 'Guideline Value', 'Arrears Balance', 'Payment Status'],
    gateway: 'Panchayat & Municipal Tax Gateway',
  },
  {
    name: 'Disputes',
    tag: 'DISPUTES',
    icon: Scale,
    desc: 'Court stays, injunctions, revenue appeals and boundary litigation.',
    fields: ['Suit / OS No.', 'Court Bench', 'Active Injunctions', 'Decree Orders'],
    gateway: 'e-Courts National Judiciary Portal',
  },
  {
    name: 'Connections',
    tag: 'CONNECTIONS',
    icon: Droplets,
    desc: 'Electricity, water, irrigation canals and public rights-of-way.',
    fields: ['Service Connection', 'Canal Buffer (m)', 'Easement Rights', 'HT Line Corridor'],
    gateway: 'DISCOM & Water Resources Dept',
  },
];

function DepartmentsSection() {
  return (
    <section id="departments" className="landing-section bg-panel-2 px-6 py-20 sm:px-12 lg:px-20 border-t border-line">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          03 / Federated Systems
        </p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
          Six departments. One authoritative record.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-ink-2 max-w-2xl mx-auto">
          No department database is replaced or duplicated. Land Stack queries all six systems live through open adapters and cites where every field originated.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-[1400px] grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {DEPT_GATEWAYS.map((d, i) => {
          const Icon = d.icon;
          return (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <SpotlightCard className="h-full rounded-3xl border border-line bg-panel p-6 shadow-xs hover:border-primary/40 hover:shadow-panel transition-all">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full bg-panel-2 px-2.5 py-0.5 font-mono text-[10px] font-bold text-ink-3 uppercase tracking-wider">
                    {d.tag}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-ink">{d.name}</h3>
                <p className="mt-2 text-xs sm:text-sm text-ink-2 leading-relaxed">{d.desc}</p>

                <div className="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-line/50">
                  {d.fields.map((f) => (
                    <span key={f} className="rounded-md bg-ground-2 px-2 py-0.5 font-mono text-[10px] font-medium text-ink-2">
                      {f}
                    </span>
                  ))}
                </div>

                <p className="mt-3 font-mono text-[10px] text-primary/80 font-semibold truncate">
                  Gateway: {d.gateway}
                </p>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================================
   5. PLATFORM CAPABILITIES: HARDWARE-ACCELERATED HORIZONTAL SHOWCASE
   ========================================================================= */

const SHOWCASE_CARDS = [
  {
    num: '01',
    title: 'AI Risk & Title Briefs',
    tag: 'AI INFERENCE',
    engine: 'NVIDIA Nemotron',
    icon: Sparkles,
    lead: 'Instant cross-department risk scoring and legal flags.',
    body: 'Flagged parcels are analysed automatically by the AI engine: court stays, encumbrance overlap, fiscal arrears, and survey mismatches synthesized into one plain-language brief with recommendations.',
    metric: '9-Point Due Diligence Check',
  },
  {
    num: '02',
    title: 'Satellite Change Detection',
    tag: 'EARTH OBSERVATION',
    engine: 'Sentinel-2 Orbit (10m)',
    icon: Satellite,
    lead: 'Unrecorded construction detected from orbit.',
    body: 'Multi-spectral NDVI and NDBI delta comparison compares satellite passes against registered building permissions. Likely unauthorized built-up triggers an automated field review in the officer queue in one click.',
    metric: 'Bi-Weekly Orbit Revisit',
  },
  {
    num: '03',
    title: 'Vertical Property (3D Cadastre)',
    tag: '3D STRATIFIED',
    engine: 'PostGIS 3D Vector',
    icon: Boxes,
    lead: 'True 3D-ULPIN for multi-storey apartments and basements.',
    body: 'Land is no longer flat. Land Stack binds vertical property units to their elevation band, unit floor area, common areas, and underground basements with authoritative sub-parcel keys.',
    metric: 'Full 3D Stratum Registry',
  },
  {
    num: '04',
    title: 'Bounded Boundary Edits',
    tag: 'RESURVEY & GIS',
    engine: 'Norm Enforcement',
    icon: PenLine,
    lead: 'Officers drag corners; geometry validation enforces norms.',
    body: 'Surveyors correct parcel geometry directly on the map. Strict automated validation blocks overlaps, limits area drift to ±15%, and requires a two-step second-officer sign-off that synchronizes the Record of Rights.',
    metric: '±15% Tolerance · 0 Overlaps',
  },
  {
    num: '05',
    title: 'Verifiable LIR Reports',
    tag: 'INTEGRITY',
    engine: 'Cryptographic QR',
    icon: QrCode,
    lead: 'Tamper-evident Land Information Reports anyone can verify.',
    body: 'Citizens and financial institutions download officially signed PDFs containing full parcel provenance. Anyone with a smartphone can scan the embedded QR code to verify the live government hash in under two seconds.',
    metric: 'Sub-2s Mobile Verification',
  },
  {
    num: '06',
    title: 'Privacy by Consent',
    tag: 'DPDP 2023',
    engine: 'Tokenized Gateways',
    icon: EyeOff,
    lead: 'Owner identities masked by default for public search.',
    body: 'Compliant with the Digital Personal Data Protection Act. Landowner details show as masked (e.g. R*** K***) for public queries until the owner grants a cryptographically signed, time-boxed consent token.',
    metric: 'Zero-Knowledge Public Search',
  },
  {
    num: '07',
    title: 'State Adapters Engine',
    tag: 'MULTI-STATE CDM',
    engine: 'Common Land Model 1.0',
    icon: Landmark,
    lead: 'Unifies AP, TN, and TG cadastre schemas in real-time.',
    body: 'Translates local nomenclature — khata (Meebhoomi), patta (Chitta), and passbook (Dharani) — into one canonical standard. Integrates each state without replacing their existing database.',
    metric: '3 States · 1 Common Schema',
  },
  {
    num: '08',
    title: 'Tamper-Evident Provenance',
    tag: 'AUDIT LEDGER',
    engine: 'Cryptographic Hash Chain',
    icon: ShieldCheck,
    lead: 'Every transaction sealed with verifiable government signatures.',
    body: 'Deed registration, court orders, boundary updates, and tax clears form an unbroken audit chain. Any attempt to alter historical records is immediately flagged during verification.',
    metric: 'Immutable Audit Trail',
  },
  {
    num: '09',
    title: 'Citizen Self-Service Portal',
    tag: 'CITIZEN FIRST',
    engine: 'Direct Government Gateway',
    icon: Users,
    lead: 'Title verification, service requests, and objections without office visits.',
    body: 'Citizens log in with verified mobile OTP, view their registered parcels automatically via RoR sync, apply for building permissions or mutation, and track progress with transparent statutory SLAs.',
    metric: 'Zero Physical Queues',
  },
  {
    num: '10',
    title: 'Officer Workflow Decision Console',
    tag: 'STATUTORY CONSOLE',
    engine: 'Multi-Role Officer Inbox',
    icon: Workflow,
    lead: 'Role-based work queues for Revenue, Registration, and Planning officers.',
    body: 'Officers review statutory applications with complete cross-department impact summaries, automatic boundary safety checks, and 1-click approvals that update state databases in real-time.',
    metric: 'Instant Cache Sync & Audit',
  },
];

function StickyHorizontalScroll() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scrollRange, setScrollRange] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);

  const totalCardCount = SHOWCASE_CARDS.length;

  // Native hardware-accelerated scroll tracking without any main-thread scroll listener lag
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });

  // Direct 1:1 compositor transform: Eliminates spring oscillation micro-stutters completely
  const x = useTransform(scrollYProgress, [0, 1], [0, -scrollRange]);
  const progressPercent = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Only trigger React state updates when crossing discrete card thresholds
  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      const nextIdx = Math.min(totalCardCount - 1, Math.max(0, Math.floor(latest * totalCardCount)));
      if (nextIdx !== activeIdxRef.current) {
        activeIdxRef.current = nextIdx;
        setActiveIdx(nextIdx);
      }
    });
  }, [scrollYProgress, totalCardCount]);

  // Dynamically compute exact scroll width
  useEffect(() => {
    const updateRange = () => {
      if (contentRef.current) {
        const scrollWidth = contentRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;
        // Make sure the last card rests comfortably inside viewport with padding
        setScrollRange(Math.max(0, scrollWidth - viewportWidth + 100));
      }
    };

    updateRange();
    window.addEventListener('resize', updateRange, { passive: true });
    return () => window.removeEventListener('resize', updateRange);
  }, []);

  // Support horizontal trackpad swipe translating to page scroll
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 10) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaX * 1.2, behavior: 'auto' });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const scrollToCard = (idx: number) => {
    if (!targetRef.current) return;
    const targetTop = targetRef.current.offsetTop;
    const targetHeight = targetRef.current.offsetHeight - window.innerHeight;
    const fraction = idx / (totalCardCount - 1);
    window.scrollTo({
      top: targetTop + targetHeight * fraction,
      behavior: 'smooth',
    });
  };

  return (
    <div id="capabilities" ref={targetRef} className="relative h-[480vh] bg-ground">
      <div className="sticky top-0 flex h-screen w-full flex-col justify-between overflow-hidden px-6 py-10 sm:px-12 lg:px-20">
        {/* Section Header */}
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              04 / Platform Capabilities
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
              One platform. Ten breakthroughs.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-ink-3">
              {String(activeIdx + 1).padStart(2, '0')} / {String(totalCardCount).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollToCard(Math.max(0, activeIdx - 1))}
                disabled={activeIdx === 0}
                className="flex size-9 items-center justify-center rounded-full border border-line bg-panel text-ink hover:bg-ground-2 disabled:opacity-30 cursor-pointer transition-all"
                aria-label="Previous card"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollToCard(Math.min(totalCardCount - 1, activeIdx + 1))}
                disabled={activeIdx === totalCardCount - 1}
                className="flex size-9 items-center justify-center rounded-full border border-line bg-panel text-ink hover:bg-ground-2 disabled:opacity-30 cursor-pointer transition-all"
                aria-label="Next card"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Motion Track: Hardware-accelerated GPU translate3d with will-change */}
        <div className="relative my-auto w-full overflow-visible py-4">
          <motion.div
            ref={contentRef}
            style={{ x, willChange: 'transform' }}
            className="flex items-stretch gap-6"
          >
            {SHOWCASE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.num}
                  style={{ willChange: 'transform', transform: 'translate3d(0, 0, 0)' }}
                  className="w-[340px] sm:w-[420px] lg:w-[460px] shrink-0 select-none"
                >
                  <SpotlightCard className="flex h-[420px] flex-col justify-between rounded-3xl border border-line bg-panel p-7 shadow-panel hover:border-primary/50 transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold tracking-widest text-ink-3">{card.num}</span>
                        <span className="rounded-full bg-primary-soft/60 px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-primary uppercase">
                          {card.tag}
                        </span>
                      </div>
                      <div className="mt-5 flex items-center gap-3">
                        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white shadow-2xs">
                          <Icon size={20} />
                        </span>
                        <div>
                          <h3 className="font-display text-2xl font-bold tracking-tight text-ink">{card.title}</h3>
                          <p className="font-mono text-[11px] font-semibold text-primary">{card.engine}</p>
                        </div>
                      </div>
                      <p className="mt-5 text-sm font-semibold leading-snug text-ink">{card.lead}</p>
                      <p className="mt-2.5 text-xs sm:text-[13px] leading-relaxed text-ink-2">{card.body}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-4">
                      <span className="font-mono text-[11px] font-bold text-ink-3 uppercase tracking-wider">Metric</span>
                      <span className="rounded-full bg-panel-2 px-3 py-1 font-mono text-xs font-bold text-primary">
                        {card.metric}
                      </span>
                    </div>
                  </SpotlightCard>
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Footer Progress & Indicators */}
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 border-t border-line/60 pt-4">
          <div className="relative h-1.5 w-48 sm:w-72 overflow-hidden rounded-full bg-ground-2">
            <motion.div
              style={{ width: progressPercent, willChange: 'width' }}
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
            />
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            {SHOWCASE_CARDS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToCard(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={clsx(
                  'h-1.5 rounded-full transition-all cursor-pointer',
                  idx === activeIdx ? 'w-6 bg-primary' : 'w-2 bg-line hover:bg-line-strong'
                )}
              />
            ))}
          </div>

          <p className="text-[11px] font-mono text-ink-3 uppercase tracking-wider">
            Scroll or swipe horizontally to inspect all 10 modules
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   6. PILOT CORRIDORS & CLUSTERS
   ========================================================================= */

const PILOT_CLUSTERS = [
  {
    state: 'Andhra Pradesh',
    cluster: 'Mangalagiri Capital Region',
    district: 'Guntur District',
    parcels: '185 cadastral parcels',
    status: 'Clean Title & Master Plan Aligned',
    color: 'border-primary/40 bg-primary-soft/20',
    tagColor: 'bg-primary text-white',
    demoULPIN: 'TFCM91641E6C82',
    demoLabel: 'Sy. 123/4 · 3.44 ac',
  },
  {
    state: 'Tamil Nadu',
    cluster: 'Sriperumbudur Industrial Corridor',
    district: 'Kanchipuram District',
    parcels: '210 cadastral parcels',
    status: 'Patta Chitta & SIPCOT Easements',
    color: 'border-emerald-700/30 bg-emerald-50/50',
    tagColor: 'bg-emerald-800 text-white',
    demoULPIN: 'TF2CEQ4ACED970',
    demoLabel: 'Sy. 45/2 · 2.18 ac',
  },
  {
    state: 'Telangana',
    cluster: 'Shamshabad Aerotropolis Corridor',
    district: 'Rangareddy District',
    parcels: '180 cadastral parcels',
    status: 'Dharani Passbook & Forest Buffer',
    color: 'border-amber-700/30 bg-amber-50/50',
    tagColor: 'bg-amber-800 text-white',
    demoULPIN: 'TEPDPUQC13C0D7',
    demoLabel: 'Sy. 77 · 4.60 ac',
  },
];

function PilotClustersSection() {
  return (
    <section id="pilots" className="landing-section bg-panel px-6 py-20 sm:px-12 lg:px-20 border-t border-line">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          06 / Field Pilot Corridors
        </p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
          Live across 3 states · 575+ cadastral parcels
        </h2>
        <p className="mt-4 text-sm sm:text-base text-ink-2 max-w-2xl mx-auto">
          Tested with live state cadastre data from AP Meebhoomi, TN Chitta, and TG Dharani. Click any pilot corridor to open the live vector map explorer.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-[1400px] grid-cols-1 gap-6 md:grid-cols-3">
        {PILOT_CLUSTERS.map((c) => (
          <div
            key={c.state}
            className={clsx('rounded-3xl border p-7 shadow-xs transition-all hover:shadow-panel', c.color)}
          >
            <div className="flex items-center justify-between">
              <span className={clsx('rounded-full px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider', c.tagColor)}>
                {c.state}
              </span>
              <span className="font-mono text-xs font-bold text-ink-2">{c.parcels}</span>
            </div>

            <h3 className="mt-4 font-display text-xl font-bold text-ink">{c.cluster}</h3>
            <p className="mt-1 text-xs text-ink-3">{c.district}</p>

            <div className="mt-5 rounded-2xl border border-line bg-panel p-3.5">
              <span className="text-[10.5px] uppercase tracking-wide font-mono text-ink-3">Registry Health</span>
              <p className="text-xs font-bold text-ink mt-0.5">{c.status}</p>
            </div>

            <div className="mt-6 flex items-center justify-between pt-2">
              <MapLaunch
                ulpin={c.demoULPIN}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                Inspect {c.demoLabel} <ArrowRight size={13} />
              </MapLaunch>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================================
   7. OPERATIONAL ARCHITECTURE (HOW IT WORKS)
   ========================================================================= */

const HOW_STEPS = [
  {
    step: '01',
    title: 'Query Any Identifier',
    desc: 'Enter a 14-digit ULPIN, Survey Number with sub-division, Khata Number, or click any parcel directly on the cadastral vector map.',
    badge: 'Multi-Key Resolution',
  },
  {
    step: '02',
    title: 'Live Federation',
    desc: 'Six open connectors query authoritative department databases simultaneously. Per-state adapters translate local terminology into the Common Land Model.',
    badge: 'Zero Data Duplication',
  },
  {
    step: '03',
    title: 'Verifiable Decision',
    desc: 'AI synthesizes legal risk briefs, checks satellite change alerts, masks private data per DPDP guidelines, and generates signed tamper-evident reports with cryptographic QR.',
    badge: 'Instant Trust',
  },
];

function HowItWorksSection() {
  return (
    <section id="how" className="landing-section bg-ground px-6 py-20 sm:px-12 lg:px-20 border-t border-line">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          08 / Operational Architecture
        </p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
          Three steps from parcel key to verifiable action.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-ink-2 max-w-2xl mx-auto">
          Built on open standards and micro-adapters that let state governments maintain digital sovereignty while offering citizens seamless unified access.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-[1400px] grid-cols-1 gap-6 md:grid-cols-3">
        {HOW_STEPS.map((s) => (
          <div key={s.step} className="rounded-3xl border border-line bg-panel p-7 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft font-mono text-sm font-bold text-primary">
                {s.step}
              </span>
              <span className="rounded-full bg-ground-2 px-2.5 py-0.5 font-mono text-[10px] font-bold text-ink-3 uppercase">
                {s.badge}
              </span>
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-ink">{s.title}</h3>
            <p className="mt-3 text-xs sm:text-sm text-ink-2 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================================
   8. FINAL CALL TO ACTION
   ========================================================================= */

function FinalCTASection() {
  return (
    <section className="relative overflow-hidden bg-primary px-6 py-24 text-center text-white sm:px-12 lg:px-20">
      <div className="mx-auto max-w-3xl relative z-10">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-soft">
          09 / Explore Land Stack
        </p>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          The next layer of public infrastructure.
        </h2>
        <p className="mt-6 text-base sm:text-lg text-primary-soft/90 max-w-xl mx-auto leading-relaxed">
          Search any parcel, inspect cross-department records live, track statutory applications, and verify titles with cryptographic certainty.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <MapLaunch className="relative overflow-hidden cta-glow inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-[15px] font-bold text-primary transition hover:bg-ground active:scale-95 shadow-md cursor-pointer">
            <BorderBeam size={140} duration={6} colorFrom="#183B2B" colorTo="#D1A654" />
            Explore Platform <ArrowRight size={17} />
          </MapLaunch>
          <Link
            to="/help"
            className="inline-flex items-center gap-2.5 rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
          >
            User Guide & Documentation
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   9. PAGE ROOT EXPORT (Complete Narrative Flow)
   ========================================================================= */

export function StorySections() {
  return (
    <div className="bg-ground">
      {/* Statistics & Standards */}
      <StatsStrip />
      <StandardsMarqueeStrip />

      {/* 01 / Cadastral GIS: Land, located (3 GIS Tiers + Mock Map) */}
      <SystemScene
        id="system-map"
        chapter="01"
        kicker="Cadastral GIS"
        title={<>Land, <span className="text-primary">located.</span></>}
        caption="A fast vector-tile map of the whole cadastre, organised in the three GIS tiers the problem statement asks for. Click any parcel and its full record opens."
        points={TIERS.map((t) => ({ head: t.name, sub: t.blurb }))}
      >
        <ParcelMap />
      </SystemScene>

      {/* 02 / The Core Breakthrough: The 6-Office Maze Unified + Live Interactive Card */}
      <ProblemBreakthroughSection />

      {/* Cinematic Interlude: The Land · Human Reality */}
      <LandScene
        id="fragmentation"
        kicker="The Land · Human Reality"
        statement={<>For a farmer, a boundary is not a line. <span className="text-primary">It is a livelihood.</span></>}
        detail="The mutation that takes weeks. The record that lives in three offices. Land Stack brings the answer closer to the people waiting for it."
      />

      {/* 03 / Federated Systems: Six departments */}
      <DepartmentsSection />

      {/* 04 / Platform Capabilities: Hardware-Accelerated 10-Card Horizontal Showcase */}
      <StickyHorizontalScroll />

      {/* 05 / Unified Search: Every record. One search */}
      <SystemScene
        chapter="05"
        kicker="Unified Search"
        title={<>Every record.<br /><span className="text-primary">One search.</span></>}
        caption="Search a survey number, ULPIN or khata and get the assembled record in under a second — with every field traceable to the system it came from."
        points={[
          { head: 'Per-source provenance', sub: 'each block names its department, timestamp and health.' },
          { head: 'Privacy by default', sub: 'owner details are masked unless you own the parcel or hold consent.' },
          { head: 'Verifiable reports', sub: 'download a signed report anyone can check via its QR code.' },
        ]}
      >
        <div className="flex items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-line bg-panel p-5 shadow-panel">
            <div className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 px-4 py-3">
              <Search size={18} className="text-primary" />
              <span className="font-mono text-sm font-semibold text-ink">TFCM91641E6C82</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
              <span className="rounded-lg bg-primary-soft px-2.5 py-1.5 text-center">RoR / synced</span>
              <span className="rounded-lg bg-primary-soft px-2.5 py-1.5 text-center">Tax / clear</span>
              <span className="rounded-lg bg-primary-soft px-2.5 py-1.5 text-center">Map / matched</span>
            </div>
          </div>
        </div>
      </SystemScene>

      {/* 06 / Field Pilot Corridors */}
      <PilotClustersSection />

      {/* 07 / Interoperability Engine: Different states. Common language (State Adapters Flowchart) */}
      <SystemScene
        id="identity"
        chapter="07"
        kicker="Interoperability Engine"
        title={<>Different states.<br /><span className="text-primary">Common language.</span></>}
        caption="Every state keeps its own systems and vocabulary — khata in Andhra Pradesh, patta in Tamil Nadu, pattadar passbook in Telangana's Dharani. An adapter maps each into one Common Land Model."
        points={[
          { head: 'Per-state adapters', sub: 'field mappings translate local vocabulary into the shared model — live for AP, TN and TG.' },
          { head: 'Event contract', sub: 'a registered deed automatically notifies the revenue mutation queue.' },
          { head: 'Open APIs', sub: 'OGC-shaped, consent-aware endpoints any state system can integrate.' },
        ]}
      >
        <div className="flex flex-col items-center justify-center gap-3 font-display text-[12px] uppercase tracking-[.16em] text-ink">
          <div className="flex w-full max-w-md justify-center gap-2">
            {[
              ['Andhra Pradesh', 'khata (Meebhoomi)'],
              ['Tamil Nadu', 'patta (Chitta)'],
              ['Telangana', 'passbook (Dharani)'],
            ].map(([state, vocab]) => (
              <div
                key={state}
                className="flex-1 rounded-xl border border-line bg-panel px-3 py-3 text-center shadow-xs"
              >
                <span className="block text-[11px] font-bold text-ink">{state}</span>
                <span className="mt-1 block font-mono text-[9.5px] normal-case font-medium text-primary">{vocab}</span>
              </div>
            ))}
          </div>
          <ArrowDown size={14} className="text-primary" />
          <div className="w-56 rounded-xl border border-line bg-panel px-5 py-2.5 text-center text-xs font-bold text-ink shadow-xs">Per-state adapters</div>
          <ArrowDown size={14} className="text-primary" />
          <div className="w-64 rounded-xl border border-primary bg-primary-soft px-5 py-3 text-center text-xs font-bold text-primary shadow-xs">Common Land Model</div>
          <ArrowDown size={14} className="text-primary" />
          <div className="font-mono text-xs font-bold text-primary">TFCM91641E6C82</div>
        </div>
      </SystemScene>

      {/* 08 / Operational Architecture (How it works) */}
      <HowItWorksSection />

      {/* Cinematic Interlude: The Land · Social Contract */}
      <LandScene
        kicker="The Land · Social Contract"
        statement={<>For a family, a dispute is not data. <span className="text-primary">It is a question of home.</span></>}
        detail="A connected record turns a maze of departments into a clear next step."
      />

      {/* 09 / Final CTA & Government Compliance Strip */}
      <FinalCTASection />
      <GovStrip variant="landing" />
    </div>
  );
}
