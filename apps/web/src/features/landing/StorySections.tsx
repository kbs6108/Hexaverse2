import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { ArrowDown, ArrowRight, Check, EyeOff, PenLine, QrCode, Search, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { DEPARTMENTS, PITCH_FIGURES, QUICK_START, ROLES, STORY_PARCELS, TIERS } from '@/features/marketing/pitch';
import type { Tone } from '@/components/Badge';
import { GovStrip } from '@/features/marketing/GovStrip';
import { SectionHeading } from '@/features/marketing/components';
import { MapLaunch } from './MapLaunch';

/** Scroll-story landing (light, emerald). Cinematic scenes alternate with
 *  concrete info sections whose content is imported from marketing/pitch.ts —
 *  the same source of truth as /welcome, so the two never drift. */

/** The landing scrolls inside Shell's <main>, not the window — useScroll must
 *  be told that container or its progress never moves. Resolved via closest(). */
function useLandingScroll(target: RefObject<HTMLElement | null>, offset: ['start start', 'end end'] | ['start end', 'end start']) {
  const container = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    container.current = (target.current?.closest('main') as HTMLElement | null) ?? null;
  }, [target]);
  return useScroll({ target: target as RefObject<HTMLElement>, container: container as RefObject<HTMLElement>, offset });
}

