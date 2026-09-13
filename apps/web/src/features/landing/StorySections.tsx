import { Link } from '@tanstack/react-router';
import { ArrowDown, ArrowRight, Search } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { DEPARTMENTS, PITCH_FIGURES, QUICK_START, ROLES, STORY_PARCELS } from '@/features/marketing/pitch';
import type { Tone } from '@/components/Badge';
import { MapLaunch } from './MapLaunch';

/** Scroll-story landing (light, emerald). Cinematic scenes alternate with
 *  concrete info sections whose content is imported from marketing/pitch.ts —
 *  the same source of truth as /welcome, so the two never drift. */

const TONE_TEXT: Record<Tone, string> = {
  primary: 'text-primary',
  amber: 'text-amber',
  brick: 'text-brick',
  violet: 'text-violet',
  slate: 'text-slate',
  neutral: 'text-ink-3',
};
const TONE_SOFT: Record<Tone, string> = {
  primary: 'bg-primary-soft',
  amber: 'bg-amber-soft',
  brick: 'bg-brick-soft',
  violet: 'bg-violet-soft',
  slate: 'bg-slate-soft',
  neutral: 'bg-ground-2',
};

/* ---------- cinematic scenes ---------- */

function SystemScene({
  chapter,
  title,
  children,
  id,
}: {
  chapter: string;
  title: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [60, 0, -60]);
  const titleOpacity = useTransform(scrollYProgress, [0.06, 0.22, 0.85, 0.98], [0, 1, 1, 0]);
  return (
    <section ref={ref} id={id} className="landing-section relative min-h-[115vh] overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="sticky top-0 flex min-h-screen items-center px-6 py-20 sm:px-12 lg:px-20">
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-10 lg:grid-cols-[.78fr_1.22fr]">
          <motion.div style={{ y: titleY, opacity: titleOpacity }} className="relative z-10 max-w-xl">
            <p className="mb-7 font-display text-[11px] uppercase tracking-[0.3em] text-[#0e6b54]">{chapter} / The System</p>
            <h2 className="font-display text-5xl font-semibold leading-[.92] tracking-[-0.06em] sm:text-7xl">{title}</h2>
          </motion.div>
          <div className="relative min-h-[26rem]">{children}</div>
        </div>
      </div>
    </section>
  );
}

