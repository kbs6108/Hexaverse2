import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { api, qk } from '@/lib/api';
import { useAuth, roleAtLeast } from '@/lib/auth';
import { Loading } from '@/components/Spinner';
import { ErrorNote } from '@/components/EmptyState';
import { Callout } from '@/components/Section';
import { fmtDate, fmtVal, titleCase } from '@/lib/format';
import { Badge, type Tone } from '@/components/Badge';

const srcTone: Record<string, Tone> = { revenue: 'primary', registration: 'slate', planning: 'amber', fiscal: 'neutral', legal: 'brick', utilities: 'neutral', landstack: 'violet', satellite: 'brick' };

export function Timeline({ ulpin }: { ulpin: string }) {
  const { role } = useAuth();
  const allowed = roleAtLeast(role, 'officer');
  const q = useQuery({ queryKey: qk.timeline(ulpin), queryFn: () => api.timeline(ulpin), enabled: allowed });

  if (!allowed) {
    return (
      <Callout tone="slate" title={<span className="flex items-center gap-1"><Lock size={14} /> Officer view</span>}>
        The cross-department timeline (deeds, mutations, permissions, tax events) is available to officers. Citizens can track their own applications under Citizen → Track.
      </Callout>
    );
  }
  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorNote error={q.error} retry={() => void q.refetch()} />;
  const events = q.data ?? [];
  if (events.length === 0) return <p className="text-sm text-ink-3">No events recorded for this parcel.</p>;
  return (
    <ol className="relative ml-2 border-l border-line pl-5">
      {events.map((e, i) => (
        <li key={i} className="relative pb-4 last:pb-0">
          <span className="absolute -left-[26px] top-1 size-3 rounded-full border-2 border-panel bg-primary" aria-hidden />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={srcTone[e.source] ?? 'neutral'}>{titleCase(e.source)}</Badge>
            <span className="text-xs text-ink-3">{fmtDate(e.ts, true)}</span>
          </div>
          <p className="mt-0.5 text-sm font-medium">{e.title}</p>
          {e.detail && Object.keys(e.detail).length > 0 && (
            <p className="text-xs text-ink-3">
              {Object.entries(e.detail).slice(0, 4).map(([k, v]) => `${titleCase(k)}: ${fmtVal(v)}`).join(' · ')}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
