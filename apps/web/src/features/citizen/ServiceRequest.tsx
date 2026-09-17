import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  Download,
  FileUp,
  Flag,
  Info,
  PenLine,
  XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { api, qk } from '@/lib/api';
import type { Application, ApplicationType } from '@/lib/cdm';
import { useAuth } from '@/lib/auth';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Field, Input, Select, Textarea } from '@/components/Field';
import { ParcelPicker } from '@/components/ParcelPicker';
import { Button } from '@/components/Button';
import { ErrorNote } from '@/components/EmptyState';
import { Callout } from '@/components/Section';
import { Spinner } from '@/components/Spinner';
import { toast } from '@/components/Toast';
import { PageTitle } from './CitizenHome';

type Intent = 'mutation' | 'record_correction' | 'building_permission' | 'land_complaint';

const INTENTS: { key: Intent; title: string; desc: string; icon: typeof ArrowRightLeft }[] = [
  { key: 'mutation', title: 'Transfer ownership', desc: 'Move the Record of Rights after a sale, inheritance, gift or court order.', icon: ArrowRightLeft },
  { key: 'record_correction', title: 'Fix a mistake in the record', desc: 'A name, extent or classification in the record is wrong.', icon: PenLine },
  { key: 'building_permission', title: 'Build on this land', desc: 'Apply for building permission with an instant zoning check.', icon: Building2 },
  { key: 'land_complaint', title: 'Raise a complaint', desc: 'Encroachment, boundary trouble or anything else on this parcel.', icon: Flag },
];

const STEPS: Record<Intent, string[]> = {
  mutation: [
    'Submitted to the Revenue department.',
    'Document check against the registered deed.',
    'Field verification by the village revenue officer.',
    'Approval updates the Record of Rights; you get a new khata entry.',
  ],
  record_correction: [
    'Submitted to the Revenue department.',
    'Officer compares the record with your evidence.',
    'Approval corrects the record; you can download a fresh report.',
  ],
  building_permission: [
    'Automatic planning check against the master-plan zone (shown before you submit).',
    'Planning officer scrutiny.',
    'Site inspection.',
    'Permit issued with conditions.',
  ],
  land_complaint: [
    'Registered with a tracking id straight away.',
    'An officer takes it up for review.',
    'You see the outcome and every remark in your tracking page.',
  ],
};

const USES = ['residential', 'commercial', 'mixed', 'industrial', 'institutional'];

function isIntent(v: unknown): v is Intent {
  return INTENTS.some((i) => i.key === v);
}

export function ServiceRequest() {
  const search = useSearch({ from: '/citizen/request' });
  const [intent, setIntent] = useState<Intent | null>(isIntent(search.type) ? search.type : null);
  const [ulpin, setUlpin] = useState(search.ulpin ?? '');
  const [done, setDone] = useState<Application | null>(null);

  if (done) return <Success app={done} onNew={() => setDone(null)} />;

  return (
    <>
      <PageTitle title="Apply" subtitle="Pick the parcel, say what you need — we check the record before you submit" />

      <Card className="mb-4 p-4">
        <Field label="Which parcel is this about?" htmlFor="sr-ulpin" hint="Pick a recently opened parcel, or select one on the map and choose “Request service”.">
          <ParcelPicker id="sr-ulpin" value={ulpin} onChange={setUlpin} />
        </Field>
      </Card>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="What do you need?">
        {INTENTS.map((it) => (
          <button
            key={it.key}
            role="radio"
            aria-checked={intent === it.key}
            onClick={() => setIntent(it.key)}
            className={clsx(
              'rounded-lg border p-3 text-left transition-colors',
              intent === it.key ? 'border-primary bg-primary-soft/40 ring-1 ring-primary' : 'border-line bg-panel hover:border-line-strong',
            )}
          >
            <it.icon size={18} className={intent === it.key ? 'text-primary' : 'text-ink-3'} />
            <p className="mt-1.5 text-sm font-semibold">{it.title}</p>
            <p className="mt-0.5 text-xs leading-snug text-ink-3">{it.desc}</p>
          </button>
        ))}
      </div>

      {intent && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          {intent === 'mutation' && <MutationForm ulpin={ulpin} onDone={setDone} />}
          {intent === 'record_correction' && <CorrectionForm ulpin={ulpin} onDone={setDone} />}
          {intent === 'building_permission' && <PermissionForm ulpin={ulpin} onDone={setDone} />}
          {intent === 'land_complaint' && <ComplaintForm ulpin={ulpin} onDone={setDone} />}
          <aside className="flex flex-col gap-3 text-sm text-ink-2">
            <PreCheckPanel ulpin={ulpin} type={intent} />
            <Card className="p-4">
              <h3 className="font-semibold">What happens next</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                {STEPS[intent].map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </Card>
          </aside>
        </div>
      )}
      {!intent && <p className="text-sm text-ink-3">Choose what you need above to see the form.</p>}
    </>
  );
}

