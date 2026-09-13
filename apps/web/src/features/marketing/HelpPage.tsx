import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { LogoMark } from '@/app/Shell';
import { useAuth } from '@/lib/auth';
import { FAQ, GLOSSARY, QUICK_START, ROLES, STORY_PARCELS } from './pitch';

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-md border font-medium h-9 px-3.5 text-sm transition-[background,filter,border-color]';
const btnPrimary = 'bg-primary text-primary-ink border-transparent hover:brightness-110 active:brightness-95';
const btnSecondary = 'bg-panel text-ink border-line hover:bg-panel-2 hover:border-line-strong';

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-lg font-semibold">{children}</h2>;
}

export function HelpPage() {
  const { devUsers, mode } = useAuth();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoMark size={34} />
          <div>
            <h1 className="text-2xl font-semibold">Help &amp; guide</h1>
            <p className="text-sm text-ink-3">How Land Stack works, and how to drive the demo.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/welcome" className={clsx(btnBase, btnSecondary)}>
            <ArrowLeft size={15} /> Overview
          </Link>
          <Link to="/map" className={clsx(btnBase, btnPrimary)}>
            Open the app <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Quick start */}
      <section className="mt-8">
        <H2>Quick start</H2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {QUICK_START.map((s, i) => (
            <li key={s.title} className="flex gap-3 rounded-lg border border-line bg-panel p-4 shadow-panel">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="text-[14px] font-semibold">{s.title}</h3>
                <p className="mt-0.5 text-[13px] text-ink-2">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Roles */}
      <section className="mt-10">
        <H2>Roles &amp; what each can do</H2>
        <div className="overflow-x-auto scroll-thin rounded-lg border border-line">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-panel-2 text-[12px] uppercase tracking-wide text-ink-3">
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Who</th>
                <th className="px-4 py-2 font-medium">Can do</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.role} className="border-t border-line align-top">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <r.icon size={15} className="text-primary" /> {r.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-3">{r.who}</td>
                  <td className="px-4 py-3 text-ink-2">{r.can}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dev identities */}
      <section className="mt-10">
        <Card>
          <CardHeader
            title="Demo identities"
            subtitle={
              mode === 'dev'
                ? 'These appear in the role switcher — pick one to become that user instantly.'
                : 'In dev mode (AUTH_MODE=dev) these appear in the role switcher. You are currently in Firebase mode.'
            }
          />
          <CardBody className="flex flex-col gap-1.5">
            {devUsers.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2 text-sm"
              >
                <span className="font-medium">{d.label}</span>
                <span className="flex items-center gap-2 text-xs text-ink-3">
                  {d.hint} <Badge mono>{d.id}</Badge>
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      </section>

      {/* Story parcels */}
      <section className="mt-10">
        <H2>Story parcels</H2>
        <p className="mb-3 text-sm text-ink-2">Each demonstrates a different workflow. Click to open it on the map.</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {STORY_PARCELS.map((p) => (
            <Link
              key={p.ulpin}
              to="/map"
              search={{ ulpin: p.ulpin }}
              className="group flex items-start justify-between gap-3 rounded-lg border border-line bg-panel p-3 shadow-panel transition-colors hover:border-primary"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{p.survey_no}</span>
                  <Badge tone={p.tone}>{p.title}</Badge>
                </div>
                <p className="mt-1 text-[13px] text-ink-2">{p.note}</p>
              </div>
              <ArrowRight size={15} className="mt-1 shrink-0 text-ink-3 transition-colors group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {/* Glossary */}
      <section className="mt-10">
        <H2>Glossary</H2>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {GLOSSARY.map((t) => (
            <div key={t.term} className="rounded-md border border-line bg-panel p-3">
              <dt className="text-[13px] font-semibold text-ink">{t.term}</dt>
              <dd className="mt-0.5 text-[13px] text-ink-2">{t.def}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <H2>FAQ</H2>
        <div className="flex flex-col gap-2">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-lg border border-line bg-panel px-4 py-3">
              <summary className="cursor-pointer list-none text-[14px] font-medium marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <ArrowRight size={15} className="shrink-0 text-ink-3 transition-transform group-open:rotate-90" />
                </span>
              </summary>
              <p className="mt-2 text-[13px] text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mt-12 border-t border-line pt-6 text-center text-[12px] text-ink-3">
        Data is synthetic demo content over a real Mangalagiri bounding box · SIH26014.
      </footer>
    </div>
  );
}
