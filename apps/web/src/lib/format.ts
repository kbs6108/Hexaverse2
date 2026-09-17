const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });

export const fmtINR = (v: number | null | undefined) => (v === null || v === undefined ? '—' : inr.format(v));
export const fmtNum = (v: number | null | undefined, unit = '') =>
  v === null || v === undefined ? '—' : `${num.format(v)}${unit ? ` ${unit}` : ''}`;
/** Human form of an arbitrary backend value for inline "key: value" lines. */
export const fmtVal = (v: unknown): string =>
  v === null || v === undefined || v === ''
    ? '—'
    : typeof v === 'boolean'
      ? v
        ? 'yes'
        : 'no'
      : typeof v === 'number'
        ? num.format(v)
        : String(v);
export const fmtArea = (sqm: number | null | undefined) => {
  if (sqm === null || sqm === undefined) return '—';
  const cents = sqm / 40.4686;
  return `${num.format(sqm)} m² · ${num.format(cents)} cents`;
};

export function fmtDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}
export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
export function relTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return iso;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
export const titleCase = (s: string | null | undefined) =>
  (s ?? '—').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${num.format(v)}%`);