/* ---------- Pre-submission check (deterministic rule engine, CONTRACTS §6) ---------- */

function PreCheckPanel({ ulpin, type }: { ulpin: string; type: ApplicationType }) {
  const { user } = useAuth();
  const ready = ulpin.trim().length >= 8;
  const q = useQuery({
    queryKey: qk.preCheck(ulpin.trim(), type, user?.uid ?? 'anon'),
    queryFn: () => api.preCheck(ulpin.trim(), type),
    enabled: ready,
    staleTime: 60_000,
    retry: false,
  });

  if (!ready) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold">Before you submit</h3>
        <p className="mt-1 text-xs text-ink-3">Pick a parcel above and we check its record for anything that could hold this application.</p>
      </Card>
    );
  }
  if (q.isLoading) {
    return (
      <Card className="flex items-center gap-2 p-4 text-[13px] text-ink-2">
        <Spinner size={14} /> Checking this parcel’s record…
      </Card>
    );
  }
  const c = q.data;
  if (!c) return q.isError ? <Card className="p-4"><ErrorNote error={q.error} /></Card> : null;

  const rows: { tone: 'brick' | 'amber' | 'slate'; icon: typeof XCircle; items: typeof c.blockers; label: string }[] = [
    { tone: 'brick', icon: XCircle, items: c.blockers, label: 'Likely to be refused' },
    { tone: 'amber', icon: AlertTriangle, items: c.warnings, label: 'The officer will look at' },
    { tone: 'slate', icon: Info, items: c.notes, label: 'Good to know' },
  ];
  const empty = rows.every((r) => r.items.length === 0);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Before you submit</h3>
        <span className="ml-auto font-mono text-[10px] text-ink-3" title="How this check was produced">
          {c.engine === 'rules' ? 'rule engine' : c.engine}
        </span>
      </div>
      {empty ? (
        <p className="mt-2 flex items-start gap-1.5 text-[13px]">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
          Nothing on this parcel’s record stands in the way.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {rows.filter((r) => r.items.length > 0).map((r) => (
            <div key={r.label}>
              <p className={clsx('text-[11px] font-semibold uppercase tracking-wide', r.tone === 'brick' ? 'text-brick' : r.tone === 'amber' ? 'text-amber' : 'text-ink-3')}>{r.label}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {r.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12.5px]">
                    <r.icon size={13} className={clsx('mt-0.5 shrink-0', r.tone === 'brick' ? 'text-brick' : r.tone === 'amber' ? 'text-amber' : 'text-slate')} />
                    <span>
                      {it.text}
                      {it.action && <span className="block text-ink-3">{it.action}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {!c.ok_to_submit && (
        <p className="mt-2 border-t border-line pt-2 text-xs text-ink-3">You can still submit — the officer decides. This check only tells you what they will see.</p>
      )}
    </Card>
  );
}

/* ---------- Shared bits ---------- */

function DocField({ doc, setDoc, hint }: { doc: File | null; setDoc: (f: File | null) => void; hint: string }) {
  return (
    <Field label="Supporting document" hint={`${hint} Upload is a placeholder in this prototype; only the file name is recorded.`}>
      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-line-strong px-3 py-3 text-sm hover:border-primary">
        <FileUp size={16} className="text-ink-3" />
        <span className="flex-1 truncate">{doc ? doc.name : 'Choose a file…'}</span>
        <input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => setDoc(e.target.files?.[0] ?? null)} />
      </label>
    </Field>
  );
}

function FormCard({ title, subtitle, onSubmit, children }: { title: string; subtitle: string; onSubmit: (e: FormEvent) => void; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">{children}</form>
      </CardBody>
    </Card>
  );
}

/* ---------- Forms ---------- */

function MutationForm({ ulpin, onDone }: { ulpin: string; onDone: (a: Application) => void }) {
  const [reason, setReason] = useState('sale');
  const [newOwner, setNewOwner] = useState('');
  const [doc, setDoc] = useState<File | null>(null);
  const m = useMutation({
    mutationFn: () => api.createApplication(ulpin.trim(), 'mutation', { reason, new_owner_name: newOwner.trim(), document_name: doc?.name ?? null }),
    onSuccess: (a) => { toast.success('Transfer application submitted', a.id); onDone(a); },
  });
  return (
    <FormCard title="Transfer ownership" subtitle="Revenue department · mutation of the Record of Rights" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <Field label="Reason for transfer" htmlFor="sr-reason">
        <Select id="sr-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="sale">Sale (registered deed)</option>
          <option value="inheritance">Inheritance / succession</option>
          <option value="gift">Gift</option>
          <option value="partition">Partition</option>
          <option value="court_order">Court order</option>
        </Select>
      </Field>
      <Field label="New owner name" htmlFor="sr-owner" hint="Exactly as on the deed">
        <Input id="sr-owner" required value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
      </Field>
      <DocField doc={doc} setDoc={setDoc} hint="Deed / succession certificate (PDF or image)." />
      {m.isError && <ErrorNote error={m.error} />}
      <Button type="submit" variant="primary" loading={m.isPending} className="self-start" disabled={ulpin.trim().length < 8}>Submit application</Button>
    </FormCard>
  );
}

const CORRECTION_FIELDS = [
  { value: 'owner_name', label: 'Owner name (spelling / wrong person)' },
  { value: 'extent', label: 'Extent / area' },
  { value: 'classification', label: 'Land classification' },
  { value: 'khata_no', label: 'Khata number' },
  { value: 'other', label: 'Something else' },
];

function CorrectionForm({ ulpin, onDone }: { ulpin: string; onDone: (a: Application) => void }) {
  const [field, setField] = useState('owner_name');
  const [corrected, setCorrected] = useState('');
  const [description, setDescription] = useState('');
  const [doc, setDoc] = useState<File | null>(null);
  const m = useMutation({
    mutationFn: () =>
      api.createApplication(ulpin.trim(), 'record_correction', {
        field,
        corrected_value: corrected.trim(),
        description: description.trim(),
        document_name: doc?.name ?? null,
      }),
    onSuccess: (a) => { toast.success('Correction request submitted', a.id); onDone(a); },
  });
  return (
    <FormCard title="Fix a mistake in the record" subtitle="Revenue department · record correction" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <Field label="What is wrong?" htmlFor="sr-field">
        <Select id="sr-field" value={field} onChange={(e) => setField(e.target.value)}>
          {CORRECTION_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
      </Field>
      <Field label="What should it say?" htmlFor="sr-corrected" hint="The correct value, exactly as it should appear">
        <Input id="sr-corrected" required value={corrected} onChange={(e) => setCorrected(e.target.value)} />
      </Field>
      <Field label="Tell us more" htmlFor="sr-corr-desc" hint="How the mistake happened, if you know">
        <Textarea id="sr-corr-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <DocField doc={doc} setDoc={setDoc} hint="Anything that proves the correct value (old patta, deed, Aadhaar…)." />
      {m.isError && <ErrorNote error={m.error} />}
      <Button type="submit" variant="primary" loading={m.isPending} className="self-start" disabled={ulpin.trim().length < 8}>Submit request</Button>
    </FormCard>
  );
}

function PermissionForm({ ulpin, onDone }: { ulpin: string; onDone: (a: Application) => void }) {
  const [floors, setFloors] = useState(2);
  const [builtUp, setBuiltUp] = useState(150);
  const [use, setUse] = useState('residential');
  const [checked, setChecked] = useState(false);
  const check = useQuery({
    queryKey: qk.planningCheck(ulpin.trim(), use, floors),
    queryFn: () => api.planningCheck(ulpin.trim(), use, floors),
    enabled: checked && ulpin.trim().length >= 8,
  });
  const m = useMutation({
    mutationFn: () =>
      api.createApplication(ulpin.trim(), 'building_permission', {
        floors,
        built_up_sqm: builtUp,
        proposed_use: use,
        precheck: check.data ?? null,
      }),
    onSuccess: (a) => { toast.success('Building permission application submitted', a.id); onDone(a); },
  });
  return (
    <FormCard title="Build on this land" subtitle="Planning department · with automatic zoning check" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Floors" htmlFor="sr-floors">
          <Input id="sr-floors" type="number" min={1} max={30} value={floors} onChange={(e) => { setFloors(Number(e.target.value)); setChecked(false); }} />
        </Field>
        <Field label="Built-up area (m²)" htmlFor="sr-builtup">
          <Input id="sr-builtup" type="number" min={10} value={builtUp} onChange={(e) => setBuiltUp(Number(e.target.value))} />
        </Field>
        <Field label="Proposed use" htmlFor="sr-use">
          <Select id="sr-use" value={use} onChange={(e) => { setUse(e.target.value); setChecked(false); }}>
            {USES.map((u) => <option key={u} value={u}>{u[0]!.toUpperCase() + u.slice(1)}</option>)}
          </Select>
        </Field>
      </div>

      <div className="rounded-md border border-line bg-panel-2 p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Zoning check</p>
          <Button size="sm" loading={check.isFetching} disabled={ulpin.trim().length < 8} onClick={() => setChecked(true)}>Run check</Button>
        </div>
        {check.isError && <div className="mt-2"><ErrorNote error={check.error} /></div>}
        {check.data && (
          <div className="mt-2 flex items-start gap-2 text-sm">
            {check.data.permissible ? <CheckCircle2 size={18} className="text-primary" /> : <XCircle size={18} className="text-brick" />}
            <div>
              <p className="font-medium">{check.data.permissible ? 'Permissible in this zone' : 'Not permissible as proposed'}{check.data.zone_code ? ` · zone ${check.data.zone_code}` : ''}</p>
              {check.data.reasons.length > 0 && <ul className="list-disc pl-4 text-ink-2">{check.data.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
            </div>
          </div>
        )}
        {!check.data && !check.isError && <p className="mt-1 text-xs text-ink-3">Calls the planning department’s <code>/planning/check</code> before you submit.</p>}
      </div>
      {check.data && !check.data.permissible && <Callout tone="amber" title="You can still submit">The application will be scrutinised by a planning officer, but expect it to be rejected unless the proposal changes.</Callout>}
      {m.isError && <ErrorNote error={m.error} />}
      <Button type="submit" variant="primary" loading={m.isPending} className="self-start" disabled={!checked || !check.data}>Submit application</Button>
    </FormCard>
  );
}

const COMPLAINT_CATEGORIES = [
  { value: 'encroachment', label: 'Encroachment on my land' },
  { value: 'boundary', label: 'Boundary dispute with a neighbour' },
  { value: 'illegal_construction', label: 'Construction without permission' },
  { value: 'record_fraud', label: 'Suspected fraud in the record' },
  { value: 'other', label: 'Something else' },
];

function ComplaintForm({ ulpin, onDone }: { ulpin: string; onDone: (a: Application) => void }) {
  const [category, setCategory] = useState('encroachment');
  const [description, setDescription] = useState('');
  const [doc, setDoc] = useState<File | null>(null);
  const m = useMutation({
    mutationFn: () =>
      api.createApplication(ulpin.trim(), 'land_complaint', {
        category,
        description: description.trim(),
        document_name: doc?.name ?? null,
      }),
    onSuccess: (a) => { toast.success('Complaint registered', a.id); onDone(a); },
  });
  return (
    <FormCard title="Raise a complaint" subtitle="Registered immediately · any officer can take it up" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <Field label="What is it about?" htmlFor="sr-category">
        <Select id="sr-category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {COMPLAINT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </Field>
      <Field label="Describe what happened" htmlFor="sr-comp-desc" hint="When it started, who is involved, what you want done">
        <Textarea id="sr-comp-desc" rows={4} required value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <DocField doc={doc} setDoc={setDoc} hint="Photos or papers that support the complaint." />
      {m.isError && <ErrorNote error={m.error} />}
      <Button type="submit" variant="primary" loading={m.isPending} className="self-start" disabled={ulpin.trim().length < 8}>Register complaint</Button>
    </FormCard>
  );
}

/* ---------- Success ---------- */

function Success({ app, onNew }: { app: Application; onNew: () => void }) {
  const report = useMutation({
    mutationFn: () => api.issueReport(app.ulpin),
    onSuccess: (r) => window.open(r.url.startsWith('http') ? r.url : api.reportPdfUrl(r.id), '_blank', 'noopener'),
    onError: (e: Error) => toast.error('Could not issue report', e.message),
  });
  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-6 text-center">
        <CheckCircle2 size={44} className="mx-auto text-primary" />
        <h1 className="mt-3 text-xl font-semibold">Application submitted</h1>
        <p className="mt-1 text-sm text-ink-2">Keep this id to track progress.</p>
        <p className="mt-3 inline-block rounded-md border border-line bg-ground-2 px-3 py-1.5 font-mono text-lg">{app.id}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/citizen/track/$id" params={{ id: app.id }}><Button variant="primary">Track application</Button></Link>
          <Button icon={<Download size={15} />} loading={report.isPending} onClick={() => report.mutate()}>Download Land Information Report</Button>
          <Button variant="ghost" onClick={onNew}>New request</Button>
        </div>
        {report.data && (
          <p className="mt-3 text-xs text-ink-3">
            Report {report.data.id} issued ·{' '}
            <a className="text-primary underline" href={report.data.url.startsWith('http') ? report.data.url : api.reportPdfUrl(report.data.id)} target="_blank" rel="noopener">open PDF</a>
            {' '}· <Link to="/verify/$id" params={{ id: report.data.id }} className="text-primary underline">verify link</Link>
          </p>
        )}
      </Card>
    </div>
  );
}
