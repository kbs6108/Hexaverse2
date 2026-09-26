import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { Radar, Scale, Clock, UserCheck, CheckCheck, ClipboardCheck, BookOpen, ArrowRight, Info } from 'lucide-react';
import { api, qk } from '@/lib/api';
import type { Alert } from '@/lib/cdm';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge, type Tone } from '@/components/Badge';
import { Loading } from '@/components/Spinner';
import { EmptyState, ErrorNote } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { fmtDate, titleCase } from '@/lib/format';
import { PageTitle } from '@/features/citizen/CitizenHome';
import { MechanismExplainerModal } from '@/components/MechanismExplainerModal';
import { useTranslation } from '@/lib/i18n';

const KIND_ICON = { change_detected: Radar, inconsistency: Scale, pending_mutation: Clock } as const;
const SEV_TONE: Record<string, Tone> = { high: 'brick', medium: 'amber', low: 'slate' };

export function AlertsPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'open' | 'assigned' | 'resolved' | ''>('open');
  const [guideOpen, setGuideOpen] = useState(false);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: qk.alerts(status), queryFn: () => api.alerts(status || undefined), refetchInterval: 20_000 });
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['alerts'] });
    void qc.invalidateQueries({ queryKey: qk.stats() });
  };
  const assign = useMutation({ mutationFn: (a: Alert) => api.assignAlert(a.id), onSuccess: () => { toast.success('Alert assigned to you'); invalidate(); }, onError: (e: Error) => toast.error('Assign failed', e.message) });
  // Close the loop on satellite alerts: one click files a field_review application
  // (pre-filled from the alert) and assigns the alert, so it lands in the queue.
  const review = useMutation({
    mutationFn: async (a: Alert) => {
      const app = await api.createApplication(a.ulpin!, 'field_review', {
        trigger: a.kind,
        alert_id: a.id,
        label: typeof a.detail?.label === 'string' ? a.detail.label : undefined,
        note: `Filed from alert #${a.id}: ${a.title}`,
      });
      if (a.status === 'open') await api.assignAlert(a.id).catch(() => undefined);
      return app;
    },
    onSuccess: (app) => {
      toast.success('Field review filed in Queue', `${app.id} · Awaiting site verification`);
      invalidate();
      void qc.invalidateQueries({ queryKey: ['queue'] });
    },
    onError: (e: Error) => toast.error('Could not file field review', e.message),
  });
  const resolve = useMutation({
    mutationFn: (a: Alert) => api.resolveAlert(a.id),
    onSuccess: () => {
      toast.success('Alert dismissed', 'Official land title & boundaries are updated in the Work Queue');
      invalidate();
    },
    onError: (e: Error) => toast.error('Resolve failed', e.message),
  });

  return (
    <>
      <PageTitle
        title={t('officer.subnavAlerts', 'Alerts')}
        subtitle="Satellite change, cross-department inconsistencies and pending mutations"
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={<BookOpen size={14} className="text-primary" />}
            onClick={() => setGuideOpen(true)}
          >
            {t('officer.howMechanismsWork', 'How mechanisms work')}
          </Button>
        }
      />
      <MechanismExplainerModal open={guideOpen} onClose={() => setGuideOpen(false)} initialTab="alerts_vs_apps" />

      {/* Mechanism Clarification Banner */}
      <div className="mb-4 rounded-xl border border-primary/25 bg-primary-soft/30 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Info size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-ink">{t('officer.alertFlagAnomalies', 'Alerts Flag Anomalies · Applications Execute Statutory Changes')}</p>
            <p className="text-ink-3 text-[11.5px] leading-relaxed">
              {t('officer.alertBannerDesc', 'Alerts are automated detection signals (satellite change detection, registry discrepancies, pending mutations). Resolving an alert acknowledges the notice. Official property title and extent records are legally modified by approving applications in the Work Queue.')}
            </p>
          </div>
        </div>
        <Link to="/officer/queue" className="shrink-0">
          <Button size="sm" variant="secondary" icon={<ArrowRight size={13} />}>
            {t('officer.openWorkQueue', 'Open Work Queue')}
          </Button>
        </Link>
      </div>

      <div className="mb-3 inline-flex rounded-md border border-line bg-panel p-1" role="tablist" aria-label="Alert status">
        {(['open', 'assigned', 'resolved', ''] as const).map((s) => {
          const tabLabel = s === 'open' ? t('officer.alertStatusOpen', 'Open')
            : s === 'assigned' ? t('officer.alertStatusAssigned', 'Assigned')
            : s === 'resolved' ? t('officer.alertStatusResolved', 'Resolved')
            : t('officer.alertStatusAll', 'All');
          return (
            <button key={s || 'all'} role="tab" aria-selected={status === s} onClick={() => setStatus(s)} className={clsx('rounded px-3 py-1 text-sm font-medium', status === s ? 'bg-primary text-primary-ink' : 'text-ink-2 hover:text-ink')}>
              {tabLabel}
            </button>
          );
        })}
      </div>
      {q.isLoading && <Loading />}
      {q.isError && <ErrorNote error={q.error} retry={() => void q.refetch()} />}
      {q.data && q.data.length === 0 && <EmptyState title="Nothing here" body="No alerts in this state." />}
      <ul className="flex flex-col gap-2">
        {q.data?.map((a) => {
          const Icon = KIND_ICON[a.kind] ?? Radar;
          const openAppId = a.open_application_id || (typeof a.detail?.application_id === 'string' ? a.detail.application_id : null);
          return (
            <li key={a.id}>
              <Card className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className={clsx('grid size-9 shrink-0 place-items-center rounded-md', a.severity === 'high' ? 'bg-brick-soft text-brick' : 'bg-amber-soft text-amber')}><Icon size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {a.title}
                    <Badge tone={SEV_TONE[a.severity] ?? 'neutral'}>{titleCase(a.severity)}</Badge>
                    <Badge>{titleCase(a.kind)}</Badge>
                  </p>
                  <p className="text-xs text-ink-3">
                    #{a.id} · {fmtDate(a.created_at, true)}
                    {a.ulpin && <> · <Link to="/map" search={{ ulpin: a.ulpin }} className="font-mono text-primary underline-offset-2 hover:underline">{a.survey_no ? `Sy. ${a.survey_no}` : a.ulpin}</Link></>}
                    {a.assigned_to && <> · assigned to {a.assigned_to}</>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {openAppId && (
                    <Link to="/officer/queue" search={{ app: openAppId }}>
                      <Button size="sm" variant="secondary" icon={<ArrowRight size={13} />} className="border-primary/40 text-primary hover:bg-primary-soft">
                        Review in Queue ({openAppId})
                      </Button>
                    </Link>
                  )}
                  {a.kind === 'change_detected' && a.status !== 'resolved' && a.ulpin && !openAppId && (
                    <Button size="sm" icon={<ClipboardCheck size={14} />} loading={review.isPending && review.variables?.id === a.id} onClick={() => review.mutate(a)}>
                      Field review
                    </Button>
                  )}
                  {a.status === 'open' && <Button size="sm" icon={<UserCheck size={14} />} loading={assign.isPending && assign.variables?.id === a.id} onClick={() => assign.mutate(a)}>Assign to me</Button>}
                  {a.status !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<CheckCheck size={14} />}
                      loading={resolve.isPending && resolve.variables?.id === a.id}
                      onClick={() => resolve.mutate(a)}
                      title="Resolving dismisses this notification alert. To legally update property records, approve the application in the Work Queue."
                    >
                      Resolve
                    </Button>
                  )}
                  {a.status === 'resolved' && <Badge tone="primary">Resolved</Badge>}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </>
  );
}
