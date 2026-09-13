import { useEffect, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { ArrowRight, MapPin } from 'lucide-react';
import { LogoMark } from '@/app/Shell';
import { Badge } from '@/components/Badge';
import { FeatureCard, PitchStat } from './components';
import { DEPARTMENTS, FEATURES, PITCH_FIGURES, PRINCIPLES, PROFILE_TABS, ROLES, STORY_PARCELS, TIERS, WORKFLOWS } from './pitch';

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-md border font-medium h-10 px-4 text-sm transition-[background,filter,border-color]';
const btnPrimary = 'bg-primary text-primary-ink border-transparent hover:brightness-110 active:brightness-95';
const btnSecondary = 'bg-panel text-ink border-line hover:bg-panel-2 hover:border-line-strong';
const btnGhost = 'bg-transparent text-ink-2 border-transparent hover:bg-ground-2 hover:text-ink';

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">{children}</p>;
}

export function LandingPage() {
  // Mark the landing as seen so the first-visit redirect (router.tsx) doesn't loop.
  useEffect(() => {
    try {
      localStorage.setItem('ls_seen_welcome', '1');
    } catch {
      /* storage unavailable — the gate simply won't fire again */
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <section className="fade-up flex flex-col items-center text-center">
        <LogoMark size={52} />
        <div className="mt-4 flex items-center gap-2">
          <Badge tone="primary" mono>
            SIH 2026 · SIH26014
          </Badge>
          <Badge tone="neutral" icon={<MapPin />}>
            Mangalagiri AOI
          </Badge>
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          One parcel. One identity.
          <br />
          Every government record — live.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-ink-2 sm:text-lg">
          Land Stack gives every land parcel a ULPIN-style identity and stitches together what six
          departments know about it — ownership, registration, zoning, tax, disputes and utilities —
          into one record, with per-source provenance you can trust.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <Link to="/map" className={clsx(btnBase, btnPrimary)}>
            Explore the map <ArrowRight size={16} />
          </Link>
          <Link to="/login" className={clsx(btnBase, btnSecondary)}>
            Sign in
          </Link>
          <Link to="/help" className={clsx(btnBase, btnGhost)}>
            How it works
          </Link>
        </div>

        {/* At a glance */}
        <div className="mt-9 flex flex-wrap items-center justify-center divide-x divide-line rounded-lg border border-line bg-panel/70 px-2 py-2 shadow-panel backdrop-blur">
          {PITCH_FIGURES.map((f) => (
            <PitchStat key={f.label} value={f.value} label={f.label} />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-3">Figures reflect the synthetic demo dataset.</p>
      </section>

      {/* Problem → Solution */}
      <section className="mt-16 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel-2 p-5">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="text-xl font-semibold">Land records live in silos.</h2>
          <p className="mt-2 text-sm text-ink-2">
            Ownership sits with revenue, deeds with registration, zoning with planning, dues with the
            tax office, cases with the courts, connections with utilities. Each speaks its own
            vocabulary. A citizen — or an officer — has to chase all six to see the full picture, and
            no one can tell where a fact actually came from.
          </p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary-soft/50 p-5">
          <Eyebrow>The approach</Eyebrow>
          <h2 className="text-xl font-semibold">One parcel key, one live record.</h2>
          <p className="mt-2 text-sm text-ink-2">
            A gateway calls each department through an adapter, maps its fields into a Common Data
            Model, and returns the merged parcel — complete with which source answered, how fast, and
            when. Partial answers degrade gracefully instead of failing the whole view.
          </p>
        </div>
      </section>

      {/* How a click becomes a record */}
      <section className="mt-16 rounded-xl border border-line bg-panel p-6 shadow-panel sm:p-8">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="text-2xl font-semibold">How a click becomes a record</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-5">
          {[
            { head: 'You click a parcel', sub: 'on the map, or search a survey no / ULPIN / khata.' },
            { head: 'The gateway fans out', sub: 'asking all six departments in parallel, each with a timeout.' },
            { head: 'Adapters translate', sub: 'each department’s vocabulary into the Common Data Model.' },
            { head: 'Provenance attaches', sub: 'every block records its source, timestamp and health.' },
            { head: 'You read one record', sub: 'in about a fifth of a second — masked by your role.' },
          ].map((s, i, arr) => (
            <li key={s.head} className="relative">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-semibold text-primary-ink">{i + 1}</span>
                {i < arr.length - 1 && <span aria-hidden className="hidden h-px flex-1 bg-line md:block" />}
              </div>
              <h3 className="mt-3 text-[14px] font-semibold">{s.head}</h3>
              <p className="mt-1 text-[13px] text-ink-2">{s.sub}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Departments */}
      <section className="mt-16">
        <Eyebrow>Six systems, one interface</Eyebrow>
        <h2 className="text-2xl font-semibold">The departments Land Stack unifies</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          Each keeps its own data in its own words. The open interoperability layer is what turns them
          into a single answer.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((d) => (
            <FeatureCard key={d.key} icon={d.icon} title={d.name} tone={d.tone}>
              <span className="font-medium text-ink">{d.vocab}.</span> {d.blurb}
            </FeatureCard>
          ))}
        </div>
      </section>

      {/* Three tiers */}
      <section className="mt-16">
        <Eyebrow>GIS, in three tiers</Eyebrow>
        <h2 className="text-2xl font-semibold">Layers named the way the mandate names them</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.n} className="rounded-lg border border-line bg-panel p-5 shadow-panel">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary-soft font-mono text-sm font-semibold text-primary">
                  {t.n}
                </span>
                <h3 className="text-[15px] font-semibold">{t.name}</h3>
              </div>
              <p className="mt-2 text-[13px] text-ink-3">{t.blurb}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {t.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-[13px] text-ink-2">
                    <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="mt-16">
        <Eyebrow>What you can do</Eyebrow>
        <h2 className="text-2xl font-semibold">From a map click to a decision</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} tone={f.tone}>
              {f.blurb}
            </FeatureCard>
          ))}
        </div>
      </section>

      {/* Reading a parcel profile */}
      <section className="mt-16">
        <Eyebrow>Reading a parcel profile</Eyebrow>
        <h2 className="text-2xl font-semibold">Nine tabs, one parcel</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          Open any parcel and its profile is organised into tabs — each one answered by a different
          system, and each one saying so.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROFILE_TABS.map((t) => (
            <div key={t.tab} className="rounded-lg border border-line bg-panel p-4 shadow-panel">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[14px] font-semibold">{t.tab}</h3>
              </div>
              <p className="mt-1.5 text-[13px] text-ink-2">{t.what}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-primary">{t.source}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflows */}
      <section className="mt-16">
        <Eyebrow>Interoperable by design</Eyebrow>
        <h2 className="text-2xl font-semibold">Workflows that cross department walls</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          The point of one key is that changes flow. These three run end to end in the demo.
        </p>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {WORKFLOWS.map((w) => (
            <div key={w.title} className="rounded-lg border border-line bg-panel p-5 shadow-panel">
              <h3 className="text-[15px] font-semibold">{w.title}</h3>
              <p className="mt-1 text-[13px] text-ink-3">{w.tagline}</p>
              <ol className="mt-3 flex flex-col gap-2">
                {w.steps.map((s, i) => (
                  <li key={s} className="flex items-start gap-2.5 text-[13px] text-ink-2">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-[11px] font-semibold text-primary">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="mt-16">
        <Eyebrow>Built for three audiences</Eyebrow>
        <h2 className="text-2xl font-semibold">Who it’s for</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.role} className="rounded-lg border border-line bg-panel p-5 shadow-panel">
              <div className="flex items-center gap-2">
                <r.icon size={18} className="text-primary" strokeWidth={1.9} />
                <h3 className="text-[15px] font-semibold">{r.role}</h3>
              </div>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-3">{r.who}</p>
              <p className="mt-2 text-[13px] text-ink-2">{r.can}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiator */}
      <section className="mt-16 rounded-xl border border-slate/30 bg-slate-soft/40 p-6 sm:p-8">
        <Eyebrow>The differentiator</Eyebrow>
        <h2 className="max-w-3xl text-2xl font-semibold">An open interoperability layer, not another silo</h2>
        <p className="mt-2 max-w-3xl text-sm text-ink-2">
          The hard part isn’t the map — it’s making independent systems agree. Land Stack ships an
          adapter model with per-state field mappings, an event contract so an upstream deed can flow
          into a mutation, consent-aware access for citizen data, and OGC-shaped APIs so anyone can
          build on top. That is the part a single-state pilot leaves out.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Per-state adapters', 'Event contract', 'Consent-aware access', 'OGC API Features', 'Audit trail'].map((t) => (
            <Badge key={t} tone="slate">
              {t}
            </Badge>
          ))}
        </div>
      </section>

      {/* Story parcels */}
      <section className="mt-16">
        <Eyebrow>See it on real scenarios</Eyebrow>
        <h2 className="text-2xl font-semibold">Story parcels</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          Six hand-tuned parcels demonstrate the workflows end to end. Jump straight to one.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STORY_PARCELS.map((p) => (
            <Link
              key={p.ulpin}
              to="/map"
              search={{ ulpin: p.ulpin }}
              className="group flex flex-col gap-1 rounded-lg border border-line bg-panel p-4 shadow-panel transition-colors hover:border-primary"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold">{p.survey_no}</span>
                <Badge tone={p.tone}>{p.title}</Badge>
              </div>
              <p className="text-[13px] text-ink-2">{p.note}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open on map <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section className="mt-16 rounded-xl border border-primary/25 bg-primary-soft/40 p-6 sm:p-8">
        <Eyebrow>Why you can trust it</Eyebrow>
        <h2 className="text-2xl font-semibold">Five rules the platform never breaks</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PRINCIPLES.map((p, i) => (
            <div key={p.title}>
              <p className="font-mono text-[12px] font-semibold text-primary">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-1 text-[14px] font-semibold">{p.title}</h3>
              <p className="mt-1 text-[13px] text-ink-2">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA + footer */}
      <section className="mt-16 flex flex-col items-center gap-4 rounded-xl border border-line bg-panel p-8 text-center shadow-panel">
        <h2 className="text-2xl font-semibold">Ready to look inside a parcel?</h2>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link to="/map" className={clsx(btnBase, btnPrimary)}>
            Explore the map <ArrowRight size={16} />
          </Link>
          <Link to="/help" className={clsx(btnBase, btnSecondary)}>
            Read the guide
          </Link>
        </div>
      </section>

      <footer className="mt-10 border-t border-line pt-6 text-center text-[12px] text-ink-3">
        <p>
          Land Stack · Smart India Hackathon 2026 · Problem SIH26014 (Ministry of Rural Development /
          Department of Land Resources).
        </p>
        <p className="mt-1">
          Demo area: peri-urban Mangalagiri, Guntur district, Andhra Pradesh — a real bounding box with
          a <span className="font-medium text-ink-2">synthetic cadastre</span>. Not a source of genuine
          land records.
        </p>
      </footer>
    </div>
  );
}
