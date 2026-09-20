import { AlertOctagon, Landmark } from 'lucide-react';
import type { ParcelCDM } from '@/lib/cdm';
import { ProvenanceBadge } from '@/components/ProvenanceBadge';
import { KV, SectionTitle } from '@/components/Section';
import { fmtDate, fmtINR, titleCase } from '@/lib/format';
import { Badge } from '@/components/Badge';
import { t } from '@/lib/i18n';

export function Registration({ p }: { p: ParcelCDM }) {
  const r = p.rights.registration;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle right={<ProvenanceBadge source="registration" p={p.provenance.registration} />}>{t('drawer.registration', 'Registration')}</SectionTitle>
        <KV
          items={[
            { k: t('common.status', 'Status'), v: r ? titleCase(r.status) : '—' },
            { k: t('drawer.docNo', 'Document no.'), v: r?.doc_no ?? '—', mono: true },
            { k: t('drawer.deedType', 'Deed type'), v: titleCase(r?.deed_type) },
            { k: t('drawer.registeredOn', 'Registered on'), v: fmtDate(r?.registered_on) },
            { k: t('drawer.sro', 'SRO'), v: r?.sro_code ?? '—', mono: true },
          ]}
        />
      </div>

      <div>
        <SectionTitle>{t('drawer.encumbrances', 'Encumbrances')}</SectionTitle>
        {p.restrictions.encumbrances.length === 0 ? (
          <p className="text-sm text-ink-3">{t('drawer.noEncumbrance', 'No encumbrance on record.')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {p.restrictions.encumbrances.map((e, i) => (
              <li key={i} className="flex items-center gap-3 rounded-md border border-violet/30 bg-violet-soft/50 px-3 py-2">
                <Landmark size={16} className="text-violet" />
                <div className="flex-1">
                  <p className="font-medium">{titleCase(e.kind)} · {e.holder ?? 'Holder n/a'}</p>
                  <p className="text-xs text-ink-3">{fmtINR(e.amount)}{e.from_date ? ` · from ${fmtDate(e.from_date)}` : ''}</p>
                </div>
                <Badge tone={e.active ? 'violet' : 'neutral'}>{e.active ? t('common.active', 'Active') : t('drawer.released', 'Released')}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <SectionTitle right={<ProvenanceBadge source="legal" p={p.provenance.legal} />}>{t('drawer.disputes', 'Disputes')}</SectionTitle>
        {p.restrictions.disputes.length === 0 ? (
          <p className="text-sm text-ink-3">{t('drawer.noLitigation', 'No litigation on record.')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {p.restrictions.disputes.map((d) => (
              <li key={d.case_no} className="relative overflow-hidden rounded-md border border-brick/30 bg-brick-soft/50 px-3 py-2">
                <span aria-hidden className="absolute inset-0 opacity-[0.07] hatch-brick" />
                <div className="relative flex items-start gap-3">
                  <AlertOctagon size={16} className="mt-0.5 text-brick" />
                  <div className="flex-1">
                    <p className="font-medium font-mono text-[13px]">{d.case_no}</p>
                    <p className="text-xs text-ink-2">{d.court ?? ''}{d.nature ? ` · ${d.nature}` : ''}</p>
                    <p className="text-xs text-ink-3">{t('drawer.filed', 'Filed')} {fmtDate(d.filed_on)}{d.next_hearing ? ` · ${t('drawer.nextHearing', 'next hearing')} ${fmtDate(d.next_hearing)}` : ''}</p>
                  </div>
                  <Badge tone="brick" hatch>{titleCase(d.status)}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
