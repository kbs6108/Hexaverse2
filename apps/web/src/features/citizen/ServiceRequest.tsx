import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileCheck,
  FileText,
  FileUp,
  Flag,
  Info,
  MapPin,
  PenLine,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { fmtArea, fmtINR } from '@/lib/format';
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

type Intent = 'mutation' | 'record_correction' | 'building_permission' | 'land_complaint' | 'succession' | 'utility_request' | 'acquisition_claim' | 'boundary_correction';

function isIntent(v: unknown): v is Intent {
  return ['mutation', 'record_correction', 'building_permission', 'land_complaint', 'succession', 'utility_request', 'acquisition_claim', 'boundary_correction'].includes(v as string);
}

export function ServiceRequest() {
  const search = useSearch({ from: '/citizen/request' });
  const { t } = useTranslation();
  const { user } = useAuth();
  const [intent, setIntent] = useState<Intent | null>(isIntent(search.type) ? search.type : null);
  const [ulpin, setUlpin] = useState(search.ulpin ?? '');
  const [done, setDone] = useState<Application | null>(null);
  const { parcels, hasOwnedLand } = useMyParcel();

  // Query active parcel when ulpin is provided
  const activeParcelQ = useQuery({
    queryKey: qk.parcel(ulpin.trim(), user?.uid ?? 'anon'),
    queryFn: () => api.parcel(ulpin.trim()),
    enabled: !!ulpin && ulpin.trim().length >= 8,
    staleTime: 30_000,
  });
  const activeCdm = activeParcelQ.data;

  // Government project settlement is strictly visible ONLY to applicable citizens:
  // 1) Selected parcel has an active acquisition impact, OR
  // 2) Any owned parcel has an active acquisition notice.
  const isAcquisitionApplicable = Boolean(
    (activeCdm?.acquisition && activeCdm.acquisition.length > 0) ||
    parcels.some((p) => p.has_acquisition_notice)
  );

  const intents: { key: Intent; title: string; desc: string; icon: typeof ArrowRightLeft }[] = [
    { key: 'mutation', title: t('service.intentMutation'), desc: t('service.intentMutationDesc'), icon: ArrowRightLeft },
    { key: 'succession', title: t('service.intentSuccession'), desc: t('service.intentSuccessionDesc'), icon: UsersRound },
    { key: 'record_correction', title: t('service.intentCorrection'), desc: t('service.intentCorrectionDesc'), icon: PenLine },
    { key: 'boundary_correction', title: 'Boundary Demarcation & Correction', desc: 'Request cadastral FMB survey, missing boundary stones demarcation, or dispute resolution.', icon: MapPin },
    { key: 'utility_request', title: t('service.intentUtility', 'Utility Services & Connections'), desc: t('service.intentUtilityDesc', 'Apply for electricity, water, sewer, or gas connections; name transfer or load change.'), icon: Zap },
    ...(isAcquisitionApplicable ? [
      { key: 'acquisition_claim' as Intent, title: 'Land Acquisition & Project Response', desc: 'Respond to statutory notices (RFCTLARR 2013 / NHAI Act): Accept consent payout (+25%), negotiate compensation (§64), or file objection (§15).', icon: Scale },
    ] : []),
    { key: 'building_permission', title: t('service.intentBuilding'), desc: t('service.intentBuildingDesc'), icon: Building2 },
    { key: 'land_complaint', title: t('service.intentComplaint'), desc: t('service.intentComplaintDesc'), icon: Flag },
  ];


  const steps: Record<Intent, string[]> = {
    mutation: [
      t('service.stepsTitle'),
      'Stage 1 (VRO): On-ground field inspection, ryot notices to adjoining fields, and Panchanama with village elders.',
      'Stage 2 (Mandal Surveyor): High-precision FMB traverse check and subdivision demarcation (if partial parcel transfer).',
      'Stage 3 (Revenue Inspector): Scrutiny of 30-year encumbrance index, link deeds, and public objection records.',
      'Stage 4 (Tahsildar / MRO): Quasi-judicial Speaking Order under ROR Act; updates RoR 1-B and issues e-Pattadar Passbook.',
    ],
    record_correction: [
      t('service.stepsTitle'),
      'Stage 1: Automated cross-check against 30-year Registration deed index and cadastral settlement registers.',
      'Stage 2: Field inquiry by Village Revenue Officer (VRO) to confirm physical possession and ground classification.',
      'Stage 3: Scrutiny by Revenue Inspector (RI) against original settlement registers and link deeds.',
      'Stage 4: Quasi-judicial rectification order by Tahsildar updates the Record of Rights and issues a verified Land Information Report.',
    ],
    building_permission: [
      t('service.stepsTitle'),
      'Instant automated zoning check against master-plan regulations, permissible land uses, and road width.',
      'Town Planning Officer title verification and planning guideline conformity scrutiny.',
      'Site inspection by municipal / town planning surveyor to verify setbacks and ground coverage.',
      'Sanction permit issued with digital QR verification and automated revenue notification.',
    ],
    land_complaint: [
      t('service.stepsTitle'),
      'Registered with instant statutory tracking ID and assigned to designated Mandal grievance desk.',
      'Field inquiry and inquest conducted by Village Revenue Officer / Revenue Inspector within 15 days.',
      'Quasi-judicial determination or action-taken report passed by the Tahsildar with formal citizen notice.',
    ],
    succession: [
      t('service.stepsTitle'),
      'Submitted with registered death certificate and legal heirship certificate / family tree.',
      'VRO field inquiry with village panchas to confirm surviving legal heirs in peaceful possession.',
      'Public statutory notice window (15–30 days) published on village notice board for objections.',
      'Tahsildar passes formal succession order transferring Record of Rights (RoR) title to lawful heirs.',
    ],
    utility_request: [
      t('service.stepsTitle'),
      'Submitted to municipal single-window desk and respective utility board (DISCOM / Water Board / CGD).',
      'VRO / Surveyor verifies ground feasibility, service line right-of-way alignment, and lawful connection.',
      'Technical scrutiny of sanctioned electrical load or water/sewer pipe specifications by utility engineer.',
      'Statutory connection sanction issued; spatial easement automatically registered in cadastre.',
    ],
    acquisition_claim: [
      'Statutory Claim & Response Workflow (RFCTLARR Act 2013 / NHAI Act)',
      'Notice & Claim response registered with Competent Authority for Land Acquisition (CALA / Revenue Division).',
      'VRO and Surveyor title & physical severance demarcation on ground.',
      'Certified structural, crop, and tree asset damage evaluation by approved government valuer.',
      'Statutory personal hearing conducted by the Competent Authority under Section 15 / Section 64.',
      'Final compensation award decree passed; direct DBT treasury payout disbursed or TDR certificate generated.',
    ],
    boundary_correction: [
      t('service.stepsTitle'),
      'Filed under the State Survey & Boundaries Act with Mandal Survey & Settlement Office.',
      'Cadastral vertex and FMB tippen verification within statutory ±15% area variance norm.',
      'On-ground demarcation with ETS / DGPS and statutory notice served to adjacent field ryots.',
      'Two-officer ratification: Surveyor submits demarcated polygon → Tahsildar signs order updating PostGIS cadastre.',
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
          {intent === 'utility_request' && <UtilityForm ulpin={ulpin} onDone={setDone} />}
          {intent === 'acquisition_claim' && (
            isAcquisitionApplicable ? (
              <AcquisitionClaimForm
                ulpin={ulpin}
                onDone={setDone}
                initialMode={(search as Record<string, any>).response_mode}
              />
            ) : (
              <Card className="p-5 border-amber-200 bg-amber-50/60 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-100 p-2 text-amber-800 shrink-0">
                    <Scale size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-ink">Government Project Settlement Not Applicable</h3>
                    <p className="text-xs text-ink-2 leading-relaxed">
                      Statutory Land Acquisition Claims (RFCTLARR Act, 2013) are strictly restricted to citizens whose land parcels are officially notified under a Gazette infrastructure alignment or road widening project.
                    </p>
                    <p className="text-xs text-amber-900 font-medium">
                      No active acquisition notice or corridor impact applies to {ulpin ? `parcel ${ulpin}` : 'your selected land'}.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200">
                  <Button variant="secondary" size="sm" onClick={() => setIntent('mutation')}>
                    Apply for Mutation
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setIntent('boundary_correction')}>
                    Boundary Demarcation
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setIntent('record_correction')}>
                    Record Correction
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setIntent(null)}>
                    View All Services
                  </Button>
                </div>
              </Card>
            )
          )}
          {intent === 'building_permission' && <PermissionForm ulpin={ulpin} setUlpin={setUlpin} onDone={setDone} />}
          {intent === 'land_complaint' && <ComplaintForm ulpin={ulpin} onDone={setDone} />}
          {intent === 'succession' && <SuccessionForm ulpin={ulpin} onDone={setDone} />}
          {intent === 'boundary_correction' && <BoundaryCorrectionForm ulpin={ulpin} onDone={setDone} />}
          <aside className="flex flex-col gap-3 text-sm text-ink-2">
            <RequiredDocumentsCard intent={intent} />
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
        <h3 className="font-semibold text-xs text-ink flex items-center gap-1.5">
          <Scale size={14} className="text-primary" /> Statutory Pre-Check
        </h3>
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
        <h3 className="font-semibold text-xs text-ink flex items-center gap-1.5">
          <Scale size={14} className="text-primary" /> Statutory Pre-Check
        </h3>
        <span className="ml-auto font-mono text-[10px] text-ink-3" title="How this check was produced">
          {c.engine === 'rules' ? 'Statutory Rule Engine' : 'Cadastral Check'}
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

/* ---------- Statutory Document Checklist Requirements ---------- */

export interface StatutoryDoc {
  title: string;
  requirement: 'mandatory' | 'conditional';
  issuingAuthority: string;
  description: string;
  legalRef?: string;
  conditionNote?: string;
}

