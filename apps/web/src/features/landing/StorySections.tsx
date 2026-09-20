import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import {
  ArrowRight,
  Building2,
  Boxes,
  Check,
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
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEPARTMENTS, ROLES } from '@/features/marketing/pitch';
import { GovStrip } from '@/features/marketing/GovStrip';
import { SectionHeading } from '@/features/marketing/components';
import { MapLaunch } from './MapLaunch';
import { SpotlightCard } from '@/components/SpotlightCard';
import { NumberTicker } from '@/components/NumberTicker';
import { BorderBeam } from '@/components/BorderBeam';
import { Marquee } from '@/components/Marquee';

/* =========================================================================
   1. STATS & STANDARDS TICKER
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
            <p className="mt-1.5 text-xs sm:text-sm font-medium text-ink-2">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const STANDARDS = [
  { title: 'ULPIN Standard', sub: '14-Digit Bhu-Aadhaar', badge: 'DoLR' },
  { title: 'Meebhoomi Gateway', sub: 'Andhra Pradesh Cadastre', badge: 'AP State' },
  { title: 'Patta Chitta Gateway', sub: 'Tamil Nadu Land Records', badge: 'TN State' },
  { title: 'Dharani Portal', sub: 'Telangana Cadastre', badge: 'TG State' },
  { title: 'Sentinel-2 Orbit', sub: '10m Optical & Radar Detection', badge: 'ESA' },
  { title: 'NVIDIA Nemotron', sub: 'AI Risk & Legal Briefs', badge: 'AI Engine' },
  { title: 'PostGIS 3D Vector', sub: 'Sub-Second Tile Streaming', badge: 'OGC Vector' },
  { title: 'DPDP 2023', sub: 'Consent-Gated Owner Masking', badge: 'Privacy' },
  { title: 'Tamper-Evident LIR', sub: 'Signed Digital Deeds + QR', badge: 'Integrity' },
  { title: 'Common Land Model', sub: 'Unified Multi-State Schema', badge: 'CLM 1.0' },
];

function StandardsMarqueeStrip() {
  return (
    <div className="border-b border-line bg-panel-2/60 py-3 overflow-hidden">
      <Marquee duration={28} pauseOnHover={true} gap="1rem">
        {STANDARDS.map((s) => (
          <div
            key={s.title}
            className="flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 shadow-2xs transition hover:border-primary/40 hover:bg-ground-2"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="font-display text-xs font-bold text-ink">{s.title}</span>
            <span className="text-xs text-ink-3">· {s.sub}</span>
            <span className="rounded-full bg-primary-soft px-1.5 py-0.2 font-mono text-[9.5px] font-semibold text-primary">
              {s.badge}
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}

/* =========================================================================
   2. CORE BREAKTHROUGH & INTERACTIVE LIVE PARCEL INSPECTION CARD
   ========================================================================= */

interface ParcelDepartmentCheck {
  id: string;
  dept: string;
  label: string;
  status: 'clean' | 'flagged' | 'info';
  badge: string;
  detail: string;
  source: string;
  icon: typeof Landmark;
}

