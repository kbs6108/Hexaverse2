import { AlertOctagon, BadgeCheck, CircleDashed, Clock, Landmark, Radar, Receipt } from 'lucide-react';
import { Badge } from './Badge';
import type { ParcelStatus } from '@/lib/cdm';
import { t } from '@/lib/i18n';

/** Status is never colour-only: every chip has an icon and disputed carries a hatch. */
export function statusChips(s: ParcelStatus) {
  const chips = [];
  chips.push(
    s.registered ? (
      <Badge key="reg" tone="primary" icon={<BadgeCheck />}>{t('status.registered', 'Registered')}</Badge>
    ) : (
      <Badge key="reg" tone="neutral" icon={<CircleDashed />}>{t('status.unregistered', 'Unregistered')}</Badge>
    ),
  );
  if (s.has_dispute) chips.push(<Badge key="disp" tone="brick" hatch icon={<AlertOctagon />}>{t('status.disputed', 'Disputed')}</Badge>);
  if (s.has_mortgage) chips.push(<Badge key="mort" tone="violet" icon={<Landmark />}>{t('status.mortgaged', 'Mortgaged')}</Badge>);
  if (s.tax_arrears > 0) chips.push(<Badge key="tax" tone="amber" icon={<Receipt />}>{t('status.taxArrears', 'Tax arrears')}</Badge>);
  if (s.pending_mutation) chips.push(<Badge key="mut" tone="amber" icon={<Clock />}>{t('status.pendingMutation', 'Mutation pending')}</Badge>);
  if (s.change_alert) chips.push(<Badge key="chg" tone="brick" icon={<Radar />}>{t('status.changeAlert', 'Change alert')}</Badge>);
  return chips;
}
