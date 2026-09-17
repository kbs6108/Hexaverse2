import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { api, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Loading } from '@/components/Spinner';
import { EmptyState, ErrorNote } from '@/components/EmptyState';
import { PageTitle } from '@/components/PageTitle';
import { StatusBadge, StatusTimeline } from '@/features/officer/ApplicationBits';
import { fmtDate, titleCase } from '@/lib/format';
import { Button } from '@/components/Button';

export function TrackApplication() {
  const params = useParams({ strict: false }) as { id?: string };
  const { user } = useAuth();
  const list = useQuery({ queryKey: qk.myApplications(user?.uid ?? ''), queryFn: api.myApplications });
  const selectedId = params.id ?? null;
  const detail = useQuery({ queryKey: qk.application(selectedId ?? ''), queryFn: () => api.application(selectedId!), enabled: !!selectedId });

  return (
    <>
      <PageTitle title="Track application" subtitle="Your mutation, building-permission and verification requests" action={<Link to="/citizen/request"><Button variant="primary">New request</Button></Link>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader title="My applications" subtitle={list.data ? `${list.data.length} total` : undefined} />
          <CardBody className="px-2">
            {list.isLoading && <Loading />}
            {list.isError && <ErrorNote error={list.error} retry={() => void list.refetch()} />}
            {list.data && list.data.length === 0 && <EmptyState title="No applications yet" body="Request a mutation or building permission to see it here." />}
            <ul className="flex flex-col gap-1.5">
              {list.data?.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/citizen/track/$id"
                    params={{ id: a.id }}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-[#18231F]',
                      a.id === selectedId ? 'bg-[#23483A]/15 border border-[#176B52]/40 shadow-xs' : 'hover:bg-[#E9E5D8]/70',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-bold text-[#18231F]">
                        <span className="font-mono">{a.id}</span>
                        <StatusBadge status={a.status} />
                      </p>
                      <p className="text-xs font-medium text-[#4B5345] mt-0.5">{titleCase(a.type)} · {a.survey_no ? `Sy. No. ${a.survey_no}` : a.ulpin} · {fmtDate(a.updated_at)}</p>
                    </div>
                    <ChevronRight size={16} className="text-[#6F7768]" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          {!selectedId && <CardBody className="pt-6 text-sm font-medium text-[#4B5345]">Select an application to see its progress.</CardBody>}
          {selectedId && detail.isLoading && <Loading />}
          {selectedId && detail.isError && <CardBody className="pt-4"><ErrorNote error={detail.error} /></CardBody>}
          {detail.data && (
            <>
              <CardHeader
                title={<span className="font-mono text-base font-bold text-[#18231F] tracking-tight">{detail.data.id}</span>}
                subtitle={`${titleCase(detail.data.type)} · submitted ${fmtDate(detail.data.created_at, true)}`}
                action={<StatusBadge status={detail.data.status} />}
              />
              <CardBody className="flex flex-col gap-5">
                <p className="text-sm font-medium text-[#18231F]">
                  Parcel{' '}
                  <Link to="/map" search={{ ulpin: detail.data.ulpin }} className="font-mono font-bold text-[#176B52] underline underline-offset-2">{detail.data.ulpin}</Link>
                  {detail.data.assigned_department && <span className="text-[#4B5345] font-medium"> · with {titleCase(detail.data.assigned_department)} department</span>}
                </p>
                <StatusTimeline app={detail.data} />
                {Object.keys(detail.data.payload).length > 0 && (
                  <div className="pt-3 border-t border-[#D5D2C7]/40">
                    <h3 className="mb-2 text-sm font-bold text-[#18231F] tracking-tight">Submitted details</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {Object.entries(detail.data.payload).filter(([, v]) => typeof v !== 'object').map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-[11px] font-bold uppercase tracking-wide text-[#4B5345]">{titleCase(k)}</dt>
                          <dd className="font-semibold text-[#18231F] mt-0.5">{String(v)}</dd>
                        </div>
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