export const STATUTORY_DOCUMENTS: Record<Intent, StatutoryDoc[]> = {
  boundary_correction: [
    {
      title: 'Registered Title Deed / Pattadar Passbook',
      requirement: 'mandatory',
      issuingAuthority: 'Sub-Registrar Office / Revenue Dept',
      description: 'Document proving ownership title to the parcel for which boundary demarcation is requested.',
      legalRef: 'State Survey and Boundaries Act',
    },
    {
      title: 'Existing Field Measurement Book (FMB) / Tippon Sketch',
      requirement: 'mandatory',
      issuingAuthority: 'Survey & Land Records Department',
      description: 'Certified cadastral village map extract or FMB sketch showing traverse lines and ladder measurements.',
      legalRef: 'Survey Manual & Demarcation Rules',
    },
    {
      title: 'Adjacent Landowners Details & Schedule of Boundaries',
      requirement: 'conditional',
      issuingAuthority: 'Self Declaration / Village Revenue Officer',
      description: 'North, South, East, West boundary neighbours list for issuance of statutory survey notices.',
      conditionNote: 'Required if boundaries border private holdings to avoid contiguous boundary litigation.',
      legalRef: 'Notice to Interested Persons under Survey Act',
    },
  ],
  mutation: [
    {
      title: 'Registered Sale / Gift / Partition / Settlement Deed',
      requirement: 'mandatory',
      issuingAuthority: 'Sub-Registrar Office (SRO)',
      description: 'Original registered deed bearing registration number, volume/page number, official stamp duty seal, and executant signatures.',
      legalRef: 'Registration Act, 1908 · Sec 17',
    },
    {
      title: 'Encumbrance Certificate (EC Form 15)',
      requirement: 'mandatory',
      issuingAuthority: 'Registration & Stamps Dept (IGRS)',
      description: 'Continuous 13–30 year non-encumbrance search confirming the parcel is free from prior mortgages, liens, or court attachments.',
      legalRef: 'Transfer of Property Act, 1882 · Sec 55',
    },
    {
      title: 'Latest Land Revenue / Property Tax Challan',
      requirement: 'mandatory',
      issuingAuthority: 'Revenue Dept / Gram Panchayat / ULB',
      description: 'Current fiscal year tax receipt (Khajana challan or municipal tax) showing zero pending arrears on the parcel.',
      legalRef: 'State Land Revenue Code',
    },
    {
      title: 'Transferee & Transferor Identity Verification',
      requirement: 'mandatory',
      issuingAuthority: 'UIDAI / Election Commission',
      description: 'Aadhaar / Voter ID / PAN cards matching exact party names and addresses as executed on the registered instrument.',
      legalRef: 'DILRMP Citizen KYC Guidelines',
    },
    {
      title: 'Certified Civil Court Decree & Execution Order',
      requirement: 'conditional',
      issuingAuthority: 'Competent Civil / High Court',
      description: 'Certified copy of civil court judgment, decree sheet, and Order XXI execution order.',
      conditionNote: 'Mandatory if title transfer arises from a civil suit or court auction decree rather than a voluntary deed.',
      legalRef: 'Code of Civil Procedure, 1908 · Order XXI',
    },
    {
      title: 'Prior Title Link Deeds (Chain of Title)',
      requirement: 'conditional',
      issuingAuthority: 'Sub-Registrar Office (SRO)',
      description: 'Chain of prior title deeds establishing unbroken ownership trail for 30 years.',
      conditionNote: 'Required if Tahsildar / Revenue Officer flags parent title discontinuities during scrutiny.',
    },
    {
      title: 'Agricultural Land Ceiling Self-Declaration',
      requirement: 'conditional',
      issuingAuthority: 'Notary Public / Oath Commissioner',
      description: 'Sworn affidavit affirming the purchaser’s aggregate landholding does not exceed statutory ceiling limits.',
      conditionNote: 'Required for agricultural parcel transfers exceeding state statutory ceiling limits.',
      legalRef: 'Land Reforms (Ceiling on Agricultural Holdings) Act',
    },
  ],

  succession: [
    {
      title: 'Official Death Certificate of Registered Owner',
      requirement: 'mandatory',
      issuingAuthority: 'Municipal Corp / Gram Panchayat / Registrar of Births & Deaths',
      description: 'Certified death certificate containing official registration number, date of demise, and deceased name matching the Record of Rights.',
      legalRef: 'Registration of Births and Deaths Act, 1969',
    },
    {
      title: 'Legal Heir Certificate / Surviving Member Certificate',
      requirement: 'mandatory',
      issuingAuthority: 'Tahsildar / Revenue Divisional Officer (RDO)',
      description: 'Statutory certificate formally listing all Class-I and lawful surviving legal heirs of the deceased landholder.',
      legalRef: 'Hindu Succession Act / Indian Succession Act',
    },
    {
      title: 'Genealogy / Family Tree Affidavit (Vamshavruksha)',
      requirement: 'mandatory',
      issuingAuthority: 'Notary Public / Executive Magistrate',
      description: 'Notarized sworn affidavit on non-judicial stamp paper depicting the full lineage and family hierarchy.',
      legalRef: 'Revenue Department Citizen Charter',
    },
    {
      title: 'Government Identity Proof of All Surviving Heirs',
      requirement: 'mandatory',
      issuingAuthority: 'UIDAI / Election Commission',
      description: 'Aadhaar Card or Voter ID for every surviving legal heir specified in the Legal Heir Certificate.',
      legalRef: 'DILRMP KYC Norms',
    },
    {
      title: 'Registered Relinquishment / Release Deed (Hakku Sodapatra)',
      requirement: 'conditional',
      issuingAuthority: 'Sub-Registrar Office (SRO)',
      description: 'Registered release deed where co-heirs formally relinquish their inherited shares in favour of a single applicant.',
      conditionNote: 'Mandatory if mutating the parcel into a single heir’s name when multiple surviving heirs exist.',
      legalRef: 'Registration Act, 1908 · Sec 17(1)(b)',
    },
    {
      title: 'Registered Will & Probate / Letters of Administration',
      requirement: 'conditional',
      issuingAuthority: 'Sub-Registrar Office / District Civil Court',
      description: 'Registered testamentary will along with certified civil court probate order.',
      conditionNote: 'Mandatory if succession claim is predicated on a Testamentary Will rather than natural legal heirship.',
      legalRef: 'Indian Succession Act, 1925 · Sec 213',
    },
    {
      title: 'Deceased Owner’s Patta Passbook / RoR-1B Extract',
      requirement: 'conditional',
      issuingAuthority: 'Revenue Department',
      description: 'Original or certified copy of the deceased pattadar’s passbook to verify khata continuity.',
      conditionNote: 'Recommended to expedite revenue account linkage and avoid manual survey delays.',
    },
  ],

  record_correction: [
    {
      title: 'Parent Registered Title Deed / Grant Order',
      requirement: 'mandatory',
      issuingAuthority: 'Sub-Registrar Office (SRO) / Revenue Department',
      description: 'Primary legal instrument verifying authentic particulars (spelling of name, parentage, survey number, or boundary extents).',
      legalRef: 'Registration Act, 1908',
    },
    {
      title: 'Government Photo Identity Proof (Aadhaar / Passport)',
      requirement: 'mandatory',
      issuingAuthority: 'UIDAI / Passport Office / Income Tax',
      description: 'Official photo identity confirming the correct legal name and personal identifiers.',
      legalRef: 'National Identity Standards',
    },
    {
      title: 'Current Erroneous Record of Rights / Patta Extract',
      requirement: 'mandatory',
      issuingAuthority: 'Land Revenue Portal (Dharani / Bhulekh / Meebhoomi)',
      description: 'Certified digital copy of Pahani, RoR-1B, or Khata extract highlighting the clerical error.',
      legalRef: 'State Record of Rights Act',
    },
    {
      title: 'Notarized Discrepancy & Indemnity Affidavit',
      requirement: 'mandatory',
      issuingAuthority: 'Notary Public / Executive Magistrate',
      description: 'Sworn affidavit explaining how the clerical or data-entry mistake occurred and indemnifying the revenue department.',
      legalRef: 'Indian Oaths Act, 1969',
    },
    {
      title: 'Field Measurement Book (FMB) / Survey Sketch / Tippan',
      requirement: 'conditional',
      issuingAuthority: 'Survey & Land Records Department (ADSLR)',
      description: 'Cadastral survey sketch showing original boundary offsets, sub-division lines, and measurements.',
      conditionNote: 'Mandatory if the requested correction involves land extent (area in sqm/acres) or boundary dimensions.',
      legalRef: 'Survey and Boundaries Act',
    },
    {
      title: 'Registered Rectification Deed (Tatimmma / Correction Deed)',
      requirement: 'conditional',
      issuingAuthority: 'Sub-Registrar Office (SRO)',
      description: 'Bilateral registered instrument amending errors contained in the original registered transfer document.',
      conditionNote: 'Mandatory if the error originated in the registered deed itself rather than revenue portal data entry.',
      legalRef: 'Specific Relief Act, 1963 · Sec 26',
    },
  ],

  building_permission: [
    {
      title: 'Registered Title Deed / Patta Passbook (Ownership Proof)',
      requirement: 'mandatory',
      issuingAuthority: 'Sub-Registrar Office (SRO) / Revenue Dept',
      description: 'Clear freehold title deed or pattadar passbook proving undisputed parcel ownership.',
      legalRef: 'Transfer of Property Act, 1882',
    },
    {
      title: 'Architectural Working Drawings & Sanction Dossier',
      requirement: 'mandatory',
      issuingAuthority: 'Council of Architecture (COA) Registered Architect',
      description: 'Complete drawings (Site Plan, Key Plan, Floor Plans, Cross-Sections, Elevations, Parking Layout) bearing COA registration stamp and digital signature.',
      legalRef: 'National Building Code (NBC) · Part 2',
    },
    {
      title: 'Site Plan with Abutting Road Width & Setback Layout',
      requirement: 'mandatory',
      issuingAuthority: 'Licensed Town Planning Surveyor / Architect',
      description: 'Site plan indicating existing abutting public road width, proposed ground coverage, FAR/FSI calculations, and statutory setbacks.',
      legalRef: 'Unified Building Bye-Laws (UBBL)',
    },
    {
      title: 'Structural Stability Certificate',
      requirement: 'mandatory',
      issuingAuthority: 'Empanelled Structural Engineer',
      description: 'Structural calculation endorsement certifying seismic zone resistance, wind load compliance, and foundation stability.',
      legalRef: 'IS 1893 & IS 456 Seismic Codes',
    },
    {
      title: 'Encumbrance Certificate (EC Form 15)',
      requirement: 'mandatory',
      issuingAuthority: 'Registration & Stamps Dept (IGRS)',
      description: 'Current nil-encumbrance certificate up to date of application confirming no active mortgages or liens.',
    },
    {
      title: 'Latest Municipal Property Tax Clearance Challan',
      requirement: 'mandatory',
      issuingAuthority: 'Urban Local Body / Municipal Corporation',
      description: 'Paid challan evidencing zero pending municipal property tax, development charges, or vacant land tax dues.',
    },
    {
      title: 'Non-Agricultural Land Conversion (NALA / CLU) Order',
      requirement: 'conditional',
      issuingAuthority: 'Revenue Divisional Officer (RDO) / Collector',
      description: 'Statutory order regularizing conversion of agricultural land into non-agricultural / residential / commercial use.',
      conditionNote: 'Mandatory if the parcel was originally categorized as agricultural in the revenue register.',
      legalRef: 'Non-Agricultural Land Assessment (NALA) Act',
    },
    {
      title: 'Fire Department & Environmental NOC',
      requirement: 'conditional',
      issuingAuthority: 'State Disaster Response & Fire Services / SPCB',
      description: 'Provisional Fire Safety NOC and Pollution Control Board consent to establish.',
      conditionNote: 'Mandatory for high-rise buildings (height > 15m), commercial developments, or industrial complexes.',
      legalRef: 'Fire Prevention and Life Safety Measures Act',
    },
  ],

  land_complaint: [
    {
      title: 'Proof of Lawful Title & Possession',
      requirement: 'mandatory',
      issuingAuthority: 'Revenue Department / Sub-Registrar Office',
      description: 'Registered Title Deed, Patta Passbook, or certified latest Record of Rights (RoR-1B) proving lawful ownership and possession.',
      legalRef: 'State Land Revenue Code',
    },
    {
      title: 'Cadastral Survey Map / Field Measurement Book (FMB) Extract',
      requirement: 'mandatory',
      issuingAuthority: 'Survey & Land Records Department',
      description: 'Official survey sketch marking parcel boundaries and clearly delineating the disputed or encroached area.',
      legalRef: 'Survey and Boundaries Act',
    },
    {
      title: 'Geotagged & Timestamped Ground Photographs',
      requirement: 'mandatory',
      issuingAuthority: 'Complainant / Site Inspection Camera',
      description: 'High-resolution photographs showing boundary stone destruction, unauthorized construction, wall building, or illegal fencing.',
      legalRef: 'Bharatiya Sakshya Adhiniyam / Evidence Act',
    },
    {
      title: 'Police Complaint Acknowledgment (CSR / FIR Copy)',
      requirement: 'conditional',
      issuingAuthority: 'Local Police Station',
      description: 'Certified copy of Community Service Register (CSR) or First Information Report (FIR) for trespass or criminal breach.',
      conditionNote: 'Recommended if the dispute involves criminal trespass, threats of violence, or counterfeit documents.',
      legalRef: 'BNS / Code of Criminal Procedure · Sec 145/146',
    },
    {
      title: 'Prior Legal Notice / Village Panchayat Resolution Copy',
      requirement: 'conditional',
      issuingAuthority: 'Advocate / Gram Panchayat',
      description: 'Copies of previously issued legal notices, postal delivery track reports, or Panchayat settlement attempts.',
      conditionNote: 'Attach if legal notices have already been served to the opposing party.',
    },
  ],

  utility_request: [
    {
      title: 'Proof of Title Ownership (RoR Passbook / Registered Sale Deed)',
      requirement: 'mandatory',
      issuingAuthority: 'Revenue Department / Sub-Registrar Office',
      description: 'Documentary evidence establishing lawful ownership or right to occupy the premises.',
      legalRef: 'Electricity Act 2003 / Municipal Water Works Bylaws',
    },
    {
      title: 'Government Identity Proof (Aadhaar / Passport / Voter ID)',
      requirement: 'mandatory',
      issuingAuthority: 'UIDAI / Election Commission / Govt of India',
      description: 'Photo identity of the applicant or designated authorized signatory.',
      legalRef: 'KYC Standards for Utility Consumers',
    },
    {
      title: 'Municipal Property Tax Assessment & Clearance Receipt',
      requirement: 'mandatory',
      issuingAuthority: 'Urban Local Body (ULB) / Gram Panchayat',
      description: 'Latest municipal property tax receipt or assessment order showing no outstanding tax arrears.',
      legalRef: 'Municipal Corporation Act',
    },
    {
      title: 'Existing Utility Bill (Power / Water / Gas)',
      requirement: 'conditional',
      issuingAuthority: 'DISCOM / Water Board / City Gas Distributor',
      description: 'Previous consumer bill copy showing USC / CAN / BP number.',
      conditionNote: 'Mandatory for Name Transfer, Load Enhancement, Tariff Category Change, or Meter Replacement.',
    },
    {
      title: 'Sanctioned Building Plan / Town Planning NOC',
      requirement: 'conditional',
      issuingAuthority: 'DTCP / APCRDA / Urban Development Authority',
      description: 'Approved architectural floor plan and building permit order.',
      conditionNote: 'Mandatory for commercial connections, multi-floor high-rises, or loads exceeding 10 kW.',
    },
    {
      title: 'No-Objection Certificate (NOC) / Landlord Consent',
      requirement: 'conditional',
      issuingAuthority: 'Property Owner / Notary Public',
      description: 'NOC from registered pattadar if applicant is a tenant or industrial occupant.',
      conditionNote: 'Required if applicant name differs from the registered land title holder.',
    },
  ],

  acquisition_claim: [
    {
      title: 'Title Deed & Updated Pattadar Passbook (RoR-1B)',
      requirement: 'mandatory',
      issuingAuthority: 'Registration & Stamps / Revenue Dept',
      description: 'Official proof of title and lawful possession establishing your right to claim statutory compensation.',
      legalRef: 'RFCTLARR Act 2013 Section 11',
    },
    {
      title: 'Bank Passbook / Cancelled Cheque with IFSC',
      requirement: 'mandatory',
      issuingAuthority: 'Scheduled Commercial Bank',
      description: 'Required for direct government electronic treasury disbursement (Direct Benefit Transfer - DBT).',
      legalRef: 'Direct Benefit Transfer (DBT) Mandate',
    },
    {
      title: 'Certified Valuation Report / Recent Registered Deeds',
      requirement: 'conditional',
      issuingAuthority: 'Govt Approved Valuer / Sub-Registrar Office',
      description: 'Evidence of higher fair market value or commercial potential when filing for enhancement under Section 64.',
      conditionNote: 'Required if claiming higher compensation or disputing the circle guideline rate.',
      legalRef: 'RFCTLARR Act 2013 Section 64',
    },
    {
      title: 'Site Photographs & Structural / Tree Asset Evidence',
      requirement: 'conditional',
      issuingAuthority: 'Self-attested / Licensed Surveyor',
      description: 'Photographs of existing residential structures, borewells, perimeter walls, or orchards inside the project strip.',
      conditionNote: 'Required if claiming asset damages under Section 29 or severance relief under Section 94.',
    },
  ],
};

