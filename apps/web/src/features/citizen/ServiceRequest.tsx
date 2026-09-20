import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  Check,
  CheckCircle2,
  Download,
  FileText,
  FileUp,
  Flag,
  Info,
  MapPin,
  PenLine,
  ShieldAlert,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { api, qk } from '@/lib/api';
import type { Application, ApplicationType } from '@/lib/cdm';
import { useAuth } from '@/lib/auth';
import { useMyParcel } from '@/lib/my-parcel';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Field, Input, Select, Textarea } from '@/components/Field';
import { ParcelPicker } from '@/components/ParcelPicker';
import { Button } from '@/components/Button';
import { ErrorNote } from '@/components/EmptyState';
import { Callout } from '@/components/Section';
import { Spinner } from '@/components/Spinner';
import { toast } from '@/components/Toast';
import { PageTitle } from './CitizenHome';
import { useTranslation } from '@/lib/i18n';

type Intent = 'mutation' | 'record_correction' | 'building_permission' | 'land_complaint' | 'succession';

function isIntent(v: unknown): v is Intent {
  return ['mutation', 'record_correction', 'building_permission', 'land_complaint', 'succession'].includes(v as string);
}

export function ServiceRequest() {
  const search = useSearch({ from: '/citizen/request' });
  const { t } = useTranslation();
  const [intent, setIntent] = useState<Intent | null>(isIntent(search.type) ? search.type : null);
  const [ulpin, setUlpin] = useState(search.ulpin ?? '');
  const [done, setDone] = useState<Application | null>(null);
  const { parcels, hasOwnedLand } = useMyParcel();

  const intents: { key: Intent; title: string; desc: string; icon: typeof ArrowRightLeft }[] = [
    { key: 'mutation', title: t('service.intentMutation'), desc: t('service.intentMutationDesc'), icon: ArrowRightLeft },
    { key: 'succession', title: t('service.intentSuccession'), desc: t('service.intentSuccessionDesc'), icon: UsersRound },
    { key: 'record_correction', title: t('service.intentCorrection'), desc: t('service.intentCorrectionDesc'), icon: PenLine },
    { key: 'building_permission', title: t('service.intentBuilding'), desc: t('service.intentBuildingDesc'), icon: Building2 },
    { key: 'land_complaint', title: t('service.intentComplaint'), desc: t('service.intentComplaintDesc'), icon: Flag },
  ];

  const steps: Record<Intent, string[]> = {
    mutation: [
      t('service.stepsTitle'),
      'Submitted to the Revenue department (Tahsildar office).',
      'Document check against the registered deed.',
      'Field verification by the Village Revenue Officer (VRO).',
      'Approval updates the Record of Rights; a new khata and passbook entry is generated.',
    ],
    record_correction: [
      t('service.stepsTitle'),
      'Submitted to the Revenue department.',
      'Officer compares the record with your supporting evidence.',
      'Approval corrects the official record; you can download a fresh Land Information Report.',
    ],
    building_permission: [
      t('service.stepsTitle'),
      'Automatic planning check against the master-plan zone.',
      'Planning officer scrutiny & ownership verification.',
      'Site inspection by municipal / town planning surveyor.',
      'Sanction permit issued with conditions.',
    ],
    land_complaint: [
      t('service.stepsTitle'),
      'Registered with a tracking ID straight away.',
      'A revenue or survey officer takes it up for review.',
      'You see the outcome and remarks in your tracking page.',
    ],
    succession: [
      t('service.stepsTitle'),
      'Submitted to the Revenue department.',
      'Officer verifies the death certificate and legal heirship certificates.',
      'Approval transfers the Record of Rights to lawful heirs.',
    ],
  };

  if (done) return <Success app={done} onNew={() => setDone(null)} />;

  return (
    <>
      <PageTitle title={t('service.applyTitle')} subtitle={t('service.subtitle')} />

      <Card className="mb-4 p-4">
        <Field label={t('service.pickParcel')} htmlFor="sr-ulpin" hint={t('service.pickParcelHint')}>
          <ParcelPicker id="sr-ulpin" value={ulpin} onChange={setUlpin} />
        </Field>
        {hasOwnedLand && parcels.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap pt-2.5 border-t border-line">
            <span className="text-xs font-semibold text-ink-2 flex items-center gap-1">
              <MapPin size={13} className="text-primary" /> {t('service.yourRegisteredLand')}
            </span>
            {parcels.map((p) => (
              <button
                key={p.ulpin}
                type="button"
                onClick={() => setUlpin(p.ulpin)}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer border',
                  ulpin.trim() === p.ulpin
                    ? 'border-primary bg-primary text-white shadow-xs'
                    : 'border-line bg-panel text-ink hover:border-primary/50'
                )}
              >
                <span>{t('common.surveyNo')} {p.survey_no}</span>
                <span className="opacity-70 text-[10.5px]">({p.village})</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label={t('service.selectIntent')}>
        {intents.map((it) => (
          <button
            key={it.key}
            role="radio"
            aria-checked={intent === it.key}
            onClick={() => setIntent(it.key)}
            className={clsx(
              'rounded-lg border p-3 text-left transition-colors cursor-pointer',
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
          {intent === 'building_permission' && <PermissionForm ulpin={ulpin} setUlpin={setUlpin} onDone={setDone} />}
          {intent === 'land_complaint' && <ComplaintForm ulpin={ulpin} onDone={setDone} />}
          {intent === 'succession' && <SuccessionForm ulpin={ulpin} onDone={setDone} />}
          <aside className="flex flex-col gap-3 text-sm text-ink-2">
            <PreCheckPanel ulpin={ulpin} type={intent} />
            <Card className="p-4">
              <h3 className="font-semibold">{t('service.stepsTitle')}</h3>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-ink-2">
                {steps[intent].slice(1).map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </Card>
          </aside>
        </div>
      )}
      {!intent && <p className="text-sm text-ink-3">{t('service.selectIntent')}</p>}
    </>
  );
}

/* ---------- Pre-submission check (deterministic rule engine) ---------- */

function PreCheckPanel({ ulpin, type }: { ulpin: string; type: ApplicationType }) {
  const { user } = useAuth();
  const { t } = useTranslation();
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
        <h3 className="font-semibold">{t('service.stepsTitle')}</h3>
        <p className="mt-1 text-xs text-ink-3">{t('service.pickParcelHint')}</p>
      </Card>
    );
  }
  if (q.isLoading) {
    return (
      <Card className="flex items-center gap-2 p-4 text-[13px] text-ink-2">
        <Spinner size={14} /> {t('common.loading')}
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
        <h3 className="font-semibold">{t('service.stepsTitle')}</h3>
        <span className="ml-auto font-mono text-[10px] text-ink-3" title="How this check was produced">
          {c.engine === 'rules' ? 'rule engine' : c.engine}
        </span>
      </div>
      {empty ? (
        <p className="mt-2 flex items-start gap-1.5 text-[13px]">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary" />
          {t('service.preCheckPassedDesc')}
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
        <p className="mt-2 border-t border-line pt-2 text-xs text-ink-3">
          {type === 'building_permission'
            ? t('service.onlyOwnerCanApply')
            : 'You can still submit — the officer decides. This check only tells you what they will see.'}
        </p>
      )}
    </Card>
  );
}

/* ---------- Shared bits ---------- */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocField({ doc, setDoc, hint }: { doc: File | null; setDoc: (f: File | null) => void; hint: string }) {
  const isPdf = doc?.type.includes('pdf') || doc?.name.toLowerCase().endsWith('.pdf');

  return (
    <Field label="Supporting document" hint={hint}>
      {!doc ? (
        <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-ground-2/50 px-4 py-4 text-center cursor-pointer transition-all hover:border-primary hover:bg-primary-soft/30 group">
          <div className="flex size-9 items-center justify-center rounded-lg bg-ground-1 text-ink-3 shadow-2xs group-hover:text-primary group-hover:scale-105 transition-all">
            <FileUp size={18} />
          </div>
          <span className="text-xs font-semibold text-ink group-hover:text-primary">
            Upload document (PDF, PNG, JPEG up to 10MB)
          </span>
          <span className="text-[11px] text-ink-3">
            Click to browse self-attested deed, legal heir certificate, or court order
          </span>
          <input
            type="file"
            accept="application/pdf,image/*"
            className="sr-only"
            onChange={(e) => setDoc(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary-soft/40 px-3.5 py-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={clsx('flex size-8 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold', isPdf ? 'bg-rose-600' : 'bg-primary')}>
              {isPdf ? 'PDF' : <FileText size={15} />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-ink leading-tight">{doc.name}</p>
              <div className="flex items-center gap-2 text-[10.5px] text-ink-3 mt-0.5">
                <span className="font-mono">{formatFileSize(doc.size)}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
                  <Check size={11} /> Ready for verification
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDoc(null)}
            title="Remove document"
            aria-label="Remove document"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-ground-1 hover:text-brick transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}
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
  const { t } = useTranslation();
  const [reason, setReason] = useState('sale');
  const [newOwner, setNewOwner] = useState('');
  const [doc, setDoc] = useState<File | null>(null);
  const m = useMutation({
    mutationFn: () => api.createApplication(ulpin.trim(), 'mutation', { reason, new_owner_name: newOwner.trim(), document_name: doc?.name ?? null }),
    onSuccess: (a) => { toast.success(t('service.successTitle'), a.id); onDone(a); },
  });
  return (
    <FormCard title={t('service.intentMutation')} subtitle="Revenue department · mutation of the Record of Rights" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
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
      <Button type="submit" variant="primary" loading={m.isPending} className="self-start" disabled={ulpin.trim().length < 8}>
        {t('service.btnSubmit')}
      </Button>
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
  const { t } = useTranslation();
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
    onSuccess: (a) => { toast.success(t('service.successTitle'), a.id); onDone(a); },
  });
  return (
    <FormCard title={t('service.intentCorrection')} subtitle="Revenue department · record correction" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
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
      <Button type="submit" variant="primary" loading={m.isPending} className="self-start" disabled={ulpin.trim().length < 8}>
        {t('service.btnSubmit')}
      </Button>
    </FormCard>
  );
}

const USES = ['residential', 'commercial', 'mixed', 'industrial', 'institutional'];

function PermissionForm({ ulpin, setUlpin, onDone }: { ulpin: string; setUlpin: (u: string) => void; onDone: (a: Application) => void }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { parcels, isLoading: loadingParcels } = useMyParcel();
  const isCitizen = user?.role === 'citizen';
  const ready = ulpin.trim().length >= 8;

  const [floors, setFloors] = useState(2);
  const [builtUp, setBuiltUp] = useState(150);
  const [use, setUse] = useState('residential');
  const [checked, setChecked] = useState(false);

  const preCheck = useQuery({
    queryKey: qk.preCheck(ulpin.trim(), 'building_permission', user?.uid ?? 'anon'),
    queryFn: () => api.preCheck(ulpin.trim(), 'building_permission'),
    enabled: ready,
    staleTime: 10_000,
  });

  const check = useQuery({
    queryKey: qk.planningCheck(ulpin.trim(), use, floors),
    queryFn: () => api.planningCheck(ulpin.trim(), use, floors),
    enabled: checked && ready,
  });

  const isDirectlyOwned = parcels.some((p) => p.ulpin.toLowerCase() === ulpin.trim().toLowerCase());
  const identityBlocker = preCheck.data?.blockers?.find((b) =>
    b.text.toLowerCase().includes('identity mismatch') || b.text.toLowerCase().includes('registered owner')
  );
  const isOwnershipDenied = isCitizen && ready && !loadingParcels && (!isDirectlyOwned || !!identityBlocker);
  const registeredOwnerName = preCheck.data?.ror_owner;

  const m = useMutation({
    mutationFn: () =>
      api.createApplication(ulpin.trim(), 'building_permission', {
        floors,
        built_up_sqm: builtUp,
        proposed_use: use,
        precheck: check.data ?? null,
      }),
    onSuccess: (a) => { toast.success(t('service.successTitle'), a.id); onDone(a); },
  });

  return (
    <FormCard title={t('service.intentBuilding')} subtitle="Planning department · with automatic zoning check" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      {isOwnershipDenied && (
        <div className="rounded-xl border border-brick/40 bg-brick/5 p-4 text-brick">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="shrink-0 mt-0.5 text-brick" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-ink">{t('service.titleMismatch')}</h4>
              <p className="text-xs text-ink-2 leading-relaxed">
                {t('service.titleMismatchDesc')} <strong className="text-ink">{user?.name}</strong>,{' '}
                {registeredOwnerName ? (
                  <>{t('service.registeredOwnerIs')} <strong className="text-ink">{registeredOwnerName}</strong>.</>
                ) : (
                  <>no registered title exists for parcel <span className="font-mono font-medium text-ink">{ulpin}</span>.</>
                )}
              </p>
              <p className="text-[11.5px] text-ink-3">
                {identityBlocker?.action ?? t('service.onlyOwnerCanApply')}
              </p>
              {parcels.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-line/60 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-ink">{t('service.yourRegisteredLand')}</span>
                  {parcels.map((p) => (
                    <button
                      key={p.ulpin}
                      type="button"
                      onClick={() => setUlpin(p.ulpin)}
                      className="inline-flex items-center gap-1 rounded-md bg-panel border border-line px-2.5 py-1 text-xs font-semibold text-primary hover:border-primary cursor-pointer shadow-2xs"
                    >
                      <MapPin size={11} />
                      <span>{t('common.surveyNo')} {p.survey_no} ({p.village})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Field label="Floors" htmlFor="sr-floors">
          <Input id="sr-floors" type="number" min={1} max={30} value={floors} onChange={(e) => { setFloors(Number(e.target.value)); setChecked(false); }} />
        </Field>
        <Field label={`Built-up area (${t('common.sqm')})`} htmlFor="sr-builtup">
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
          <Button size="sm" loading={check.isFetching} disabled={!ready || isOwnershipDenied} onClick={() => setChecked(true)}>
            {t('common.action')}
          </Button>
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
      <Button
        type="submit"
        variant="primary"
        loading={m.isPending}
        className="self-start"
        disabled={!checked || !check.data || isOwnershipDenied}
      >
        {isOwnershipDenied ? t('service.onlyOwnerCanApply') : t('service.btnSubmit')}
      </Button>
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
  const { t } = useTranslation();
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
    onSuccess: (a) => { toast.success(t('service.successTitle'), a.id); onDone(a); },
  });
  return (
    <FormCard title={t('service.intentComplaint')} subtitle="Registered immediately · any officer can take it up" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
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
      <Button type="submit" variant="primary" loading={m.isPending} className="self-start" disabled={ulpin.trim().length < 8}>
        {t('service.btnSubmit')}
      </Button>
    </FormCard>
  );
}

const RELATIONS = ['spouse', 'son', 'daughter', 'parent', 'sibling', 'other'];

function SuccessionForm({ ulpin, onDone }: { ulpin: string; onDone: (a: Application) => void }) {
  const { t } = useTranslation();
  const [deceased, setDeceased] = useState('');
  const [heir, setHeir] = useState('');
  const [relation, setRelation] = useState('spouse');
  const [doc, setDoc] = useState<File | null>(null);
  const m = useMutation({
    mutationFn: () =>
      api.createApplication(ulpin.trim(), 'succession', {
        deceased_name: deceased.trim(),
        nominee_name: heir.trim(),
        relation,
        document_name: doc?.name ?? null,
      }),
    onSuccess: (a) => { toast.success(t('service.successTitle'), a.id); onDone(a); },
  });
  return (
    <FormCard title={t('service.intentSuccession')} subtitle="Revenue department · succession — officer verifies heirship, nothing is automatic" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <Field label="Name of the deceased owner" htmlFor="sr-deceased" hint="Exactly as on the Record of Rights">
        <Input id="sr-deceased" required value={deceased} onChange={(e) => setDeceased(e.target.value)} />
      </Field>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
        <Field label="Heir / nominee name" htmlFor="sr-heir" hint="Recorded nominees (if any) are shown in the panel on the right">
          <Input id="sr-heir" required value={heir} onChange={(e) => setHeir(e.target.value)} />
        </Field>
        <Field label="Relation" htmlFor="sr-relation">
          <Select id="sr-relation" value={relation} onChange={(e) => setRelation(e.target.value)}>
            {RELATIONS.map((r) => <option key={r} value={r}>{r[0]!.toUpperCase() + r.slice(1)}</option>)}
          </Select>
        </Field>
      </div>
      <DocField doc={doc} setDoc={setDoc} hint="Death certificate and legal-heir certificate (or nominee record)." />
      {m.isError && <ErrorNote error={m.error} />}
      <Button type="submit" variant="primary" loading={m.isPending} className="self-start" disabled={ulpin.trim().length < 8}>
        {t('service.btnSubmit')}
      </Button>
    </FormCard>
  );
}

/* ---------- Success ---------- */

function Success({ app, onNew }: { app: Application; onNew: () => void }) {
  const { t } = useTranslation();
  const report = useMutation({
    mutationFn: () => api.issueReport(app.ulpin),
    onSuccess: (r) => window.open(r.url.startsWith('http') ? r.url : api.reportPdfUrl(r.id), '_blank', 'noopener'),
    onError: (e: Error) => toast.error('Could not issue report', e.message),
  });
  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-6 text-center">
        <CheckCircle2 size={44} className="mx-auto text-primary" />
        <h1 className="mt-3 text-xl font-semibold">{t('service.successTitle')}</h1>
        <p className="mt-1 text-sm text-ink-2">{t('service.successDesc')}</p>
        <p className="mt-3 inline-block rounded-md border border-line bg-ground-2 px-3 py-1.5 font-mono text-lg">{app.id}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/citizen/track/$id" params={{ id: app.id }}>
            <Button variant="primary">{t('service.trackApplication')}</Button>
          </Link>
          <Button icon={<Download size={15} />} loading={report.isPending} onClick={() => report.mutate()}>
            {t('drawer.downloadLIR')}
          </Button>
          <Button variant="ghost" onClick={onNew}>{t('track.newRequest')}</Button>
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
