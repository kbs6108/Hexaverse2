import { useState, useMemo, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { 
  ArrowRight, 
  Compass, 
  Home, 
  Landmark, 
  Users, 
  Search, 
  CheckCircle2, 
  ChevronDown
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { GovStrip } from './GovStrip';
import { StatutoryHierarchySimulator } from './StatutoryHierarchySimulator';
import { Cadastral3DStrataExplorer } from './Cadastral3DStrataExplorer';
import { DepartmentProvenanceExplorer } from './DepartmentProvenanceExplorer';
import { ParcelDecoderWidget } from './ParcelDecoderWidget';
import {
  getFaq,
  getGlossary,
  getMapReading,
  getProfileTabs,
  getQuickStart,
  getRoles,
  getStoryParcels,
  getWorkflows,
  type Workflow,
} from './pitch';

function H2({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div className="mb-3">
      {kicker && <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{kicker}</p>}
      <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-ink">{children}</h2>
    </div>
  );
}

function OnThisPage({ sections }: { sections: { id: string; label: string }[] }) {
  return (
    <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-1.5 border-y border-line py-3">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="rounded-full border border-line bg-panel px-3 py-1 text-[11px] font-semibold text-ink-2 transition-all hover:border-line-strong hover:bg-ground-2 hover:text-ink shadow-xs"
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}

export function HelpPage() {
  const { devUsers, mode, setDevUser, user } = useAuth();
  const { t, locale } = useTranslation();

  const quickStart = getQuickStart(locale);
  const roles = getRoles(locale);
  const mapReading = getMapReading(locale);
  const profileTabs = getProfileTabs(locale);
  const workflows = getWorkflows(locale);
  const storyParcels = getStoryParcels(locale);
  const glossary = getGlossary(locale);
  const faq = getFaq(locale);

  // Interactive local states
  const [selectedWorkflowIndex, setSelectedWorkflowIndex] = useState<number>(1);
  const [parcelStateFilter, setParcelStateFilter] = useState<'all' | 'AP' | 'TN' | 'TG'>('all');
  const [glossaryQuery, setGlossaryQuery] = useState<string>('');
  const [faqQuery, setFaqQuery] = useState<string>('');

  const sections: { id: string; label: string }[] = [
    { id: 'quickstart', label: t('guide.sec.quickstart') },
    { id: 'roles', label: t('guide.sec.roles') },
    { id: 'reading-map', label: t('guide.sec.readingMap') },
    { id: 'strata-3d', label: '3D Cadastre' },
    { id: 'profile-tabs', label: t('guide.sec.profileTabs') },
    { id: 'provenance', label: '6-Dept Federation' },
    { id: 'walkthroughs', label: t('guide.sec.walkthroughs') },
    { id: 'statutory-desks', label: 'Statutory Desks' },
    { id: 'identities', label: t('guide.sec.identities') },
    { id: 'story-parcels', label: t('guide.sec.storyParcels') },
    { id: 'glossary', label: t('guide.sec.glossary') },
    { id: 'faq', label: t('guide.sec.faq') },
  ];

  // Filtered Story Parcels
  const filteredStoryParcels = useMemo(() => {
    if (parcelStateFilter === 'all') return storyParcels;
    if (parcelStateFilter === 'AP') return storyParcels.filter((p) => p.note.includes('AP'));
    if (parcelStateFilter === 'TN') return storyParcels.filter((p) => p.note.includes('TN') || p.title.includes('Tamil Nadu'));
    if (parcelStateFilter === 'TG') return storyParcels.filter((p) => p.note.includes('TG') || p.title.includes('Telangana'));
    return storyParcels;
  }, [storyParcels, parcelStateFilter]);

  // Filtered Glossary
  const filteredGlossary = useMemo(() => {
    if (!glossaryQuery.trim()) return glossary;
    const q = glossaryQuery.toLowerCase();
    return glossary.filter((g) => g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q));
  }, [glossary, glossaryQuery]);

  // Filtered FAQ
  const filteredFaq = useMemo(() => {
    if (!faqQuery.trim()) return faq;
    const q = faqQuery.toLowerCase();
    return faq.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [faq, faqQuery]);

  const defaultWorkflow: Workflow = {
    title: 'Statutory Workflow',
    tagline: 'Multi-stage administrative review',
    steps: ['Application submitted', 'Officer review', 'Record synchronized'],
  };
  const activeWorkflow: Workflow = workflows[selectedWorkflowIndex] ?? workflows[0] ?? defaultWorkflow;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {t('guide.title')}
          </h1>
          <p className="mt-1 text-sm text-ink-2">{t('guide.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/"
            search={() => ({})}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 py-1.5 text-xs font-semibold text-ink-2 shadow-xs transition hover:bg-ground-2 hover:text-ink"
          >
            <Home size={13} /> {t('guide.home')}
          </Link>
          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 active:scale-95"
          >
            {t('guide.openMap')} <ArrowRight size={13} />
          </Link>
          <Link
            to="/citizen"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3.5 py-1.5 text-xs font-semibold text-ink-2 shadow-xs transition hover:bg-ground-2 hover:text-ink"
          >
            <Users size={13} /> {t('guide.citizenPortal')}
          </Link>
        </div>
      </header>

      {/* Assistant Callout Banner */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary-soft/40 p-3.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white shadow-xs shrink-0">
            <Landmark size={16} />
          </div>
          <div>
            <h3 className="font-display text-xs font-bold text-ink">{t('guide.aiQuestion')}</h3>
            <p className="text-[11px] text-ink-2">{t('guide.aiDesc')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-assistant', { detail: { prompt: 'How does Land Stack help me resolve a land problem?' } }))}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:brightness-105 active:scale-95 cursor-pointer"
        >
          <Compass size={13} /> {t('guide.askAssistant')}
        </button>
      </div>

      <OnThisPage sections={sections} />

      {/* 1. Quick start (Compact 5-Step Pipeline) */}
      <section id="quickstart" className="mt-8 scroll-mt-20">
        <H2 kicker={t('guide.quickstart.kicker')}>{t('guide.quickstart.title')}</H2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {quickStart.map((s, i) => (
            <div key={s.title} className="flex flex-col justify-between rounded-xl border border-line bg-panel p-3.5 shadow-xs">
              <div>
                <span className="flex size-6 items-center justify-center rounded-md bg-primary-soft font-mono text-xs font-bold text-primary">
                  0{i + 1}
                </span>
                <h3 className="mt-2.5 font-display text-xs font-bold text-ink">{s.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-2">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Roles (Compact Grid with Dev Role Switching) */}
      <section id="roles" className="mt-8 scroll-mt-20">
        <H2 kicker={t('guide.roles.kicker')}>{t('guide.roles.title')}</H2>
        <div className="grid gap-3 sm:grid-cols-3">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.role} className="flex flex-col justify-between rounded-xl border border-line bg-panel p-4 shadow-panel">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Icon size={16} strokeWidth={1.8} />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-bold text-ink">{r.role}</h3>
                      <p className="text-[11px] text-ink-3">{r.who}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-ink-2">{r.can}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Reading the map + Interactive Parcel Decoder */}
      <section id="reading-map" className="mt-10 scroll-mt-20">
        <H2 kicker={t('guide.readingMap.kicker')}>{t('guide.readingMap.title')}</H2>
        <p className="mb-3 text-xs text-ink-2">{t('guide.readingMap.subtitle')}</p>

        {/* Symbology Legend Matrix */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          {mapReading.map((m) => (
            <div key={m.cue} className="flex flex-col rounded-xl border border-line bg-panel p-3 shadow-xs">
              <span className="font-display text-xs font-bold text-ink">{m.cue}</span>
              <p className="mt-1 text-[11px] leading-snug text-ink-2">{m.meaning}</p>
            </div>
          ))}
        </div>

        {/* Interactive ULPIN & Story Parcel Decoder Widget */}
        <ParcelDecoderWidget />
      </section>

      {/* 4. 3D Cadastre & Volumetric Strata Explorer */}
      <section id="strata-3d" className="mt-10 scroll-mt-20">
        <H2 kicker="Vertical Cadastre">3D Cadastre & Multi-Level Strata (ISO 19152)</H2>
        <p className="mb-3 text-xs text-ink-2">
          Beyond flat 2D maps: manage air rights, apartment undivided share of land (UDS), commercial plinths, and sub-grade utility basements.
        </p>
        <Cadastral3DStrataExplorer />
      </section>

      {/* 5. Parcel profile tabs */}
      <section id="profile-tabs" className="mt-10 scroll-mt-20">
        <H2 kicker={t('guide.profileTabs.kicker')}>{t('guide.profileTabs.title')}</H2>
        <p className="mb-3 text-xs text-ink-2">{t('guide.profileTabs.subtitle')}</p>
        
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {profileTabs.map((pt) => {
            const sourcePrefix = pt.source.split('—')[0] ?? pt.source;

            return (
              <div key={pt.tab} className="flex flex-col justify-between rounded-xl border border-line bg-panel p-3 shadow-xs">
                <div>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-primary truncate block">
                    {sourcePrefix}
                  </span>
                  <h3 className="mt-1 font-display text-xs font-bold text-ink">{pt.tab}</h3>
                  <p className="mt-1 text-[11px] leading-snug text-ink-2">{pt.what}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. 6-Department Federation & Provenance Matrix */}
      <section id="provenance" className="mt-10 scroll-mt-20">
        <H2 kicker="Interoperability Architecture">6-Department Federation & Provenance</H2>
        <p className="mb-3 text-xs text-ink-2">
          Zero central data replication. Real-time adapters translate legacy state registries into the Common Land Model (CLM 1.0).
        </p>
        <DepartmentProvenanceExplorer />
      </section>

      {/* 7. Workflows Walkthrough (Compact Interactive Stepper) */}
      <section id="walkthroughs" className="mt-10 scroll-mt-20">
        <H2 kicker={t('guide.walkthroughs.kicker')}>Walkthroughs: End-to-End Statutory Workflows</H2>
        <p className="mb-3 text-xs text-ink-2">{t('guide.walkthroughs.subtitle')}</p>

        {/* Workflow Tabs Switcher */}
        <div className="rounded-xl border border-line bg-panel p-4 shadow-panel">
          <div className="flex gap-1.5 overflow-x-auto pb-2 scroll-thin border-b border-line">
            {workflows.map((w, idx) => {
              const isSelected = idx === selectedWorkflowIndex;
              return (
                <button
                  key={w.title}
                  type="button"
                  onClick={() => setSelectedWorkflowIndex(idx)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs'
                      : 'border border-line bg-panel-2 text-ink-2 hover:bg-ground-2 hover:text-ink'
                  }`}
                >
                  {w.title}
                </button>
              );
            })}
          </div>

          {/* Active Workflow Display */}
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 pb-2">
              <h3 className="font-display text-base font-bold text-ink">
                {activeWorkflow.title}
              </h3>
              <span className="text-xs text-ink-3 italic">
                {activeWorkflow.tagline}
              </span>
            </div>

            <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {activeWorkflow.steps.map((s, i) => (
                <li key={i} className="flex flex-col rounded-lg border border-line bg-panel-2 p-3 text-xs">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="font-mono text-[10px] uppercase font-bold text-ink-3">Step 0{i + 1}</span>
                  </div>
                  <span className="text-ink-2 leading-relaxed text-[11px]">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 8. Interactive Statutory Revenue Desks & Speaking Order Simulator */}
      <section id="statutory-desks" className="mt-10 scroll-mt-20">
        <H2 kicker="Administrative Governance">Stage-Gated Statutory Desks & Speaking Orders</H2>
        <p className="mb-3 text-xs text-ink-2">
          Experience the 4-stage quasi-judicial revenue process governing land transactions under the Record of Rights & Pattadar Pass Books Act.
        </p>
        <StatutoryHierarchySimulator />
      </section>

      {/* 9. Dev identities (Compact Grid with Instant User Switching) */}
      <section id="identities" className="mt-10 scroll-mt-20">
        <Card className="rounded-xl border border-line shadow-panel">
          <CardHeader
            title={t('guide.identities.title')}
            subtitle={
              mode === 'dev'
                ? `${t('guide.identities.subtitleDev')} Click any identity to test permissions instantly.`
                : t('guide.identities.subtitleProd')
            }
          />
          <CardBody className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {devUsers.map((d) => {
              const isCurrent = user?.name === d.label || user?.uid.endsWith(d.id);

              return (
                <div
                  key={d.id}
                  onClick={() => {
                    if (mode === 'dev') {
                      setDevUser(d.id);
                    }
                  }}
                  className={`flex flex-col justify-between gap-1.5 rounded-lg border p-2.5 text-xs transition ${
                    isCurrent
                      ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                      : 'border-line bg-panel-2 hover:border-line-strong hover:bg-ground-2'
                  } ${mode === 'dev' ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-ink truncate flex items-center gap-1.5">
                      {isCurrent && <CheckCircle2 size={13} className="text-primary" />}
                      {d.label}
                    </span>
                    {'state' in d && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-ground-2 text-ink-3">
                        {d.state}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-ink-3">
                    <span className="truncate">{d.hint}</span>
                    <Badge mono tone={isCurrent ? 'primary' : 'slate'}>{d.role}</Badge>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </section>

      {/* 10. Story parcels (Compact with State Filters) */}
      <section id="story-parcels" className="mt-10 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <H2 kicker={t('guide.storyParcels.kicker')}>{t('guide.storyParcels.title')}</H2>

          {/* State Filter Buttons */}
          <div className="flex items-center gap-1 rounded-full border border-line bg-panel p-1 text-xs">
            {(['all', 'AP', 'TN', 'TG'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setParcelStateFilter(st)}
                className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold uppercase transition cursor-pointer ${
                  parcelStateFilter === st
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-ink-2 hover:bg-ground-2 hover:text-ink'
                }`}
              >
                {st === 'all' ? 'All (8)' : st}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-3 text-xs text-ink-2">{t('guide.storyParcels.subtitle')}</p>
        
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredStoryParcels.map((p) => {
            const parcelTitlePart = p.title.split('·')[0] ?? p.title;

            return (
              <Link
                key={p.ulpin}
                to="/map"
                search={{ ulpin: p.ulpin }}
                className="group flex flex-col justify-between rounded-xl border border-line bg-panel p-3.5 shadow-panel transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-ink">Sy. {p.survey_no}</span>
                    <Badge tone={p.tone}>{parcelTitlePart}</Badge>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-ink-2">{p.note}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-[10px]">
                  <span className="font-mono text-primary font-semibold">{p.ulpin}</span>
                  <ArrowRight size={13} className="text-ink-3 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 11. Glossary (Compact & Searchable) */}
      <section id="glossary" className="mt-10 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <H2 kicker={t('guide.glossary.kicker')}>{t('guide.glossary.title')}</H2>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              value={glossaryQuery}
              onChange={(e) => setGlossaryQuery(e.target.value)}
              placeholder="Search terms (e.g. ULPIN, FMB, RoR)..."
              className="w-full rounded-full border border-line bg-panel py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none shadow-xs"
            />
          </div>
        </div>

        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGlossary.map((t) => (
            <div key={t.term} className="rounded-xl border border-line bg-panel p-3 shadow-panel">
              <dt className="font-display text-xs font-bold text-ink flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" />
                {t.term}
              </dt>
              <dd className="mt-1 text-[11px] leading-relaxed text-ink-2">{t.def}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 12. FAQ (Compact Accordions with Search) */}
      <section id="faq" className="mt-10 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <H2 kicker={t('guide.faq.kicker')}>{t('guide.faq.title')}</H2>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              type="text"
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
              placeholder="Filter FAQs..."
              className="w-full rounded-full border border-line bg-panel py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none shadow-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {filteredFaq.map((f) => (
            <details key={f.q} className="group rounded-xl border border-line bg-panel px-4 py-3 shadow-panel">
              <summary className="cursor-pointer list-none text-xs sm:text-sm font-bold text-ink marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <ChevronDown size={15} className="shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <p className="mt-2.5 text-xs leading-relaxed text-ink-2 border-t border-line pt-2.5">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer Strip */}
      <div className="mt-12">
        <GovStrip />
      </div>
    </div>
  );
}

export default HelpPage;