function LandScene({ chapter, statement, detail, className = '', id }: { chapter: string; statement: React.ReactNode; detail?: string; className?: string; id?: string }) {
  return (
    <section id={id} className={`landing-section relative flex min-h-[85vh] items-center overflow-hidden bg-white px-6 py-24 text-[#1d1d1f] sm:px-12 lg:px-24 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 55 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true, amount: 0.45 }} className="mx-auto w-full max-w-6xl">
        <p className="mb-10 font-display text-[11px] uppercase tracking-[0.3em] text-[#7a7a7a]">{chapter} / The Land</p>
        <h2 className="max-w-5xl font-serif text-5xl leading-[.96] tracking-[-0.055em] sm:text-7xl lg:text-[6.2rem]">{statement}</h2>
        {detail && <p className="mt-12 max-w-md border-l border-[#0e6b54]/40 pl-5 font-sans text-sm leading-7 text-[#0e6b54]">{detail}</p>}
      </motion.div>
    </section>
  );
}

function ParcelMap() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-[#0e6b54]/20 bg-[#0D1A13] shadow-[0_24px_60px_-24px_rgba(13,26,19,0.55)] [background-image:linear-gradient(rgba(134,239,172,.11)_1px,transparent_1px),linear-gradient(90deg,rgba(134,239,172,.11)_1px,transparent_1px)] [background-size:52px_52px]">
      <motion.div initial={{ scale: 0.7, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2 }} viewport={{ once: true }} className="absolute inset-0">
        <div className="absolute left-[19%] top-[22%] h-48 w-72 -rotate-12 border border-[#86EFAC] bg-[#86EFAC]/10 shadow-[0_0_80px_rgba(134,239,172,.18)]" />
        <div className="absolute left-[48%] top-[48%] h-56 w-72 rotate-12 border border-[#86EFAC]/50 bg-[#86EFAC]/5" />
        <div className="absolute left-[58%] top-[14%] h-36 w-48 rotate-6 border border-[#86EFAC]/35" />
        <div className="absolute left-[37%] top-[34%] h-3 w-3 rounded-full bg-[#86EFAC] shadow-[0_0_20px_7px_rgba(134,239,172,.45)]" />
        <motion.div initial={{ y: -35, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} viewport={{ once: true }} className="absolute left-[36%] top-[25%] font-mono text-[10px] tracking-widest text-[#86EFAC]">
          ULPIN-1403-PB-889
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ---------- info sections (content from marketing/pitch.ts) ---------- */

function InfoHeader({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-display text-[11px] uppercase tracking-[0.3em] text-[#0e6b54]">{kicker}</p>
      <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-[#1d1d1f] sm:text-5xl">{title}</h2>
      {sub && <p className="mt-5 text-base leading-7 text-[#515154]">{sub}</p>}
    </div>
  );
}

function StatsStrip() {
  return (
    <section className="landing-section bg-white px-6 py-20 sm:px-12">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        {PITCH_FIGURES.map((f) => (
          <motion.div key={f.label} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.7 }} className="text-center">
            <p className="font-display text-4xl font-semibold tracking-[-0.04em] text-[#0e6b54] sm:text-5xl">{f.value}</p>
            <p className="mt-2 text-[13px] text-[#6e6e73]">{f.label}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[#aeaeb2]">Demo cadastre · Mangalagiri AOI · synthetic data</p>
    </section>
  );
}

function DepartmentsSection() {
  return (
    <section id="departments" className="landing-section bg-[#f5f5f7] px-6 py-28 sm:px-12">
      <InfoHeader
        kicker="Six departments / one key"
        title="Everything government knows, in one place"
        sub="Each department keeps its own system and its own authority. Land Stack asks all six live — through one ULPIN parcel key — and shows where every answer came from."
      />
      <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((d, i) => (
          <motion.div
            key={d.key}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: i * 0.06 }}
            className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.12)]"
          >
            <span className={`inline-flex size-10 items-center justify-center rounded-xl ${TONE_SOFT[d.tone]}`}>
              <d.icon size={20} className={TONE_TEXT[d.tone]} />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-[#1d1d1f]">{d.name}</h3>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#0e6b54]">{d.vocab}</p>
            <p className="mt-2 text-sm leading-6 text-[#515154]">{d.blurb}</p>
          </motion.div>
        ))}
      </div>
    </section>
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
            className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] p-6"
          >
            <span className="font-display text-3xl font-semibold text-[#0e6b54]/30">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-3 font-display text-base font-semibold text-[#1d1d1f]">{s.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#515154]">{s.detail}</p>
          </motion.div>
        ))}
      </div>

      <div className="mx-auto mt-20 max-w-6xl">
        <p className="text-center font-display text-[11px] uppercase tracking-[0.3em] text-[#0e6b54]">One platform / three roles</p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.role}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.12)]"
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex size-10 items-center justify-center rounded-xl ${TONE_SOFT[r.tone]}`}>
                  <r.icon size={20} className={TONE_TEXT[r.tone]} />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-[#1d1d1f]">{r.role}</h3>
                  <p className="text-[12px] text-[#86868b]">{r.who}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#515154]">{r.can}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StoriesSection() {
  return (
    <section id="stories" className="landing-section bg-[#f5f5f7] px-6 py-28 sm:px-12">
      <InfoHeader
        kicker="Six parcels / six stories"
        title="See it on real records"
        sub="The demo cadastre seeds six named parcels, each telling one land-governance story. Click any of them to open it on the live map."
      />
      <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STORY_PARCELS.map((p, i) => (
          <motion.div key={p.ulpin} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.6, delay: i * 0.06 }}>
            <MapLaunch
              ulpin={p.ulpin}
              className="group flex h-full w-full flex-col rounded-2xl border border-black/[0.06] bg-white p-6 text-left shadow-[0_12px_32px_-16px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:border-[#0e6b54]/40 hover:shadow-[0_18px_44px_-18px_rgba(14,107,84,0.35)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-semibold text-[#1d1d1f]">Sy. {p.survey_no}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${TONE_SOFT[p.tone]} ${TONE_TEXT[p.tone]}`}>{p.title}</span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#515154]">{p.note}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0e6b54] transition group-hover:gap-2.5">
                Open on the map <ArrowRight size={14} />
              </span>
            </MapLaunch>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- assembled page ---------- */

export function StorySections() {
  const apiRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: apiProgress } = useScroll({ target: apiRef, offset: ['start end', 'end start'] });
  const apiX = useTransform(apiProgress, [0.1, 0.65], [-100, 0]);
  return (
    <div className="bg-[#f5f5f7]">
      <StatsStrip />

      <SystemScene id="system-map" chapter="01" title={<>Land, <span className="text-[#0e6b54]">located.</span></>}>
        <ParcelMap />
        <div className="absolute bottom-5 left-5 font-mono text-[10px] uppercase tracking-[.22em] text-[#86EFAC]/80">LIVE / GIS PARCEL LAYER</div>
      </SystemScene>

      <LandScene
        id="fragmentation"
        chapter="02"
        statement={<>For a farmer, a boundary is not a line. <em className="text-[#0e6b54]">It is a livelihood.</em></>}
        detail="The mutation that takes weeks. The record that lives in three offices. Land Stack brings the answer closer to the people waiting for it."
      />

      <DepartmentsSection />

      <SystemScene chapter="03" title={<>Every record.<br /><span className="text-[#0e6b54]">One search.</span></>}>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="w-full max-w-xl rounded-xl border border-[#86EFAC]/40 bg-[#0D1A13]/95 p-3 shadow-[0_24px_60px_-24px_rgba(13,26,19,0.55)] backdrop-blur-xl">
            <div className="flex items-center gap-4 border-b border-[#86EFAC]/20 px-3 py-4">
              <Search size={18} className="text-[#86EFAC]" />
              <span className="font-mono text-sm text-[#EFFFF7]">ULPIN-1403-PB-889</span>
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

      <LandScene
        chapter="04"
        statement={<>For a family, a dispute is not data. <em className="text-[#0e6b54]">It is a question of home.</em></>}
        detail="A connected record turns a maze of departments into a clear next step."
        className="bg-[#f5f5f7]"
      />

      <SystemScene id="identity" chapter="05" title={<>Different states.<br /><span className="text-[#0e6b54]">Common language.</span></>}>
        <div ref={apiRef} className="absolute inset-0 flex flex-col items-center justify-center gap-3 font-display text-sm uppercase tracking-[.18em] text-[#1d1d1f]">
          <motion.div style={{ x: apiX }} className="w-56 rounded-lg border border-[#86EFAC]/40 bg-[#0D1A13] px-5 py-4 text-center text-[#EFFFF7]">Andhra Pradesh</motion.div>
          <motion.div className="h-8 w-px bg-[#0e6b54]" />
          <motion.div className="w-56 rounded-lg border border-[#86EFAC]/40 bg-[#0D1A13] px-5 py-4 text-center text-[#86EFAC]">State Adapter</motion.div>
          <ArrowDown size={14} className="text-[#0e6b54]" />
          <motion.div className="w-64 rounded-lg border border-[#0e6b54] bg-[#0e6b54]/10 px-5 py-4 text-center text-[#0e6b54]">Common Land Model</motion.div>
          <ArrowDown size={14} className="text-[#0e6b54]" />
          <motion.div className="font-mono text-xs text-[#0e6b54]">ULPIN</motion.div>
        </div>
      </SystemScene>

      <StoriesSection />

      <LandScene
        chapter="06"
        statement={<>One parcel.<br /><em className="text-[#0e6b54]">A connected India.</em></>}
        detail="Land Stack is the quiet layer underneath: making every record, boundary, and decision part of the same story."
        className="min-h-[70vh] bg-white"
      />

      <section className="flex min-h-[70vh] items-center justify-center bg-[#0e6b54] px-6 py-24 text-center text-white">
        <div>
          <p className="mb-6 font-display text-[11px] uppercase tracking-[0.3em] text-white/75">The next layer</p>
          <h2 className="font-display text-5xl font-semibold tracking-[-.06em] sm:text-8xl">Explore Land Stack.</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <MapLaunch className="cta-glow inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0e6b54] transition hover:bg-[#f5f5f7] active:scale-95">
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
    </div>
  );
}