const LIVE_PARCEL_CHECKS: ParcelDepartmentCheck[] = [
  {
    id: 'ror',
    dept: 'Revenue Dept',
    label: 'Record of Rights (RoR)',
    status: 'clean',
    badge: 'Synced & Matched',
    detail: 'Khata No. 412 · Extent: 3.44 acres (13,929 m²) · Classified as Dry Agricultural. No pending mutation backlog.',
    source: 'Meebhoomi RoR-1B Gateway',
    icon: Landmark,
  },
  {
    id: 'reg',
    dept: 'Registration & Stamps',
    label: 'Deed & Encumbrance',
    status: 'clean',
    badge: 'Nil Encumbrance (EC Clear)',
    detail: 'Registered Sale Deed Doc #1420/2021 (SRO Mangalagiri). Zero active bank mortgages or third-party attachments.',
    source: 'CARD Online Registration System',
    icon: FileText,
  },
  {
    id: 'plan',
    dept: 'Town Planning & CRDA',
    label: 'Master Plan Zoning',
    status: 'clean',
    badge: 'Zone: Agricultural / R-1 Compatible',
    detail: 'Outside flood mitigation buffer (Krishna Basin). Permissible building height: G+2 residential / farmstead.',
    source: 'CRDA Master Plan 2035 GIS',
    icon: Building2,
  },
  {
    id: 'tax',
    dept: 'Gram Panchayat / Tax',
    label: 'Property Assessment & Tax',
    status: 'clean',
    badge: 'Paid Up to FY 2026',
    detail: 'Annual assessment ₹1,840 paid in full. Guideline valuation: ₹14,200/sqm (Reference market rate: ₹18,500/sqm).',
    source: 'Panchayat Raj Fiscal Gateway',
    icon: Receipt,
  },
  {
    id: 'court',
    dept: 'Judicial & Courts',
    label: 'Dispute & Litigation',
    status: 'clean',
    badge: 'Clear · Zero Active Stays',
    detail: 'District Munsif Court registry scanned. Suit OS 42/2018 disposed with final decree. No active injunctions.',
    source: 'e-Courts National Portal',
    icon: Scale,
  },
  {
    id: 'utils',
    dept: 'Utilities & Irrigation',
    label: 'Public Rights-of-Way',
    status: 'info',
    badge: 'Irrigation Canal Buffer Clear',
    detail: 'Secondary feeder canal 28m east (15m mandatory buffer respected). 11kV distribution line easement registered.',
    source: 'APCPDCL & Water Resources Dept',
    icon: Droplets,
  },
];

function InteractiveParcelCard() {
  const [activeCheckId, setActiveCheckId] = useState<string>('ror');
  const [copied, setCopied] = useState(false);
  const activeCheck = LIVE_PARCEL_CHECKS.find((c) => c.id === activeCheckId) ?? LIVE_PARCEL_CHECKS[0];

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
          <span className="text-[10px] uppercase tracking-wide text-ink-3">Land Classification</span>
          <p className="font-bold text-ink text-[13px] mt-0.5">Dry Agricultural</p>
          <p className="text-[10.5px] text-ink-2">Passbook Khata #412</p>
        </div>
        <div className="rounded-xl border border-line bg-panel-2/60 p-2.5">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">DPDP Owner Privacy</span>
          <p className="font-bold text-ink text-[13px] mt-0.5">R*** K***</p>
          <p className="text-[10.5px] text-primary">Masked by default</p>
        </div>
        <div className="rounded-xl border border-line bg-panel-2/60 p-2.5">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">Overall Health</span>
          <p className="font-bold text-emerald-700 text-[13px] mt-0.5">Clean Title</p>
          <p className="text-[10.5px] text-ink-2">9/9 verification checks</p>
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
        <span className="text-xs text-ink-3 font-medium">Ready to see this parcel live on the map?</span>
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
            01 / The Core Breakthrough
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

        {/* Live Parcel Card on the Right */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full"
        >
          <InteractiveParcelCard />
        </motion.div>
      </div>
    </section>
  );
}

/* =========================================================================
   3. SIX DEPARTMENTS MATRIX
   ========================================================================= */

