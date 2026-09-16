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
import { PageTitle } from '@/components/PageTitle';

const SUBNAV = [
  { to: '/officer', label: 'Console', exact: true },
  { to: '/officer/queue', label: 'Queue', exact: false },
  { to: '/officer/alerts', label: 'Alerts', exact: false },
] as const;

export function OfficerLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-5">
      <nav aria-label="Officer sections" className="mb-4 flex gap-1 border-b border-line">
        {SUBNAV.map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} search={{}} aria-current={active ? 'page' : undefined} className={clsx('-mb-px border-b-2 px-3 py-2 text-sm font-medium', active ? 'border-primary text-ink' : 'border-transparent text-ink-3 hover:text-ink')}>
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
  const q = useQuery({ queryKey: qk.stats(), queryFn: api.stats, refetchInterval: 30_000 });
  const t = useChartTheme();
  const s = q.data;

  const kpis: { label: string; value: string; icon: LucideIcon; tone: string }[] = s
    ? [
        { label: 'Parcels', value: fmtNum(s.total_parcels), icon: BadgeCheck, tone: 'text-ink' },
        { label: 'Registered', value: pct(s.registered_pct), icon: BadgeCheck, tone: 'text-primary' },
        { label: 'Disputed', value: fmtNum(s.disputed), icon: Scale, tone: 'text-brick' },
        { label: 'Mortgaged', value: fmtNum(s.mortgaged), icon: Landmark, tone: 'text-violet' },
        { label: 'Tax arrears', value: fmtNum(s.tax_arrears), icon: Receipt, tone: 'text-amber' },
        { label: 'Pending applications', value: fmtNum(s.pending_applications), icon: Inbox, tone: 'text-slate' },
        { label: 'Open alerts', value: fmtNum(s.open_alerts), icon: Radar, tone: 'text-brick' },
      ]
    : [];

  const textStyle = { fontFamily: 'IBM Plex Sans, sans-serif', color: t.ink3 };
  const donut = s && {
    textStyle,
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: t.ink3, fontSize: 11 }, icon: 'circle' },
    series: [{
      type: 'pie', radius: ['48%', '72%'], center: ['50%', '42%'], avoidLabelOverlap: true,
      label: { show: false }, itemStyle: { borderColor: t.panel, borderWidth: 2 },
      data: Object.entries(s.land_use).map(([k, v]) => ({ name: titleCase(k), value: v, itemStyle: { color: LAND_USE.find((l) => l.value === k)?.colour ?? '#B9B5A6' } })),
    }],
  };
  const statusColour = (k: string) => (k === 'approved' || k === 'resolved' ? t.primary : k === 'rejected' ? t.brick : k === 'returned' ? t.violet : k === 'submitted' || k === 'open' ? t.slate : t.amber);
  const bars = s && {
    textStyle,
    grid: { left: 8, right: 12, top: 12, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: t.line } }, axisLabel: { color: t.ink3 } },
    yAxis: { type: 'category', data: Object.keys(s.applications_by_status).map(titleCase), axisLabel: { color: t.ink }, axisLine: { lineStyle: { color: t.line } } },
    series: [{ type: 'bar', barMaxWidth: 18, data: Object.entries(s.applications_by_status).map(([k, v]) => ({ value: v, itemStyle: { color: statusColour(k), borderRadius: [0, 3, 3, 0] } })) }],
  };
  const alertColour: Record<string, string> = { change_detected: t.brick, inconsistency: t.amber, pending_mutation: t.slate };
  const alerts = s && {
    textStyle,
    grid: { left: 8, right: 12, top: 12, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: Object.keys(s.alerts_by_kind).map(titleCase), axisLabel: { color: t.ink, interval: 0 }, axisLine: { lineStyle: { color: t.line } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: t.line } }, axisLabel: { color: t.ink3 } },
    series: [{ type: 'bar', barMaxWidth: 36, data: Object.entries(s.alerts_by_kind).map(([k, v]) => ({ value: v, itemStyle: { color: alertColour[k] ?? t.violet, borderRadius: [3, 3, 0, 0] } })) }],
  };

  return (
    <>
      <PageTitle title="Officer console" subtitle={user?.department ? `${titleCase(user.department)} department · AP · TN · TG` : 'All departments · AP · TN · TG'} />
      {q.isLoading && <Loading label="Loading statistics…" />}
      {q.isError && <ErrorNote error={q.error} retry={() => void q.refetch()} />}
      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            {kpis.map((k) => (
              <Card key={k.label} className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-ink-3"><k.icon size={12} /> {k.label}</div>
                <p className={clsx('mt-1 font-display text-2xl font-semibold', k.tone)}>{k.value}</p>
              </Card>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card><CardHeader title="Land use" subtitle="Parcels by current use" /><CardBody><ReactECharts option={donut} style={{ height: 260 }} notMerge /></CardBody></Card>
            <Card><CardHeader title="Applications by status" /><CardBody><ReactECharts option={bars} style={{ height: 260 }} notMerge /></CardBody></Card>
            <Card><CardHeader title="Alerts by kind" subtitle="Open + assigned" /><CardBody><ReactECharts option={alerts} style={{ height: 260 }} notMerge /></CardBody></Card>
          </div>
          {s.open_alerts > 0 && (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-2">
              <AlertTriangle size={15} className="text-amber" /> {s.open_alerts} alert(s) need attention. <Link to="/officer/alerts" className="text-primary underline underline-offset-2">Open alerts</Link>
            </p>
          )}
        </>
      )}
    </>
  );
}
