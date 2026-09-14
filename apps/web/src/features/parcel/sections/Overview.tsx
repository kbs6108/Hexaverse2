import { Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { AlertOctagon, BadgeCheck, Clock, Download, FileSearch, Landmark, ListChecks, Radar, Receipt, Satellite, Wand2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { ParcelCDM } from '@/lib/cdm';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtArea, fmtDate, fmtINR, titleCase } from '@/lib/format';
import { Button } from '@/components/Button';
import { Callout, KV, SectionTitle } from '@/components/Section';
import { toast } from '@/components/Toast';
import { Badge } from '@/components/Badge';
import type { ParcelTab } from '../ParcelDrawer';

interface Cell {
  label: string;
  value: string;
  tone: 'ok' | 'warn' | 'bad' | 'muted';
  icon: typeof BadgeCheck;
  hatch?: boolean;
}

export function Overview({ p, goTo }: { p: ParcelCDM; goTo: (t: ParcelTab) => void }) {
  const { role } = useAuth();
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

      {(!p.consistency.area_match || !p.consistency.owner_match || issues.length > 0) && (
        <Callout tone="amber" title={`Cross-department inconsistency${issues.length > 1 ? ' · ' + issues.length + ' fields' : ''}`}>
          <ul className="list-disc pl-4">
            {!p.consistency.area_match && !issues.some((i) => i.field === 'extent_sqm') && <li>Area differs between revenue and registration records.</li>}
            {!p.consistency.owner_match && !issues.some((i) => i.field === 'owner_name') && <li>Owner name differs between RoR and latest deed.</li>}
            {issues.map((i, k) => (
              <li key={k}>
                <span className="font-medium">{titleCase(i.field)}</span>:{' '}
                {Object.entries(i)
                  .filter(([key]) => key !== 'field')
                  .map(([src, v]) => `${titleCase(src)} ${String(v)}`)
                  .join(' vs ')}
              </li>
            ))}
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
          {role === 'citizen' && (
            <>
              <Link to="/citizen/verify" search={{ ulpin: p.ulpin }}><Button icon={<FileSearch size={15} />}>Verify ownership</Button></Link>
              <Link to="/citizen/request" search={{ ulpin: p.ulpin }}><Button icon={<ListChecks size={15} />}>Request service</Button></Link>
              <Button variant="primary" icon={<Download size={15} />} loading={report.isPending} onClick={() => report.mutate()}>Download report</Button>
            </>
          )}
          {role === 'officer' && (
            <>
              <Link to="/officer/queue" search={{ q: p.ulpin }}><Button icon={<ListChecks size={15} />}>Open in queue</Button></Link>
              <Button variant="primary" icon={<Satellite size={15} />} onClick={() => goTo('satellite')}>Run change detection</Button>
              <Button icon={<Download size={15} />} loading={report.isPending} onClick={() => report.mutate()}>Report</Button>
            </>
          )}
          {role === 'admin' && (
            <>
              <Link to="/admin" search={{ ulpin: p.ulpin }}><Button variant="primary" icon={<Wand2 size={15} />}>Simulate deed</Button></Link>
              <Link to="/officer/queue" search={{ q: p.ulpin }}><Button icon={<ListChecks size={15} />}>Open in queue</Button></Link>
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
            { k: 'Taluk / District', v: `${p.identifiers.taluk} · ${p.identifiers.district}` },
            { k: 'Centroid', v: `${p.spatial.centroid[1].toFixed(5)}, ${p.spatial.centroid[0].toFixed(5)}`, mono: true },
            { k: 'Estimated value', v: fmtINR(p.fiscal.estimated_value) },
            { k: 'Registered on', v: fmtDate(p.rights.registration?.registered_on) },
          ]}
        />
      </div>
    </div>
  );
}
