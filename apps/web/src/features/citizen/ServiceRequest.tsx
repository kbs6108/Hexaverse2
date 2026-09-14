import { useState, type FormEvent } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Download, FileUp, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { api, qk } from '@/lib/api';
import type { Application } from '@/lib/cdm';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Field, Input, Select } from '@/components/Field';
import { Button } from '@/components/Button';
import { ErrorNote } from '@/components/EmptyState';
import { Callout } from '@/components/Section';
import { toast } from '@/components/Toast';
import { PageTitle } from '@/components/PageTitle';

type Kind = 'mutation' | 'building_permission';
const USES = ['residential', 'commercial', 'mixed', 'industrial', 'institutional'];

export function ServiceRequest() {
  const search = useSearch({ from: '/citizen/request' });
  const [kind, setKind] = useState<Kind>(search.type === 'building_permission' ? 'building_permission' : 'mutation');
  const [ulpin, setUlpin] = useState(search.ulpin ?? '');
  const [done, setDone] = useState<Application | null>(null);

  if (done) return <Success app={done} onNew={() => setDone(null)} />;

  return (
    <>
      <PageTitle title="Request a service" subtitle="Applications route to the owning department and appear in the officer queue" />
      <div className="mb-4 inline-flex rounded-md border border-line bg-panel p-1" role="tablist" aria-label="Service type">
        {(['mutation', 'building_permission'] as Kind[]).map((k) => (
          <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)} className={clsx('rounded px-3 py-1.5 text-sm font-medium', kind === k ? 'bg-primary text-primary-ink' : 'text-ink-2 hover:text-ink')}>
            {k === 'mutation' ? 'Mutation (transfer of RoR)' : 'Building permission'}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {kind === 'mutation' ? <MutationForm ulpin={ulpin} setUlpin={setUlpin} onDone={setDone} /> : <PermissionForm ulpin={ulpin} setUlpin={setUlpin} onDone={setDone} />}
        <aside className="text-sm text-ink-2">
          <Card className="p-4">
            <h3 className="font-semibold">What happens next</h3>
            {kind === 'mutation' ? (
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Submitted to the Revenue department.</li>
                <li>Document check against the registered deed.</li>
                <li>Field verification by the village revenue officer.</li>
                <li>Approval updates the Record of Rights; you get a new khata entry.</li>
              </ol>
            ) : (
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Automatic planning check against the master-plan zone (shown before you submit).</li>
                <li>Planning officer scrutiny.</li>
                <li>Site inspection.</li>
                <li>Permit issued with conditions.</li>
              </ol>
            )}
            <p className="mt-3 text-xs text-ink-3">Tax arrears or an active dispute on the parcel are surfaced to the officer and can hold an application.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}

function UlpinField({ ulpin, setUlpin }: { ulpin: string; setUlpin: (v: string) => void }) {
  return (
    <Field label="ULPIN" htmlFor="sr-ulpin" hint="Select a parcel on the map and choose “Request service” to prefill.">
      <Input id="sr-ulpin" mono required value={ulpin} onChange={(e) => setUlpin(e.target.value.toUpperCase())} placeholder="TDR1K3M9A2F7C1" />
    </Field>
  );
}

function MutationForm({ ulpin, setUlpin, onDone }: { ulpin: string; setUlpin: (v: string) => void; onDone: (a: Application) => void }) {
  const [reason, setReason] = useState('sale');
  const [newOwner, setNewOwner] = useState('');
  const [doc, setDoc] = useState<File | null>(null);
  const m = useMutation({
    mutationFn: () => api.createApplication(ulpin.trim(), 'mutation', { reason, new_owner_name: newOwner.trim(), document_name: doc?.name ?? null }),
    onSuccess: (a) => { toast.success('Mutation application submitted', a.id); onDone(a); },
  });
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  return (
    <Card>
      <CardHeader title="Mutation application" subtitle="Revenue department · RoR transfer" />
      <CardBody>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <UlpinField ulpin={ulpin} setUlpin={setUlpin} />
          <Field label="Reason for mutation" htmlFor="sr-reason">
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
          <Field label="Supporting document" hint="Deed / succession certificate (PDF or image). Upload is a placeholder in this prototype; only the file name is recorded.">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-line-strong px-3 py-3 text-sm hover:border-primary">
              <FileUp size={16} className="text-ink-3" />
              <span className="flex-1 truncate">{doc ? doc.name : 'Choose a file…'}</span>
              <input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => setDoc(e.target.files?.[0] ?? null)} />
            </label>
          </Field>
          {m.isError && <ErrorNote error={m.error} />}
          <Button type="submit" variant="primary" loading={m.isPending} className="self-start">Submit application</Button>
        </form>
      </CardBody>
    </Card>
  );
}

function PermissionForm({ ulpin, setUlpin, onDone }: { ulpin: string; setUlpin: (v: string) => void; onDone: (a: Application) => void }) {
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
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  return (
    <Card>
      <CardHeader title="Building permission" subtitle="Planning department · with automatic pre-check" />
      <CardBody>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <UlpinField ulpin={ulpin} setUlpin={(v) => { setUlpin(v); setChecked(false); }} />
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
              <p className="text-sm font-medium">Planning pre-check</p>
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
        </form>
      </CardBody>
    </Card>
  );
}

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
