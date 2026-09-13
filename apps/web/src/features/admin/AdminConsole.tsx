import { useState, type FormEvent } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { Activity, CircleCheck, CircleX, RefreshCcw, RotateCcw, Wand2 } from 'lucide-react';
import { api, qk } from '@/lib/api';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Field, Input } from '@/components/Field';
import { Loading } from '@/components/Spinner';
import { EmptyState, ErrorNote } from '@/components/EmptyState';
import { Badge } from '@/components/Badge';
import { toast } from '@/components/Toast';
import { fmtDate, relTime, titleCase } from '@/lib/format';
import { PageTitle } from '@/features/citizen/CitizenHome';

export function AdminConsole() {
  const search = useSearch({ strict: false }) as { ulpin?: string };
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-5">
      <PageTitle title="Admin & integration console" subtitle="Connector health, adapter mappings, consistency findings and demo controls" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Connectors />
          <Consistency />
          <Adapters />
        </div>
        <div className="flex flex-col gap-4">
          <SimulateDeed initialUlpin={search.ulpin ?? ''} />
          <DemoReset />
        </div>
      </div>
    </div>
  );
}

function Connectors() {
  const q = useQuery({ queryKey: qk.connectors(), queryFn: api.connectors, refetchInterval: 10_000 });
  return (
    <Card>
      <CardHeader title="Department connectors" subtitle="Auto-refreshes every 10 s" action={<Button size="sm" variant="ghost" icon={<RefreshCcw size={14} className={q.isFetching ? 'animate-spin' : ''} />} onClick={() => void q.refetch()}>Refresh</Button>} />
      <CardBody>
        {q.isLoading && <Loading />}
        {q.isError && <ErrorNote error={q.error} retry={() => void q.refetch()} />}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {q.data?.map((c) => (
            <div key={c.name} className={clsx('rounded-md border px-3 py-2', c.ok ? 'border-primary/25 bg-primary-soft/40' : 'border-brick/30 bg-brick-soft/50')}>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                {c.ok ? <CircleCheck size={15} className="text-primary" /> : <CircleX size={15} className="text-brick" />}
                {titleCase(c.name)}
              </div>
              <p className="mt-0.5 flex items-center gap-1 font-mono text-[11.5px] text-ink-2"><Activity size={11} /> {c.latency_ms ?? '—'} ms</p>
              <p className="text-[11px] text-ink-3" title={fmtDate(c.last_sync, true)}>sync {relTime(c.last_sync)}</p>
              {c.note && <p className="mt-0.5 truncate text-[11px] text-ink-3" title={c.note}>{c.note}</p>}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function Consistency() {
  const q = useQuery({ queryKey: qk.consistency(), queryFn: api.consistency });
  return (
    <Card>
      <CardHeader title="Consistency findings" subtitle="Fields that disagree across department systems" />
      <CardBody className="px-0 pb-0">
        {q.isLoading && <Loading />}
        {q.isError && <div className="px-4 pb-4"><ErrorNote error={q.error} retry={() => void q.refetch()} /></div>}
        {q.data && q.data.length === 0 && <EmptyState className="m-4" title="No findings" body="All compared fields agree." />}
        {q.data && q.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ground-2 text-left text-[11px] uppercase tracking-wide text-ink-3">
                <tr><th className="px-4 py-2 font-medium">Parcel</th><th className="px-3 py-2 font-medium">Field</th><th className="px-3 py-2 font-medium">Values</th><th className="px-3 py-2 font-medium">Severity</th><th className="px-3 py-2" /></tr>
              </thead>
              <tbody>
                {q.data.map((f, i) => (
                  <tr key={`${f.ulpin}-${f.field}-${i}`} className="border-t border-line">
                    <td className="px-4 py-2"><span className="font-medium">{f.survey_no ? `Sy. ${f.survey_no}` : ''}</span> <span className="font-mono text-xs text-ink-3">{f.ulpin}</span></td>
                    <td className="px-3 py-2">{titleCase(f.field)}</td>
                    <td className="px-3 py-2 text-ink-2">{Object.entries(f.values).map(([k, v]) => `${titleCase(k)}: ${String(v)}`).join(' · ')}</td>
                    <td className="px-3 py-2"><Badge tone={f.severity === 'high' ? 'brick' : 'amber'}>{titleCase(f.severity ?? 'medium')}</Badge></td>
                    <td className="px-3 py-2 text-right"><Link to="/map" search={{ ulpin: f.ulpin }} className="text-primary underline-offset-2 hover:underline">Open parcel</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function Adapters() {
  const q = useQuery({ queryKey: qk.adapters(), queryFn: api.adapters, staleTime: 5 * 60_000 });
  return (
    <Card>
      <CardHeader title="Adapter mappings" subtitle="How each department vocabulary maps onto the Common Data Model (from adapters/*.yaml)" />
      <CardBody className="flex flex-col gap-4">
        {q.isLoading && <Loading />}
        {q.isError && <ErrorNote error={q.error} retry={() => void q.refetch()} />}
        {q.data?.map((a) => (
          <div key={a.department}>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold">{titleCase(a.department)} <span className="font-normal text-ink-3">← {a.source_system}{a.endpoint ? ` · ${a.endpoint}` : ''}</span></div>
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full text-[13px]">
                <thead className="bg-ground-2 text-left text-[11px] uppercase tracking-wide text-ink-3"><tr><th className="px-3 py-1.5 font-medium">CDM field</th><th className="px-3 py-1.5 font-medium">Source field</th><th className="px-3 py-1.5 font-medium">Transform</th></tr></thead>
                <tbody>
                  {a.fields.map((f, i) => (
                    <tr key={i} className="border-t border-line"><td className="px-3 py-1 font-mono">{f.cdm_field}</td><td className="px-3 py-1 font-mono text-ink-2">{f.source_field}</td><td className="px-3 py-1 text-ink-3">{f.transform ?? '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function SimulateDeed({ initialUlpin }: { initialUlpin: string }) {
  const [ulpin, setUlpin] = useState(initialUlpin);
  const [claimant, setClaimant] = useState('');
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => api.simulateDeed(ulpin.trim(), claimant.trim()),
    onSuccess: () => {
      toast.success('Deed registered upstream', 'Registration → outbox → gateway event → system-initiated mutation');
      void qc.invalidateQueries({ queryKey: ['queue'] });
      void qc.invalidateQueries({ queryKey: ['parcel', ulpin.trim()] });
      void qc.invalidateQueries({ queryKey: qk.consistency() });
    },
    onError: (e: Error) => toast.error('Simulation failed', e.message),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  return (
    <Card>
      <CardHeader title="Simulate upstream change" subtitle="Registers a sale deed in the Registration system for a new claimant; watch the event create a pending mutation and an owner-mismatch finding." />
      <CardBody>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="ULPIN" htmlFor="sim-ulpin"><Input id="sim-ulpin" mono required value={ulpin} onChange={(e) => setUlpin(e.target.value.toUpperCase())} /></Field>
          <Field label="Claimant (new owner)" htmlFor="sim-claimant"><Input id="sim-claimant" required value={claimant} onChange={(e) => setClaimant(e.target.value)} placeholder="Lakshmi Devi" /></Field>
          {m.isError && <ErrorNote error={m.error} />}
          <Button type="submit" variant="primary" icon={<Wand2 size={15} />} loading={m.isPending} className="self-start">Register deed</Button>
          {m.data && <pre className="max-h-40 overflow-auto rounded-md bg-ground-2 p-2 font-mono text-[11px] text-ink-2">{JSON.stringify(m.data, null, 2)}</pre>}
        </form>
      </CardBody>
    </Card>
  );
}

function DemoReset() {
  const [confirm, setConfirm] = useState(false);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: api.demoReset,
    onSuccess: () => { toast.success('Demo data reset'); setConfirm(false); qc.clear(); },
    onError: (e: Error) => toast.error('Reset failed', e.message),
  });
  return (
    <Card>
      <CardHeader title="Demo reset" subtitle="Re-seeds departments, applications, alerts and audit log to the deterministic seed=42 state." />
      <CardBody>
        {!confirm ? (
          <Button variant="secondary" icon={<RotateCcw size={15} />} onClick={() => setConfirm(true)}>Reset demo data…</Button>
        ) : (
          <div className="rounded-md border border-brick/30 bg-brick-soft/60 p-3">
            <p className="text-sm font-medium text-brick">This discards every application and transition made during the demo.</p>
            <div className="mt-2 flex gap-2">
              <Button variant="danger" loading={m.isPending} onClick={() => m.mutate()}>Yes, reset</Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