function DepartmentsSection() {
  return (
    <section id="departments" className="landing-section border-t border-line bg-panel-2/40 px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker="02 / Federated Systems"
          title="Six departments. One authoritative record."
          sub="No department database is replaced or duplicated. Land Stack queries all six systems live through open adapters and cites where every field originated."
          align="center"
          size="lg"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((d) => (
            <SpotlightCard
              key={d.key}
              className="p-6 rounded-2xl border border-line bg-panel shadow-panel hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <d.icon size={20} strokeWidth={1.8} />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-soft/60 px-2 py-0.5 rounded-full">
                  {d.vocab}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{d.name}</h3>
              <p className="mt-2 text-xs sm:text-sm leading-6 text-ink-2">{d.blurb}</p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   4. CORE CAPABILITIES: COMPACT HIGH-IMPACT GRID (REPLACES 360vh SCROLL)
   ========================================================================= */

const CAPABILITIES = [
  {
    num: '01',
    title: 'AI Due Diligence Check',
    tag: 'NVIDIA Nemotron',
    icon: Sparkles,
    lead: 'Automated 9-point title & legal synthesis',
    desc: 'Analyzes court stays, encumbrance overlapping charges, fiscal arrears, and survey boundary mismatches into one plain-language brief with recommendations.',
    metric: 'Instant Legal Brief',
  },
  {
    num: '02',
    title: 'Satellite Change Alerts',
    tag: 'Sentinel-2 Orbit (10m)',
    icon: Satellite,
    lead: 'Detects unrecorded built-up from orbit',
    desc: 'Multi-spectral NDVI/NDBI delta checks compare satellite passes against approved municipal building permissions, triggering field inspection alerts in the officer queue.',
    metric: 'Bi-Weekly Orbit Sync',
  },
  {
    num: '03',
    title: 'Vertical Property (3D Cadastre)',
    tag: 'PostGIS 3D Vector',
    icon: Boxes,
    lead: 'Stratified 3D-ULPIN for multi-storey units',
    desc: 'Land is no longer flat. Binds apartments, commercial towers, elevation bands, common facilities, and underground basements to authoritative sub-parcel keys.',
    metric: 'Full Stratum Registry',
  },
  {
    num: '04',
    title: 'Bounded Boundary Resurvey',
    tag: 'Norm Enforcement',
    icon: PenLine,
    lead: 'Surveyors drag corners with strict rules',
    desc: 'Interactive map editor enforces strict geometry norms: blocks polygon overlaps, bounds area drift to ±15%, and mandates dual-officer sign-off to sync the RoR.',
    metric: '±15% Limit · 0 Overlap',
  },
  {
    num: '05',
    title: 'Verifiable LIR Reports',
    tag: 'Cryptographic QR',
    icon: QrCode,
    lead: 'Official reports checkable on any smartphone',
    desc: 'Citizens and financial institutions download certified Land Information Reports with embedded government cryptographic hashes, verifiable in under two seconds.',
    metric: 'Sub-2s Mobile Check',
  },
  {
    num: '06',
    title: 'DPDP 2023 Consent Privacy',
    tag: 'Privacy by Design',
    icon: EyeOff,
    lead: 'Masked owner identities by default',
    desc: 'Complies with the Digital Personal Data Protection Act. Public lookups display masked owner names until the owner grants a time-boxed cryptographic consent token.',
    metric: 'Zero-Knowledge Public Search',
  },
];

function CapabilitiesGridSection() {
  return (
    <section id="capabilities" className="landing-section bg-ground px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker="03 / Platform Capabilities"
          title="Engineered like true public infrastructure."
          sub="Purpose-built for spatial certainty, auditability, and speed — without gimmicks or manual delays."
          align="center"
          size="lg"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <SpotlightCard
                key={cap.num}
                className="flex flex-col justify-between p-6 sm:p-7 rounded-3xl border border-line bg-panel shadow-panel hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-2xs">
                      <Icon size={20} strokeWidth={1.8} />
                    </span>
                    <span className="rounded-full border border-line bg-panel-2 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                      {cap.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-lg sm:text-xl font-bold text-ink">{cap.title}</h3>
                  <p className="mt-1 text-xs font-semibold text-primary">{cap.lead}</p>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-ink-2">{cap.desc}</p>
                </div>

                <div className="mt-5 border-t border-line/60 pt-3 flex items-center justify-between font-mono text-xs">
                  <span className="text-ink-3 font-medium">Metric</span>
                  <span className="font-bold text-ink">{cap.metric}</span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   5. THREE REAL PILOT CLUSTERS (DIRECT LAUNCH)
   ========================================================================= */

const PILOT_CLUSTERS = [
  {
    code: 'AP',
    state: 'Andhra Pradesh',
    cluster: 'Mangalagiri · Amaravati Capital Region',
    vocab: 'Meebhoomi (Khata & RoR-1B)',
    parcels: '61 georeferenced parcels',
    focus: 'Capital region urban fringe, Krishna river buffer zone, agricultural conversion & residential master-plan zones.',
    sampleUlpin: 'TFCM91641E6C82',
    sampleLabel: 'Sy. 123/4 · Clean Title',
  },
  {
    code: 'TN',
    state: 'Tamil Nadu',
    cluster: 'Sriperumbudur · Chennai Industrial Corridor',
    vocab: 'Tamil Nilam (Patta & Chitta)',
    parcels: '240+ georeferenced parcels',
    focus: 'Manufacturing corridors, industrial parks, highway buffer restrictions, and multi-owner patta sub-divisions.',
    sampleUlpin: 'TF2CEQ4ACED970',
    sampleLabel: 'Sy. 45/2 · Patta Dispute',
  },
  {
    code: 'TG',
    state: 'Telangana',
    cluster: 'Shamshabad · Hyderabad Airport Region',
    vocab: 'Dharani Portal (Pattadar Passbook)',
    parcels: '270+ georeferenced parcels',
    focus: 'Airport expansion zones, satellite change alert tracking, peri-urban layout sanctions, and digital mutation.',
    sampleUlpin: 'TEPDPUQC13C0D7',
    sampleLabel: 'Sy. 77 · Change Alert',
  },
];

function PilotClustersSection() {
  return (
    <section id="clusters" className="landing-section border-t border-line bg-panel-2/40 px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker="04 / Active Pilot Clusters"
          title="Three states. One cadastre standard."
          sub="Explore real cadastral parcels across Andhra Pradesh, Tamil Nadu, and Telangana — running through local state adapters into one Common Land Model."
          align="center"
          size="lg"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PILOT_CLUSTERS.map((c) => (
            <div
              key={c.code}
              className="flex flex-col justify-between rounded-3xl border border-line bg-panel p-6 sm:p-7 shadow-panel hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-mono text-xs font-bold text-white shadow-2xs">
                    {c.code}
                  </span>
                  <span className="rounded-full bg-primary-soft/60 px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-primary">
                    {c.parcels}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-lg font-bold text-ink">{c.cluster}</h3>
                <p className="mt-1 font-mono text-xs font-semibold text-primary">{c.vocab}</p>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-ink-2">{c.focus}</p>
              </div>

              <div className="mt-6 border-t border-line/60 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-ink-3">Demo parcel:</span>
                  <span className="text-xs font-bold text-ink">{c.sampleLabel}</span>
                </div>
                <MapLaunch
                  ulpin={c.sampleUlpin}
                  className="mt-3 w-full justify-center inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white cursor-pointer active:scale-95 shadow-2xs"
                >
                  Explore {c.state} Cluster <ArrowRight size={14} />
                </MapLaunch>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================================
   6. THREE ROLES & CALL TO ACTION
   ========================================================================= */

function HowItWorksSection() {
  return (
    <section id="how" className="landing-section bg-ground px-6 py-20 sm:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          kicker="05 / Designed for Everyone"
          title="One platform. Three distinct roles."
          sub="Whether you are a citizen checking a deed, an officer clearing a mutation, or an admin monitoring state adapters."
          align="center"
          size="lg"
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.role}
                className="rounded-2xl border border-line bg-panel p-6 shadow-panel flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Icon size={20} strokeWidth={1.8} />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-ink">{r.role}</h3>
                      <p className="text-xs text-ink-3">{r.who}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs sm:text-sm leading-6 text-ink-2">{r.can}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-line/60">
                  <Link
                    to={r.role === 'Citizen' ? '/citizen' : r.role === 'Officer' ? '/officer' : '/admin'}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    Open {r.role} Workspace <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  return (
    <section className="relative overflow-hidden bg-primary px-6 py-20 text-center text-white sm:px-12">
      <BorderBeam size={260} duration={8} colorFrom="#52B788" colorTo="#D1A654" />
      <div className="mx-auto max-w-3xl relative z-10">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-soft">
          Digital Public Infrastructure for Land
        </p>
        <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
          Experience Land Stack live.
        </h2>
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-white/80 max-w-xl mx-auto">
          Search any parcel, inspect 3D layers, test AI due diligence, and download verified Land Information Reports across Andhra Pradesh, Tamil Nadu, and Telangana.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <MapLaunch className="relative overflow-hidden inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-primary transition hover:bg-ground active:scale-95 shadow-sm cursor-pointer">
            Explore Interactive Map <ArrowRight size={16} />
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
   PAGE ROOT EXPORT
   ========================================================================= */

export function StorySections() {
  return (
    <div className="bg-ground">
      <StatsStrip />
      <StandardsMarqueeStrip />
      <ProblemBreakthroughSection />
      <DepartmentsSection />
      <CapabilitiesGridSection />
      <PilotClustersSection />
      <HowItWorksSection />
      <FinalCTASection />
      <GovStrip variant="landing" />
    </div>
  );
}
