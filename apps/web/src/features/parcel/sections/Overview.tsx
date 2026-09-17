import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertOctagon, AlertTriangle, BadgeCheck, CheckCircle2, ClipboardCheck, Clock, Download, FileSearch, Landmark, ListChecks, PenLine, Radar, Receipt, Satellite, Wand2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { ParcelCDM } from '@/lib/cdm';
import { api, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useUI } from '@/lib/store';
import { fmtArea, fmtDate, fmtINR, fmtNum, titleCase } from '@/lib/format';
import { Button } from '@/components/Button';
import { Callout, KV, SectionTitle } from '@/components/Section';
import { toast } from '@/components/Toast';
import { Badge } from '@/components/Badge';
import { AIInsight, parcelNeedsAttention } from '@/components/AIInsight';
import type { ParcelTab } from '../ParcelDrawer';

/** Readable names for consistency-issue fields (raw keys are backend column names). */
const ISSUE_LABEL: Record<string, string> = {
  extent_sqm: 'Recorded extent',
  owner_name: 'Owner name',
};

const DD_ICON = {
  pass: { icon: CheckCircle2, cls: 'text-primary' },
  caution: { icon: AlertTriangle, cls: 'text-amber' },
  fail: { icon: XCircle, cls: 'text-brick' },
} as const;

const DD_VERDICT = {
  clear: { label: 'Clear to proceed', cls: 'bg-primary text-primary-ink' },
  caution: { label: 'Proceed with caution', cls: 'bg-amber text-white' },
  high_risk: { label: 'High risk', cls: 'bg-brick text-white' },
} as const;

/** Buyer due-diligence: a 9-point checklist over the same aggregated record (on demand —
 *  most viewers are not buying). Deterministic; the signed report PDF stays the artefact. */
