import { AlertOctagon, BadgeCheck, CircleDashed, Clock, Landmark, Radar, Receipt } from 'lucide-react';
import { Badge } from './Badge';
import type { ParcelStatus } from '@/lib/cdm';
import { useTranslation, t } from '@/lib/i18n';

/** Status is never colour-only: every chip has an icon and disputed carries a hatch. */
export function statusChips(s: ParcelStatus, tFn: (key: string, fallback?: string) => string = t) {
  const chips = [];
  chips.push(
    s.registered ? (
      <Badge key="reg" tone="primary" icon={<BadgeCheck />}>{tFn('status.registered', 'Registered')}</Badge>
    ) : (
      <Badge key="reg" tone="neutral" icon={<CircleDashed />}>{tFn('status.unregistered', 'Unregistered')}</Badge>
    ),
  );
  if (s.has_dispute) chips.push(<Badge key="disp" tone="brick" hatch icon={<AlertOctagon />}>{tFn('status.disputed', 'Disputed')}</Badge>);
  if (s.has_mortgage) chips.push(<Badge key="mort" tone="violet" icon={<Landmark />}>{tFn('status.mortgaged', 'Mortgaged')}</Badge>);
  if (s.tax_arrears > 0) chips.push(<Badge key="tax" tone="amber" icon={<Receipt />}>{tFn('status.taxArrears', 'Tax arrears')}</Badge>);
  if (s.pending_mutation) chips.push(<Badge key="mut" tone="amber" icon={<Clock />}>{tFn('status.pendingMutation', 'Mutation pending')}</Badge>);
  if (s.change_alert) chips.push(<Badge key="chg" tone="brick" icon={<Radar />}>{tFn('status.changeAlert', 'Change alert')}</Badge>);
  return chips;
}

export function StatusChips({ status }: { status: ParcelStatus }) {
  const { t: translate } = useTranslation();
  return <>{statusChips(status, translate)}</>;
}
