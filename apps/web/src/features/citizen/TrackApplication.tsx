import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
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
  };

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
          {detail.data && (
            <>
              <CardHeader
                title={<span className="font-mono">{detail.data.id}</span>}
                subtitle={`${noticeTypeLabels[detail.data.type] ?? titleCase(detail.data.type)} · ${t('status.submitted')} ${fmtDate(detail.data.created_at, true)}`}
                action={<StatusBadge status={detail.data.status} />}
              />
              <CardBody className="flex flex-col gap-4">
                <p className="text-sm">
                  {t('citizen.yourLand')}{' '}
                  <Link to="/map" search={{ ulpin: detail.data.ulpin }} className="font-mono text-primary underline underline-offset-2">{detail.data.ulpin}</Link>
                  {detail.data.assigned_department && (
                    <span className="text-ink-3"> · {t('track.assignedDept').replace('{dept}', titleCase(detail.data.assigned_department))}</span>
                  )}
                </p>
                <StatusTimeline app={detail.data} />
                {Object.keys(detail.data.payload).length > 0 && (
                  <div>
                    <h3 className="mb-1 text-sm font-semibold">{t('track.submittedDetails')}</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {Object.entries(detail.data.payload).filter(([, v]) => typeof v !== 'object').map(([k, v]) => (
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
