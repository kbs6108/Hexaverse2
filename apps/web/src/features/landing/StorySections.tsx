import { useEffect, useRef, useState } from 'react';
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
  Droplets,
  EyeOff,
  FileText,
  Landmark,
  Layers,
  PenLine,
  QrCode,
  Receipt,
  Satellite,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { DEPARTMENTS, QUICK_START, ROLES, TIERS } from '@/features/marketing/pitch';
import { GovStrip } from '@/features/marketing/GovStrip';
import { SectionHeading } from '@/features/marketing/components';
import { MapLaunch } from './MapLaunch';
import { SpotlightCard } from '@/components/SpotlightCard';
import { NumberTicker } from '@/components/NumberTicker';
import { BorderBeam } from '@/components/BorderBeam';
import { Marquee } from '@/components/Marquee';

/** Scroll-story landing styled in Warm Sandstone & Heritage Forest Green. */

/* ---------- cinematic scenes ---------- */

function SystemScene({
  chapter,
  title,
  caption,
  points,
  children,
  id,
}: {
  chapter: string;
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
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">{chapter} / The System</p>
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

function LandScene({ chapter, statement, detail, className = '', id }: { chapter: string; statement: React.ReactNode; detail?: string; className?: string; id?: string }) {
  return (
    <section id={id} className={`landing-section relative flex min-h-[45vh] items-center overflow-hidden border-y border-line bg-panel-2 px-6 py-20 text-ink sm:px-12 lg:px-24 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true, amount: 0.3 }} className="mx-auto w-full max-w-5xl">
        <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">{chapter} / The Land</p>
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

/* ---------- info sections (content from marketing/pitch.ts) ---------- */

function InfoHeader({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return <SectionHeading kicker={kicker} title={title} sub={sub} align="center" size="lg" />;
}

const STATS_DATA = [
  { value: 3, suffix: '', label: 'States · AP, TN & TG' },
  { value: 575, suffix: '+', label: 'Parcels indexed' },
  { value: 6, suffix: '', label: 'Departments unified' },
  { value: 100, suffix: '%', label: 'Authoritative provenance' },
];

function StatsStrip() {
  return (
    <section className="landing-section border-y border-line bg-panel px-6 py-16 sm:px-12">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        {STATS_DATA.map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">
              <NumberTicker value={s.value} />
              {s.suffix}
            </p>
            <p className="mt-2 text-[13px] font-medium text-ink-2">{s.label}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3">Demo cadastre · Mangalagiri · Sriperumbudur · Shamshabad · synthetic data</p>
    </section>
  );
}

const STANDARDS = [
  { title: 'ULPIN Standard', sub: '14-Digit Bhu-Aadhaar', badge: 'DoLR' },
  { title: 'Meebhoomi Gateway', sub: 'Andhra Pradesh Cadastre', badge: 'AP State' },
  { title: 'Patta Chitta Gateway', sub: 'Tamil Nadu Land Records', badge: 'TN State' },
  { title: 'Dharani Portal', sub: 'Telangana Cadastre', badge: 'TG State' },
  { title: 'Sentinel-2 Orbit', sub: '10m Optical & Radar Detection', badge: 'ESA Satellite' },
  { title: 'NVIDIA Nemotron', sub: 'AI Risk & Legal Briefs', badge: 'AI Engine' },
  { title: 'PostGIS 3D', sub: 'Sub-Second Vector Tile Stream', badge: 'OGC Vector' },
  { title: 'DPDP 2023', sub: 'Consent-Gated Owner Masking', badge: 'Privacy' },
  { title: 'Tamper-Evident LIR', sub: 'Signed Digital Deeds + QR', badge: 'Integrity' },
  { title: 'Common Land Model', sub: 'Unified Multi-State Schema', badge: 'CDM 1.0' },
];

function StandardsMarqueeStrip() {
  return (
    <div className="border-b border-line bg-panel-2/50 py-3.5 overflow-hidden">
      <Marquee duration={28} pauseOnHover={true} gap="1rem">
        {STANDARDS.map((s) => (
          <div
            key={s.title}
            className="flex items-center gap-2.5 rounded-full border border-line bg-panel px-4 py-2 shadow-xs transition hover:border-line-strong hover:bg-ground-2"
          >
            <span className="size-2 rounded-full bg-primary" />
            <span className="font-display text-xs font-bold text-ink">{s.title}</span>
            <span className="text-xs text-ink-3">· {s.sub}</span>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
              {s.badge}
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}

function DepartmentCard({ d }: { d: (typeof DEPARTMENTS)[number] }) {
  return (
    <SpotlightCard className="h-full p-6 shadow-panel transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <d.icon size={20} strokeWidth={1.8} />
        </span>
        <span className="text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary">
          <ArrowRight size={18} className="-rotate-45" />
        </span>
      </div>
      <h3 className="mt-5 font-display text-lg font-bold text-ink">{d.name}</h3>
      <p className="mt-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{d.vocab}</p>
      <p className="mt-3 text-sm leading-6 text-ink-2">{d.blurb}</p>
    </SpotlightCard>
  );
}

function DepartmentsSection() {
  return (
    <section id="departments" className="landing-section bg-ground px-6 py-24 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <InfoHeader
          kicker="Six departments / one key"
          title="Everything government knows, in one place"
          sub="Each department keeps its own system and its own authority. Land Stack asks all six live — through one ULPIN parcel key — and shows where every answer came from."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((d) => (
            <DepartmentCard key={d.key} d={d} />
          ))}
        </div>
      </div>
    </section>
  );
}

const SHOWCASE_CARDS = [
  {
    num: '01',
    title: 'AI Risk & Title Briefs',
    tag: 'AI Inference',
    engine: 'NVIDIA Nemotron',
    icon: Sparkles,
    lead: 'Instant cross-department risk scoring and legal flags.',
    body: 'Flagged parcels are analysed automatically by the AI engine: court stays, encumbrance overlap, fiscal arrears, and survey mismatches synthesized into one plain-language brief with recommendations.',
    metric: '9-Point Due Diligence Check',
  },
  {
    num: '02',
    title: 'Satellite Change Detection',
    tag: 'Earth Observation',
    engine: 'Sentinel-2 Orbit (10m)',
    icon: Satellite,
    lead: 'Unrecorded construction detected from orbit.',
    body: 'Multi-spectral NDVI and NDBI delta comparison compares satellite passes against registered building permissions. Likely unauthorized built-up triggers an automated field review in the officer queue in one click.',
    metric: 'Bi-Weekly Orbit Revisit',
  },
  {
    num: '03',
    title: 'Vertical Property (3D Cadastre)',
    tag: '3D Stratified',
    engine: 'PostGIS 3D Vector',
    icon: Boxes,
    lead: 'True 3D-ULPIN for multi-storey apartments and basements.',
    body: 'Land is no longer flat. Land Stack binds vertical property units to their elevation band, unit floor area, common areas, and underground basements with authoritative sub-parcel keys.',
    metric: 'Full 3D Stratum Registry',
  },
  {
    num: '04',
    title: 'Bounded Boundary Edits',
    tag: 'Resurvey & GIS',
    engine: 'Norm Enforcement',
    icon: PenLine,
    lead: 'Officers drag corners; geometry validation enforces norms.',
    body: 'Surveyors correct parcel geometry directly on the map. Strict automated validation blocks overlaps, limits area drift to ±15%, and requires a two-step second-officer sign-off that synchronizes the Record of Rights.',
    metric: '±15% Tolerance · 0 Overlaps',
  },
  {
    num: '05',
    title: 'Verifiable LIR Reports',
    tag: 'Integrity',
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
    tag: 'Multi-State CDM',
    engine: 'Common Land Model 1.0',
    icon: Landmark,
    lead: 'Unifies AP, TN, and TG cadastre schemas in real-time.',
    body: 'Translates local nomenclature — khata (Meebhoomi), patta (Chitta), and passbook (Dharani) — into one canonical standard. Integrates each state without replacing their existing database.',
    metric: '3 States · 1 Common Schema',
  },
  {
    num: '08',
    title: 'Tamper-Evident Provenance',
    tag: 'Audit Ledger',
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

  const rawProgress = useMotionValue(0);
  // Ultra-fluid spring interpolation for smooth gliding on trackpad / mousewheel
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 260,
    damping: 32,
    mass: 0.25,
  });

  const x = useTransform(smoothProgress, [0, 1], [0, -scrollRange]);
  const progressPercent = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  // Measure content width dynamically
  useEffect(() => {
    const updateRange = () => {
      if (contentRef.current) {
        const scrollWidth = contentRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;
        // Make sure the last card has comfortable padding at the right edge
        setScrollRange(Math.max(0, scrollWidth - viewportWidth + 100));
      }
    };

    updateRange();

    const ro = new ResizeObserver(updateRange);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener('resize', updateRange);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateRange);
    };
  }, []);

  // Universal scroll tracking: measures target relative to viewport
  // Works identically whether window or an ancestor container scrolls
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    let rafId: number;

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const totalDistance = rect.height - window.innerHeight;
        if (totalDistance <= 0) return;

        // When rect.top <= 0, the section has hit top of viewport
        const scrolled = -rect.top;
        const p = Math.min(1, Math.max(0, scrolled / totalDistance));
        rawProgress.set(p);

        // 1 intro card + 8 showcase cards + 1 outro card = 10 items
        const totalCards = SHOWCASE_CARDS.length + 2;
        const currentCard = Math.min(totalCards - 1, Math.max(0, Math.floor(p * totalCards)));
        setActiveIdx(currentCard);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    let p = target.parentElement;
    while (p && p !== document.body) {
      p.addEventListener('scroll', onScroll, { passive: true });
      p = p.parentElement;
    }

    onScroll();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      let parent = target.parentElement;
      while (parent && parent !== document.body) {
        parent.removeEventListener('scroll', onScroll);
        parent = parent.parentElement;
      }
    };
  }, [rawProgress]);

  // Click navigation: advance scroll position
  const handleNav = (direction: 'next' | 'prev') => {
    const target = targetRef.current;
    if (!target) return;
    const totalDistance = target.offsetHeight - window.innerHeight;
    const totalCards = SHOWCASE_CARDS.length + 2;
    const step = totalDistance / totalCards;
    const targetScroll = direction === 'next' ? step : -step;

    window.scrollBy({ top: targetScroll, behavior: 'smooth' });

    let parent = target.parentElement;
    while (parent && parent !== document.body) {
      if (parent.scrollHeight > parent.clientHeight) {
        parent.scrollBy({ top: targetScroll, behavior: 'smooth' });
        break;
      }
      parent = parent.parentElement;
    }
  };

  const totalCardCount = SHOWCASE_CARDS.length + 2;

  return (
    <section ref={targetRef} className="relative h-[360vh] bg-ground">
      <div className="sticky top-0 flex h-screen max-h-screen flex-col justify-between overflow-hidden border-y border-line bg-panel-2/30 py-6 sm:py-8 lg:py-10 backdrop-blur-xs">
        {/* Sticky Section Header */}
        <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-12 lg:px-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                  03 / Platform Capabilities
                </p>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                  Sticky Horizontal Showcase
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
                  className="flex size-9 items-center justify-center rounded-full border border-line bg-panel text-ink transition hover:border-line-strong hover:bg-ground active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-xs"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('next')}
                  disabled={activeIdx >= totalCardCount - 1}
                  className="flex size-9 items-center justify-center rounded-full border border-line bg-panel text-ink transition hover:border-line-strong hover:bg-ground active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-xs"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span className="font-mono text-[11px] font-bold text-primary">
                  Card {activeIdx + 1} of {totalCardCount}
                </span>
                <div className="h-2 w-36 sm:w-44 overflow-hidden rounded-full bg-line/80">
                  <motion.div
                    style={{ width: progressPercent }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Motion Track */}
        <div className="relative my-auto w-full overflow-hidden py-3">
          <motion.div
            ref={contentRef}
            style={{ x }}
            className="flex gap-6 px-6 sm:px-12 lg:px-20 w-max will-change-transform"
          >
            {/* Intro Lead Card */}
            <div className="w-[320px] sm:w-[380px] lg:w-[420px] shrink-0 h-[400px] sm:h-[440px] lg:h-[460px]">
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-primary/30 bg-primary p-7 sm:p-8 text-white shadow-panel">
                <BorderBeam size={200} duration={8} colorFrom="#52B788" colorTo="#D1A654" />
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
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-xs">
                    <p className="font-mono text-[11px] font-bold text-primary-soft uppercase tracking-wider">
                      Vertical Scroll Activated
                    </p>
                    <p className="mt-1 text-xs text-white/90">
                      Continue scrolling down your mouse or trackpad to pan through all 8 system pillars.
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
                className="w-[320px] sm:w-[380px] lg:w-[420px] shrink-0 h-[400px] sm:h-[440px] lg:h-[460px]"
              >
                <SpotlightCard className="h-full p-7 sm:p-8 shadow-panel flex flex-col justify-between rounded-3xl border border-line bg-panel hover:border-line-strong hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-xs">
                        <card.icon size={22} strokeWidth={1.8} />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink-3">#{card.num}</span>
                        <span className="rounded-full border border-line bg-panel-2 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                          {card.tag}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-5 font-display text-xl sm:text-2xl font-bold text-ink">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-xs font-semibold text-primary uppercase tracking-wide">
                      {card.lead}
                    </p>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-ink-2">
                      {card.body}
                    </p>
                  </div>

                  <div className="border-t border-line/60 pt-4 flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-primary">{card.engine}</span>
                    <span className="rounded-md bg-panel-2 px-2.5 py-1 font-mono text-[10px] font-bold text-ink-2">
                      {card.metric}
                    </span>
                  </div>
                </SpotlightCard>
              </div>
            ))}

            {/* Outro Finale Card */}
            <div className="w-[320px] sm:w-[380px] lg:w-[420px] shrink-0 h-[400px] sm:h-[440px] lg:h-[460px]">
              <div className="flex h-full flex-col justify-between rounded-3xl border border-primary/40 bg-panel p-7 sm:p-8 shadow-panel">
                <div>
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
                    Live Demo Ready
                  </span>
                  <h3 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-ink leading-tight">
                    Experience it on the ground.
                  </h3>
                  <p className="mt-4 text-xs sm:text-sm leading-relaxed text-ink-2">
                    Every feature above is integrated live into the Land Stack cadastre map across 575+ parcels in Andhra Pradesh, Tamil Nadu, and Telangana.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-line bg-ground p-4">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink">
                      <span className="size-2 rounded-full bg-primary animate-pulse" />
                      <span>Ready for exploration</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-2">
                      Inspect 3D layers, AI risk scoring, and verified Land Information Reports in one click.
                    </p>
                  </div>

                  <MapLaunch className="w-full justify-center inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 shadow-sm">
                    Launch Interactive Map <ArrowRight size={16} />
                  </MapLaunch>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer info & dots indicator */}
        <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-12 lg:px-20">
          <div className="flex items-center justify-between border-t border-line/60 pt-3 sm:pt-4">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalCardCount }).map((_, i) => (
                <span
                  key={i}
                  className={clsx(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === activeIdx ? 'w-6 bg-primary' : 'w-2 bg-line'
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

function HowItWorksSection() {
  return (
    <section id="how" className="landing-section bg-ground px-6 py-24 sm:px-12">
      <InfoHeader
        kicker="How it works"
        title="One search. Six answers. Full provenance."
        sub="No department is replaced and no data is copied — the gateway assembles the record live and tells you exactly which system said what, and when."
      />
      <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_START.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="rounded-2xl border border-line bg-panel p-6 shadow-panel"
          >
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft font-mono text-sm font-bold text-primary">{i + 1}</span>
            <h3 className="mt-4 font-display text-base font-bold text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-2">{s.detail}</p>
          </motion.div>
        ))}
      </div>

      <div className="mx-auto mt-20 max-w-6xl">
        <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">One platform / three roles</p>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-line bg-panel p-6 shadow-panel"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <r.icon size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">{r.role}</h3>
                  <p className="text-xs text-ink-3">{r.who}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink-2">{r.can}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}





/* ---------- assembled page ---------- */

export function StorySections() {
  return (
    <div className="bg-ground">
      <StatsStrip />
      <StandardsMarqueeStrip />

      <SystemScene
        id="system-map"
        chapter="01"
        title={<>Land, <span className="text-primary">located.</span></>}
        caption="A fast vector-tile map of the whole cadastre, organised in the three GIS tiers the problem statement asks for. Click any parcel and its full record opens."
        points={TIERS.map((t) => ({ head: t.name, sub: t.blurb }))}
      >
        <ParcelMap />
      </SystemScene>

      <LandScene
        id="fragmentation"
        chapter="02"
        statement={<>For a farmer, a boundary is not a line. <span className="text-primary">It is a livelihood.</span></>}
        detail="The mutation that takes weeks. The record that lives in three offices. Land Stack brings the answer closer to the people waiting for it."
      />

      <DepartmentsSection />

      <StickyHorizontalScroll />

      <SystemScene
        chapter="03"
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

      <HowItWorksSection />

      <LandScene
        chapter="04"
        statement={<>For a family, a dispute is not data. <span className="text-primary">It is a question of home.</span></>}
        detail="A connected record turns a maze of departments into a clear next step."
      />

      <SystemScene
        id="identity"
        chapter="05"
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

      <section className="flex min-h-[50vh] items-center justify-center bg-primary px-6 py-20 text-center text-white">
        <div>
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-soft">The next layer</p>
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">Explore Land Stack.</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <MapLaunch className="relative overflow-hidden cta-glow inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-primary transition hover:bg-ground active:scale-95 shadow-sm">
              <BorderBeam size={140} duration={6} colorFrom="#183B2B" colorTo="#D1A654" />
              Explore Platform <ArrowRight size={16} />
            </MapLaunch>
            <Link to="/help" className="inline-flex items-center gap-3 rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95">
              Guide & FAQ
            </Link>
          </div>
        </div>
      </section>

      <GovStrip variant="landing" />
    </div>
  );
}
