import { fmtArea, titleCase } from '@/lib/format';
import { maskName } from '@/lib/mask';

export interface HoverInfo {
  x: number;
  y: number;
  props: Record<string, unknown>;
}

/** Mini-card following the cursor. Owner names are always masked here (tiles are public). */
export function HoverCard({ info }: { info: HoverInfo }) {
  const p = info.props;
  const flags: string[] = [];
  if (truthy(p.has_dispute)) flags.push('Disputed');
  if (truthy(p.has_mortgage)) flags.push('Mortgaged');
  if (Number(p.tax_arrears ?? 0) > 0) flags.push('Tax arrears');
  if (truthy(p.pending_mutation)) flags.push('Mutation pending');
  if (truthy(p.change_alert)) flags.push('Change alert');
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 min-w-44 max-w-72 rounded-xl border border-line bg-panel/95 px-3 py-2 text-xs shadow-elevated backdrop-blur-xl text-ink"
      style={{ left: info.x + 14, top: info.y + 14 }}
    >
      <p className="font-display text-sm font-semibold text-ink">Sy. No. {String(p.survey_no ?? '—')}</p>
      <p className="text-ink-2">
        {titleCase(String(p.land_use ?? '—'))} · {fmtArea(Number(p.area_sqm ?? 0))}
      </p>
      {typeof p.owner_name === 'string' && p.owner_name && <p className="text-ink-2">Owner: {maskName(p.owner_name)}</p>}
      {flags.length > 0 && <p className="mt-1 text-amber-600 dark:text-amber-400 font-semibold">{flags.join(' · ')}</p>}
      <p className="mt-1 font-mono text-[10.5px] text-ink-3">{String(p.ulpin ?? '')}</p>
    </div>
  );
}

function truthy(v: unknown): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}
