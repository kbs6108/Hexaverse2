import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { AlertTriangle, BadgeCheck, Inbox, Landmark, Radar, Receipt, Scale, type LucideIcon } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { api, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Loading } from '@/components/Spinner';
import { ErrorNote } from '@/components/EmptyState';
import { fmtNum, pct, titleCase } from '@/lib/format';
import { LAND_USE } from '@/features/map/legend';
import { PageTitle } from '@/features/citizen/CitizenHome';
import { useTranslation } from '@/lib/i18n';

export function OfficerLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();

  const subnav = [
    { to: '/officer', label: t('officer.navConsole'), exact: true },
    { to: '/officer/queue', label: t('officer.navQueue'), exact: false },
    { to: '/officer/alerts', label: t('officer.navAlerts'), exact: false },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <nav aria-label="Officer sections" className="mb-6 flex gap-2 border-b border-line pb-3">
        {subnav.map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              search={{}}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition-all shadow-xs',
                active ? 'bg-primary text-white shadow-sm' : 'border border-line bg-panel text-ink-2 hover:bg-ground-2 hover:text-ink',
              )}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}

function useChartTheme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return { ink: v('--ink'), ink3: v('--ink-3'), line: v('--line'), panel: v('--panel'), primary: v('--primary'), amber: v('--amber'), brick: v('--brick'), violet: v('--violet'), slate: v('--slate') };
}

export function OfficerConsole() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const q = useQuery({ queryKey: qk.stats(), queryFn: api.stats, refetchInterval: 30_000 });
  const theme = useChartTheme();
  const s = q.data;

  const kpis: { label: string; value: string; icon: LucideIcon; tone: string }[] = s
    ? [
        { label: t('officer.kpiParcels'), value: fmtNum(s.total_parcels), icon: BadgeCheck, tone: 'text-ink' },
        { label: t('officer.kpiRegistered'), value: pct(s.registered_pct), icon: BadgeCheck, tone: 'text-primary' },
        { label: t('officer.kpiDisputed'), value: fmtNum(s.disputed), icon: Scale, tone: 'text-brick' },
        { label: t('officer.kpiMortgaged'), value: fmtNum(s.mortgaged), icon: Landmark, tone: 'text-violet' },
        { label: t('officer.kpiTaxArrears'), value: fmtNum(s.tax_arrears), icon: Receipt, tone: 'text-amber' },
        { label: t('officer.kpiPendingApps'), value: fmtNum(s.pending_applications), icon: Inbox, tone: 'text-slate' },
        { label: t('officer.kpiOpenAlerts'), value: fmtNum(s.open_alerts), icon: Radar, tone: 'text-brick' },
      ]
    : [];

  const textStyle = { fontFamily: 'IBM Plex Sans, sans-serif', color: theme.ink3 };
  const donut = s && {
    textStyle,
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: theme.ink3, fontSize: 11 }, icon: 'circle' },
    series: [{
      type: 'pie', radius: ['48%', '72%'], center: ['50%', '42%'], avoidLabelOverlap: true,
      label: { show: false }, itemStyle: { borderColor: theme.panel, borderWidth: 2 },
      data: Object.entries(s.land_use).map(([k, v]) => ({ name: titleCase(k), value: v, itemStyle: { color: LAND_USE.find((l) => l.value === k)?.colour ?? '#B9B5A6' } })),
    }],
  };
  const statusColour = (k: string) => (k === 'approved' || k === 'resolved' ? theme.primary : k === 'rejected' ? theme.brick : k === 'returned' ? theme.violet : k === 'submitted' || k === 'open' ? theme.slate : theme.amber);
  const bars = s && {
    textStyle,
    grid: { left: 8, right: 12, top: 12, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: theme.line } }, axisLabel: { color: theme.ink3 } },
    yAxis: { type: 'category', data: Object.keys(s.applications_by_status).map(titleCase), axisLabel: { color: theme.ink }, axisLine: { lineStyle: { color: theme.line } } },
    series: [{ type: 'bar', barMaxWidth: 18, data: Object.entries(s.applications_by_status).map(([k, v]) => ({ value: v, itemStyle: { color: statusColour(k), borderRadius: [0, 4, 4, 0] } })) }],
  };
  const alertColour: Record<string, string> = { change_detected: theme.brick, inconsistency: theme.amber, pending_mutation: theme.slate };
  const alerts = s && {
    textStyle,
    grid: { left: 8, right: 12, top: 12, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: Object.keys(s.alerts_by_kind).map(titleCase), axisLabel: { color: theme.ink, interval: 0 }, axisLine: { lineStyle: { color: theme.line } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: theme.line } }, axisLabel: { color: theme.ink3 } },
    series: [{ type: 'bar', barMaxWidth: 36, data: Object.entries(s.alerts_by_kind).map(([k, v]) => ({ value: v, itemStyle: { color: alertColour[k] ?? theme.violet, borderRadius: [4, 4, 0, 0] } })) }],
  };

  return (
    <>
      <PageTitle
        title={t('officer.navConsole')}
        subtitle={user?.department ? `${titleCase(user.department)} department · AP · TN · TG` : 'All departments · AP · TN · TG'}
      />
      {q.isLoading && <Loading label={t('common.loading')} />}
      {q.isError && <ErrorNote error={q.error} retry={() => void q.refetch()} />}
      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {kpis.map((k) => (
              <div key={k.label} className="flex flex-col justify-between rounded-2xl border border-line bg-panel p-4 shadow-panel transition hover:border-line-strong">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                  <k.icon size={13} className="text-primary" /> {k.label}
                </div>
                <p className={clsx('mt-2 font-display text-2xl font-bold', k.tone)}>{k.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl border border-line shadow-panel"><CardHeader title="Land use" subtitle="Parcels by current use" /><CardBody><ReactECharts option={donut} style={{ height: 260 }} notMerge /></CardBody></Card>
            <Card className="rounded-2xl border border-line shadow-panel"><CardHeader title="Applications by status" /><CardBody><ReactECharts option={bars} style={{ height: 260 }} notMerge /></CardBody></Card>
            <Card className="rounded-2xl border border-line shadow-panel"><CardHeader title="Alerts by kind" subtitle="Open + assigned" /><CardBody><ReactECharts option={alerts} style={{ height: 260 }} notMerge /></CardBody></Card>
          </div>
          {s.open_alerts > 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-2">
              <AlertTriangle size={15} className="text-amber" /> {s.open_alerts} {t('officer.kpiOpenAlerts')}. <Link to="/officer/alerts" className="text-primary underline underline-offset-2">{t('officer.navAlerts')}</Link>
            </p>
          )}
        </>
      )}
    </>
  );
}