function BuyerCheck({ ulpin }: { ulpin: string }) {
  const { user } = useAuth();
  const [run, setRun] = useState(false);
  const q = useQuery({
    queryKey: qk.dueDiligence(ulpin, user?.uid ?? 'anon'),
    queryFn: () => api.dueDiligence(ulpin),
    enabled: run,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const d = q.data;
  const verdict = d ? DD_VERDICT[d.verdict as keyof typeof DD_VERDICT] : undefined;
  return (
    <section aria-label="Buyer due-diligence" className="rounded-lg border border-line bg-panel-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <ClipboardCheck size={15} className="text-ink-3" />
        <h3 className="text-sm font-semibold">Thinking of buying?</h3>
        {verdict && <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold', verdict.cls)}>{verdict.label}</span>}
        {d && (
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10.5px] text-ink-3">
            <span
              className={clsx(
                'size-1.5 rounded-full',
                d.engine.startsWith('gemini') ? 'bg-emerald-500' : d.engine.startsWith('nvidia') ? 'bg-primary' : 'bg-ink-3'
              )}
            />
            <span>
              {d.engine.startsWith('gemini')
                ? `Gemini (${d.engine.split(':')[1] || '2.5 Flash'})`
                : d.engine.startsWith('nvidia')
                  ? 'NVIDIA Nemotron'
                  : 'rule engine'}
            </span>
          </span>
        )}
        {!run && <Button size="sm" className="ml-auto" onClick={() => setRun(true)}>Run 9-point check</Button>}
      </div>
      {!run && <p className="mt-1 text-xs text-ink-3">One click checks the deed, court cases, mortgages, tax, pending transfers, record consistency, construction alerts, restriction zones and resurvey status.</p>}
      {q.isLoading && run && <p className="mt-2 text-[13px] text-ink-2">Checking all six departments…</p>}
      {q.isError && <p className="mt-2 text-[13px] text-brick">The check could not run — open the parcel again or retry.</p>}
      {d && (
        <>
          {d.summary && (
            <div className="mt-2.5 rounded-md border border-line bg-ground-1 px-2.5 py-2 text-xs text-ink-2">
              <span className="font-semibold text-primary">AI Buyer Summary: </span>
              <span>{d.summary}</span>
            </div>
          )}
          <ul className="mt-2 flex flex-col gap-1">
            {d.checks.map((c) => {
              const ic = DD_ICON[c.status as keyof typeof DD_ICON] ?? DD_ICON.caution;
              return (
                <li key={c.name} className="flex items-start gap-1.5 text-[12.5px] text-ink-2">
                  <ic.icon size={13} className={clsx('mt-0.5 shrink-0', ic.cls)} />
                  <span><span className="font-medium text-ink">{c.name}:</span> {c.text}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 border-t border-line pt-2 text-[11px] text-ink-3">
            {d.estimated_value ? `Indicative value ${fmtINR(d.estimated_value)} at the guideline rate. ` : ''}
            A record summary, not legal advice — download the signed Land Information Report for the formal document.
          </p>
        </>
      )}
    </section>
  );
}

interface Cell {
  label: string;
  value: string;
  tone: 'ok' | 'warn' | 'bad' | 'muted';
  icon: typeof BadgeCheck;
  hatch?: boolean;
}

export function Overview({ p, goTo }: { p: ParcelCDM; goTo: (t: ParcelTab) => void }) {
  const { role, department } = useAuth();
  const startBoundaryEdit = useUI((s) => s.startBoundaryEdit);
  const canEditBoundary = role === 'admin' || (role === 'officer' && department === 'revenue');
  const beginBoundaryEdit = async () => {
    try {
      const feat = await api.parcelFeature(p.ulpin);
      const geom = feat.geometry as { type?: string; coordinates?: number[][][] | number[][][][] };
      const ring = (geom.type === 'MultiPolygon'
        ? (geom.coordinates as number[][][][])[0]?.[0]
        : (geom.coordinates as number[][][])[0]) as [number, number][] | undefined;
      if (!ring || ring.length < 4) throw new Error('parcel geometry unavailable');
      startBoundaryEdit({ ulpin: p.ulpin, survey_no: p.identifiers.survey_no ?? undefined, ring: ring.slice(0, -1) });
    } catch (e) {
      toast.error('Could not start boundary edit', e instanceof Error ? e.message : String(e));
    }
  };
  const s = p.status;
  const cells: Cell[] = [
    { label: 'Registered', value: s.registered ? 'Yes' : 'No', tone: s.registered ? 'ok' : 'muted', icon: BadgeCheck },
    { label: 'Dispute', value: s.has_dispute ? `${p.restrictions.disputes.length} case(s)` : 'None', tone: s.has_dispute ? 'bad' : 'ok', icon: AlertOctagon, hatch: s.has_dispute },
    { label: 'Mortgage', value: s.has_mortgage ? 'Active' : 'Clear', tone: s.has_mortgage ? 'warn' : 'ok', icon: Landmark },
    { label: 'Tax', value: s.tax_arrears > 0 ? `${fmtINR(s.tax_arrears)} due` : 'Paid up', tone: s.tax_arrears > 0 ? 'warn' : 'ok', icon: Receipt },
    { label: 'Mutation', value: s.pending_mutation ? 'Pending' : 'None pending', tone: s.pending_mutation ? 'warn' : 'ok', icon: Clock },
    { label: 'Change alert', value: s.change_alert ? 'Flagged' : 'None', tone: s.change_alert ? 'bad' : 'ok', icon: Radar },
  ];
  const tones = {
    ok: 'border-primary/25 bg-primary-soft/60 text-primary',
    warn: 'border-amber/30 bg-amber-soft/70 text-amber',
    bad: 'border-brick/30 bg-brick-soft/70 text-brick',
    muted: 'border-line bg-ground-2 text-ink-2',
  };

  const report = useMutation({
    mutationFn: () => api.issueReport(p.ulpin),
    onSuccess: (r) => {
      toast.success('Land Information Report issued', r.id);
      window.open(r.url.startsWith('http') ? r.url : api.reportPdfUrl(r.id), '_blank', 'noopener');
    },
    onError: (e: Error) => toast.error('Could not issue report', e.message),
  });

  const issues = p.consistency.issues;
  const resurvey = p.status_flags?.resurvey;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2" role="list" aria-label="Status summary">
        {cells.map((c) => (
          <div key={c.label} role="listitem" className={clsx('relative overflow-hidden rounded-md border px-2.5 py-2', tones[c.tone])}>
            {c.hatch && <span aria-hidden className="absolute inset-0 opacity-10 hatch-brick" />}
            <div className="relative flex items-center gap-1 text-[11px] uppercase tracking-wide opacity-80">
              <c.icon size={12} /> {c.label}
            </div>
            <p className="relative mt-0.5 text-sm font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <AIInsight p={p} auto={parcelNeedsAttention(p)} />

      <BuyerCheck ulpin={p.ulpin} />

      {resurvey && (
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-3">
          <Badge tone={resurvey === 'completed' ? 'primary' : resurvey === 'in_progress' ? 'amber' : 'neutral'}>
            {resurvey === 'completed' ? 'Resurvey completed' : resurvey === 'in_progress' ? 'Resurvey in progress' : 'Resurvey pending'}
          </Badge>
          <span>State land-settlement programme · see the “Settlement / resurvey” map layer</span>
        </div>
      )}

      {(!p.consistency.area_match || !p.consistency.owner_match || issues.length > 0) && (
        <Callout tone="amber" title={`Cross-department inconsistency${issues.length > 1 ? ' · ' + issues.length + ' fields' : ''}`}>
          <ul className="list-disc pl-4">
            {!p.consistency.area_match && !issues.some((i) => i.field === 'extent_sqm') && <li>Area differs between revenue and registration records.</li>}
            {!p.consistency.owner_match && !issues.some((i) => i.field === 'owner_name') && <li>Owner name differs between RoR and latest deed.</li>}
            {issues.map((i, k) => {
              const values = (['revenue', 'registration', 'parcel'] as const)
                .filter((s) => i[s] !== null && i[s] !== undefined)
                .map((s) => `${s === 'parcel' ? 'Surveyed' : titleCase(s)} ${typeof i[s] === 'number' ? fmtNum(i[s] as number, i.field === 'extent_sqm' ? ' sqm' : '') : String(i[s])}`);
              return (
                <li key={k}>
                  <span className="font-medium">{ISSUE_LABEL[i.field] ?? titleCase(i.field)}</span>
                  {typeof i.note === 'string' && <> — {i.note}.</>}
                  {values.length > 0 && <span className="mt-0.5 block text-[12px] opacity-80">{values.join(' · ')}</span>}
                </li>
              );
            })}
          </ul>
        </Callout>
      )}

      {p.alerts.filter((a) => a.status !== 'resolved').length > 0 && (
        <div>
          <SectionTitle>Open alerts</SectionTitle>
          <ul className="flex flex-col gap-1">
            {p.alerts.filter((a) => a.status !== 'resolved').map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5 text-sm">
                <span className="flex items-center gap-2">
                  <Badge tone={a.severity === 'high' ? 'brick' : 'amber'}>{titleCase(a.kind)}</Badge>
                  {a.title}
                </span>
                <span className="text-xs text-ink-3">{a.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <SectionTitle>Quick actions</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {canEditBoundary && (
            <Button icon={<PenLine size={15} />} onClick={() => void beginBoundaryEdit()}>
              Propose boundary fix
            </Button>
          )}
          {role === 'citizen' && (
            <>
              <Link to="/citizen/verify" search={{ ulpin: p.ulpin }}><Button icon={<FileSearch size={15} />}>Verify ownership</Button></Link>
              <Link to="/citizen/request" search={{ ulpin: p.ulpin }}><Button icon={<ListChecks size={15} />}>Request service</Button></Link>
              <Button variant="primary" icon={<Download size={15} />} loading={report.isPending} onClick={() => report.mutate()}>Download report</Button>
            </>
          )}
          {role === 'officer' && (
            <>
              <Link to="/officer/queue" search={{}}><Button icon={<ListChecks size={15} />}>Open in queue</Button></Link>
              <Button variant="primary" icon={<Satellite size={15} />} onClick={() => goTo('satellite')}>Run change detection</Button>
              <Button icon={<Download size={15} />} loading={report.isPending} onClick={() => report.mutate()}>Report</Button>
            </>
          )}
          {role === 'admin' && (
            <>
              <Link to="/admin" search={{ ulpin: p.ulpin }}><Button variant="primary" icon={<Wand2 size={15} />}>Simulate deed</Button></Link>
              <Link to="/officer/queue" search={{}}><Button icon={<ListChecks size={15} />}>Open in queue</Button></Link>
              <Button icon={<Satellite size={15} />} onClick={() => goTo('satellite')}>Run change detection</Button>
            </>
          )}
        </div>
      </div>

      <div>
        <SectionTitle>Parcel</SectionTitle>
        <KV
          items={[
            { k: 'Area', v: fmtArea(p.spatial.area_sqm) },
            { k: 'Land use', v: titleCase(p.planning.land_use) },
            { k: 'Zone', v: p.planning.zone_code ? `${p.planning.zone_code} · ${p.planning.zone_name ?? ''}` : '—' },
            { k: 'Khata', v: p.identifiers.khata_no ?? '—', mono: true },
            // AP and Telangana call the sub-district a mandal; Tamil Nadu a taluk.
            { k: p.identifiers.state === 'TN' ? 'Taluk / District' : 'Mandal / District', v: `${p.identifiers.taluk} · ${p.identifiers.district}` },
            { k: 'Centroid', v: `${p.spatial.centroid[1].toFixed(5)}, ${p.spatial.centroid[0].toFixed(5)}`, mono: true },
            { k: 'Estimated value', v: fmtINR(p.fiscal.estimated_value) },
            { k: 'Registered on', v: fmtDate(p.rights.registration?.registered_on) },
          ]}
        />
      </div>
    </div>
  );
}
