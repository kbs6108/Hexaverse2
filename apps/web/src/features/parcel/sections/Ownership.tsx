import { useState } from 'react';
import { CheckCircle2, EyeOff, SlidersHorizontal, UserRound } from 'lucide-react';
import type { ParcelCDM } from '@/lib/cdm';
import { useAuth } from '@/lib/auth';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { KV, SectionTitle, Callout } from '@/components/Section';
import { fmtArea, titleCase } from '@/lib/format';
import { Badge } from '@/components/Badge';
import { useTranslation } from '@/lib/i18n';
import { OwnerPrivacyModal } from '../OwnerPrivacyModal';

export function Ownership({ p }: { p: ParcelCDM }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const ror = p.rights.ror;
  const isMyLand = !!p.viewer_is_owner || (!p.party.masked && user?.role === 'citizen' && p.party.owners.some((o) => {
    const pName = (user.name || '').trim().toLowerCase();
    const oName = (o.name || '').trim().toLowerCase();
    return pName && oName && (pName === oName || pName.includes(oName) || oName.includes(pName));
  }));

  return (
    <div className="flex flex-col gap-5">
      <OwnerPrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} parcel={p} />
      <div>
        <SectionTitle right={<ProvenanceBadge source="revenue" p={p.provenance.revenue} />}>{t('drawer.ror', 'Record of Rights')}</SectionTitle>
        {p.party.masked && (
          <Callout tone="slate" title={<span className="flex items-center gap-1"><EyeOff size={14} /> {t('drawer.namesMasked', 'Names are masked')}</span>}>
            {t('drawer.maskedNotice', 'Full owner details require consent from the owner or officer access. Use “Verify ownership” to check a name without revealing it.')}
          </Callout>
        )}
        {!p.party.masked && isMyLand && (
          <Callout tone="primary" title={<span className="flex items-center gap-1.5 font-semibold text-primary"><CheckCircle2 size={15} /> Verified Title Holder (Your Parcel)</span>}>
            <p>
              You are the registered title owner of this parcel under the statutory Record of Rights (RoR). Full title records, nominee allocations, and unmasked identifiers are unlocked for your profile.
            </p>
            <div className="mt-2.5 pt-2 border-t border-primary/20 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11.5px] text-ink-2">Control public disclosure & privacy for this parcel:</span>
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer bg-white/90 dark:bg-ground-2 px-2.5 py-1 rounded-md border border-line shadow-2xs"
              >
                <SlidersHorizontal size={12} /> Privacy Settings →
              </button>
            </div>
          </Callout>
        )}
        <ul className="mt-3 flex flex-col gap-2">
          {p.party.owners.length === 0 && <li className="text-sm text-ink-3">{t('drawer.noOwner', 'No owner on record.')}</li>}
          {p.party.owners.map((o, i) => (
            <li key={i} className="flex items-center gap-3 rounded-md border border-line px-3 py-2">
              <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-primary"><UserRound size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{o.name}</p>
                <p className="text-xs text-ink-3">{o.father_name ? `S/o ${o.father_name} · ` : ''}{titleCase(o.type)}</p>
              </div>
              <Badge>{Math.round(o.share * 100)}{t('drawer.sharePercent', '% share')}</Badge>
            </li>
          ))}
        </ul>
      </div>
      {(ror?.nominees?.length ?? 0) > 0 && (
        <div>
          <SectionTitle>{t('drawer.recordedNominees', 'Recorded nominees')}</SectionTitle>
          <ul className="mt-1 flex flex-col gap-1">
            {ror!.nominees!.map((n, i) => (
              <li key={i} className="flex items-center justify-between rounded-md border border-line px-3 py-1.5 text-sm">
                <span>{n.name ?? '—'}<span className="text-ink-3"> · {titleCase(n.relation)}</span></span>
                {n.share != null && <Badge>{Math.round(n.share * 100)}%</Badge>}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-ink-3">{t('drawer.nomineeNotice', 'Nominees take effect only through an approved succession application — nothing is automatic.')}</p>
        </div>
      )}
      <KV
        items={[
          { k: t('common.khataNo', 'Khata no.'), v: ror?.khata_no ?? p.identifiers.khata_no ?? '—', mono: true },
          { k: t('drawer.classification', 'Classification'), v: titleCase(ror?.classification) },
          { k: t('drawer.extentRoR', 'Extent (RoR)'), v: fmtArea(ror?.extent_sqm) },
          { k: t('drawer.ownershipType', 'Ownership type'), v: titleCase(ror?.ownership_type) },
        ]}
      />
    </div>
  );
}
