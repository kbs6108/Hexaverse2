import { Link } from '@tanstack/react-router';
import { ArrowDown, ArrowRight, Search } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/** Scroll-story chapters (light version). Dark mint-grid visuals are kept as
 *  contained "screen" panels — they read as live displays on the light page. */

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
  const titleY = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [80, 0, -80]);
  const titleOpacity = useTransform(scrollYProgress, [0.12, 0.3, 0.78, 0.93], [0, 1, 1, 0]);
  return (
    <section ref={ref} id={id} className="relative min-h-[145vh] overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="sticky top-0 flex min-h-screen items-center px-6 py-24 sm:px-12 lg:px-20">
        <div className="mx-auto grid w-full max-w-[1500px] items-center gap-10 lg:grid-cols-[.78fr_1.22fr]">
          <motion.div style={{ y: titleY, opacity: titleOpacity }} className="relative z-10 max-w-xl">
            <p className="mb-7 font-display text-[11px] uppercase tracking-[0.3em] text-[#23613C]">{chapter} / The System</p>
            <h2 className="font-display text-6xl font-semibold leading-[.9] tracking-[-0.065em] sm:text-8xl">{title}</h2>
          </motion.div>
          <div className="relative min-h-[28rem]">{children}</div>
        </div>
      </div>
    </section>
  );
}

function LandScene({ chapter, statement, detail, className = '', id }: { chapter: string; statement: React.ReactNode; detail?: string; className?: string; id?: string }) {
  return (
    <section id={id} className={`relative flex min-h-screen items-center overflow-hidden bg-white px-6 py-28 text-[#1d1d1f] sm:px-12 lg:px-24 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 55 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: true, amount: 0.45 }} className="mx-auto w-full max-w-6xl">
        <p className="mb-10 font-display text-[11px] uppercase tracking-[0.3em] text-[#7a7a7a]">{chapter} / The Land</p>
        <h2 className="max-w-5xl font-serif text-5xl leading-[.96] tracking-[-0.055em] sm:text-7xl lg:text-[7rem]">{statement}</h2>
        {detail && <p className="mt-12 max-w-md border-l border-[#23613C]/40 pl-5 font-sans text-sm leading-7 text-[#23613C]">{detail}</p>}
      </motion.div>
    </section>
  );
}

function ParcelMap() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl border border-[#23613C]/20 bg-[#0D1A13] shadow-[0_24px_60px_-24px_rgba(13,26,19,0.55)] [background-image:linear-gradient(rgba(134,239,172,.11)_1px,transparent_1px),linear-gradient(90deg,rgba(134,239,172,.11)_1px,transparent_1px)] [background-size:52px_52px]">
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

export function StorySections() {
  const apiRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: apiProgress } = useScroll({ target: apiRef, offset: ['start end', 'end start'] });
  const apiX = useTransform(apiProgress, [0.1, 0.65], [-100, 0]);
  return (
    <div className="bg-[#f5f5f7]">
      <SystemScene id="system-map" chapter="01" title={<>Land, <span className="text-[#23613C]">located.</span></>}>
        <ParcelMap />
        <div className="absolute bottom-5 left-5 font-mono text-[10px] uppercase tracking-[.22em] text-[#86EFAC]/80">LIVE / GIS PARCEL LAYER</div>
      </SystemScene>
      <LandScene
        id="fragmentation"
        chapter="02"
        statement={<>For a farmer, a boundary is not a line. <em className="text-[#0066cc]">It is a livelihood.</em></>}
        detail="The mutation that takes weeks. The record that lives in three offices. Land Stack brings the answer closer to the people waiting for it."
      />
      <SystemScene chapter="03" title={<>Every record.<br /><span className="text-[#23613C]">One search.</span></>}>
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
      <LandScene
        chapter="04"
        statement={<>For a family, a dispute is not data. <em className="text-[#0066cc]">It is a question of home.</em></>}
        detail="A connected record turns a maze of departments into a clear next step."
        className="bg-[#f5f5f7]"
      />
      <SystemScene chapter="05" title={<>Different states.<br /><span className="text-[#23613C]">Common language.</span></>}>
        <div ref={apiRef} className="absolute inset-0 flex flex-col items-center justify-center gap-3 font-display text-sm uppercase tracking-[.18em] text-[#1d1d1f]">
          <motion.div style={{ x: apiX }} className="w-56 rounded-lg border border-[#86EFAC]/40 bg-[#0D1A13] px-5 py-4 text-center text-[#EFFFF7]">Andhra Pradesh</motion.div>
          <motion.div className="h-8 w-px bg-[#23613C]" />
          <motion.div className="w-56 rounded-lg border border-[#86EFAC]/40 bg-[#0D1A13] px-5 py-4 text-center text-[#86EFAC]">State Adapter</motion.div>
          <ArrowDown size={14} className="text-[#23613C]" />
          <motion.div className="w-64 rounded-lg border border-[#23613C] bg-[#23613C]/10 px-5 py-4 text-center text-[#23613C]">Common Land Model</motion.div>
          <ArrowDown size={14} className="text-[#23613C]" />
          <motion.div className="font-mono text-xs text-[#23613C]">ULPIN</motion.div>
        </div>
      </SystemScene>
      <LandScene
        id="identity"
        chapter="06"
        statement={<>One parcel.<br /><em className="text-[#0066cc]">A connected India.</em></>}
        detail="Land Stack is the quiet layer underneath: making every record, boundary, and decision part of the same story."
        className="min-h-[90vh] bg-[#f5f5f7]"
      />
      <section className="flex min-h-[70vh] items-center justify-center bg-[#0066cc] px-6 py-24 text-center text-white">
        <div>
          <p className="mb-6 font-display text-[11px] uppercase tracking-[0.3em] text-white/75">The next layer</p>
          <h2 className="font-display text-5xl font-semibold tracking-[-.06em] sm:text-8xl">Explore Land Stack.</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/map" className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm text-[#0066cc] transition hover:bg-[#f5f5f7] active:scale-95">
              Explore Platform <ArrowRight size={16} />
            </Link>
            <Link to="/welcome" className="inline-flex items-center gap-3 rounded-full border border-white/40 px-6 py-3 text-sm text-white transition hover:bg-white/10 active:scale-95">
              Read the full overview
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
