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
    <section id={id} className="landing-section relative flex items-center overflow-hidden bg-ground py-14 sm:py-16 text-ink">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 sm:gap-12 px-6 sm:px-12 lg:grid-cols-[.95fr_1.05fr] lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-xl"
        >
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            {chapter} / {kicker}
          </p>
          <h2 className="font-display text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
          <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-ink-2">{caption}</p>
          {points && (
            <ul className="mt-6 space-y-2.5">
              {points.map((p) => (
                <li key={p.head} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Check size={11} strokeWidth={2.5} />
                  </span>
                  <p className="text-xs sm:text-sm leading-snug text-ink-2">
                    <span className="font-semibold text-ink">{p.head}</span> — {p.sub}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
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
    <section id={id} className={`landing-section relative flex items-center overflow-hidden border-y border-line bg-panel-2 px-6 py-12 text-ink sm:px-12 lg:px-24 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true, amount: 0.3 }} className="mx-auto w-full max-w-4xl">
        <p className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.24em] text-primary">{kicker}</p>
        <h2 className="max-w-3xl font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl text-ink">{statement}</h2>
        {detail && <p className="mt-4 max-w-xl border-l-2 border-primary pl-4 text-xs sm:text-sm leading-relaxed text-ink-2">{detail}</p>}
      </motion.div>
    </section>
  );
}

function ParcelMap() {
  return (
    <div className="relative h-[360px] sm:h-[380px] w-full overflow-hidden rounded-2xl border border-line bg-panel p-4 sm:p-5 shadow-panel">
      {/* Precision coordinate grid */}
      <div className="absolute inset-0 [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-panel/90 px-2.5 py-1 border border-line text-[10px] font-mono text-ink-3 backdrop-blur-md shadow-2xs">
        <span className="size-1.5 rounded-full bg-primary" />
        <span>80°32′14″ E · 16°26′08″ N</span>
      </div>
      <div className="absolute top-3 right-3 z-10 rounded-lg bg-panel/90 px-2.5 py-1 border border-line text-[10px] font-mono text-ink-3 backdrop-blur-md shadow-2xs">
        EPSG:4326 · WGS84
      </div>

      {/* Technical Cadastral Survey Fabric SVG */}
      <svg className="absolute inset-0 h-full w-full p-4" viewBox="0 0 500 320" fill="none">
        {/* Road Corridor */}
        <path d="M 0,225 Q 250,215 500,245" stroke="currentColor" strokeWidth="18" className="text-ground-3/80" />
        <path d="M 0,225 Q 250,215 500,245" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" className="text-line-strong" />
        <text x="35" y="244" className="fill-ink-3 font-mono text-[9px] uppercase tracking-wider">MDR-14 (60ft Road Alignment)</text>

        {/* Adjacent Parcel 123/1 */}
        <polygon points="40,50 160,40 180,185 50,195" fill="var(--bg-panel-2)" stroke="var(--border-line)" strokeWidth="1.5" />
        <text x="95" y="115" className="fill-ink-2 font-mono text-[11px] font-bold">Sy. 123/1</text>
        <text x="85" y="130" className="fill-ink-3 font-mono text-[9px]">4,820 m² · Ag</text>

        {/* Adjacent Parcel 123/2 */}
        <polygon points="160,40 290,30 310,175 180,185" fill="var(--bg-panel-2)" stroke="var(--border-line)" strokeWidth="1.5" />
        <text x="215" y="110" className="fill-ink-2 font-mono text-[11px] font-bold">Sy. 123/2</text>
        <text x="205" y="125" className="fill-ink-3 font-mono text-[9px]">6,210 m² · Wet</text>

        {/* Selected Primary Parcel 123/4 */}
        <polygon
          points="290,30 460,45 440,200 310,175"
          fill="rgba(15, 118, 110, 0.12)"
          stroke="#0f766e"
          strokeWidth="2.5"
          className="transition-all"
        />
        {/* Corner boundary stones (FMB Pillars) */}
        <circle cx="290" cy="30" r="3.5" fill="#0f766e" stroke="white" strokeWidth="1.5" />
        <circle cx="460" cy="45" r="3.5" fill="#0f766e" stroke="white" strokeWidth="1.5" />
        <circle cx="440" cy="200" r="3.5" fill="#0f766e" stroke="white" strokeWidth="1.5" />
        <circle cx="310" cy="175" r="3.5" fill="#0f766e" stroke="white" strokeWidth="1.5" />

        {/* Boundary measurements */}
        <text x="365" y="32" className="fill-primary font-mono text-[9px] font-bold">114.2 m</text>
        <text x="455" y="125" className="fill-primary font-mono text-[9px] font-bold">122.0 m</text>
        <text x="360" y="195" className="fill-primary font-mono text-[9px] font-bold">110.8 m</text>
        <text x="288" y="105" className="fill-primary font-mono text-[9px] font-bold">125.4 m</text>

        {/* Parcel Interior Label */}
        <text x="345" y="95" className="fill-primary font-mono text-[12px] font-black">Sy. 123/4</text>
        <text x="335" y="112" className="fill-ink font-mono text-[10px] font-semibold">13,929.1 m²</text>
        <text x="330" y="127" className="fill-ink-2 font-mono text-[9px]">3.44 Ac · Dry Ag</text>
      </svg>

      {/* Selected Parcel Floating Info HUD */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-panel/95 p-2.5 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary-soft text-primary font-mono text-[11px] font-bold">
            14
          </span>
          <div>
            <p className="font-mono text-[11px] font-bold text-ink">ULPIN: TFCM91641E6C82</p>
            <p className="text-[10px] text-ink-3">Village: Mangalagiri (R) · Guntur · 1-B Khata #412</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
            ✓ Clear Title
          </span>
          <MapLaunch
            ulpin="TFCM91641E6C82"
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:brightness-105 cursor-pointer"
          >
            Open on Map →
          </MapLaunch>
        </div>
      </div>
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
    dept: 'Revenue Dept (RoR)',
    label: 'Record of Rights (1-B Khata)',
    status: 'clean',
    badge: 'Clear Title · 0 Backlog',
    detail: 'Khata No. 412 · Extent: 3.44 acres (13,929.1 m²) · Dry Agricultural · Verified Pattadar Passbook · Nil mutation backlog.',
    source: 'Meebhoomi RoR-1B Gateway',
    icon: Landmark,
  },
  {
    id: 'deeds',
    dept: 'Registration & Stamps (SRO)',
    label: 'Deeds & Encumbrance (EC)',
    status: 'clean',
    badge: '30-Yr Nil Encumbrance',
    detail: 'Registered Sale Deed Doc No. 4125/2026 SRO Mangalagiri. Consideration: ₹45,00,000. 30-year Nil Encumbrance Certificate verified.',
    source: 'IGRS Deed & EC Registry',
    icon: FileText,
  },
  {
    id: 'planning',
    dept: 'Urban Planning (CRDA)',
    label: 'Master Plan & Zoning',
    status: 'clean',
    badge: 'R-1 Low Density Residential',
    detail: 'CRDA Master Plan 2035 zoning: R-1 Low-Density Residential. Permitted FSI: 1.50. 0m buffer encroachment. Public project corridor clear.',
    source: 'CRDA Geo-Planning Gateway',
    icon: Building2,
  },
  {
    id: 'tax',
    dept: 'Fiscal & Municipal Tax',
    label: 'Valuation & Tax Demand',
    status: 'clean',
    badge: 'Paid in Full · Tier-2 Value',
    detail: 'Guideline rate: ₹14,200/m² · Dynamic market valuation: ₹18,500/m². Annual property tax assessment ₹1,840 paid in full for FY 2026-27.',
    source: 'Panchayat & Municipal Tax Gateway',
    icon: Receipt,
  },
  {
    id: 'court',
    dept: 'Judicial & e-Courts',
    label: 'Litigation & Section 22A',
    status: 'clean',
    badge: 'Clear · 0 Active Stays',
    detail: 'e-Courts National Portal scanned across District Courts and High Court benches. Zero active stays, injunctions, or Section 22A prohibited property flags.',
    source: 'e-Courts National Judiciary Portal',
    icon: Scale,
  },
  {
    id: 'utils',
    dept: 'Utilities & Lifelines',
    label: 'Utility Networks (6 Services)',
    status: 'info',
    badge: '3-Phase Power · UGD · Water',
    detail: 'APCPDCL 3-phase 10kW commercial power connection (active) · Underground Drainage (UGD connected) · Municipal Piped Water Works (active) · High-speed OFC broadband accessible.',
    source: 'APCPDCL & Municipal Lifeline Grid',
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
    <div className="relative overflow-hidden rounded-3xl border border-line bg-panel p-5 sm:p-6 shadow-panel">
      <BorderBeam size={220} duration={8} colorFrom="#0f766e" colorTo="#d97706" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              Live Assembled Cadastral Record
            </span>
          </div>
          <h3 className="mt-1 font-display text-lg sm:text-xl font-bold text-ink">
            Survey No. 123/4 · Mangalagiri (R)
          </h3>
          <p className="text-[11px] text-ink-3">Guntur District · Andhra Pradesh · 1-B Khata #412</p>
        </div>

        {/* ULPIN Key with copy */}
        <div className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary-soft/40 px-2.5 py-1 shadow-2xs">
          <span className="font-mono text-xs font-bold text-primary">TFCM91641E6C82</span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded p-1 text-primary/70 hover:text-primary transition-colors cursor-pointer"
            title="Copy 14-digit ULPIN"
            aria-label="Copy ULPIN"
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs">
        <div className="rounded-xl border border-line bg-panel-2/60 p-2">
          <span className="text-[9.5px] uppercase tracking-wide text-ink-3">Total Extent</span>
          <p className="font-bold text-ink text-xs mt-0.5">13,929.1 m²</p>
          <p className="text-[10px] text-ink-2">3.44 acres</p>
        </div>
        <div className="rounded-xl border border-line bg-panel-2/60 p-2">
          <span className="text-[9.5px] uppercase tracking-wide text-ink-3">Classification</span>
          <p className="font-bold text-ink text-xs mt-0.5">Dry Agricultural</p>
          <p className="text-[10px] text-ink-2">Patta Khata #412</p>
        </div>
        <div className="rounded-xl border border-line bg-panel-2/60 p-2">
          <span className="text-[9.5px] uppercase tracking-wide text-ink-3">DPDP Privacy</span>
          <p className="font-bold text-ink text-xs mt-0.5">S*** R*** M***</p>
          <p className="text-[10px] text-primary">Masked by default</p>
        </div>
        <div className="rounded-xl border border-line bg-panel-2/60 p-2">
          <span className="text-[9.5px] uppercase tracking-wide text-ink-3">Statutory Status</span>
          <p className="font-bold text-emerald-700 dark:text-emerald-400 text-xs mt-0.5">Clear Title</p>
          <p className="text-[10px] text-ink-2">6/6 Gateways Clean</p>
        </div>
      </div>

      {/* 6 Department Check Pills */}
      <div className="mt-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-2">
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
                  'flex items-center gap-2 rounded-xl border p-2 text-left transition-all cursor-pointer select-none',
                  isSelected
                    ? 'border-primary bg-primary-soft/60 shadow-xs ring-1 ring-primary/40'
                    : 'border-line bg-panel-2/40 hover:bg-panel-2 hover:border-line-strong'
                )}
              >
                <span
                  className={clsx(
                    'flex size-6.5 shrink-0 items-center justify-center rounded-lg',
                    isSelected ? 'bg-primary text-white' : 'bg-ground-2 text-ink-2'
                  )}
                >
                  <Icon size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-ink">{c.label}</p>
                  <p className="truncate font-mono text-[9.5px] text-primary font-semibold">{c.badge}</p>
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
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="mt-3.5 rounded-2xl border border-primary/25 bg-panel-2/80 p-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-[9.5px] font-bold text-white">
                {activeCheck.dept}
              </span>
              <span className="text-xs font-bold text-ink">{activeCheck.label}</span>
            </div>
            <span className="font-mono text-[10px] text-ink-3">Source: {activeCheck.source}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-2">{activeCheck.detail}</p>
        </motion.div>
      </AnimatePresence>

      {/* Direct launch link */}
      <div className="mt-4 flex items-center justify-between pt-2">
        <span className="text-xs text-ink-3 font-medium">Ready to inspect on the map?</span>
        <MapLaunch
          ulpin="TFCM91641E6C82"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
        >
          Open Sy. 123/4 in Map Explorer <ArrowRight size={13} />
        </MapLaunch>
      </div>
    </div>
  );
}

function ProblemBreakthroughSection() {
  return (
    <section id="breakthrough" className="landing-section bg-ground px-6 py-14 sm:py-16 sm:px-12 lg:px-20">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-8 sm:gap-10 lg:grid-cols-[0.95fr_1.05fr]">
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
          <h2 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.08]">
            The 6-office maze,
            <br />
            <span className="text-primary">unified in one key.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-ink-2">
            A citizen buying land, a bank sanctioning an agricultural loan, or an officer vetting a title must run between six isolated departments with zero cross-visibility. A court injunction or tax arrear only surfaces after money changes hands.
          </p>

          <div className="mt-6 space-y-3">
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
                  'rounded-2xl border p-3.5 transition-all',
                  item.bad ? 'border-line/70 bg-panel/50' : 'border-primary/40 bg-primary-soft/30 shadow-2xs'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'flex size-4.5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                      item.bad ? 'bg-amber-100 text-amber-800' : 'bg-primary text-white'
                    )}
                  >
                    {item.bad ? '✕' : '✓'}
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink">{item.head}</p>
                </div>
                <p className="mt-1 pl-6.5 text-xs text-ink-2 leading-relaxed">{item.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live interactive cadastral parcel card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.08 }}
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
    desc: 'Authoritative title, khata number, extent (acres), classification (RoR 1-B), and statutory mutation audit trails.',
    fields: ['Khata No.', 'Pattadar Name', 'Extent (Acres)', 'Mutation Trail'],
    gateway: 'AP Meebhoomi / TN Chitta / TG Dharani',
  },
  {
    name: 'Registration',
    tag: 'DEEDS & ENCUMBRANCES',
    icon: FileText,
    desc: 'Registered sale deeds, 30-year non-encumbrance certificates (EC), bank mortgages, and stamp duty clearance.',
    fields: ['Doc No. / Year', 'SRO Office', '30-Yr Encumbrance', 'Stamp Duty Paid'],
    gateway: 'IGRS Deed & EC Registry',
  },
  {
    name: 'Planning',
    tag: 'ZONING & ACQUISITION',
    icon: Building2,
    desc: 'Master Plan zoning, permissible FSI, sanctioned layouts, buffer setbacks, and public project corridor acquisition notices.',
    fields: ['Master Plan Zone', 'Permitted FSI', 'Layout Sanction', 'Corridor Notices'],
    gateway: 'Urban Development & Geo-Planning',
  },
  {
    name: 'Tax & Valuation',
    tag: 'TAX & VALUATION',
    icon: Receipt,
    desc: 'Government guideline valuation, dynamic market rates, annual municipal demand, and verified payment receipts.',
    fields: ['Guideline Value', 'Market Estimate', 'Annual Tax Demand', 'Payment Receipt'],
    gateway: 'Municipal & Panchayat Tax Gateway',
  },
  {
    name: 'Disputes & Courts',
    tag: 'JUDICIAL STAYS',
    icon: Scale,
    desc: 'e-Courts stays, permanent injunctions, quasi-judicial revenue appeals, and Section 22A prohibited property flags.',
    fields: ['Suit / OS No.', 'Court Bench', 'Active Injunctions', 'Section 22A Flag'],
    gateway: 'e-Courts National Judiciary Portal',
  },
  {
    name: 'Utilities & Works',
    tag: 'UTILITIES & RIGHTS-OF-WAY',
    icon: Droplets,
    desc: 'APCPDCL power grid connections, underground drainage (UGD), municipal piped water, irrigation canals, and OFC corridors.',
    fields: ['Service Connection', 'Canal Buffer (m)', 'Easement Rights', 'HT Line Corridor'],
    gateway: 'DISCOM & Water Resources Dept',
  },
];

function DepartmentsSection() {
  return (
    <section id="departments" className="landing-section bg-panel-2 px-6 py-14 sm:py-16 sm:px-12 lg:px-20 border-t border-line">
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          03 / Federated Systems
        </p>
        <h2 className="mt-2.5 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
          Six departments. One authoritative record.
        </h2>
        <p className="mt-3.5 text-sm sm:text-base text-ink-2 max-w-2xl mx-auto leading-relaxed">
          No state department database is replaced or duplicated. Land Stack queries all six systems live through open micro-adapters and cites where every field originated.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-[1400px] grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {DEPT_GATEWAYS.map((d, i) => {
          const Icon = d.icon;
          return (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
            >
              <SpotlightCard className="h-full rounded-2xl border border-line bg-panel p-5 shadow-xs hover:border-primary/40 hover:shadow-panel transition-all">
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon size={17} />
                  </span>
                  <span className="rounded-full bg-panel-2 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-ink-3 uppercase tracking-wider">
                    {d.tag}
                  </span>
                </div>
                <h3 className="mt-3.5 font-display text-lg font-bold text-ink">{d.name}</h3>
                <p className="mt-1.5 text-xs sm:text-[13px] text-ink-2 leading-relaxed">{d.desc}</p>

                <div className="mt-3.5 flex flex-wrap gap-1.5 pt-2.5 border-t border-line/60">
                  {d.fields.map((f) => (
                    <span key={f} className="rounded-md bg-ground-2 px-2 py-0.5 font-mono text-[9.5px] font-medium text-ink-2">
                      {f}
                    </span>
                  ))}
                </div>

                <p className="mt-3 font-mono text-[10px] text-primary font-semibold truncate">
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
    title: 'Statutory Risk & Title Briefs',
    tag: 'INTELLIGENCE DESK',
    engine: 'Cadastral Scrutiny Engine',
    icon: Scale,
    lead: 'Instant cross-department risk scoring and legal flags.',
    body: 'Flagged parcels are analysed automatically by the statutory scrutiny engine: court stays, encumbrance overlap, fiscal arrears, and survey mismatches synthesized into one plain-language brief with recommendations.',
    metric: '9-Point Due Diligence Check',
  },
  {
    num: '02',
    title: 'Satellite Earth Observation',
    tag: 'SENTINEL-2 ORBIT',
    engine: 'NDVI & NDBI Optical Delta',
    icon: Satellite,
    lead: 'Unrecorded construction and vegetation delta detected from orbit.',
    body: 'Multi-spectral NDVI and NDBI delta comparison evaluates satellite passes against registered building sanctions. Detected unauthorized built-up triggers an automated field review in the officer queue in one click.',
    metric: '10m Resolution · Bi-Weekly Revisit',
  },
  {
    num: '03',
    title: 'Vertical Property (3D Cadastre)',
    tag: '3D STRATIFIED',
    engine: 'PostGIS 3D Vector',
    icon: Boxes,
    lead: 'True 3D-ULPIN for multi-storey apartments, basements, and air rights.',
    body: 'Land is no longer flat. Land Stack binds vertical property units to their elevation band, unit floor area, common areas, and underground basements with authoritative sub-parcel keys under ISO 19152 LADM.',
    metric: 'Full 3D Stratum Registry',
  },
  {
    num: '04',
    title: 'Bounded Boundary Edits',
    tag: 'RESURVEY & GIS',
    engine: 'Topological Validation',
    icon: PenLine,
    lead: 'Officers drag corners; geometry validation enforces statutory norms.',
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
    tag: 'DPDP ACT 2023',
    engine: 'Tokenized Gateways',
    icon: EyeOff,
    lead: 'Owner identities masked by default for public search.',
    body: 'Compliant with the Digital Personal Data Protection Act. Landowner details show as masked (e.g. K*** R***) for public queries until the owner grants a cryptographically signed, time-boxed consent token.',
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
    title: 'Stage-Gated Revenue Desks',
    tag: 'QUASI-JUDICIAL DESK',
    engine: 'Automated Speaking Orders',
    icon: Workflow,
    lead: 'Multi-stage statutory hierarchy from VRO panchanama to Tahsildar speaking orders.',
    body: 'Applications progress through formal stage gates: VRO ground panchanama verification, Mandal Surveyor FMB demarcation, RI scrutiny, and Tahsildar quasi-judicial proceedings generating statutory speaking orders under the Pattadar Pass Books Act.',
    metric: '4-Stage Statutory Gate',
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
    title: 'Corridor & Acquisition Layer',
    tag: 'PUBLIC WORKS',
    engine: 'Spatial Overlay Engine',
    icon: ShieldCheck,
    lead: 'Public infrastructure acquisition notices and master plan alignments.',
    body: 'Identifies land parcels intersecting public development corridors (CRDA Capital Region, expressway corridors, railway alignments) with automated gazette notification cross-referencing and statutory compensation metrics.',
    metric: '0-Lag Gazette Cross-Reference',
  },
];

function StickyHorizontalScroll() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scrollRange, setScrollRange] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);

  const totalCardCount = SHOWCASE_CARDS.length;

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], [0, -scrollRange]);
  const progressPercent = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      const nextIdx = Math.min(totalCardCount - 1, Math.max(0, Math.floor(latest * totalCardCount)));
      if (nextIdx !== activeIdxRef.current) {
        activeIdxRef.current = nextIdx;
        setActiveIdx(nextIdx);
      }
    });
  }, [scrollYProgress, totalCardCount]);

  useEffect(() => {
    const updateRange = () => {
      if (contentRef.current) {
        const scrollWidth = contentRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;
        setScrollRange(Math.max(0, scrollWidth - viewportWidth + 80));
      }
    };

    updateRange();
    window.addEventListener('resize', updateRange, { passive: true });
    return () => window.removeEventListener('resize', updateRange);
  }, []);

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
    <div id="capabilities" ref={targetRef} className="relative h-[400vh] bg-ground">
      <div className="sticky top-0 flex h-screen w-full flex-col justify-between overflow-hidden px-6 py-8 sm:px-12 lg:px-20">
        {/* Section Header */}
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
              04 / Platform Capabilities
            </p>
            <h2 className="mt-1.5 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink">
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
                className="flex size-8.5 items-center justify-center rounded-full border border-line bg-panel text-ink hover:bg-ground-2 disabled:opacity-30 cursor-pointer transition-all"
                aria-label="Previous card"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => scrollToCard(Math.min(totalCardCount - 1, activeIdx + 1))}
                disabled={activeIdx === totalCardCount - 1}
                className="flex size-8.5 items-center justify-center rounded-full border border-line bg-panel text-ink hover:bg-ground-2 disabled:opacity-30 cursor-pointer transition-all"
                aria-label="Next card"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Motion Track */}
        <div className="relative my-auto w-full overflow-visible py-3">
          <motion.div
            ref={contentRef}
            style={{ x, willChange: 'transform' }}
            className="flex items-stretch gap-5"
          >
            {SHOWCASE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.num}
                  style={{ willChange: 'transform', transform: 'translate3d(0, 0, 0)' }}
                  className="w-[310px] sm:w-[370px] lg:w-[410px] shrink-0 select-none"
                >
                  <SpotlightCard className="flex h-[390px] flex-col justify-between rounded-2xl border border-line bg-panel p-5 sm:p-6 shadow-panel hover:border-primary/50 transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold tracking-widest text-ink-3">{card.num}</span>
                        <span className="rounded-full bg-primary-soft/60 px-2.5 py-0.5 font-mono text-[10px] font-bold text-primary uppercase">
                          {card.tag}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-2xs">
                          <Icon size={18} />
                        </span>
                        <div>
                          <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink leading-tight">{card.title}</h3>
                          <p className="font-mono text-[10.5px] font-semibold text-primary">{card.engine}</p>
                        </div>
                      </div>
                      <p className="mt-3.5 text-xs sm:text-sm font-semibold leading-snug text-ink">{card.lead}</p>
                      <p className="mt-2 text-xs sm:text-[12.5px] leading-relaxed text-ink-2">{card.body}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
                      <span className="font-mono text-[10px] font-bold text-ink-3 uppercase tracking-wider">Benchmark</span>
                      <span className="rounded-full bg-panel-2 px-2.5 py-0.5 font-mono text-[11px] font-bold text-primary">
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
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 border-t border-line/60 pt-3.5">
          <div className="relative h-1.5 w-44 sm:w-64 overflow-hidden rounded-full bg-ground-2">
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
                  idx === activeIdx ? 'w-5 bg-primary' : 'w-1.5 bg-line hover:bg-line-strong'
                )}
              />
            ))}
          </div>

          <p className="text-[10.5px] font-mono text-ink-3 uppercase tracking-wider">
            Scroll or swipe horizontally to inspect all 10 modules
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   6. CHAPTER 05: UNIFIED SEARCH PREVIEW COMPONENT
   ========================================================================= */

function SearchPreviewBox() {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-line bg-panel p-5 shadow-panel">
      {/* Top simulated omni-search input */}
      <div className="flex items-center justify-between rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Search size={16} className="text-primary shrink-0" />
          <span className="font-mono text-xs sm:text-sm font-semibold text-ink">TFCM91641E6C82</span>
          <span className="hidden sm:inline-block rounded bg-panel px-1.5 py-0.5 font-mono text-[10px] text-ink-3 border border-line">
            Sy. 123/4
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            118ms · Live Sync
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-line bg-ground px-1.5 py-0.5 font-mono text-[10px] text-ink-3">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Assembled Cadastral Dossier result preview */}
      <div className="mt-3.5 rounded-xl border border-line/80 bg-ground/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display text-sm font-bold text-ink">Survey No. 123/4</h4>
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                Authoritative
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-ink-3 font-mono">
              Village: Mangalagiri (R) · Guntur · 3.44 Acres (Dry Ag)
            </p>
          </div>
          <MapLaunch
            ulpin="TFCM91641E6C82"
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:brightness-105 transition cursor-pointer"
          >
            Inspect <ArrowRight size={12} />
          </MapLaunch>
        </div>

        {/* 4 Multi-Department Checks */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-panel p-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-ink-3">
              <span>Revenue (RoR)</span>
              <span className="text-primary font-bold">1-B Khata #412</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-ink truncate">Pattadar Passbook Clear</p>
          </div>
          <div className="rounded-lg border border-line bg-panel p-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-ink-3">
              <span>Registration</span>
              <span className="text-primary font-bold">Doc 4125/2026</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-ink truncate">30-Yr Nil Encumbrance</p>
          </div>
          <div className="rounded-lg border border-line bg-panel p-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-ink-3">
              <span>Urban Planning</span>
              <span className="text-primary font-bold">FSI: 1.50</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-ink truncate">CRDA R-1 Residential Zone</p>
          </div>
          <div className="rounded-lg border border-line bg-panel p-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-ink-3">
              <span>Municipal Tax</span>
              <span className="text-primary font-bold">₹1,840 Paid</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-ink truncate">Zero Arrears Clearance</p>
          </div>
        </div>

        {/* Privacy consent banner */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-line/60 bg-panel-2 px-3 py-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-ink-2">
            <EyeOff size={13} className="text-primary shrink-0" />
            <span>DPDP Act 2023: Identity masked (K*** R***)</span>
          </div>
          <span className="font-mono text-[10px] text-primary font-bold">Verified Owner Access</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   7. CHAPTER 07: INTEROPERABILITY PIPELINE ARCHITECTURE COMPONENT
   ========================================================================= */

function InteroperabilityPipeline() {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-line bg-panel p-5 shadow-panel">
      {/* Top Ingestion Layer: 3 State Systems */}
      <div className="text-center mb-3">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3 font-semibold">
          1. State Cadastral Ingestion Gateways
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { state: 'Andhra Pradesh', portal: 'NIC Meebhoomi', dialect: 'Khata · RoR 1-B', badge: 'AP-GW' },
          { state: 'Tamil Nadu', portal: 'TNREGINET', dialect: 'Patta · Chitta', badge: 'TN-GW' },
          { state: 'Telangana', portal: 'C-DAC Dharani', dialect: 'Passbook · RoR', badge: 'TG-GW' },
        ].map((item) => (
          <div key={item.state} className="rounded-xl border border-line bg-panel-2 p-2.5 text-center shadow-2xs">
            <span className="rounded bg-primary-soft px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary">
              {item.badge}
            </span>
            <p className="mt-1.5 text-[11px] font-bold text-ink leading-tight">{item.state}</p>
            <p className="mt-0.5 font-mono text-[9.5px] text-primary">{item.portal}</p>
            <p className="mt-1 text-[9px] text-ink-3">{item.dialect}</p>
          </div>
        ))}
      </div>

      {/* Middle Layer: Schema Normalizer */}
      <div className="my-2.5 flex items-center justify-center">
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-ground px-3 py-1 text-[10px] font-mono text-ink-3">
          <ArrowDown size={11} className="text-primary" />
          <span>ISO 19152 LADM Schema Normalizer</span>
          <ArrowDown size={11} className="text-primary" />
        </div>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary-soft/25 p-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          <span className="font-display text-xs font-bold text-primary uppercase tracking-wider">
            Common Land Model (CLM 1.0)
          </span>
          <span className="size-2 rounded-full bg-primary" />
        </div>
        <p className="mt-1 text-[11px] text-ink-2">
          Harmonizes coordinate reference systems (EPSG:4326), legal rights, parcel geometries & multi-tier provenance
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 font-mono text-[9.5px]">
          <span className="rounded bg-panel px-2 py-0.5 border border-primary/20 text-ink">OGC Features API</span>
          <span className="rounded bg-panel px-2 py-0.5 border border-primary/20 text-ink">GeoJSON-LD</span>
          <span className="rounded bg-panel px-2 py-0.5 border border-primary/20 text-ink">Event Webhooks</span>
        </div>
      </div>

      {/* Bottom Output: Canonical 14-digit ULPIN Key */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-panel-2 px-3.5 py-2.5">
        <div>
          <span className="block font-mono text-[9.5px] uppercase tracking-wider text-ink-3">Canonical National Key</span>
          <span className="font-mono text-xs font-bold text-primary">ULPIN: TFCM91641E6C82</span>
        </div>
        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          ✓ Single Point of Truth
        </span>
      </div>
    </div>
  );
}

/* =========================================================================
   8. PILOT CORRIDORS & CLUSTERS
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
    color: 'border-emerald-700/30 bg-emerald-50/50 dark:bg-emerald-950/20',
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
    color: 'border-amber-700/30 bg-amber-50/50 dark:bg-amber-950/20',
    tagColor: 'bg-amber-800 text-white',
    demoULPIN: 'TEPDPUQC13C0D7',
    demoLabel: 'Sy. 77 · 4.60 ac',
  },
];

function PilotClustersSection() {
  return (
    <section id="pilots" className="landing-section bg-panel px-6 py-14 sm:py-16 sm:px-12 lg:px-20 border-t border-line">
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          06 / Field Pilot Corridors
        </p>
        <h2 className="mt-2.5 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
          Live across 3 states · 575+ cadastral parcels
        </h2>
        <p className="mt-3.5 text-sm sm:text-base text-ink-2 max-w-2xl mx-auto leading-relaxed">
          Tested with real cadastral geometry from AP Meebhoomi, TN Chitta, and TG Dharani. Click any pilot corridor to open the live vector map explorer.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-[1400px] grid-cols-1 gap-5 md:grid-cols-3">
        {PILOT_CLUSTERS.map((c) => (
          <div
            key={c.state}
            className={clsx('rounded-2xl border p-5 sm:p-6 shadow-xs transition-all hover:shadow-panel', c.color)}
          >
            <div className="flex items-center justify-between">
              <span className={clsx('rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider', c.tagColor)}>
                {c.state}
              </span>
              <span className="font-mono text-xs font-bold text-ink-2">{c.parcels}</span>
            </div>

            <h3 className="mt-3.5 font-display text-xl font-bold text-ink">{c.cluster}</h3>
            <p className="mt-1 text-xs text-ink-3">{c.district}</p>

            <div className="mt-4 rounded-xl border border-line bg-panel p-3">
              <span className="text-[10px] uppercase tracking-wide font-mono text-ink-3">Registry Health</span>
              <p className="text-xs font-bold text-ink mt-0.5">{c.status}</p>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <MapLaunch
                ulpin={c.demoULPIN}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
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
   9. OPERATIONAL ARCHITECTURE (HOW IT WORKS)
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
    title: 'Verifiable Action',
    desc: 'The platform synthesizes statutory risk briefs, checks satellite change alerts, masks private data per DPDP guidelines, and generates signed tamper-evident reports with cryptographic QR.',
    badge: 'Instant Trust',
  },
];

function HowItWorksSection() {
  return (
    <section id="how" className="landing-section bg-ground px-6 py-14 sm:py-16 sm:px-12 lg:px-20 border-t border-line">
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          08 / Operational Architecture
        </p>
        <h2 className="mt-2.5 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.1]">
          Three steps from parcel key to verifiable action.
        </h2>
        <p className="mt-3.5 text-sm sm:text-base text-ink-2 max-w-2xl mx-auto leading-relaxed">
          Built on open standards and micro-adapters that let state governments maintain digital sovereignty while offering citizens seamless unified access.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-[1400px] grid-cols-1 gap-5 md:grid-cols-3">
        {HOW_STEPS.map((s) => (
          <div key={s.step} className="rounded-2xl border border-line bg-panel p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft font-mono text-sm font-bold text-primary">
                {s.step}
              </span>
              <span className="rounded-full bg-ground-2 px-2.5 py-0.5 font-mono text-[9.5px] font-bold text-ink-3 uppercase">
                {s.badge}
              </span>
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink">{s.title}</h3>
            <p className="mt-2 text-xs sm:text-[13px] text-ink-2 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================================================
   10. FINAL CALL TO ACTION
   ========================================================================= */

function FinalCTASection() {
  return (
    <section className="relative overflow-hidden bg-primary px-6 py-16 sm:py-20 text-center text-white sm:px-12 lg:px-20">
      <div className="mx-auto max-w-3xl relative z-10">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-primary-soft">
          09 / Explore Land Stack
        </p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          The next layer of public infrastructure.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-primary-soft/90 max-w-xl mx-auto leading-relaxed">
          Search any parcel, inspect cross-department records live, track statutory applications, and verify titles with cryptographic certainty.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <MapLaunch className="relative overflow-hidden cta-glow inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary transition hover:bg-ground active:scale-95 shadow-md cursor-pointer">
            <BorderBeam size={120} duration={6} colorFrom="#183B2B" colorTo="#D1A654" />
            Explore Platform <ArrowRight size={15} />
          </MapLaunch>
          <Link
            to="/help"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
          >
            User Guide & Documentation
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   11. PAGE ROOT EXPORT (Complete Narrative Flow)
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
        <SearchPreviewBox />
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
        <InteroperabilityPipeline />
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

