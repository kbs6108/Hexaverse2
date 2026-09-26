import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { api, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Loading } from '@/components/Spinner';
import { EmptyState, ErrorNote } from '@/components/EmptyState';
import { PageTitle } from './CitizenHome';
import { StatusBadge, StatusTimeline } from '@/features/officer/ApplicationBits';
import { fmtDate, titleCase } from '@/lib/format';
import { Button } from '@/components/Button';
import { useTranslation } from '@/lib/i18n';

function StageGatedDeskTracker({ app }: { app: any }) {
  const isRevenueWorkflow = ['mutation', 'record_correction', 'succession', 'boundary_correction'].includes(app.type);
  if (!isRevenueWorkflow || ['approved', 'resolved', 'rejected', 'dismissed'].includes(app.status)) {
    return null;
  }

  // Determine current active desk
  let activeIndex = 0;
  if (['document_check', 'field_inspection'].includes(app.status)) activeIndex = 0;
  else if (['field_verification', 'boundary_demarcation', 'geometry_check'].includes(app.status)) activeIndex = 1;
  else if (app.status === 'scrutiny_review') activeIndex = 2;
  else if (app.status === 'statutory_sanction') activeIndex = 3;

  const desks = [
    { title: 'VRO Desk', desc: 'On-ground Panchanama & Ryot Notice', role: 'Village Revenue Officer' },
    { title: 'Surveyor Desk', desc: 'FMB Boundary Traverse & Demarcation', role: 'Mandal Cadastral Surveyor' },
    { title: 'RI Scrutiny', desc: 'Title Chain & 30-Yr Encumbrance Audit', role: 'Revenue Inspector' },
    { title: 'Tahsildar Desk', desc: 'Statutory Speaking Order & RoR Update', role: 'Tahsildar / MRO' },
  ];

  return (
    <div className="rounded-xl border border-line bg-panel p-3.5 space-y-2.5 text-xs shadow-2xs">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-primary" />
          <span className="font-bold text-ink text-sm">Stage-Gated Statutory Desk Progression</span>
        </div>
        <span className="font-mono text-[10px] text-ink-3 uppercase tracking-wider bg-ground-2 px-2 py-0.5 rounded border border-line">
          ROR Act §5
        </span>
      </div>
      <p className="text-[11.5px] text-ink-3 leading-relaxed">
        Under statutory revenue procedure, applications pass sequentially through designated revenue desks. Only the jurisdictional officer can sign off on their stage.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {desks.map((d, idx) => {
          const isPassed = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          return (
            <div
              key={d.title}
              className={clsx(
                'rounded-lg p-2.5 border transition-all space-y-1',
                isCurrent && 'border-primary/50 bg-primary-soft/60 shadow-xs ring-1 ring-primary/30',
                isPassed && 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300',
                !isCurrent && !isPassed && 'border-line bg-ground-1 opacity-60 text-ink-3'
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-[11px]">{d.title}</span>
                {isPassed && <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />}
                {isCurrent && <span className="size-2 rounded-full bg-primary animate-pulse" />}
              </div>
              <p className="text-[10px] leading-tight text-ink-2">{d.desc}</p>
              <span className="text-[9.5px] text-ink-3 block font-mono">Stage {idx + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrackApplication() {
  const params = useParams({ strict: false }) as { id?: string };
  const { user } = useAuth();
  const { t } = useTranslation();
  const list = useQuery({ queryKey: qk.myApplications(user?.uid ?? ''), queryFn: api.myApplications });
  const selectedId = params.id ?? null;
  const detail = useQuery({ queryKey: qk.application(selectedId ?? ''), queryFn: () => api.application(selectedId!), enabled: !!selectedId });
  const [showConditions, setShowConditions] = useState(false);

  const noticeTypeLabels: Record<string, string> = {
    mutation: t('service.intentMutation'),
    succession: t('service.intentSuccession'),
    record_correction: t('service.intentCorrection'),
    building_permission: t('service.intentBuilding'),
    land_complaint: t('service.intentComplaint'),
    utility_request: t('service.intentUtility', 'Utility Service Request'),
    acquisition_claim: 'Land Acquisition Claim & Response',
  };

  const app = detail.data;

  // Extract decision details
  const rejectionReason: string | null = app
    ? ((app.payload?.rejection_reason as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'rejected' || h.to_status === 'dismissed')?.remark ||
      (app.status === 'dismissed' ? 'Grievance was scrutinized and dismissed by the competent authority.' : 'Application was scrutinized and rejected by the competent authority for statutory non-compliance.'))
    : null;
  const rejectedBy: string | null = app
    ? ((app.payload?.rejected_by as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'rejected' || h.to_status === 'dismissed')?.actor_name ||
      null)
    : null;
  const rejectedDesig: string | null = app
    ? ((app.payload?.rejected_by_designation as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'rejected' || h.to_status === 'dismissed')?.actor_designation ||
      null)
    : null;
  const rejectedAt: string | null = app
    ? ((app.payload?.rejected_at as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'rejected' || h.to_status === 'dismissed')?.ts ||
      null)
    : null;

  const approvalRemark: string | null = app
    ? ((app.payload?.approval_remark as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'approved' || h.to_status === 'resolved')?.remark ||
      null)
    : null;
  const approvedBy: string | null = app
    ? ((app.payload?.approved_by as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'approved' || h.to_status === 'resolved')?.actor_name ||
      null)
    : null;
  const approvedDesig: string | null = app
    ? ((app.payload?.approved_by_designation as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'approved' || h.to_status === 'resolved')?.actor_designation ||
      null)
    : null;
  const approvedAt: string | null = app
    ? ((app.payload?.approved_at as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'approved' || h.to_status === 'resolved')?.ts ||
      null)
    : null;

  const docVerification = app?.payload?.document_verification as Record<string, any> | undefined;

  return (
    <>
      <PageTitle
        title={t('track.title')}
        subtitle={t('track.subtitle')}
        action={<Link to="/citizen/request"><Button variant="primary">{t('track.newRequest')}</Button></Link>}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader title={t('track.myApps')} subtitle={list.data ? `${list.data.length} ${t('common.total')}` : undefined} />
          <CardBody className="px-2">
            {list.isLoading && <Loading />}
            {list.isError && <ErrorNote error={list.error} retry={() => void list.refetch()} />}
            {list.data && list.data.length === 0 && (
              <EmptyState title={t('track.noApps')} body={t('track.noAppsDesc')} />
            )}
            <ul className="flex flex-col">
              {list.data?.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/citizen/track/$id"
                    params={{ id: a.id }}
                    className={`flex items-center gap-3 rounded-md px-2 py-2 hover:bg-ground-2 ${a.id === selectedId ? 'bg-primary-soft/60' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <span className="font-mono">{a.id}</span>
                        <StatusBadge status={a.status} />
                      </p>
                      <p className="text-xs text-ink-3">
                        {noticeTypeLabels[a.type] ?? titleCase(a.type)} · {a.survey_no ? `${t('common.surveyNo')} ${a.survey_no}` : a.ulpin} · {fmtDate(a.updated_at)}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-ink-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          {!selectedId && <CardBody className="pt-5 text-sm text-ink-3">{t('track.selectApp')}</CardBody>}
          {selectedId && detail.isLoading && <Loading />}
          {selectedId && detail.isError && <CardBody className="pt-4"><ErrorNote error={detail.error} /></CardBody>}
          {app && (
            <>
              <CardHeader
                title={<span className="font-mono">{app.id}</span>}
                subtitle={`${noticeTypeLabels[app.type] ?? titleCase(app.type)} · ${t('status.submitted')} ${fmtDate(app.created_at, true)}`}
                action={<StatusBadge status={app.status} />}
              />
              <CardBody className="flex flex-col gap-4">
                <p className="text-sm">
                  {t('citizen.yourLand')}{' '}
                  <Link to="/map" search={{ ulpin: app.ulpin }} className="font-mono text-primary underline underline-offset-2">{app.ulpin}</Link>
                  {app.assigned_department && (
                    <span className="text-ink-3"> · {t('track.assignedDept').replace('{dept}', titleCase(app.assigned_department))}</span>
                  )}
                </p>

                {/* Statutory Rejection Speaking Order & Grounds */}
                {(app.status === 'rejected' || app.status === 'dismissed') && (
                  <div className="rounded-xl border border-brick/40 bg-brick-soft/40 p-4 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-brick font-bold text-sm">
                      <XCircle size={18} className="shrink-0" />
                      <span>{app.status === 'dismissed' ? 'Statutory Grievance Dismissed' : 'Statutory Rejection Order Issued'}</span>
                    </div>
                    <div className="rounded-lg border border-brick/30 bg-panel p-3 space-y-1.5 shadow-2xs">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-ink-3">
                        {app.status === 'dismissed' ? 'Official Grounds for Dismissal:' : 'Official Grounds for Rejection / Speaking Order:'}
                      </p>
                      <p className="text-sm font-medium text-ink leading-relaxed whitespace-pre-wrap">
                        “{rejectionReason}”
                      </p>
                      {rejectedBy && (
                        <p className="text-[11px] text-ink-3 pt-1 border-t border-line/60">
                          Order passed by: <strong>{rejectedBy}</strong>
                          {rejectedDesig ? ` (${titleCase(rejectedDesig)})` : ''}
                          {rejectedAt ? ` · ${fmtDate(rejectedAt, true)}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11.5px] text-ink-2">
                      <span>{app.status === 'dismissed' ? 'You may submit fresh supporting evidence or escalate to the District Collectorate.' : 'You may rectify the cited defect and re-apply, or appeal to the Revenue Divisional Officer (RDO).'}</span>
                      <Link
                        to="/citizen/request"
                        search={{ type: app.type, ulpin: app.ulpin }}
                      >
                        <Button size="sm" variant="primary" className="bg-brick hover:bg-brick/90">
                          {app.status === 'dismissed' ? 'File Rectified Grievance →' : 'File Rectified Application →'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Statutory Approval & Execution Order */}
                {(app.status === 'approved' || app.status === 'resolved') && (
                  <div className="rounded-xl border border-primary/40 bg-primary-soft/40 p-4 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <CheckCircle2 size={18} className="shrink-0" />
                      <span>Statutory Approval & Execution Order Passed</span>
                    </div>
                    <div className="rounded-lg border border-primary/30 bg-panel p-3 space-y-1.5 shadow-2xs">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-ink-3">
                        Official Endorsement Order:
                      </p>
                      <p className="text-sm font-medium text-ink leading-relaxed whitespace-pre-wrap">
                        “{approvalRemark || 'The application has been officially scrutinized, approved, and executed in state land records.'}”
                      </p>
                      {approvedBy && (
                        <p className="text-[11px] text-ink-3 pt-1 border-t border-line/60">
                          Sanctioned by: <strong>{approvedBy}</strong>
                          {approvedDesig ? ` (${titleCase(approvedDesig)})` : ''}
                          {approvedAt ? ` · ${fmtDate(approvedAt, true)}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11.5px] text-ink-2">
                      <span>Official land records and spatial GIS layers have been synchronized across departments.</span>
                      <Link
                        to="/map"
                        search={{ ulpin: app.ulpin }}
                      >
                        <Button size="sm" variant="primary">
                          View Updated Land on Map →
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Returned for Clarification */}
                {app.status === 'returned' && (
                  <div className="rounded-xl border border-amber/40 bg-amber-soft/40 p-4 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-amber font-bold text-sm">
                      <AlertTriangle size={18} className="shrink-0" />
                      <span>Application Returned for Clarification / Resubmission</span>
                    </div>
                    <div className="rounded-lg border border-amber/30 bg-panel p-3 space-y-1 shadow-2xs">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-ink-3">Officer Remarks:</p>
                      <p className="text-sm font-medium text-ink">
                        “{app.history?.slice().reverse().find((h) => h.to_status === 'returned')?.remark || 'Please provide required additional documents.'}”
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11.5px] text-ink-2">Upload the requested documents to resume scrutiny.</span>
                      <Link to="/citizen/request" search={{ type: app.type, ulpin: app.ulpin }}>
                        <Button size="sm" variant="secondary" icon={<RotateCcw size={13} />}>
                          Resubmit with Corrections
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                <StageGatedDeskTracker app={app} />

                {/* Cadastral Document Verification & Scrutiny */}
                {docVerification && typeof docVerification === 'object' && (
                  <div className="rounded-xl border border-line bg-panel p-3.5 text-xs space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-line pb-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={15} className="text-primary" />
                        <span className="font-bold text-sm text-ink">
                          {docVerification.document_type || 'Cadastral Instrument Verification'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={clsx(
                          'rounded-full px-2 py-0.5 text-[10.5px] font-bold border',
                          docVerification.cross_verification?.overall_status === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                        )}>
                          {docVerification.cross_verification?.overall_status === 'verified'
                            ? 'Cadastre Verified'
                            : 'Flagged for Officer Review'}
                        </span>
                        {docVerification.sha256 && (
                          <span className="font-mono text-[10px] text-ink-3 hidden sm:inline" title="SHA-256 Fingerprint">
                            SHA: {String(docVerification.sha256).slice(0, 10)}...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Flags */}
                    {docVerification.cross_verification?.flags &&
                      docVerification.cross_verification.flags.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-3 block">
                            Forensic Checks & Cadastral Alignment:
                          </span>
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {docVerification.cross_verification.flags.map((f: any) => (
                              <div
                                key={f.id}
                                className={clsx(
                                  'flex items-start gap-1.5 rounded-lg border p-2 text-[11px] leading-tight',
                                  f.severity === 'ok' && 'border-emerald-200/70 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200',
                                  f.severity === 'warn' && 'border-amber-200/70 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200',
                                  f.severity === 'bad' && 'border-rose-200/70 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                                )}
                              >
                                {f.severity === 'ok' ? (
                                  <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                  <AlertTriangle size={13} className={clsx('shrink-0 mt-0.5', f.severity === 'bad' ? 'text-rose-600' : 'text-amber-600')} />
                                )}
                                <div>
                                  <strong className="block text-ink font-semibold">{f.title}</strong>
                                  <span className="text-ink-2">{f.summary}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Tamper status and Conditions toggle */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/60 text-[11px]">
                      <span className="text-ink-3 flex items-center gap-1">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        Tamper Hash: <strong className="text-ink font-medium">{docVerification.tamper_check?.risk_level || 'Clean'}</strong>
                      </span>
                      {docVerification.cross_verification?.statutory_conditions && (
                        <button
                          type="button"
                          onClick={() => setShowConditions((p) => !p)}
                          className="text-primary hover:underline font-semibold cursor-pointer inline-flex items-center gap-0.5"
                        >
                          <span>Statutory Preconditions ({docVerification.cross_verification.statutory_conditions.length})</span>
                          <ChevronDown size={12} className={clsx('transition-transform', showConditions && 'rotate-180')} />
                        </button>
                      )}
                    </div>

                    {showConditions && docVerification.cross_verification?.statutory_conditions && (
                      <div className="rounded-lg bg-ground-1 p-2.5 space-y-1.5 border border-line text-[11px]">
                        <span className="font-bold text-ink block text-[10px] uppercase tracking-wide">
                          Officer Preconditions Before Statutory Approval:
                        </span>
                        <ul className="space-y-1">
                          {docVerification.cross_verification.statutory_conditions.map((sc: any) => (
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

                    <p className="text-[10px] text-ink-3 italic">
                      {docVerification.cross_verification?.disclaimer ||
                        'Automated diagnostic extraction is an administrative triage aid. Final quasi-judicial determination rests with the designated Competent Authority.'}
                    </p>
                  </div>
                )}

                <StatusTimeline app={app} />

                {Object.keys(app.payload).length > 0 && (
                  <div>
                    <h3 className="mb-1 text-sm font-semibold">{t('track.submittedDetails')}</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {Object.entries(app.payload).filter(([k, v]) => typeof v !== 'object' && !k.includes('rejection') && !k.includes('approval')).map(([k, v]) => (
                        <div key={k}><dt className="text-[11px] uppercase tracking-wide text-ink-3">{titleCase(k)}</dt><dd>{String(v)}</dd></div>
                      ))}
                    </dl>
                  </div>
                )}
              </CardBody>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
