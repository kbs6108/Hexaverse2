import { useQuery } from '@tanstack/react-query';
import { Badge, type Tone } from '@/components/Badge';
import type { Application, HistoryEntry } from '@/lib/cdm';
import { api, qk } from '@/lib/api';
import { roleAtLeast, useAuth } from '@/lib/auth';
import { fmtDate, titleCase } from '@/lib/format';

const STATUS_TONE: Record<string, Tone> = {
  submitted: 'slate',
  document_check: 'amber',
  field_verification: 'amber',
  planning_check: 'amber',
  site_inspection: 'amber',
  open: 'slate',
  assigned: 'amber',
  approved: 'primary',
  resolved: 'primary',
  returned: 'violet',
  rejected: 'brick',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{titleCase(status)}</Badge>;
}

/**
 * Status history. Uses `app.history` when the API provides it; officers fall back to the parcel
 * timeline filtered to this application; citizens fall back to a two-point derived history.
 */
export function StatusTimeline({ app }: { app: Application }) {
  const { role } = useAuth();
  const canTimeline = roleAtLeast(role, 'officer') && !app.history;
  const tl = useQuery({ queryKey: qk.timeline(app.ulpin), queryFn: () => api.timeline(app.ulpin), enabled: canTimeline });

  let entries: HistoryEntry[] = app.history ?? [];
  if (entries.length === 0 && tl.data) {
    entries = tl.data
      .filter((e) => JSON.stringify(e.detail ?? {}).includes(app.id) || e.title.includes(app.id))
      .map((e) => ({ ts: e.ts, to_status: String(e.detail?.to_status ?? e.kind), actor_name: e.actor ?? null, remark: typeof e.detail?.remark === 'string' ? e.detail.remark : null, action: e.title }));
  }
  if (entries.length === 0) {
    entries = [{ ts: app.created_at, to_status: 'submitted', actor_name: app.applicant_name ?? null }];
    if (app.status !== 'submitted') entries.push({ ts: app.updated_at, to_status: app.status });
  }

  return (
    <ol className="relative ml-1.5 border-l border-line pl-5" aria-label="Status history">
      {entries.map((h, i) => {
        const last = i === entries.length - 1;
        return (
          <li key={i} className="relative pb-3 last:pb-0">
            <span className={`absolute -left-[25px] top-1 size-3 rounded-full border-2 border-panel ${last ? 'bg-primary' : 'bg-line-strong'}`} aria-hidden />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={h.to_status} />
              <span className="text-xs text-ink-3">{fmtDate(h.ts, true)}</span>
              {h.actor_name && <span className="text-xs text-ink-3">· {h.actor_name}{h.actor_role ? ` (${h.actor_role})` : ''}</span>}
            </div>
            {h.remark && <p className="mt-0.5 text-sm text-ink-2">“{h.remark}”</p>}
          </li>
        );
      })}
    </ol>
  );
}
