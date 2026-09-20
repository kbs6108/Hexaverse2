import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import {
  ArrowRight,
  Building2,
  Boxes,
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
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { DEPARTMENTS, ROLES } from '@/features/marketing/pitch';
import { GovStrip } from '@/features/marketing/GovStrip';
import { SectionHeading } from '@/features/marketing/components';
import { MapLaunch } from './MapLaunch';
import { SpotlightCard } from '@/components/SpotlightCard';
import { NumberTicker } from '@/components/NumberTicker';
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
    <section className="border-y border-line bg-panel py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-line sm:grid-cols-4 px-4 sm:px-6">
        {STATS_DATA.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4 }}
            className="text-center px-3 py-2"
          >
            <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-primary">
              <NumberTicker value={s.value} />
              {s.suffix}
            </p>
            <p className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-3">{s.label}</p>
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
    <div className="border-b border-line bg-panel-2/50 py-2.5 overflow-hidden">
      <Marquee duration={28} pauseOnHover={true} gap="0.75rem">
        {STANDARDS.map((s) => (
          <div
            key={s.title}
            className="flex items-center gap-2 rounded-xs border border-line bg-panel px-3 py-1 text-xs font-mono shadow-2xs transition hover:border-primary/40 hover:bg-ground-2"
          >
            <span className="size-1.5 rounded-none bg-primary" />
            <span className="font-bold text-ink">{s.title}</span>
            <span className="text-ink-3">· {s.sub}</span>
            <span className="border border-primary/20 bg-primary-soft/50 px-1.5 py-0.5 text-[9.5px] font-bold text-primary uppercase">
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
    detail: 'Khata No. 412 · Extent: 3.44 acres (13,929 m²) · Dry Agricultural. No pending mutation backlog.',
    source: 'Meebhoomi RoR-1B Gateway',
    icon: Landmark,
  },
  {
    id: 'reg',
    dept: 'Registration & Stamps',
    label: 'Deed & Encumbrance',
    status: 'clean',
    badge: 'Nil Encumbrance (EC Clear)',
    detail: 'Registered Sale Deed Doc #1420/2021 (SRO Mangalagiri). Zero active bank mortgages or attachments.',
    source: 'CARD Online Registration System',
    icon: FileText,
  },
  {
    id: 'plan',
    dept: 'Town Planning & CRDA',
    label: 'Master Plan Zoning',
    status: 'clean',
    badge: 'Zone: Agricultural / R-1 Compatible',
    detail: 'Outside flood mitigation buffer. Permissible building height: G+2 residential / farmstead.',
    source: 'CRDA Master Plan 2035 GIS',
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
  const activeCheck = LIVE_PARCEL_CHECKS.find((c) => c.id === activeCheckId) ?? LIVE_PARCEL_CHECKS[0];

  const handleCopy = () => {
    navigator.clipboard?.writeText('TFCM91641E6C82');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-sm border border-line bg-panel p-6 sm:p-7 shadow-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-none bg-primary" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
              Authoritative Cadastral Record · Assembled Live
            </span>
          </div>
          <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-ink">
            Survey No. 123/4 · Mangalagiri
          </h3>
          <p className="font-mono text-xs text-ink-3">Village: Mangalagiri · Guntur District · Andhra Pradesh</p>
        </div>

        {/* ULPIN Key with copy */}
        <div className="flex items-center gap-1.5 rounded-xs border border-primary/30 bg-primary-soft/50 px-2.5 py-1 shadow-2xs">
          <span className="font-mono text-xs font-bold text-primary">TFCM91641E6C82</span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-primary/70 hover:text-primary transition-colors cursor-pointer"
            title="Copy 14-digit ULPIN"
            aria-label="Copy ULPIN"
          >
            {copied ? <Check size={13} className="text-emerald-700" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs">
        <div className="rounded-xs border border-line bg-panel-2/50 p-2.5">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">Total Area</span>
          <p className="font-bold text-ink text-[13px] mt-0.5">13,929.1 m²</p>
          <p className="text-[10.5px] text-ink-2">3.44 acres · 344 cents</p>
        </div>
        <div className="rounded-xs border border-line bg-panel-2/50 p-2.5">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">Classification</span>
          <p className="font-bold text-ink text-[13px] mt-0.5">Dry Agricultural</p>
          <p className="text-[10.5px] text-ink-2">Passbook Khata #412</p>
        </div>
        <div className="rounded-xs border border-line bg-panel-2/50 p-2.5">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">DPDP Privacy</span>
          <p className="font-bold text-ink text-[13px] mt-0.5">R*** K***</p>
          <p className="text-[10.5px] text-primary">Masked by default</p>
        </div>
        <div className="rounded-xs border border-line bg-panel-2/50 p-2.5">
          <span className="text-[10px] uppercase tracking-wide text-ink-3">Overall Status</span>
          <p className="font-bold text-emerald-700 text-[13px] mt-0.5">Clean Title</p>
          <p className="text-[10.5px] text-ink-2">9/9 checks passed</p>
        </div>
      </div>

      {/* 6 Department Check Pills */}
      <div className="mt-5">
        <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-ink-3 mb-2">
          Click department to inspect source provenance:
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
                  'flex items-center gap-2 rounded-xs border p-2.5 text-left transition-all cursor-pointer select-none',
                  isSelected
                    ? 'border-primary bg-primary-soft/70 shadow-2xs'
                    : 'border-line bg-panel-2/40 hover:bg-panel-2 hover:border-line-strong'
                )}
              >
                <span
                  className={clsx(
                    'flex size-7 shrink-0 items-center justify-center rounded-xs',
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
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="mt-4 rounded-xs border border-primary/30 bg-panel-2/90 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <span className="rounded-xs bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-white uppercase">
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
      <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3">
        <span className="font-mono text-xs text-ink-3">Inspect live PostGIS vector:</span>
        <MapLaunch
          ulpin="TFCM91641E6C82"
          className="inline-flex items-center gap-1.5 rounded-xs bg-primary px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90 active:scale-98 transition-all cursor-pointer"
        >
          Open Sy. 123/4 in Map Explorer <ArrowRight size={13} />
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
                  'rounded-sm border p-4 transition-all',
                  item.bad ? 'border-line bg-panel/60' : 'border-primary/40 bg-primary-soft/30 shadow-2xs'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'flex size-5 shrink-0 items-center justify-center rounded-xs font-mono text-xs font-bold',
                      item.bad ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-primary text-white'
                    )}
                  >
                    {item.bad ? '✕' : '✓'}
                  </span>
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink">{item.head}</p>
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
              className="p-6 rounded-sm border border-line bg-panel shadow-xs hover:border-primary/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xs bg-primary-soft text-primary">
                  <d.icon size={18} strokeWidth={1.8} />
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-soft/70 px-2 py-0.5 rounded-xs border border-primary/20">
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
   4. STICKY HORIZONTAL SHOWCASE (BUTTERY-SMOOTH, ZERO-STUTTER)
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
];

function StickyHorizontalScroll() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scrollRange, setScrollRange] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const activeIdxRef = useRef(0);

  const totalCardCount = SHOWCASE_CARDS.length + 2; // 10 cards total

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
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 4) {
        window.scrollBy({ top: e.deltaX, behavior: 'auto' });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const scrollToCard = (cardIndex: number) => {
    const target = targetRef.current;
    if (!target) return;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const totalDistance = target.offsetHeight - window.innerHeight;
    if (totalDistance <= 0) return;
    const targetScroll = targetTop + (totalDistance * (cardIndex / (totalCardCount - 1)));
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  const handleNav = (direction: 'next' | 'prev') => {
    const nextIdx = direction === 'next'
      ? Math.min(totalCardCount - 1, activeIdxRef.current + 1)
      : Math.max(0, activeIdxRef.current - 1);
    scrollToCard(nextIdx);
  };

  return (
    <section ref={targetRef} className="relative h-[300vh] bg-ground">
      <div className="sticky top-0 flex h-screen max-h-screen flex-col justify-between overflow-hidden border-y border-line bg-panel-2/30 py-6 sm:py-8 lg:py-10 backdrop-blur-xs">
        {/* Sticky Section Header */}
        <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-12 lg:px-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  03 / Platform Capabilities
                </p>
                <span className="rounded-xs border border-primary/20 bg-primary-soft/60 px-2 py-0.5 font-mono text-[10px] font-bold text-primary uppercase">
                  Technical Architecture
                </span>
              </div>
              <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
                Built like public infrastructure.
              </h2>
              <p className="mt-1 max-w-xl text-xs sm:text-sm leading-relaxed text-ink-2">
                Scroll vertically down to glide horizontally through the core modules unifying analysis, geometry integrity, verifiable deeds, and privacy.
              </p>
            </div>

            {/* Interactive Progress & Arrow controls */}
            <div className="flex items-center gap-4 self-start sm:self-auto">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleNav('prev')}
                  disabled={activeIdx === 0}
                  className="flex size-8 items-center justify-center rounded-xs border border-line bg-panel text-ink transition hover:border-line-strong hover:bg-ground active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-2xs cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('next')}
                  disabled={activeIdx >= totalCardCount - 1}
                  className="flex size-8 items-center justify-center rounded-xs border border-line bg-panel text-ink transition hover:border-line-strong hover:bg-ground active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-2xs cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span className="font-mono text-[11px] font-bold text-primary">
                  Module {activeIdx + 1} of {totalCardCount}
                </span>
                <div className="h-1.5 w-32 sm:w-40 overflow-hidden rounded-xs bg-line">
                  <motion.div
                    style={{ width: progressPercent }}
                    className="h-full rounded-xs bg-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Motion Track: Hardware accelerated with will-change and translate3d */}
        <div className="relative my-auto w-full overflow-hidden py-3">
          <motion.div
            ref={contentRef}
            style={{
              x,
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform',
            }}
            className="flex gap-5 px-6 sm:px-12 lg:px-20 w-max"
          >
            {/* Intro Lead Card */}
            <div
              style={{ transform: 'translate3d(0, 0, 0)' }}
              className="w-[320px] sm:w-[380px] lg:w-[420px] shrink-0 h-[400px] sm:h-[440px] lg:h-[460px]"
            >
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-sm border border-primary/40 bg-primary p-7 sm:p-8 text-white shadow-xs">
                <div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary-soft">
                    Six Systems · One Cadastre
                  </span>
                  <h3 className="mt-4 font-display text-2xl sm:text-3xl font-bold leading-tight">
                    Beyond simple mapping.
                  </h3>
                  <p className="mt-4 text-xs sm:text-sm leading-relaxed text-white/80">
                    A land platform is only as trustworthy as the capabilities it unlocks when a citizen applies, an officer reviews, or an audit inspects.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xs border border-white/20 bg-white/10 p-3.5 backdrop-blur-xs">
                    <p className="font-mono text-[11px] font-bold text-primary-soft uppercase tracking-wider">
                      Horizontal Stream Active
                    </p>
                    <p className="mt-1 text-xs text-white/90">
                      Scroll down to review each foundational public infrastructure module.
                    </p>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-primary-soft">
                    <span>8 Core Pillars</span>
                    <span className="flex items-center gap-1">Scroll down ↓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Showcase Innovation Cards */}
            {SHOWCASE_CARDS.map((card) => (
              <div
                key={card.num}
                style={{ transform: 'translate3d(0, 0, 0)' }}
                className="w-[320px] sm:w-[380px] lg:w-[420px] shrink-0 h-[400px] sm:h-[440px] lg:h-[460px]"
              >
                <SpotlightCard className="h-full p-7 sm:p-8 shadow-xs flex flex-col justify-between rounded-sm border border-line bg-panel hover:border-primary/50 transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex size-10 items-center justify-center rounded-xs bg-primary-soft text-primary shadow-2xs">
                        <card.icon size={19} strokeWidth={1.8} />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink-3">#{card.num}</span>
                        <span className="rounded-xs border border-line bg-panel-2 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                          {card.tag}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-5 font-display text-xl sm:text-2xl font-bold text-ink">
                      {card.title}
                    </h3>
                    <p className="mt-2 font-mono text-xs font-bold text-primary uppercase tracking-wider">
                      {card.lead}
                    </p>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-ink-2">
                      {card.body}
                    </p>
                  </div>

                  <div className="border-t border-line pb-1 pt-3 flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary">{card.engine}</span>
                    <span className="rounded-xs bg-panel-2 px-2.5 py-1 font-mono text-[10px] font-bold text-ink-2 border border-line">
                      {card.metric}
                    </span>
                  </div>
                </SpotlightCard>
              </div>
            ))}

            {/* Outro Finale Card */}
            <div
              style={{ transform: 'translate3d(0, 0, 0)' }}
              className="w-[320px] sm:w-[380px] lg:w-[420px] shrink-0 h-[400px] sm:h-[440px] lg:h-[460px]"
            >
              <div className="flex h-full flex-col justify-between rounded-sm border border-line bg-panel p-7 sm:p-8 shadow-xs">
                <div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
                    Live Cadastre Engine
                  </span>
                  <h3 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-ink leading-tight">
                    Experience it on the ground.
                  </h3>
                  <p className="mt-4 text-xs sm:text-sm leading-relaxed text-ink-2">
                    Every feature above is integrated live into the Land Stack cadastre map across 575+ parcels in Andhra Pradesh, Tamil Nadu, and Telangana.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xs border border-line bg-ground p-4">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink">
                      <span className="size-2 rounded-none bg-primary" />
                      <span>Ready for live exploration</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-2">
                      Inspect 3D layers, AI risk scoring, and verified Land Information Reports in one click.
                    </p>
                  </div>

                  <MapLaunch className="w-full justify-center inline-flex items-center gap-2.5 rounded-xs bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-98 shadow-xs cursor-pointer">
                    Launch Interactive Map <ArrowRight size={15} />
                  </MapLaunch>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer info & clickable dots indicator */}
        <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-12 lg:px-20">
          <div className="flex items-center justify-between border-t border-line pt-3 sm:pt-4">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalCardCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToCard(i)}
                  title={`Jump to card ${i + 1}`}
                  aria-label={`Jump to card ${i + 1}`}
                  className={clsx(
                    'h-1 rounded-xs transition-all duration-300 cursor-pointer',
                    i === activeIdx ? 'w-6 bg-primary' : 'w-2 bg-line hover:bg-ink-3'
                  )}
                />
              ))}
            </div>

            <p className="font-mono text-[11px] text-ink-3">
              Vertical scroll continues below after card 10 ↓
            </p>
          </div>
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
              className="flex flex-col justify-between rounded-sm border border-line bg-panel p-6 sm:p-7 shadow-xs hover:border-primary/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-8 items-center justify-center rounded-xs bg-primary font-mono text-xs font-bold text-white shadow-2xs">
                    {c.code}
                  </span>
                  <span className="rounded-xs bg-primary-soft/70 border border-primary/20 px-2 py-0.5 font-mono text-[10.5px] font-bold text-primary">
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
                  className="mt-3 w-full justify-center inline-flex items-center gap-2 rounded-xs bg-primary-soft border border-primary/20 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-white cursor-pointer active:scale-98 shadow-2xs"
                >
                  Explore {c.state} Cluster <ArrowRight size={13} />
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
                className="rounded-sm border border-line bg-panel p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xs bg-primary-soft text-primary">
                      <Icon size={19} strokeWidth={1.8} />
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
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-primary hover:underline"
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
          <MapLaunch className="inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-ground active:scale-[0.99] shadow-xs cursor-pointer">
            Explore Interactive Map <ArrowRight size={15} />
          </MapLaunch>
          <Link
            to="/help"
            className="inline-flex items-center gap-2 rounded-sm border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.99]"
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
      <StickyHorizontalScroll />
      <PilotClustersSection />
      <HowItWorksSection />
      <FinalCTASection />
      <GovStrip variant="landing" />
    </div>
  );
}