/* ---------- Statutory Document Checklist Sidebar Card ---------- */

function RequiredDocumentsCard({ intent }: { intent: Intent }) {
  const [filter, setFilter] = useState<'all' | 'mandatory' | 'conditional'>('all');
  const docs = STATUTORY_DOCUMENTS[intent] || [];
  const mandatory = docs.filter((d) => d.requirement === 'mandatory');
  const conditional = docs.filter((d) => d.requirement === 'conditional');

  const displayed = filter === 'all' ? docs : filter === 'mandatory' ? mandatory : conditional;

  return (
    <Card className="p-4 overflow-hidden">
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-line">
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
            <FileCheck size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-ink text-sm leading-snug">Statutory Document Checklist</h3>
            <p className="text-[11.5px] text-ink-3">Required under Indian Land Revenue & Registration Acts</p>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 p-1 rounded-lg bg-ground-2 border border-line text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={clsx(
            'flex-1 py-1 rounded-md font-medium text-center transition-all cursor-pointer text-[11.5px]',
            filter === 'all' ? 'bg-panel text-ink shadow-2xs font-semibold' : 'text-ink-3 hover:text-ink'
          )}
        >
          All ({docs.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('mandatory')}
          className={clsx(
            'flex-1 py-1 rounded-md font-medium text-center transition-all cursor-pointer text-[11.5px]',
            filter === 'mandatory' ? 'bg-panel text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold' : 'text-ink-3 hover:text-ink'
          )}
        >
          Mandatory ({mandatory.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('conditional')}
          className={clsx(
            'flex-1 py-1 rounded-md font-medium text-center transition-all cursor-pointer text-[11.5px]',
            filter === 'conditional' ? 'bg-panel text-amber-600 dark:text-amber-400 shadow-2xs font-semibold' : 'text-ink-3 hover:text-ink'
          )}
        >
          As Applicable ({conditional.length})
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {displayed.map((d, i) => (
          <div
            key={i}
            className="group rounded-lg border border-line bg-panel p-3 text-xs transition-all hover:border-line-strong hover:shadow-2xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 min-w-0">
                {d.requirement === 'mandatory' ? (
                  <FileText size={14} className="text-primary shrink-0 mt-0.5" />
                ) : (
                  <Info size={14} className="text-amber shrink-0 mt-0.5" />
                )}
                <span className="font-bold text-ink leading-tight text-[12.5px]">{d.title}</span>
              </div>
              <span
                className={clsx(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide',
                  d.requirement === 'mandatory'
                    ? 'bg-primary-soft/40 text-primary border-primary/20'
                    : 'bg-amber-500/10 text-amber-800 border-amber-500/20 dark:text-amber-300'
                )}
              >
                {d.requirement === 'mandatory' ? 'Mandatory' : 'As Applicable'}
              </span>
            </div>

            <p className="mt-1.5 text-ink-2 text-[11.5px] leading-relaxed pl-5">{d.description}</p>

            <div className="mt-2 flex items-center justify-between gap-2 flex-wrap pl-5 pt-1.5 border-t border-line/60 text-[10.5px]">
              <span className="inline-flex items-center gap-1 font-mono text-ink-3">
                <Building2 size={11} className="text-ink-4 shrink-0" /> {d.issuingAuthority}
              </span>
              {d.legalRef && (
                <span className="text-ink-3 italic font-medium">
                  § {d.legalRef}
                </span>
              )}
            </div>

            {d.conditionNote && (
              <div className="mt-2 ml-5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                <strong className="font-semibold">When required:</strong> {d.conditionNote}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2.5 border-t border-line flex items-start gap-2 text-[11px] text-ink-3">
        <ShieldCheck size={14} className="text-primary shrink-0 mt-0.5" />
        <span>
          Upload official records (PDF, PNG, JPG). Automated cadastral scrutiny will verify deed covenants, boundary schedules, and party identity against spatial registers.
        </span>
      </div>
    </Card>
  );
}

/* ---------- Shared bits ---------- */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocField({
  intent,
  ulpin,
  doc,
  setDoc,
  hint,
  onAutoFill,
}: {
  intent?: Intent;
  ulpin?: string;
  doc: File | null;
  setDoc: (f: File | null) => void;
  hint: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAutoFill?: (extracted: Record<string, any>) => void;
}) {
  const isPdf = doc?.type.includes('pdf') || doc?.name.toLowerCase().endsWith('.pdf');
  const checklist = intent ? STATUTORY_DOCUMENTS[intent] : [];
  const mandatoryDocs = checklist.filter((d) => d.requirement === 'mandatory');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [extracted, setExtracted] = useState<Record<string, any> | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [showPreconditions, setShowPreconditions] = useState(false);

  useEffect(() => {
    if (!doc) {
      setExtracted(null);
      setExtracting(false);
      return;
    }
    let active = true;
    setExtracting(true);
    api.extractDocument(doc, ulpin)
      .then((res) => {
        if (active) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = (res?.extracted as Record<string, any>) || res || {};
          const anchors = (raw.core_anchors as Record<string, any>) || {};
          const fields = (raw.fields as Record<string, any>) || {};
          const parties = (anchors.parties as Array<Record<string, any>>) || [];
          const cross = (res?.cross_verification as Record<string, any>) || raw.cross_verification || {};
          const tamper = (raw.tampering_and_risk_check as Record<string, any>) || raw.tamper_check || {};

          const claimant =
            parties.find((p) => p.role?.includes('claimant') || p.role?.includes('buyer') || p.role?.includes('heir'))?.name ||
            fields.claimant ||
            fields.owner_name ||
            raw.claimant;
          const executant =
            parties.find((p) => p.role?.includes('executant') || p.role?.includes('seller') || p.role?.includes('deceased'))?.name ||
            fields.executant ||
            raw.executant;
          const deedDocNo = anchors.registration?.document_no || fields.document_no || raw.deed_doc_number;
          const sro = anchors.registration?.sub_registrar_office || fields.sro_office || raw.sro_office;
          const survey = anchors.survey_no || fields.survey_no || raw.survey_no;
          const extent = anchors.extent || fields.extent || raw.extent_acres;
          const extentUnit = anchors.extent_unit || fields.extent_unit || 'Ac';

          const normalized = {
            ...raw,
            claimant,
            executant,
            deed_doc_number: deedDocNo,
            sro_office: sro,
            survey_no: survey,
            extent_acres: extent,
            extent_unit: extentUnit,
            cross,
            tamper,
          };
          setExtracted(normalized);
        }
      })
      .catch((err) => {
        console.warn('Document extraction failed:', err);
      })
      .finally(() => {
        if (active) setExtracting(false);
      });
    return () => {
      active = false;
    };
  }, [doc, ulpin]);

  return (
    <Field label="Supporting document" hint={hint}>
      {mandatoryDocs.length > 0 && (
        <div className="mb-2 rounded-lg border border-line bg-ground-2/70 p-2.5 text-xs">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-semibold text-ink text-[11.5px] flex items-center gap-1">
              <FileCheck size={12} className="text-primary" /> Required Documents Checklist
            </span>
            <span className="text-[10.5px] text-ink-3">Must be clear & uncropped</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {checklist.map((d, i) => (
              <span
                key={i}
                title={`${d.title} (${d.issuingAuthority}) - ${d.description}`}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border cursor-help transition-colors',
                  d.requirement === 'mandatory'
                    ? 'bg-panel border-line text-ink font-medium shadow-2xs'
                    : 'bg-ground-1 border-line text-ink-3'
                )}
              >
                <FileText size={10} className={d.requirement === 'mandatory' ? 'text-primary' : 'text-ink-4'} />
                {(d.title.split('(')[0] ?? d.title).trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {!doc ? (
        <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-ground-2/50 px-4 py-4 text-center cursor-pointer transition-all hover:border-primary hover:bg-primary-soft/30 group">
          <div className="flex size-9 items-center justify-center rounded-lg bg-ground-1 text-ink-3 shadow-2xs group-hover:text-primary group-hover:scale-105 transition-all">
            <FileUp size={18} />
          </div>
          <span className="text-xs font-semibold text-ink group-hover:text-primary">
            Upload document (PDF, PNG, JPEG up to 10MB)
          </span>
          <span className="text-[11px] text-ink-3">
            Click to browse self-attested deed, certificate, drawings, or affidavit
          </span>
          <input
            type="file"
            accept="application/pdf,image/*"
            className="sr-only"
            onChange={(e) => setDoc(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <div className="flex flex-col gap-2">
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
                  <span className="inline-flex items-center gap-0.5 text-primary font-semibold">
                    <Check size={11} /> Attached for verification
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDoc(null);
                setExtracted(null);
              }}
              title="Remove document"
              aria-label="Remove document"
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-ground-1 hover:text-brick transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {extracting && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary-soft/30 px-3 py-2 text-xs text-primary font-medium">
              <Spinner size={13} />
              <span>Parsing instrument covenants and cross-verifying with spatial registers...</span>
            </div>
          )}

          {extracted && Object.keys(extracted).length > 0 && (
            <div className="rounded-xl border border-line bg-panel p-3 text-xs space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <ShieldCheck size={15} className="text-primary shrink-0" />
                  <span>Cadastral Instrument Verification</span>
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] text-primary font-semibold border border-primary/20">
                    {extracted.document_type || 'Deed Verified'}
                  </span>
                </div>
                {onAutoFill && (
                  <button
                    type="button"
                    onClick={() => onAutoFill(extracted)}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-primary-hover cursor-pointer transition-all"
                  >
                    <FileCheck size={12} /> Auto-fill Form
                  </button>
                )}
              </div>

              {/* Core Extracted Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-panel/85 p-2.5 rounded-lg border border-line">
                {extracted.deed_doc_number && (
                  <div>
                    <span className="text-ink-3 block text-[10px]">Deed No:</span>
                    <span className="font-semibold text-ink font-mono">{extracted.deed_doc_number}</span>
                  </div>
                )}
                {extracted.survey_no && (
                  <div>
                    <span className="text-ink-3 block text-[10px]">Survey No:</span>
                    <span className="font-semibold text-ink">{extracted.survey_no}</span>
                  </div>
                )}
                {(extracted.extent_acres || extracted.extent_sqm) && (
                  <div>
                    <span className="text-ink-3 block text-[10px]">Deed Extent:</span>
                    <span className="font-semibold text-ink">
                      {extracted.extent_acres ? `${extracted.extent_acres} ${extracted.extent_unit || 'Ac'}` : `${extracted.extent_sqm} m²`}
                    </span>
                  </div>
                )}
                {extracted.claimant && (
                  <div>
                    <span className="text-ink-3 block text-[10px]">Buyer / Claimant:</span>
                    <span className="font-semibold text-ink">{extracted.claimant}</span>
                  </div>
                )}
                {extracted.executant && (
                  <div>
                    <span className="text-ink-3 block text-[10px]">Seller / Executant:</span>
                    <span className="font-semibold text-ink">{extracted.executant}</span>
                  </div>
                )}
                {extracted.sro_office && (
                  <div>
                    <span className="text-ink-3 block text-[10px]">SRO Office:</span>
                    <span className="font-semibold text-ink">{extracted.sro_office}</span>
                  </div>
                )}
              </div>

              {/* Cadastral Cross-Verification Flags */}
              {extracted.cross?.flags && extracted.cross.flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {extracted.cross.flags.map((flag: any) => (
                    <span
                      key={flag.id}
                      title={`${flag.summary} (${flag.statutory_ref})`}
                      className={clsx(
                        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-medium border cursor-help',
                        flag.severity === 'ok' && 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
                        flag.severity === 'warn' && 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
                        flag.severity === 'bad' && 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
                      )}
                    >
                      {flag.severity === 'ok' ? (
                        <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle size={11} className={flag.severity === 'bad' ? 'text-rose-600' : 'text-amber-600'} />
                      )}
                      <span>{flag.title}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Forensic Tamper Check & Conditions Toggle */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/60 text-[10.5px] text-ink-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span>Forensic Tamper Check: <strong className="text-ink font-semibold">{extracted.tamper?.risk_level || 'Clean'}</strong></span>
                </div>
                {extracted.cross?.statutory_conditions && extracted.cross.statutory_conditions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPreconditions((prev) => !prev)}
                    className="text-primary hover:underline font-semibold cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <span>Preconditions ({extracted.cross.statutory_conditions.length})</span>
                    <ChevronDown size={11} className={clsx('transition-transform', showPreconditions && 'rotate-180')} />
                  </button>
                )}
              </div>

              {/* Collapsible Preconditions Checklist */}
              {showPreconditions && extracted.cross?.statutory_conditions && (
                <div className="rounded-lg bg-panel p-2.5 space-y-1.5 border border-line text-[11px]">
                  <span className="font-bold text-ink block text-[10px] uppercase tracking-wide">
                    Mandatory Statutory Preconditions:
                  </span>
                  <ul className="space-y-1">
                    {extracted.cross.statutory_conditions.map((sc: any) => (
                      <li key={sc.id} className="flex items-start gap-1.5 text-ink-2">
                        <Check size={12} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-ink">{sc.title}:</strong> {sc.desc}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compact Statutory Disclaimer */}
              <p className="text-[10px] text-ink-3 italic leading-tight">
                Disclaimer: Automated diagnostic extraction is an administrative triage aid. Final quasi-judicial determination rests with the designated Competent Authority.
              </p>
            </div>
          )}
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
  const [fatherName, setFatherName] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('spouse');
  const [doc, setDoc] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const m = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        const docRecord = doc ? await api.uploadDocument(doc) : null;
        return await api.createApplication(ulpin.trim(), 'mutation', {
          reason,
          new_owner_name: newOwner.trim(),
          father_name: fatherName.trim() || null,
          nominees: nomineeName.trim()
            ? [{ name: nomineeName.trim(), relation: nomineeRelation, share: 1.0 }]
            : [],
          document_name: doc?.name ?? null,
          document: docRecord,
        });
      } finally {
        setUploading(false);
      }
    },
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
      <Field label="New owner name" htmlFor="sr-owner" hint="Full legal name of the buyer/transferee">
        <Input id="sr-owner" required value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Father's / Husband's Name (Optional)" htmlFor="sr-father">
          <Input id="sr-father" value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="e.g. Venkateswarlu" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Nominee Name (Optional)" htmlFor="sr-nominee">
            <Input id="sr-nominee" value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} placeholder="e.g. Lakshmi" />
          </Field>
          <Field label="Relation" htmlFor="sr-nom-rel">
            <Select id="sr-nom-rel" value={nomineeRelation} onChange={(e) => setNomineeRelation(e.target.value)}>
              <option value="spouse">Spouse</option>
              <option value="son">Son</option>
              <option value="daughter">Daughter</option>
              <option value="parent">Parent</option>
              <option value="other">Other</option>
            </Select>
          </Field>
        </div>
      </div>
      <DocField
        intent="mutation"
        ulpin={ulpin}
        doc={doc}
        setDoc={setDoc}
        hint="Registered deed, Encumbrance Certificate (EC), and tax receipt (PDF or image dossier)."
        onAutoFill={(extracted) => {
          if (extracted.claimant) setNewOwner(extracted.claimant);
          if (extracted.reason) setReason(extracted.reason);
          toast.success('Form auto-filled from verified deed data!');
        }}
      />
      {m.isError && <ErrorNote error={m.error} />}
      <Button type="submit" variant="primary" loading={m.isPending || uploading} className="self-start" disabled={ulpin.trim().length < 8}>
        {uploading ? 'Uploading document...' : t('service.btnSubmit')}
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
  const [uploading, setUploading] = useState(false);

  const m = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        const docRecord = doc ? await api.uploadDocument(doc) : null;
        return await api.createApplication(ulpin.trim(), 'record_correction', {
          field,
          corrected_value: corrected.trim(),
          description: description.trim(),
          document_name: doc?.name ?? null,
          document: docRecord,
        });
      } finally {
        setUploading(false);
      }
    },
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
      <DocField
        intent="record_correction"
        ulpin={ulpin}
        doc={doc}
        setDoc={setDoc}
        hint="Parent deed, photo ID, FMB survey sketch, or affidavit proving the correct value."
        onAutoFill={(extracted) => {
          if (extracted.claimant && field === 'owner_name') setCorrected(extracted.claimant);
          else if (extracted.extent_acres && field === 'extent') setCorrected(String(extracted.extent_acres));
          else if (extracted.survey_no && field === 'other') setCorrected(extracted.survey_no);
          if (extracted.deed_doc_number) {
            setDescription(`Rectification as per registered deed ${extracted.deed_doc_number} (SRO: ${extracted.sro_office || 'jurisdiction'}).`);
          }
          toast.success('Form auto-filled from document text!');
        }}
      />
      {m.isError && <ErrorNote error={m.error} />}
      <Button type="submit" variant="primary" loading={m.isPending || uploading} className="self-start" disabled={ulpin.trim().length < 8}>
        {uploading ? 'Uploading document...' : t('service.btnSubmit')}
      </Button>
    </FormCard>
  );
}

const BOUNDARY_DISPUTE_REASONS = [
  { value: 'stone_missing', label: 'Boundary Stones Missing or Damaged' },
  { value: 'encroachment', label: 'Neighbour Encroachment / Ridge Shift' },
  { value: 'vertex_shift', label: 'Cadastral Vertex / Coordinates Shift' },
  { value: 'subdivision_demarcation', label: 'Sub-division Demarcation & FMB Update' },
  { value: 'fmb_discrepancy', label: 'Discrepancy Between Ground & FMB Sketch' },
];

function BoundaryCorrectionForm({ ulpin, onDone }: { ulpin: string; onDone: (a: Application) => void }) {
  const { t } = useTranslation();
  const [reasonCategory, setReasonCategory] = useState('stone_missing');
  const [neighbourDetails, setNeighbourDetails] = useState('');
  const [description, setDescription] = useState('');
  const [doc, setDoc] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const m = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        const docRecord = doc ? await api.uploadDocument(doc) : null;
        return await api.createApplication(ulpin.trim(), 'boundary_correction', {
          reason_category: reasonCategory,
          reason: description.trim() || reasonCategory,
          neighbour_details: neighbourDetails.trim(),
          document_name: doc?.name ?? null,
          document: docRecord,
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: (a) => {
      toast.success(t('service.successTitle'), a.id);
      onDone(a);
    },
  });

  return (
    <FormCard
      title="Boundary Demarcation & Correction"
      subtitle="Survey & Land Records Department · Cadastral boundary verification & FMB demarcation"
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate();
      }}
    >
      <Field label="Demarcation Reason" htmlFor="bc-reason">
        <Select id="bc-reason" value={reasonCategory} onChange={(e) => setReasonCategory(e.target.value)}>
          {BOUNDARY_DISPUTE_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Adjacent Landowners / Boundary Schedule"
        htmlFor="bc-neighbours"
        hint="Names or survey numbers of North, South, East, West neighbours for survey notice"
      >
        <Input
          id="bc-neighbours"
          placeholder="e.g. North: Sy 102/1 (Ramesh), South: Panchayat Road, East: Sy 104, West: Canal"
          value={neighbourDetails}
          onChange={(e) => setNeighbourDetails(e.target.value)}
        />
      </Field>

      <Field
        label="Dispute & Demarcation Details"
        htmlFor="bc-desc"
        hint="Describe ground landmarks, estimated boundary shift in feet/metres, or details of missing stones"
      >
        <Textarea
          id="bc-desc"
          rows={3}
          required
          placeholder="Please describe the exact boundary dispute or demarcation needed..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <DocField
        intent="boundary_correction"
        ulpin={ulpin}
        doc={doc}
        setDoc={setDoc}
        hint="Title deed, old FMB sketch, or photos of boundary stones / demarcation site."
        onAutoFill={(extracted) => {
          if (extracted.survey_no) {
            setDescription((prev) => prev || `Boundary survey requested for Survey No. ${extracted.survey_no}.`);
          }
          toast.success('Form details auto-filled from document!');
        }}
      />

      {m.isError && <ErrorNote error={m.error} />}

      <Button
        type="submit"
        variant="primary"
        loading={m.isPending || uploading}
        className="self-start"
        disabled={ulpin.trim().length < 8}
      >
        {uploading ? 'Uploading document...' : t('service.btnSubmit')}
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
  const [doc, setDoc] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
    mutationFn: async () => {
      setUploading(true);
      try {
        const docRecord = doc ? await api.uploadDocument(doc) : null;
        return await api.createApplication(ulpin.trim(), 'building_permission', {
          floors,
          built_up_sqm: builtUp,
          proposed_use: use,
          precheck: check.data ?? null,
          document_name: doc?.name ?? null,
          document: docRecord,
        });
      } finally {
        setUploading(false);
      }
    },
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
      <DocField intent="building_permission" ulpin={ulpin} doc={doc} setDoc={setDoc} hint="Architectural drawings, site plan, structural stability certificate (PDF or image dossier)." />
      {m.isError && <ErrorNote error={m.error} />}
      <Button
        type="submit"
        variant="primary"
        loading={m.isPending || uploading}
        className="self-start"
        disabled={!checked || !check.data || isOwnershipDenied}
      >
        {isOwnershipDenied ? t('service.onlyOwnerCanApply') : uploading ? 'Uploading document...' : t('service.btnSubmit')}
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
  const [uploading, setUploading] = useState(false);

  const m = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        const docRecord = doc ? await api.uploadDocument(doc) : null;
        return await api.createApplication(ulpin.trim(), 'land_complaint', {
          category,
          description: description.trim(),
          document_name: doc?.name ?? null,
          document: docRecord,
        });
      } finally {
        setUploading(false);
      }
    },
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
      <DocField intent="land_complaint" ulpin={ulpin} doc={doc} setDoc={setDoc} hint="Title proof, cadastral FMB extract, timestamped photos, or police acknowledgment." />
      {m.isError && <ErrorNote error={m.error} />}
      <Button type="submit" variant="primary" loading={m.isPending || uploading} className="self-start" disabled={ulpin.trim().length < 8}>
        {uploading ? 'Uploading document...' : t('service.btnSubmit')}
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
  const [uploading, setUploading] = useState(false);

  const m = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        const docRecord = doc ? await api.uploadDocument(doc) : null;
        return await api.createApplication(ulpin.trim(), 'succession', {
          deceased_name: deceased.trim(),
          nominee_name: heir.trim(),
          relation,
          document_name: doc?.name ?? null,
          document: docRecord,
        });
      } finally {
        setUploading(false);
      }
    },
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
      <DocField
        intent="succession"
        ulpin={ulpin}
        doc={doc}
        setDoc={setDoc}
        hint="Death Certificate, Legal Heir Certificate, and Family Tree Affidavit."
        onAutoFill={(extracted) => {
          if (extracted.executant) setDeceased(extracted.executant);
          if (extracted.claimant) setHeir(extracted.claimant);
          toast.success('Form auto-filled from certificate data!');
        }}
      />
      {m.isError && <ErrorNote error={m.error} />}
      <Button type="submit" variant="primary" loading={m.isPending || uploading} className="self-start" disabled={ulpin.trim().length < 8}>
        {uploading ? 'Uploading document...' : t('service.btnSubmit')}
      </Button>
    </FormCard>
  );
}

/* ---------- Utility Request Form ---------- */

function UtilityForm({ ulpin, onDone }: { ulpin: string; onDone: (a: Application) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [action, setAction] = useState('new_connection');
  const [utilityType, setUtilityType] = useState('electricity');
  const [consumerName, setConsumerName] = useState(user?.name || '');
  const [consumerNo, setConsumerNo] = useState('');
  const [sanctionedLoad, setSanctionedLoad] = useState('5.0');
  const [tariffCategory, setTariffCategory] = useState('LT-I Domestic');
  const [phase, setPhase] = useState('1-Phase');
  const [pipeSize, setPipeSize] = useState('15');
  const [meterNo, setMeterNo] = useState('');
  const [description, setDescription] = useState('');
  const [doc, setDoc] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const m = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        const docRecord = doc ? await api.uploadDocument(doc) : null;
        return await api.createApplication(ulpin.trim(), 'utility_request', {
          action,
          utility_type: utilityType,
          consumer_name: consumerName.trim(),
          consumer_no: consumerNo.trim() || undefined,
          sanctioned_load_kw: utilityType === 'electricity' ? parseFloat(sanctionedLoad) : undefined,
          tariff_category: utilityType === 'electricity' ? tariffCategory : undefined,
          phase: utilityType === 'electricity' ? phase : undefined,
          pipe_size_mm: utilityType === 'water' ? parseInt(pipeSize, 10) : undefined,
          meter_no: meterNo.trim() || undefined,
          description: description.trim(),
          document_name: doc?.name ?? null,
          document: docRecord,
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: (a) => {
      toast.success(t('service.successTitle'), a.id);
      onDone(a);
    },
  });

  return (
    <FormCard
      title="Utility Services & Municipal Connections"
      subtitle="DISCOM · Water Board · Municipal Drainage & City Gas"
      onSubmit={(e) => {
        e.preventDefault();
        m.mutate();
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="What service do you require?" htmlFor="sr-util-action">
          <Select id="sr-util-action" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="new_connection">New Service Connection</option>
            <option value="name_transfer">Consumer Name / Ownership Transfer</option>
            <option value="load_enhancement">Sanctioned Load / Pipe Enhancement</option>
            <option value="category_change">Tariff Category Conversion</option>
            <option value="meter_replacement">Meter Replacement / Smart Meter</option>
          </Select>
        </Field>

        <Field label="Utility Department / Service" htmlFor="sr-util-type">
          <Select id="sr-util-type" value={utilityType} onChange={(e) => setUtilityType(e.target.value)}>
            <option value="electricity">⚡ Power & Electricity (DISCOM)</option>
            <option value="water">🚰 Municipal Water Supply</option>
            <option value="sewer">🚽 Underground Drainage (UGD)</option>
            <option value="gas">🔥 Piped Natural Gas (PNG)</option>
            <option value="broadband">🌐 OFC Fiber Internet (FTTH)</option>
            <option value="all">⚡🚰 All Utilities (Full Ownership Sync)</option>
          </Select>
        </Field>
      </div>

      <Field
        label="Consumer / Applicant Legal Name"
        htmlFor="sr-util-name"
        hint="Name under which the service connection or account must be sanctioned"
      >
        <Input
          id="sr-util-name"
          required
          value={consumerName}
          onChange={(e) => setConsumerName(e.target.value)}
          placeholder="e.g. Jatin barali"
        />
      </Field>

      {action !== 'new_connection' && (
        <Field
          label="Existing Consumer / Service Account Number"
          htmlFor="sr-util-cno"
          hint="USC number for power, CAN for water, or BP number for gas"
        >
          <Input
            id="sr-util-cno"
            value={consumerNo}
            onChange={(e) => setConsumerNo(e.target.value)}
            placeholder="e.g. USC-1092842 or CAN-441029"
          />
        </Field>
      )}

      {/* Electricity Specific Fields */}
      {utilityType === 'electricity' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-primary/20 bg-primary-soft/20 p-3">
          <Field label="Sanctioned Load (kW)" htmlFor="sr-util-load">
            <Input
              id="sr-util-load"
              type="number"
              step="0.5"
              min="0.5"
              max="150"
              required
              value={sanctionedLoad}
              onChange={(e) => setSanctionedLoad(e.target.value)}
            />
          </Field>
          <Field label="Tariff Category" htmlFor="sr-util-tariff">
            <Select id="sr-util-tariff" value={tariffCategory} onChange={(e) => setTariffCategory(e.target.value)}>
              <option value="LT-I Domestic">LT-I Domestic (Residential)</option>
              <option value="LT-II Commercial">LT-II Commercial (Offices / Retail)</option>
              <option value="LT-III Industrial">LT-III Industrial</option>
              <option value="LT-IV Agriculture">LT-IV Agricultural Pump</option>
              <option value="LT-VII General">LT-VII General / Institutional</option>
            </Select>
          </Field>
          <Field label="Electric Phase" htmlFor="sr-util-phase">
            <Select id="sr-util-phase" value={phase} onChange={(e) => setPhase(e.target.value)}>
              <option value="1-Phase">1-Phase (230V Single Phase)</option>
              <option value="3-Phase">3-Phase (415V Three Phase)</option>
            </Select>
          </Field>
        </div>
      )}

      {/* Water Specific Fields */}
      {utilityType === 'water' && (
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
          <Field label="Requested Pipe Diameter" htmlFor="sr-util-pipe" hint="Internal pipe bore for municipal tap connection">
            <Select id="sr-util-pipe" value={pipeSize} onChange={(e) => setPipeSize(e.target.value)}>
              <option value="15">15 mm (0.5 inch - Standard Domestic)</option>
              <option value="20">20 mm (0.75 inch - High Flow Domestic)</option>
              <option value="25">25 mm (1.0 inch - Commercial / Multi-dwelling)</option>
              <option value="50">50 mm (2.0 inch - Bulk Commercial / Apartment)</option>
            </Select>
          </Field>
        </div>
      )}

      {/* Meter Replacement */}
      {(action === 'meter_replacement' || action === 'load_enhancement') && (
        <Field label="Existing Meter Serial Number" htmlFor="sr-util-meter" hint="Found on meter glass plate or monthly utility invoice">
          <Input
            id="sr-util-meter"
            value={meterNo}
            onChange={(e) => setMeterNo(e.target.value)}
            placeholder="e.g. AP-MTR-882194"
          />
        </Field>
      )}

      <Field label="Purpose & Justification" htmlFor="sr-util-desc" hint="Provide context on usage, occupancy, or justification">
        <Textarea
          id="sr-util-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Applying for 3-Phase load enhancement following installation of new equipment, or name endorsement following land registration."
        />
      </Field>

      <DocField
        intent="utility_request"
        ulpin={ulpin}
        doc={doc}
        setDoc={setDoc}
        hint="Attach latest utility invoice, property tax receipt, registered sale deed, or municipal NOC."
        onAutoFill={(extracted) => {
          if (extracted.claimant) setConsumerName(extracted.claimant);
          if (extracted.deed_doc_number) {
            setDescription(`Utility endorsement as per registered deed ${extracted.deed_doc_number} (SRO: ${extracted.sro_office || 'jurisdiction'}).`);
          }
          toast.success('Form auto-filled from document text!');
        }}
      />

      {m.isError && <ErrorNote error={m.error} />}
      <Button
        type="submit"
        variant="primary"
        loading={m.isPending || uploading}
        className="self-start"
        disabled={ulpin.trim().length < 8}
      >
        {uploading ? 'Uploading document...' : t('service.btnSubmit')}
      </Button>
    </FormCard>
  );
}

/* ---------- Statutory Land Acquisition Claim Form ---------- */

function AcquisitionClaimForm({
  ulpin,
  onDone,
  initialMode,
}: {
  ulpin: string;
  onDone: (a: Application) => void;
  initialMode?: string;
}) {
  const { user } = useAuth();

  const parcelQ = useQuery({
    queryKey: qk.parcel(ulpin, user?.uid ?? 'anon'),
    queryFn: () => api.parcel(ulpin),
    enabled: !!ulpin && ulpin.trim().length >= 8,
  });

  const p = parcelQ.data;
  const impact = p?.acquisition?.[0];

  const isOwner = !!p && (
    !!p.viewer_is_owner ||
    (!p.party.masked && user?.role === 'citizen' && p.party.owners.some((o) => {
      const pName = (user?.name || '').trim().toLowerCase();
      const oName = (o.name || '').trim().toLowerCase();
      return pName && oName && (pName === oName || pName.includes(oName) || oName.includes(pName));
    }))
  );

  const [repAffirmation, setRepAffirmation] = useState(false);

  const validModes = ['accept_consent', 'negotiate_value', 'decline_objection', 'opt_tdr'] as const;
  type ResponseMode = (typeof validModes)[number];

  const [mode, setMode] = useState<ResponseMode>(() => {
    if (initialMode && validModes.includes(initialMode as ResponseMode)) {
      return initialMode as ResponseMode;
    }
    return 'accept_consent';
  });

  const defaultName = user?.name || p?.party.owners[0]?.name || '';
  const [applicantName, setApplicantName] = useState(defaultName);
  const [applicantPhone, setApplicantPhone] = useState('9876543210');
  const [applicantAadhaar, setApplicantAadhaar] = useState('XXXX-XXXX-4819');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountConfirm, setBankAccountConfirm] = useState('');
  const [bankIfsc, setBankIfsc] = useState('SBIN0001234');
  const [bankName, setBankName] = useState('State Bank of India');
  const [consentAgreed, setConsentAgreed] = useState(true);

  // Negotiation / enhancement
  const standardOffer = impact?.total_compensation_offer ?? 4746000;
  const consentTotal = impact?.consent_settlement_total ?? Math.round(standardOffer * 1.25);
  const [demandedAmount, setDemandedAmount] = useState(String(Math.round(standardOffer * 1.5)));
  const enhancementGrounds = [
    'Recent market sales average higher value (SRO registered deeds)',
    'Loss of prime road frontage & commercial utility',
  ];
  const [enhancementJustification, setEnhancementJustification] = useState(
    'Recent registered sale transactions in the same village reflect higher market rate. The acquisition cuts off road frontage and undervalues existing boundary and structural assets.'
  );

  // Objection
  const [objectionCategory, setObjectionCategory] = useState('realignment');
  const [objectionDetails, setObjectionDetails] = useState(
    'Adequate government poramboke / vacant land exists on the opposite margin. The proposed alignment severely impacts existing structures.'
  );
  const [severanceRelief, setSeveranceRelief] = useState(impact?.severance_risk ?? false);

  // TDR
  const [tdrZone, setTdrZone] = useState('Amaravati Capital Metropolitan Planning Zone');
  const [tdrPurpose, setTdrPurpose] = useState('tradable_drc');

  const [doc, setDoc] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!applicantName && p?.party.owners[0]?.name) {
      setApplicantName(p.party.owners[0].name);
    }
  }, [p, applicantName]);

  const m = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        const docRecord = doc ? await api.uploadDocument(doc) : null;
        return await api.createApplication(ulpin.trim(), 'acquisition_claim', {
          project_id: impact?.project_id ?? 1,
          project_name: impact?.project_name ?? 'Government Infrastructure Project',
          claim_type: mode,
          claimant_name: applicantName.trim(),
          claimant_phone: applicantPhone.trim(),
          claimant_aadhaar: applicantAadhaar.trim() || undefined,
          bank_account_no: bankAccountNo.trim() || undefined,
          bank_ifsc: bankIfsc.trim().toUpperCase() || undefined,
          bank_name: bankName.trim() || undefined,
          offered_amount: standardOffer,
          consent_settlement_total: consentTotal,
          demanded_amount: mode === 'negotiate_value' ? parseFloat(demandedAmount) || consentTotal : consentTotal,
          grounds:
            mode === 'negotiate_value'
              ? `${enhancementGrounds.join('; ')}: ${enhancementJustification}`
              : mode === 'decline_objection'
                ? `[${objectionCategory}] ${objectionDetails}`
                : 'Direct consent settlement under Section 23A with 25% statutory bonus.',
          severance_relief_demanded: severanceRelief,
          tdr_opted: mode === 'opt_tdr',
          tdr_zone: mode === 'opt_tdr' ? tdrZone : undefined,
          tdr_units_sqm: mode === 'opt_tdr' ? (impact?.tdr_units_offered_sqm ?? (impact?.affected_area_sqm ? impact.affected_area_sqm * 2 : 0)) : undefined,
          document_name: doc?.name ?? null,
          document: docRecord,
        });
      } finally {
        setUploading(false);
      }
    },
    onSuccess: (a) => {
      toast.success('Statutory Application Submitted for Official Verification', a.id);
      onDone(a);
    },
    onError: (err: Error) => {
      toast.error('Failed to submit application', err.message);
    },
  });

  return (
    <FormCard
      title="Statutory Land Acquisition Application & Representation"
      subtitle="Competent Authority for Land Acquisition (CALA) · RFCTLARR Act, 2013"
      onSubmit={(e) => {
        e.preventDefault();
        if (p && !isOwner && !repAffirmation) {
          toast.error('You must confirm titleholder or authorized representative standing.');
          return;
        }
        if (mode === 'accept_consent' && (!bankAccountNo.trim() || !bankIfsc.trim())) {
          toast.error('Bank Account & IFSC are required for direct DBT compensation payment.');
          return;
        }
        if (mode === 'accept_consent' && bankAccountNo.trim() !== bankAccountConfirm.trim()) {
          toast.error('Bank Account numbers do not match. Please re-check.');
          return;
        }
        m.mutate();
      }}
    >
      {/* Titleholder Standing Advisory (When logged-in user is not verified owner) */}
      {p && !isOwner && (
        <div className="rounded-lg border border-amber/40 bg-amber-soft/40 p-3 text-xs text-ink space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
            <ShieldAlert size={15} className="text-amber-700 dark:text-amber-400 shrink-0" />
            <span>Title Standing Advisory · Representative Mandate Required</span>
          </div>
          <p className="text-[11.5px] text-ink-3 leading-relaxed">
            You are not currently logged in as the recorded Pattadar (titleholder) for this parcel ({p.identifiers.survey_no ? `Survey No. ${p.identifiers.survey_no}` : ulpin}).
            Under Section 84 of the RFCTLARR Act, 2013, submissions made on behalf of another party require a registered Power of Attorney (POA) or Succession Certificate.
          </p>
          <label className="flex items-start gap-2 pt-1 text-[11px] text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={repAffirmation}
              onChange={(e) => setRepAffirmation(e.target.checked)}
              className="mt-0.5 rounded border-line text-primary focus:ring-primary"
              required
            />
            <span>
              I solemnly affirm that I am the recorded Pattadar, legal heir, or legally authorized representative under registered Power of Attorney (POA) holding lawful authority for this parcel.
            </span>
          </label>
        </div>
      )}

      {/* Official 4-Stage Verification Workflow Banner */}
      <div className="rounded-lg border border-line bg-panel p-2.5 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-ink-2 uppercase text-[10.5px] tracking-wider flex items-center gap-1">
            <FileCheck size={12} className="text-primary" />
            Official Revenue Verification Procedure (Post-Submission)
          </span>
          <span className="text-[10px] text-ink-3">Governed by CALA & Revenue Division</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 text-[11px] text-ink-3">
          <div className="p-1.5 rounded bg-ground-1 border border-line/60">
            <span className="font-semibold text-ink block text-[11px]">1. Acknowledgment</span>
            Statutory Ack ID generated for tracking
          </div>
          <div className="p-1.5 rounded bg-ground-1 border border-line/60">
            <span className="font-semibold text-ink block text-[11px]">2. VRO Ground Check</span>
            Boundary stone inspection & title verification
          </div>
          <div className="p-1.5 rounded bg-ground-1 border border-line/60">
            <span className="font-semibold text-ink block text-[11px]">3. Valuer & Hearing</span>
            Damage appraisal & CALA hearing (§15)
          </div>
          <div className="p-1.5 rounded bg-ground-1 border border-line/60">
            <span className="font-semibold text-ink block text-[11px]">4. Award & Treasury DBT</span>
            Order sanctioned & e-Kuber payout released
          </div>
        </div>
      </div>

      {/* Project Impact Summary */}
      {impact && (
        <div className="rounded-lg border border-line bg-ground-1 p-3 text-xs text-ink space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5 font-semibold">
            <span className="text-ink flex items-center gap-1.5">
              <Scale size={14} className="text-primary" />
              {impact.project_name}
            </span>
            <span className="font-mono text-ink-3 text-[11px]">Gazette: {impact.gazette_no || 'AP/GZ/2026/088'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-[11px] pt-0.5">
            <div className="rounded border border-line bg-panel p-1.5">
              <span className="text-ink-3">Total Area</span>
              <p className="font-semibold font-mono">{fmtArea(impact.total_area_sqm)}</p>
            </div>
            <div className="rounded border border-amber/30 bg-amber-soft/40 p-1.5">
              <span className="text-amber-800 dark:text-amber-300 font-medium">Acquired Strip</span>
              <p className="font-semibold font-mono text-amber-900 dark:text-amber-200">
                {fmtArea(impact.affected_area_sqm)} ({impact.impact_pct}%)
              </p>
            </div>
            <div className="rounded border border-line bg-panel p-1.5">
              <span className="text-ink-3">Standard Award</span>
              <p className="font-semibold font-mono text-ink">{fmtINR(impact.total_compensation_offer)}</p>
            </div>
            <div className="rounded border border-line bg-panel p-1.5">
              <span className="text-ink-3">Consent Offer (+25%)</span>
              <p className="font-semibold font-mono text-primary">{fmtINR(impact.consent_settlement_total)}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4 Statutory Pathway Tabs */}
      <div>
        <label className="block text-xs font-semibold text-ink mb-1.5">
          Select Statutory Application Type (As per Indian Law)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Consent */}
          <button
            type="button"
            onClick={() => setMode('accept_consent')}
            className={clsx(
              'rounded-lg border p-2.5 text-left transition-all cursor-pointer flex flex-col justify-between text-xs',
              mode === 'accept_consent'
                ? 'border-primary bg-primary/10 shadow-2xs'
                : 'border-line bg-panel hover:bg-ground-1'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-ink">1. Consent Award (§23A)</span>
              <CheckCircle2 size={13} className={mode === 'accept_consent' ? 'text-primary' : 'text-ink-3'} />
            </div>
            <p className="mt-1 text-[10.5px] text-ink-3">Direct DBT payout with +25% bonus upon VRO check</p>
            <span className="mt-2 text-xs font-semibold font-mono text-primary">
              {fmtINR(consentTotal)}
            </span>
          </button>

          {/* 2. Valuation Representation */}
          <button
            type="button"
            onClick={() => setMode('negotiate_value')}
            className={clsx(
              'rounded-lg border p-2.5 text-left transition-all cursor-pointer flex flex-col justify-between text-xs',
              mode === 'negotiate_value'
                ? 'border-primary bg-primary/10 shadow-2xs'
                : 'border-line bg-panel hover:bg-ground-1'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-ink">2. Valuation Rep. (§64)</span>
              <TrendingUp size={13} className={mode === 'negotiate_value' ? 'text-primary' : 'text-ink-3'} />
            </div>
            <p className="mt-1 text-[10.5px] text-ink-3">Reference petition for rate enhancement before LARRA</p>
            <span className="mt-2 text-xs font-semibold font-mono text-ink">
              Claim Higher Value
            </span>
          </button>

          {/* 3. Statutory Objection */}
          <button
            type="button"
            onClick={() => setMode('decline_objection')}
            className={clsx(
              'rounded-lg border p-2.5 text-left transition-all cursor-pointer flex flex-col justify-between text-xs',
              mode === 'decline_objection'
                ? 'border-primary bg-primary/10 shadow-2xs'
                : 'border-line bg-panel hover:bg-ground-1'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-ink">3. Objection (§15)</span>
              <XCircle size={13} className={mode === 'decline_objection' ? 'text-primary' : 'text-ink-3'} />
            </div>
            <p className="mt-1 text-[10.5px] text-ink-3">Hearing for alignment shift or §94 buyout</p>
            <span className="mt-2 text-xs font-semibold font-mono text-ink">
              Personal Hearing
            </span>
          </button>

          {/* 4. TDR */}
          <button
            type="button"
            onClick={() => setMode('opt_tdr')}
            className={clsx(
              'rounded-lg border p-2.5 text-left transition-all cursor-pointer flex flex-col justify-between text-xs',
              mode === 'opt_tdr'
                ? 'border-primary bg-primary/10 shadow-2xs'
                : 'border-line bg-panel hover:bg-ground-1'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-ink">4. TDR Surrender</span>
              <Building2 size={13} className={mode === 'opt_tdr' ? 'text-primary' : 'text-ink-3'} />
            </div>
            <p className="mt-1 text-[10.5px] text-ink-3">Tradable 2.0x Development Rights Certificate</p>
            <span className="mt-2 text-xs font-semibold font-mono text-ink">
              {impact?.tdr_units_offered_sqm ? `${impact.tdr_units_offered_sqm} m² DRC` : '200% DRC'}
            </span>
          </button>
        </div>
      </div>

      {/* Applicant Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Claimant / Landowner Name" htmlFor="ac-name">
          <Input id="ac-name" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required />
        </Field>
        <Field label="Mobile Phone (for Hearing SMS & DBT)" htmlFor="ac-phone">
          <Input id="ac-phone" value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} required />
        </Field>
        <Field label="Aadhaar / PAN" htmlFor="ac-aadhaar" hint="For Treasury e-Kuber DBT KYC">
          <Input id="ac-aadhaar" value={applicantAadhaar} onChange={(e) => setApplicantAadhaar(e.target.value)} />
        </Field>
      </div>

      {/* Dynamic Content based on chosen Mode */}

      {/* PATHWAY 1: ACCEPT CONSENT AWARD */}
      {mode === 'accept_consent' && (
        <div className="space-y-3 rounded-lg border border-line bg-ground-1 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <CheckCircle2 size={14} className="text-primary" />
            <span>Direct Consent Award Application & Bank Mandate (Section 23A RFCTLARR Act, 2013)</span>
          </div>

          <div className="rounded border border-line bg-panel p-2.5 divide-y divide-line/60 text-xs">
            <div className="flex items-center justify-between pb-1 text-ink-2">
              <span>Standard Statutory Award (Base + Solatium + Damages)</span>
              <span className="font-mono text-ink">{fmtINR(standardOffer)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-ink-2">
              <span>Statutory Direct Consent Incentive (+25% bonus)</span>
              <span className="font-mono text-primary">+{fmtINR(consentTotal - standardOffer)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 font-semibold text-ink">
              <span>Total Statutory Compensation (Non-taxable under Section 96)</span>
              <span className="font-mono text-primary text-sm">{fmtINR(consentTotal)}</span>
            </div>
          </div>

          <p className="text-[11px] text-ink-3">
            Please enter your bank account details for direct government electronic treasury credit (e-Kuber DBT).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Bank Account Number" htmlFor="ac-bank-acc">
              <Input
                id="ac-bank-acc"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="e.g. 10293847561"
                required
              />
            </Field>
            <Field label="Confirm Bank Account Number" htmlFor="ac-bank-acc-confirm">
              <Input
                id="ac-bank-acc-confirm"
                value={bankAccountConfirm}
                onChange={(e) => setBankAccountConfirm(e.target.value)}
                placeholder="Re-enter account number"
                required
              />
            </Field>
            <Field label="Bank IFSC Code" htmlFor="ac-bank-ifsc" hint="e.g. SBIN0001234">
              <Input
                id="ac-bank-ifsc"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                required
              />
            </Field>
            <Field label="Bank & Branch Name" htmlFor="ac-bank-name">
              <Input
                id="ac-bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India, Main Branch"
                required
              />
            </Field>
          </div>

          <label className="flex items-start gap-2 pt-1 text-xs text-ink-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consentAgreed}
              onChange={(e) => setConsentAgreed(e.target.checked)}
              className="mt-0.5 rounded border-line text-primary focus:ring-primary"
              required
            />
            <span>
              I agree to execute the direct consent agreement under Section 23A of the RFCTLARR Act, 2013 and surrender the demarcated right-of-way strip upon electronic credit of <strong>{fmtINR(consentTotal)}</strong> into my designated bank account following VRO field verification.
            </span>
          </label>
        </div>
      )}

      {/* PATHWAY 2: NEGOTIATE / ENHANCEMENT CLAIM (§64) */}
      {mode === 'negotiate_value' && (
        <div className="space-y-3 rounded-lg border border-line bg-ground-1 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <TrendingUp size={14} className="text-primary" />
            <span>Valuation Enhancement Reference Petition (Section 64 RFCTLARR Act, 2013)</span>
          </div>

          <div className="rounded border border-line bg-panel p-2.5 text-xs text-ink-2">
            <strong className="text-ink">Legal Protection (§64): </strong>
            Under Section 64, you have the statutory right to receive the offered base award (<strong>{fmtINR(standardOffer)}</strong>) <em>"Under Protest"</em> immediately, without prejudicing your legal right to claim higher compensation before the Land Acquisition Authority (LARRA).
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Current Government Award Offer" htmlFor="ac-offer">
              <Input id="ac-offer" value={fmtINR(standardOffer)} disabled />
            </Field>
            <Field label="Demanded Fair Market Compensation (₹)" htmlFor="ac-demand" hint="Based on recent sale deeds or commercial potential">
              <Input
                id="ac-demand"
                type="number"
                value={demandedAmount}
                onChange={(e) => setDemandedAmount(e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Detailed Statutory Justification & Evidence Cited" htmlFor="ac-enh-desc" hint="Mention deed numbers, commercial frontage factors, or structural damage omissions">
            <Textarea
              id="ac-enh-desc"
              rows={3}
              value={enhancementJustification}
              onChange={(e) => setEnhancementJustification(e.target.value)}
              required
            />
          </Field>
        </div>
      )}

      {/* PATHWAY 3: DECLINE / FILE STATUTORY OBJECTION (§15) */}
      {mode === 'decline_objection' && (
        <div className="space-y-3 rounded-lg border border-line bg-ground-1 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <XCircle size={14} className="text-brick" />
            <span>Statutory Objection Petition under Section 15 of RFCTLARR Act, 2013 / Section 3C NHAI Act</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Primary Ground of Objection" htmlFor="ac-obj-cat">
              <Select id="ac-obj-cat" value={objectionCategory} onChange={(e) => setObjectionCategory(e.target.value)}>
                <option value="realignment">Realignment Feasibility (Sufficient vacant government land exists on opposite margin)</option>
                <option value="homestead">Protection of Residential Homestead / Religious Structure</option>
                <option value="severance_total_take">Severance Viability Risk (§94): Demand 100% Parcel Buyout</option>
                <option value="measurement_error">Measurement & Boundary Demarcation Discrepancy</option>
                <option value="lack_of_public_purpose">Non-Compliance with Social Impact Assessment (SIA)</option>
              </Select>
            </Field>

            <div className="flex flex-col justify-center">
              <label className="flex items-start gap-2 text-xs text-ink-2 cursor-pointer p-2 rounded-lg border border-line bg-panel">
                <input
                  type="checkbox"
                  checked={severanceRelief}
                  onChange={(e) => setSeveranceRelief(e.target.checked)}
                  className="mt-0.5 rounded border-line text-brick focus:ring-brick"
                />
                <div>
                  <span className="font-semibold text-ink">Invoke Section 94 Severance Rights</span>
                  <p className="text-[11px] text-ink-3">Demand full parcel buyout if the residual plot cannot be feasibly used.</p>
                </div>
              </label>
            </div>
          </div>

          <Field label="Written Grounds of Objection" htmlFor="ac-obj-desc" hint="The Collector / CALA is legally mandated to provide a personal hearing on these grounds">
            <Textarea
              id="ac-obj-desc"
              rows={4}
              value={objectionDetails}
              onChange={(e) => setObjectionDetails(e.target.value)}
              required
            />
          </Field>
        </div>
      )}

      {/* PATHWAY 4: OPT FOR TDR */}
      {mode === 'opt_tdr' && (
        <div className="space-y-3 rounded-lg border border-line bg-ground-1 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <Building2 size={14} className="text-primary" />
            <span>Transferable Development Rights (TDR) / Development Rights Certificate (DRC)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="TDR Credit Ratio Offered" htmlFor="ac-tdr-ratio">
              <Input
                id="ac-tdr-ratio"
                value={`${impact?.affected_area_sqm ? (impact.affected_area_sqm * 2).toFixed(1) : '157.0'} m² DRC (2.0x Land Extent)`}
                disabled
              />
            </Field>
            <Field label="Target Municipal Planning Jurisdiction" htmlFor="ac-tdr-zone">
              <Select id="ac-tdr-zone" value={tdrZone} onChange={(e) => setTdrZone(e.target.value)}>
                <option value="Amaravati Capital Metropolitan Planning Zone">Amaravati Capital Metropolitan Planning Zone (APCRDA)</option>
                <option value="Hyderabad Metropolitan Development Authority (HMDA)">Hyderabad Metropolitan Development Authority (HMDA)</option>
                <option value="Chennai Metropolitan Development Authority (CMDA)">Chennai Metropolitan Development Authority (CMDA)</option>
                <option value="General Urban Planning Area">General Urban Planning Area</option>
              </Select>
            </Field>
          </div>

          <Field label="Intended Utilization of Development Rights" htmlFor="ac-tdr-purpose">
            <Select id="ac-tdr-purpose" value={tdrPurpose} onChange={(e) => setTdrPurpose(e.target.value)}>
              <option value="tradable_drc">Issuance of Tradable DRC for open market sale to registered builders / developers</option>
              <option value="self_development">Utilization on another land parcel owned by applicant to construct additional floors/FSI</option>
            </Select>
          </Field>
        </div>
      )}

      {/* Document Upload */}
      <DocField
        intent="acquisition_claim"
        ulpin={ulpin}
        doc={doc}
        setDoc={setDoc}
        hint="Upload Title Deed, Bank Passbook, Certified Valuation, or Photographs of Affected Assets"
        onAutoFill={(extracted) => {
          if (extracted.claimant) setApplicantName(extracted.claimant);
          if (extracted.bank_account) setBankAccountNo(extracted.bank_account);
          if (extracted.bank_ifsc) setBankIfsc(extracted.bank_ifsc);
          toast.success('Auto-extracted claimant info from document!');
        }}
      />

      {m.isError && <ErrorNote error={m.error} />}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          loading={m.isPending || uploading}
          disabled={ulpin.trim().length < 8 || (p && !isOwner && !repAffirmation)}
        >
          {uploading
            ? 'Uploading document...'
            : mode === 'accept_consent'
              ? 'Submit Consent Award Application & Bank Mandate'
              : mode === 'negotiate_value'
                ? 'Submit Statutory Enhancement Petition (§64)'
                : mode === 'decline_objection'
                  ? 'Submit Statutory Objection Petition (§15)'
                  : 'Submit TDR Application to Planning Authority'}
        </Button>

        <span className="text-[11.5px] text-ink-3">
          Filed directly to the Revenue Divisional Officer / Competent Authority for Land Acquisition
        </span>
      </div>
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
