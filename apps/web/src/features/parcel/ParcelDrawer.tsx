import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Copy, ShieldCheck } from 'lucide-react';
import { Drawer } from '@/components/Drawer';
import { Tabs, TabPanel } from '@/components/Tabs';
import { Loading } from '@/components/Spinner';
import { ErrorNote } from '@/components/EmptyState';
import { api, qk } from '@/lib/api';
import { useUI } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { fmtArea, titleCase } from '@/lib/format';
import { statusChips } from '@/components/StatusChip';
import { Overview } from './sections/Overview';
import { Ownership } from './sections/Ownership';
import { Registration } from './sections/Registration';
import { PlanningSection } from './sections/Planning';
import { FiscalSection } from './sections/Fiscal';
import { UtilitiesSection } from './sections/Utilities';
import { Timeline } from './sections/Timeline';
import { SatelliteSection } from './sections/Satellite';
import { useTranslation } from '@/lib/i18n';
import { OwnerPrivacyModal } from './OwnerPrivacyModal';

export type ParcelTab = 'overview' | 'ownership' | 'registration' | 'planning' | 'fiscal' | 'utilities' | 'timeline' | 'satellite';

export function ParcelDrawer({ onClose }: { onClose: () => void }) {
  const { selectedUlpin, drawerOpen, recordRecentParcel } = useUI();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tab, setTab] = useState<ParcelTab>('overview');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  useEffect(() => setTab('overview'), [selectedUlpin]);

  const tabs: { id: ParcelTab; label: string }[] = [
    { id: 'overview', label: t('drawer.tabOverview') },
    { id: 'ownership', label: t('drawer.tabOwnership') },
    { id: 'registration', label: t('drawer.tabRegistration') },
    { id: 'planning', label: t('drawer.tabPlanning') },
    { id: 'fiscal', label: t('drawer.tabFiscal') },
    { id: 'utilities', label: t('drawer.tabUtilities') },
    { id: 'timeline', label: t('drawer.tabTimeline') },
    { id: 'satellite', label: t('drawer.tabSatellite') },
  ];

  const identity = user?.uid ?? 'anon';
  const q = useQuery({
    queryKey: qk.parcel(selectedUlpin ?? '', identity),
    queryFn: () => api.parcel(selectedUlpin!),
    enabled: !!selectedUlpin && drawerOpen,
  });

  const p = q.data;
  const isOwner = !!p && (
    !!p.viewer_is_owner ||
    (!p.party.masked && user?.role === 'citizen' && p.party.owners.some((o) => {
      const pName = (user.name || '').trim().toLowerCase();
      const oName = (o.name || '').trim().toLowerCase();
      return pName && oName && (pName === oName || pName.includes(oName) || oName.includes(pName));
    }))
  );

  // Feed the "recently opened" list used by the parcel pickers (forms, admin tools).
  useEffect(() => {
    if (p) recordRecentParcel({ ulpin: p.ulpin, survey_no: p.identifiers.survey_no, village: p.identifiers.village });
  }, [p, recordRecentParcel]);

  return (
    <Drawer
      open={drawerOpen && !!selectedUlpin}
      onClose={onClose}
      ariaLabel={t('drawer.parcelProfile')}
      header={
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-ink-3">{t('drawer.parcelProfile')}</p>
          <h2 className="truncate text-lg font-semibold leading-tight">
            {p ? `${t('common.surveyNo')} ${p.identifiers.survey_no}` : t('common.loading')}
            {p && <span className="ml-2 text-sm font-normal text-ink-3">{p.identifiers.village}</span>}
          </h2>
          <UlpinLine ulpin={selectedUlpin ?? ''} />
          {p && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
              <span className="font-semibold text-primary">{fmtArea(p.spatial.area_sqm)}</span>
              <span className="text-line-strong">·</span>
              <span>{titleCase(p.planning.land_use)}</span>
            </div>
          )}
          {p && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex flex-wrap gap-1">{statusChips(p.status)}</div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-soft hover:bg-primary-soft/80 text-primary px-2.5 py-1 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  title="Owner Privacy & Public Disclosure Settings"
                >
                  <ShieldCheck size={13} />
                  <span>Privacy Settings</span>
                </button>
              )}
            </div>
          )}
        </div>
      }
    >
      {q.isLoading && <Loading label={t('common.loading')} />}
      {q.isError && (
        <div className="p-4">
          <ErrorNote error={q.error} retry={() => void q.refetch()} />
        </div>
      )}
      {p && (
        <>
          <Tabs ariaLabel={t('drawer.parcelProfile')} items={tabs} value={tab} onChange={(id) => setTab(id as ParcelTab)} className="sticky top-0 z-10 bg-[#F4F1E7]/50 backdrop-blur-xl border-b border-[#D5D2C7]/50 px-2" />
          <div className="p-4">
            <TabPanel id="overview" active={tab === 'overview'}><Overview p={p} goTo={setTab} /></TabPanel>
            <TabPanel id="ownership" active={tab === 'ownership'}><Ownership p={p} /></TabPanel>
            <TabPanel id="registration" active={tab === 'registration'}><Registration p={p} /></TabPanel>
            <TabPanel id="planning" active={tab === 'planning'}><PlanningSection p={p} /></TabPanel>
            <TabPanel id="fiscal" active={tab === 'fiscal'}><FiscalSection p={p} /></TabPanel>
            <TabPanel id="utilities" active={tab === 'utilities'}><UtilitiesSection p={p} /></TabPanel>
            <TabPanel id="timeline" active={tab === 'timeline'}><Timeline ulpin={p.ulpin} /></TabPanel>
            <TabPanel id="satellite" active={tab === 'satellite'}><SatelliteSection p={p} /></TabPanel>
          </div>
        </>
      )}
      {p && <OwnerPrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} parcel={p} />}
    </Drawer>
  );
}

export function UlpinLine({ ulpin }: { ulpin: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-0.5 flex items-center gap-1.5">
      <span className="font-mono text-[12.5px] text-ink-2">{ulpin}</span>
      <button
        type="button"
        aria-label="Copy ULPIN"
        onClick={() => {
          void navigator.clipboard?.writeText(ulpin).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          });
        }}
        className="rounded p-0.5 text-ink-3 hover:bg-ground-2 hover:text-ink cursor-pointer"
      >
        {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
      </button>
    </div>
  );
}