const STATUS_DOT: Record<Tone, string> = {
  primary: 'bg-emerald-600',
  amber: 'bg-amber-600',
  brick: 'bg-rose-600',
  violet: 'bg-indigo-600',
  slate: 'bg-slate-500',
  neutral: 'bg-zinc-400',
};

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
    <section id={id} className="landing-section relative flex min-h-screen items-center overflow-hidden bg-ground py-24 text-ink">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 sm:px-12 lg:grid-cols-[.9fr_1.1fr] lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-xl"
        >
          <p className="mb-6 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-ink-3">{chapter} / The System</p>
          <h2 className="font-display text-5xl font-semibold leading-[.92] tracking-[-0.06em] sm:text-6xl">{title}</h2>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-ink-2">{caption}</p>
          {points && (
            <ul className="mt-7 space-y-3">
              {points.map((p) => (
                <li key={p.head} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-ink">
                    <Check size={12} strokeWidth={2.2} />
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
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative min-h-[26rem]"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

function LandScene({ chapter, statement, detail, className = '', id }: { chapter: string; statement: React.ReactNode; detail?: string; className?: string; id?: string }) {
  return (
    <section id={id} className={`landing-section relative flex min-h-[85vh] items-center overflow-hidden bg-white px-6 py-24 text-ink sm:px-12 lg:px-24 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 55 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true, amount: 0.45 }} className="mx-auto w-full max-w-6xl">
        <p className="mb-10 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-ink-3">{chapter} / The Land</p>
        <h2 className="max-w-5xl font-serif text-5xl leading-[.96] tracking-[-0.055em] sm:text-7xl lg:text-[6.2rem]">{statement}</h2>
        {detail && <p className="mt-12 max-w-md border-l border-primary/40 pl-5 font-sans text-sm leading-7 text-primary">{detail}</p>}
      </motion.div>
    </section>
  );
}

function ParcelMap() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-primary/20 bg-[#0D1A13] shadow-[0_24px_60px_-24px_rgba(13,26,19,0.55)] [background-image:linear-gradient(rgba(134,239,172,.11)_1px,transparent_1px),linear-gradient(90deg,rgba(134,239,172,.11)_1px,transparent_1px)] [background-size:52px_52px]">
      <motion.div initial={{ scale: 0.7, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2 }} viewport={{ once: true }} className="absolute inset-0">
        <div className="absolute left-[19%] top-[22%] h-48 w-72 -rotate-12 border border-[#86EFAC] bg-[#86EFAC]/10 shadow-[0_0_80px_rgba(134,239,172,.18)]" />
        <div className="absolute left-[48%] top-[48%] h-56 w-72 rotate-12 border border-[#86EFAC]/50 bg-[#86EFAC]/5" />
        <div className="absolute left-[58%] top-[14%] h-36 w-48 rotate-6 border border-[#86EFAC]/35" />
        <div className="absolute left-[37%] top-[34%] h-3 w-3 rounded-full bg-[#86EFAC] shadow-[0_0_20px_7px_rgba(134,239,172,.45)]" />
        <motion.div initial={{ y: -35, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} viewport={{ once: true }} className="absolute left-[36%] top-[25%] font-mono text-[10px] tracking-widest text-[#86EFAC]">
          TFCM91641E6C82
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ---------- info sections (content from marketing/pitch.ts) ---------- */

function InfoHeader({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return <SectionHeading kicker={kicker} title={title} sub={sub} align="center" size="lg" />;
}

function StatsStrip() {
  return (
    <section className="landing-section bg-white px-6 py-20 sm:px-12">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        {PITCH_FIGURES.map((f) => (
          <motion.div key={f.label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.7 }} className="text-center">
            <p className="font-display text-4xl font-semibold tracking-[-0.04em] text-primary sm:text-5xl">{f.value}</p>
            <p className="mt-2 text-[13px] text-ink-3">{f.label}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[#aeaeb2]">Demo cadastre · Mangalagiri · Sriperumbudur · Shamshabad · synthetic data</p>
    </section>
  );
}

function DepartmentCard({ d, index }: { d: (typeof DEPARTMENTS)[number]; index: number }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.08)] transition-all hover:border-black/15">
      <div className="flex items-center justify-between">
        <span className="inline-flex size-9 items-center justify-center rounded-lg border border-black/[0.07] bg-black/[0.02] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <d.icon size={18} strokeWidth={1.75} />
        </span>
        <span className="font-mono text-2xl font-light tracking-tight text-ink-3/30">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{d.name}</h3>
      <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{d.vocab}</p>
      <p className="mt-2.5 text-sm leading-6 text-ink-2">{d.blurb}</p>
    </div>
  );
}

function DepartmentsSection() {
  // Horizontal sticky scroll (desktop): the section pins while vertical scroll
  // drives the six department cards sideways. Small screens get a plain grid.
  const trackRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useLandingScroll(trackRef, ['start start', 'end end']);
  const x = useTransform(scrollYProgress, [0.02, 0.98], ['1%', '-62%']);

  const header = (
    <InfoHeader
      kicker="Six departments / one key"
      title="Everything government knows, in one place"
      sub="Each department keeps its own system and its own authority. Land Stack asks all six live — through one ULPIN parcel key — and shows where every answer came from."
    />
  );

  return (
    <>
      {/* Desktop: pinned horizontal strip */}
      <section ref={trackRef} id="departments" className="landing-section relative hidden h-[280vh] bg-ground lg:block">
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden py-12">
          <div className="px-12">{header}</div>
          <motion.div style={{ x }} className="mt-12 flex w-max gap-5 pl-[8vw]">
            {DEPARTMENTS.map((d, i) => (
              <div key={d.key} className="w-[340px] shrink-0">
                <DepartmentCard d={d} index={i} />
              </div>
            ))}
            <div className="flex w-[300px] shrink-0 items-center">
              <p className="text-sm leading-7 text-[#86868b]">
                …and every one of them keeps its own vocabulary.
                <span className="mt-2 block font-semibold text-ink">One ULPIN key ties them together.</span>
              </p>
            </div>
          </motion.div>
          <p className="mt-10 px-12 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-[#aeaeb2]">Keep scrolling — the cards follow</p>
        </div>
      </section>

      {/* Mobile / tablet: plain grid */}
      <section id="departments-grid" className="landing-section bg-ground px-6 py-24 sm:px-12 lg:hidden">
        {header}
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
          {DEPARTMENTS.map((d, i) => (
            <DepartmentCard key={d.key} d={d} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}

function HowItWorksSection() {
  return (
    <section id="how" className="landing-section bg-white px-6 py-28 sm:px-12">
      <InfoHeader
        kicker="How it works"
        title="One search. Six answers. Full provenance."
        sub="No department is replaced and no data is copied — the gateway assembles the record live and tells you exactly which system said what, and when."
      />
      <div className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_START.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="rounded-2xl border border-black/[0.06] bg-ground p-6"
          >
            <span className="font-mono text-2xl font-light tracking-tight text-ink-3/30">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-3 font-display text-base font-semibold text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-2">{s.detail}</p>
          </motion.div>
        ))}
      </div>

      <div className="mx-auto mt-20 max-w-6xl">
        <p className="text-center font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-ink-3">One platform / three roles</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.08)] transition-all hover:border-black/15"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-lg border border-black/[0.07] bg-black/[0.02] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <r.icon size={18} strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">{r.role}</h3>
                  <p className="font-mono text-[11px] text-ink-3">{r.who}</p>
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

function StoriesSection() {
  return (
    <section id="stories" className="landing-section bg-ground px-6 py-28 sm:px-12">
      <InfoHeader
        kicker="Eight parcels / three states"
        title="See it on real records"
        sub="The demo cadastre seeds eight named parcels across Andhra Pradesh, Tamil Nadu and Telangana — each telling one land-governance story. Click any of them to open it on the live map."
      />
      <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STORY_PARCELS.map((p, i) => (
          <motion.div key={p.ulpin} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, delay: i * 0.06 }}>
            <MapLaunch
              ulpin={p.ulpin}
              className="group flex h-full w-full flex-col rounded-2xl border border-black/[0.06] bg-white p-6 text-left shadow-[0_12px_32px_-16px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_16px_36px_-16px_rgba(0,0,0,0.12)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-semibold text-ink">Sy. {p.survey_no}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-black/[0.02] px-2.5 py-0.5 font-mono text-[11px] font-medium text-ink-2">
                  <span className={clsx('size-1.5 rounded-full', STATUS_DOT[p.tone])} />
                  {p.title}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-ink-2">{p.note}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 transition group-hover:gap-2.5 group-hover:text-ink">
                Open on the map <ArrowRight size={14} />
              </span>
            </MapLaunch>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CapabilitiesBento() {
  // The keep-list features that had no landing presence: mixed-size tiles, one
  // sentence each, two quiet micro-animations (reduced-motion aware).
  const tile = 'rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.08)] transition-all hover:border-black/15';
  return (
    <section id="capabilities" className="landing-section bg-white px-6 py-28 sm:px-12">
      <InfoHeader
        kicker="Beyond the record"
        title="Built like infrastructure, not a viewer"
        sub="The parts you only notice when you need them — analysis, controlled change, verification and privacy."
      />
      <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* AI briefs — wide tile with a living risk meter */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6 }} className={`${tile} sm:col-span-2`}>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-black/[0.07] bg-black/[0.02] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <Sparkles size={18} strokeWidth={1.75} />
            </span>
            <h3 className="font-display text-lg font-semibold text-ink">AI risk briefs</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-2">Flagged parcels are analysed automatically — a risk score, the findings behind it and recommended actions, with the engine that produced them named on the card.</p>
          <div className="mt-4 rounded-lg border border-black/[0.06] bg-black/[0.02] p-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-ink-3">
              <span>Risk analysis</span>
              <span className="font-medium text-ink-2">nvidia · nemotron</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
              <div className="bento-meter h-full rounded-full bg-ink" />
            </div>
          </div>
        </motion.div>
        {/* Satellite alerts — scanline micro-animation */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, delay: 0.06 }} className={tile}>
          <div className="relative h-20 overflow-hidden rounded-lg bg-[#0D1A13]">
            <div className="absolute inset-0 [background-image:linear-gradient(rgba(134,239,172,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(134,239,172,.12)_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="bento-scanline absolute left-0 right-0 h-px bg-[#86EFAC] shadow-[0_0_12px_2px_rgba(134,239,172,0.6)]" />
            <span className="absolute bottom-1.5 right-2 font-mono text-[9px] uppercase tracking-widest text-[#86EFAC]/80">Sentinel-2</span>
          </div>
          <h3 className="mt-4 font-display text-base font-semibold text-ink">Satellite change alerts</h3>
          <p className="mt-1.5 text-sm leading-6 text-ink-2">Unrecorded construction is flagged from orbit — and becomes a field review in one click.</p>
        </motion.div>
        {/* 3D units */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, delay: 0.12 }} className={tile}>
          <div className="flex h-20 items-end justify-center gap-1.5 rounded-lg bg-ground p-3">
            {[8, 14, 20, 11].map((h, i) => (
              <div key={i} className="w-6 rounded-t-sm bg-neutral-800" style={{ height: `${h * 3}px` }} />
            ))}
            <div className="w-6 rounded-sm border border-neutral-400 bg-neutral-300" style={{ height: '8px' }} title="basement" />
          </div>
          <h3 className="mt-4 font-display text-base font-semibold text-ink">Vertical property</h3>
          <p className="mt-1.5 text-sm leading-6 text-ink-2">Click a unit in 3D for its 3D-ULPIN, floor area and elevation band — basements included.</p>
        </motion.div>
        {/* Boundary editing */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, delay: 0.18 }} className={tile}>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-black/[0.07] bg-black/[0.02] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <PenLine size={18} strokeWidth={1.75} />
            </span>
            <h3 className="font-display text-base font-semibold text-ink">Bounded boundary edits</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-2">Officers drag a parcel's corners; validation enforces the norms (±15% area, no overlaps) and a second approval applies it. Nothing changes silently.</p>
        </motion.div>
        {/* Reports + QR */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, delay: 0.24 }} className={tile}>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-black/[0.07] bg-black/[0.02] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <QrCode size={18} strokeWidth={1.75} />
            </span>
            <h3 className="font-display text-base font-semibold text-ink">Verifiable reports</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-2">Signed Land Information Reports with a QR code anyone can scan to verify — on a phone, in seconds.</p>
        </motion.div>
        {/* Consent / masking */}
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, delay: 0.3 }} className={`${tile} sm:col-span-2`}>
          <div className="flex items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-black/[0.07] bg-black/[0.02] text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <EyeOff size={18} strokeWidth={1.75} />
            </span>
            <h3 className="font-display text-lg font-semibold text-ink">Privacy by consent</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink-2">
            Owner details are masked for everyone except the owner and consented parties — <span className="font-mono text-[13px] text-ink">R*** K***</span> until consent turns it into <span className="font-mono text-[13px] text-ink">Ravi Kumar</span>. Time-boxed grants, fully audited.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- assembled page ---------- */

export function StorySections() {
  return (
    <div className="bg-ground">
      <StatsStrip />

      <SystemScene
        id="system-map"
        chapter="01"
        title={<>Land, <span className="text-primary">located.</span></>}
        caption="A fast vector-tile map of the whole cadastre, organised in the three GIS tiers the problem statement asks for. Click any parcel and its full record opens."
        points={TIERS.map((t) => ({ head: t.name, sub: t.blurb }))}
      >
        <ParcelMap />
        <div className="absolute bottom-5 left-5 font-mono text-[10px] uppercase tracking-[.22em] text-[#86EFAC]/80">LIVE / GIS PARCEL LAYER</div>
      </SystemScene>

      <LandScene
        id="fragmentation"
        chapter="02"
        statement={<>For a farmer, a boundary is not a line. <em className="text-primary">It is a livelihood.</em></>}
        detail="The mutation that takes weeks. The record that lives in three offices. Land Stack brings the answer closer to the people waiting for it."
      />

      <DepartmentsSection />

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
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="w-full max-w-xl rounded-xl border border-[#86EFAC]/40 bg-[#0D1A13]/95 p-3 shadow-[0_24px_60px_-24px_rgba(13,26,19,0.55)] backdrop-blur-xl">
            <div className="flex items-center gap-4 border-b border-[#86EFAC]/20 px-3 py-4">
              <Search size={18} className="text-[#86EFAC]" />
              <span className="font-mono text-sm text-[#EFFFF7]">TFCM91641E6C82</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-widest text-[#86EFAC]/70">
              <span>RoR / synced</span>
              <span>Tax / clear</span>
              <span>Map / matched</span>
            </div>
          </motion.div>
        </div>
      </SystemScene>

      <HowItWorksSection />

      <CapabilitiesBento />

      <LandScene
        chapter="04"
        statement={<>For a family, a dispute is not data. <em className="text-primary">It is a question of home.</em></>}
        detail="A connected record turns a maze of departments into a clear next step."
        className="bg-ground"
      />

      <SystemScene
        id="identity"
        chapter="05"
        title={<>Different states.<br /><span className="text-primary">Common language.</span></>}
        caption="Every state keeps its own systems and vocabulary — khata in Andhra Pradesh, patta in Tamil Nadu, pattadar passbook in Telangana's Dharani. An adapter maps each into one Common Land Model, so onboarding a state is a mapping file, not a migration."
        points={[
          { head: 'Per-state adapters', sub: 'field mappings translate local vocabulary into the shared model — live for AP, TN and TG.' },
          { head: 'Event contract', sub: 'a registered deed automatically notifies the revenue mutation queue.' },
          { head: 'Open APIs', sub: 'OGC-shaped, consent-aware endpoints any state system can integrate.' },
        ]}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 font-display text-[12px] uppercase tracking-[.16em] text-ink">
          <div className="flex w-full max-w-md justify-center gap-2">
            {[
              ['Andhra Pradesh', 'khata (Meebhoomi)'],
              ['Tamil Nadu', 'patta (Chitta)'],
              ['Telangana', 'passbook (Dharani)'],
            ].map(([state, vocab], i) => (
              <motion.div
                key={state}
                initial={{ y: -40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 rounded-lg border border-[#86EFAC]/40 bg-[#0D1A13] px-2 py-3 text-center"
              >
                <span className="block text-[10.5px] text-[#EFFFF7]">{state}</span>
                <span className="mt-1 block font-mono text-[9px] normal-case tracking-normal text-[#86EFAC]">{vocab}</span>
              </motion.div>
            ))}
          </div>
          <ArrowDown size={14} className="text-primary" />
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="w-56 rounded-lg border border-[#86EFAC]/40 bg-[#0D1A13] px-5 py-3 text-center text-[#86EFAC]">Per-state adapters</motion.div>
          <ArrowDown size={14} className="text-primary" />
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.55 }} className="w-64 rounded-lg border border-primary bg-primary/10 px-5 py-4 text-center text-primary">Common Land Model</motion.div>
          <ArrowDown size={14} className="text-primary" />
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }} className="font-mono text-xs text-primary">TFCM91641E6C82</motion.div>
        </div>
      </SystemScene>

      <StoriesSection />

      <LandScene
        chapter="06"
        statement={<>One parcel.<br /><em className="text-primary">A connected India.</em></>}
        detail="Land Stack is the quiet layer underneath: making every record, boundary, and decision part of the same story."
        className="min-h-[70vh] bg-white"
      />

      <section className="flex min-h-[70vh] items-center justify-center bg-primary px-6 py-24 text-center text-white">
        <div>
          <p className="mb-6 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-white/75">The next layer</p>
          <h2 className="font-display text-5xl font-semibold tracking-[-.06em] sm:text-8xl">Explore Land Stack.</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <MapLaunch className="cta-glow inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-primary transition hover:bg-ground active:scale-95">
              Explore Platform <ArrowRight size={16} />
            </MapLaunch>
            <Link to="/welcome" className="inline-flex items-center gap-3 rounded-full border border-white/40 px-6 py-3.5 text-sm text-white transition hover:bg-white/10 active:scale-95">
              Read the full overview
            </Link>
            <Link to="/help" className="inline-flex items-center gap-3 rounded-full border border-white/40 px-6 py-3.5 text-sm text-white transition hover:bg-white/10 active:scale-95">
              Guide & FAQ
            </Link>
          </div>
        </div>
      </section>

      <GovStrip variant="landing" />
    </div>
  );
}
