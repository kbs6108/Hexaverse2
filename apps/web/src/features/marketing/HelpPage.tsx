import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Bot, Home, Sparkles, Users } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { useAuth } from '@/lib/auth';
import { GovStrip } from './GovStrip';
import { FAQ, GLOSSARY, MAP_READING, PROFILE_TABS, QUICK_START, ROLES, STORY_PARCELS, WORKFLOWS } from './pitch';

function H2({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div className="mb-4">
      {kicker && <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{kicker}</p>}
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{children}</h2>
    </div>
  );
}

/** On-page tracker */
const SECTIONS: { id: string; label: string }[] = [
  { id: 'quickstart', label: 'Quick start' },
  { id: 'roles', label: 'Roles' },
  { id: 'reading-map', label: 'Reading the map' },
  { id: 'profile-tabs', label: 'Profile tabs' },
  { id: 'walkthroughs', label: 'Walkthroughs' },
  { id: 'identities', label: 'Identities' },
  { id: 'story-parcels', label: 'Story parcels' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'faq', label: 'FAQ' },
];

function OnThisPage() {
  return (
    <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="rounded-full border border-line bg-panel px-3.5 py-1.5 text-xs font-semibold text-ink-2 transition-all hover:border-line-strong hover:bg-ground-2 hover:text-ink shadow-xs"
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}

export function HelpPage() {
  const { devUsers, mode } = useAuth();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Guide &amp; Walkthrough</h1>
          <p className="mt-1 text-base text-ink-2">How Land Stack works, and how to drive the interactive demo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-4 py-2 text-xs font-semibold text-ink-2 shadow-xs transition hover:bg-ground-2 hover:text-ink"
          >
            <Home size={14} /> Home
          </Link>
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-95"
          >
            Open live map <ArrowRight size={14} />
          </Link>
          <Link
            to="/citizen"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-4 py-2 text-xs font-semibold text-ink-2 shadow-xs transition hover:bg-ground-2 hover:text-ink"
          >
            <Users size={14} /> Citizen Portal
          </Link>
        </div>
      </header>

      {/* Interactive AI Assistant Guide Callout */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary-soft/50 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-xs shrink-0">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-ink">Have a specific question or land problem?</h3>
            <p className="text-xs text-ink-2">Bhu-Sahayak AI can diagnose your situation and guide you directly to the solution in Land Stack.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-assistant', { detail: { prompt: 'How does Land Stack help me resolve a land problem?' } }))}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:brightness-105 active:scale-95"
        >
          <Sparkles size={13} /> Ask Bhu-Sahayak
        </button>
      </div>

      <OnThisPage />

      {/* Quick start */}
      <section id="quickstart" className="mt-12 scroll-mt-20">
        <H2 kicker="Orientation">Quick start in 5 steps</H2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_START.map((s, i) => (
            <div key={s.title} className="flex flex-col rounded-2xl border border-line bg-panel p-5 shadow-panel">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft font-mono text-sm font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-base font-bold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink-2">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="mt-14 scroll-mt-20">
        <H2 kicker="Access Matrix">Roles &amp; what each can do</H2>
        <div className="grid gap-4 sm:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.role} className="flex flex-col rounded-2xl border border-line bg-panel p-6 shadow-panel">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <r.icon size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">{r.role}</h3>
                  <p className="text-xs text-ink-3">{r.who}</p>
                </div>
              </div>
              <p className="mt-4 flex-1 text-sm leading-6 text-ink-2">{r.can}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reading the map */}
      <section id="reading-map" className="mt-14 scroll-mt-20">
        <H2 kicker="Visual Cues">Reading the map</H2>
        <p className="mb-4 text-sm text-ink-2">Every visual cue on the map means something specific — and none of them relies on colour alone.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MAP_READING.map((m) => (
            <div key={m.cue} className="flex flex-col rounded-2xl border border-line bg-panel p-5 shadow-panel">
              <p className="font-display text-sm font-bold text-ink">{m.cue}</p>
              <p className="mt-1 text-sm leading-6 text-ink-2">{m.meaning}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Parcel profile tabs */}
      <section id="profile-tabs" className="mt-14 scroll-mt-20">
        <H2 kicker="Aggregated Profile">The parcel profile, tab by tab</H2>
        <p className="mb-4 text-sm text-ink-2">
          Click any parcel on the map to open its profile. Each tab is answered live by a different department system with verifiable provenance.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROFILE_TABS.map((t) => (
            <div key={t.tab} className="flex flex-col rounded-2xl border border-line bg-panel p-5 shadow-panel">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">{t.source}</span>
              <h3 className="mt-2 font-display text-base font-bold text-ink">{t.tab}</h3>
              <p className="mt-1 text-sm leading-6 text-ink-2">{t.what}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflows walkthrough */}
      <section id="walkthroughs" className="mt-14 scroll-mt-20">
        <H2 kicker="End-to-end Demonstration">Walkthroughs: three cross-department workflows</H2>
        <p className="mb-4 text-sm text-ink-2">These run end to end in the demo — follow the steps exactly and you’ll see each one happen live.</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {WORKFLOWS.map((w) => (
            <div key={w.title} className="flex flex-col rounded-2xl border border-line bg-panel p-6 shadow-panel">
              <h3 className="font-display text-base font-bold text-ink">{w.title}</h3>
              <p className="mt-1 text-xs text-ink-3">{w.tagline}</p>
              <ol className="mt-4 flex flex-col gap-2.5">
                {w.steps.map((s, i) => (
                  <li key={s} className="flex items-start gap-2.5 text-sm leading-6 text-ink-2">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-[11px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Dev identities */}
      <section id="identities" className="mt-14 scroll-mt-20">
        <Card className="rounded-2xl border border-line shadow-panel">
          <CardHeader
            title="Demo identities"
            subtitle={
              mode === 'dev'
                ? 'These appear in the role switcher — pick one to become that user instantly.'
                : 'In dev mode (AUTH_MODE=dev) these appear in the role switcher. You are currently in Firebase mode.'
            }
          />
          <CardBody className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {devUsers.map((d) => (
              <div
                key={d.id}
                className="flex flex-col justify-between gap-1.5 rounded-xl border border-line bg-panel-2 p-3 text-sm shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-ink truncate">{d.label}</span>
                  {'state' in d && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ground-2 text-ink-3">
                      {d.state}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-ink-3">
                  <span className="truncate">{d.hint}</span>
                  <Badge mono tone="primary">{d.role}</Badge>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </section>

      {/* Story parcels */}
      <section id="story-parcels" className="mt-14 scroll-mt-20">
        <div className="flex items-baseline justify-between">
          <H2 kicker="Pre-seeded Scenarios">Story parcels</H2>
          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-ink-3">
            Scroll horizontally <ArrowRight size={12} />
          </span>
        </div>
        <p className="mb-4 text-sm text-ink-2">Each demonstrates a different workflow. Scroll horizontally across all 8 parcels, or click to open on the live map.</p>
        <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6">
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scroll-thin snap-x snap-mandatory">
            {STORY_PARCELS.map((p) => (
              <Link
                key={p.ulpin}
                to="/map"
                search={{ ulpin: p.ulpin }}
                className="group w-72 shrink-0 snap-start flex flex-col justify-between rounded-2xl border border-line bg-panel p-5 shadow-panel transition hover:-translate-y-1 hover:border-line-strong hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-ink">Sy. {p.survey_no}</span>
                    <Badge tone={p.tone}>{p.title}</Badge>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-ink-2">{p.note}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                  <span className="font-mono text-[10px] text-primary">{p.ulpin}</span>
                  <ArrowRight size={14} className="text-ink-3 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Glossary */}
      <section id="glossary" className="mt-14 scroll-mt-20">
        <H2 kicker="Vocabulary">Glossary</H2>
        <dl className="grid gap-3 sm:grid-cols-2">
          {GLOSSARY.map((t) => (
            <div key={t.term} className="rounded-2xl border border-line bg-panel p-4 shadow-panel">
              <dt className="font-display text-sm font-bold text-ink">{t.term}</dt>
              <dd className="mt-1 text-sm leading-6 text-ink-2">{t.def}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* FAQ */}
      <section id="faq" className="mt-14 scroll-mt-20">
        <H2 kicker="Common Questions">FAQ</H2>
        <div className="flex flex-col gap-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-line bg-panel px-5 py-4 shadow-panel">
              <summary className="cursor-pointer list-none text-base font-bold text-ink marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <ArrowRight size={16} className="shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-ink-2 border-t border-line pt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-14">
        <GovStrip />
      </div>
    </div>
  );
}
