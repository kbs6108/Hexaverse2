import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ChevronRight, RotateCcw, XCircle } from 'lucide-react';
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

export function TrackApplication() {
  const params = useParams({ strict: false }) as { id?: string };
  const { user } = useAuth();
  const { t } = useTranslation();
  const list = useQuery({ queryKey: qk.myApplications(user?.uid ?? ''), queryFn: api.myApplications });
  const selectedId = params.id ?? null;
  const detail = useQuery({ queryKey: qk.application(selectedId ?? ''), queryFn: () => api.application(selectedId!), enabled: !!selectedId });

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
  const rejectionReason = app
    ? (app.payload?.rejection_reason as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'rejected')?.remark ||
      'Application was scrutinized and rejected by the competent authority for statutory non-compliance.'
    : null;
  const rejectedBy = app
    ? (app.payload?.rejected_by as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'rejected')?.actor_name
    : null;
  const rejectedDesig = app
    ? (app.payload?.rejected_by_designation as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'rejected')?.actor_designation
    : null;
  const rejectedAt = app
    ? (app.payload?.rejected_at as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'rejected')?.ts
    : null;

  const approvalRemark = app
    ? (app.payload?.approval_remark as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'approved' || h.to_status === 'resolved')?.remark
    : null;
  const approvedBy = app
    ? (app.payload?.approved_by as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'approved' || h.to_status === 'resolved')?.actor_name
    : null;
  const approvedDesig = app
    ? (app.payload?.approved_by_designation as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'approved' || h.to_status === 'resolved')?.actor_designation
    : null;
  const approvedAt = app
    ? (app.payload?.approved_at as string) ||
      app.history?.slice().reverse().find((h) => h.to_status === 'approved' || h.to_status === 'resolved')?.ts
    : null;

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
                {app.status === 'rejected' && (
                  <div className="rounded-xl border border-brick/40 bg-brick-soft/40 p-4 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 text-brick font-bold text-sm">
                      <XCircle size={18} className="shrink-0" />
                      <span>Statutory Rejection Order Issued</span>
                    </div>
                    <div className="rounded-lg border border-brick/30 bg-panel p-3 space-y-1.5 shadow-2xs">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-ink-3">
                        Official Grounds for Rejection / Speaking Order:
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
                      <span>You may rectify the cited defect and re-apply, or appeal to the Revenue Divisional Officer (RDO).</span>
                      <Link
                        to="/citizen/request"
                        search={{ type: app.type, ulpin: app.ulpin }}
                      >
                        <Button size="sm" variant="primary" className="bg-brick hover:bg-brick/90">
                          File Rectified Application →
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
