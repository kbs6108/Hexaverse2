import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe,
  HelpCircle,
  Landmark,
  LogOut,
  Mail,
  MapPin,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useUI, type DevUserId } from '@/lib/store';
import { clearCitizenCinematic } from '@/lib/cinematic';
import { useMyParcel } from '@/lib/my-parcel';
import { useTranslation } from '@/lib/i18n';
import { SlidingTabs } from '@/components/SlidingTabs';
import { Kbd } from '@/components/Kbd';
import { OwnerPrivacyModal } from '@/features/parcel/OwnerPrivacyModal';

interface AccountPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountPanel({ isOpen, onClose }: AccountPanelProps) {
  const { user, mode, devUsers, setDevUser, signOut } = useAuth();
  const { t, locale, setLocale, languages } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { parcel, hasOwnedLand, goToMyParcel } = useMyParcel();
  const [filter, setFilter] = useState<'all' | 'citizen' | 'officer' | 'admin'>('all');
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const switchTo = (id: DevUserId) => {
    setDevUser(id);
    useUI.getState().select(null);
    qc.clear();
    onClose();
    void navigate({ to: '/map' });
  };

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/25 backdrop-blur-xs"
        />

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-screen max-w-md bg-panel border-l border-line shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-line bg-panel-2/40">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary font-bold text-xs">
                  LS
                </span>
                <h2 className="font-display text-base font-bold text-ink">{t('account.title')}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="flex items-center gap-1.5 rounded-lg py-1 px-2 text-ink-3 hover:bg-ground-2 hover:text-ink transition-colors cursor-pointer text-xs"
              >
                <Kbd className="text-[9px] px-1 py-0">ESC</Kbd>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-thin">
              {/* Profile Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-panel-2 border border-line">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-ink font-bold text-base shadow-xs">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-ink truncate">{user.name}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-medium text-primary uppercase">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-ink-3 truncate mt-0.5">{user.email || t('account.authCitizen')}</p>
                </div>
              </div>

              {/* Language Selection Card */}
              <div className="rounded-2xl border border-line bg-panel-2/70 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
                    <Globe size={14} className="text-primary" /> {t('account.switchLanguage')}
                  </h4>
                  <span className="text-[11px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary-soft">
                    {languages.find((l) => l.code === locale)?.native}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {languages.map((lang) => {
                    const isSelected = locale === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLocale(lang.code)}
                        className={clsx(
                          'flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer select-none text-center relative group',
                          isSelected
                            ? 'bg-primary text-primary-ink border-primary font-bold shadow-xs'
                            : 'bg-panel border-line text-ink-2 hover:bg-ground-2 hover:border-line-strong',
                        )}
                      >
                        <span className="text-sm font-semibold">{lang.native}</span>
                        <span className={clsx('text-[10.5px]', isSelected ? 'opacity-90' : 'opacity-70')}>
                          {lang.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-3">{t('account.personalDetails')}</h4>
                <div className="rounded-xl border border-line bg-panel divide-y divide-line overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-ink-3">
                      <UserRound size={15} /> {t('account.fullName')}
                    </span>
                    <span className="font-medium text-ink">{user.name}</span>
                  </div>
                  {user.email && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="flex items-center gap-2 text-ink-3">
                        <Mail size={15} /> {t('account.email')}
                      </span>
                      <span className="font-medium text-ink">{user.email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-ink-3">
                      <Shield size={15} /> {t('account.role')}
                    </span>
                    <span className="font-medium capitalize text-ink">{user.role}</span>
                  </div>
                  {user.department && (
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="flex items-center gap-2 text-ink-3">{t('account.department')}</span>
                      <span className="font-medium text-ink">{user.department}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-ink-3">
                      <CheckCircle2 size={15} className="text-primary" /> {t('account.status')}
                    </span>
                    <span className="font-medium text-primary">{t('account.active')}</span>
                  </div>
                </div>
              </div>

              {/* Owned Land & Property linked to profile */}
              {user.role === 'citizen' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
                      <Landmark size={14} className="text-primary" /> {t('citizen.yourLand')}
                    </h4>
                    <span className={clsx(
                      'text-[11px] font-medium px-2 py-0.5 rounded-full',
                      hasOwnedLand ? 'text-primary bg-primary-soft' : 'text-ink-3 bg-ground-2'
                    )}>
                      {hasOwnedLand ? t('citizen.linkedTitle') : t('citizen.noTitle')}
                    </span>
                  </div>

                  {hasOwnedLand && parcel ? (
                    <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary-soft/40 via-panel to-panel p-4 shadow-sm relative overflow-hidden">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-base font-bold text-ink">
                              {t('common.surveyNo')} {parcel.survey_no}
                            </span>
                            <span className="text-xs text-ink-3">·</span>
                            <span className="text-xs font-semibold text-ink-2">
                              {parcel.village}
                            </span>
                          </div>
                          <p className="font-mono text-[11.5px] text-primary mt-0.5 font-medium">
                            ULPIN: {parcel.ulpin}
                          </p>
                        </div>

                        <span className="shrink-0 flex items-center justify-center size-8 rounded-xl bg-primary text-white shadow-xs">
                          <MapPin size={16} />
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-line/70 text-xs">
                        <div>
                          <span className="text-ink-3 block text-[11px]">{t('common.khataNo')}</span>
                          <span className="font-mono font-medium text-ink">{parcel.khata_no}</span>
                        </div>
                        <div>
                          <span className="text-ink-3 block text-[11px]">{t('common.extent')}</span>
                          <span className="font-medium text-ink">{parcel.area_sqm} m²</span>
                        </div>
                        <div>
                          <span className="text-ink-3 block text-[11px]">{t('drawer.planning')}</span>
                          <span className="font-medium text-ink capitalize">{parcel.land_use}</span>
                        </div>
                        <div>
                          <span className="text-ink-3 block text-[11px]">{t('drawer.rights')}</span>
                          <span className="font-medium text-ink">{parcel.ownership_type}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPrivacyModalOpen(true)}
                          className="flex w-full sm:w-1/2 items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary-soft/60 hover:bg-primary-soft text-primary py-2.5 px-3 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        >
                          <ShieldCheck size={14} />
                          <span>Privacy Settings</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            onClose();
                            await goToMyParcel();
                          }}
                          className="flex w-full sm:w-1/2 items-center justify-center gap-1.5 rounded-xl bg-primary text-white py-2.5 px-3 text-xs font-bold shadow-sm hover:bg-primary/90 hover:shadow transition-all cursor-pointer"
                        >
                          <MapPin size={14} />
                          <span>{t('citizen.goToMyParcel')}</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-line bg-panel p-4 text-center">
                      <p className="text-xs font-medium text-ink">{t('citizen.noTitle')}</p>
                      <p className="mt-1 text-[11px] text-ink-3 leading-relaxed">
                        {t('citizen.noTitleDesc')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Dev Mode Identity Switcher */}
              {mode === 'dev' && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3 flex items-center gap-1.5">
                      <Users size={14} /> {t('account.devIdentities')}
                    </h4>
                    <span className="text-[11px] text-ink-3 font-mono">
                      {devUsers.length} {t('account.profilesCount')}
                    </span>
                  </div>

                  {/* Filter Tabs */}
                  <SlidingTabs
                    items={[
                      { id: 'all', label: t('account.filterAll'), count: devUsers.length },
                      { id: 'citizen', label: t('account.filterCitizens'), count: devUsers.filter((d) => d.role === 'citizen').length },
                      { id: 'officer', label: t('account.filterOfficers'), count: devUsers.filter((d) => d.role === 'officer').length },
                      { id: 'admin', label: t('account.filterAdmin'), count: devUsers.filter((d) => d.role === 'admin').length },
                    ]}
                    value={filter}
                    onChange={(tab) => setFilter(tab as typeof filter)}
                    layoutId="account-identities-filter"
                    size="sm"
                    className="mb-3"
                  />

                  {/* Switcher List */}
                  <div className="rounded-xl border border-line bg-panel divide-y divide-line overflow-hidden shadow-xs max-h-72 overflow-y-auto scroll-thin">
                    {devUsers
                      .filter((d) => (filter === 'all' ? true : d.role === filter))
                      .map((d) => {
                        const isCurrent = d.id === user.uid.replace('dev:', '');
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => switchTo(d.id)}
                            className={clsx(
                              'flex w-full items-center justify-between px-3.5 py-2 text-left text-sm hover:bg-ground-2 transition-colors cursor-pointer',
                              isCurrent && 'bg-primary-soft/70 text-primary font-medium',
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span
                                className={clsx(
                                   'size-2 rounded-full shrink-0',
                                   isCurrent ? 'bg-primary' : 'bg-line-strong',
                                 )}
                              />
                              <div className="min-w-0">
                                <span className="font-medium text-xs block truncate text-ink">{d.label}</span>
                                <span className="text-[11px] text-ink-3 block truncate">{d.hint}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {'state' in d && (
                                <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-ground-2 text-ink-3">
                                  {d.state}
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {t('account.activeUser')}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Applications Shortcut */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-3">{t('account.applicationsRecords')}</h4>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    void navigate({ to: '/citizen/track' });
                  }}
                  className="group flex w-full items-center justify-between p-4 rounded-xl border border-line bg-panel hover:bg-ground-2/70 transition-all text-left shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-ink group-hover:text-primary transition-colors">{t('account.applicationsTitle')}</p>
                      <p className="text-xs text-ink-3">{t('account.applicationsDesc')}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-ink-3 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* Help & Support Shortcut */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-3 mb-3">{t('account.assistance')}</h4>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    void navigate({ to: '/help' });
                  }}
                  className="group flex w-full items-center justify-between p-4 rounded-xl border border-line bg-panel hover:bg-ground-2/70 transition-all text-left shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-ground-2 text-ink-2">
                      <HelpCircle size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-ink group-hover:text-primary transition-colors">{t('account.helpGuidance')}</p>
                      <p className="text-xs text-ink-3">{t('account.helpDesc')}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-ink-3 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>

            {/* Footer / Sign Out */}
            <div className="border-t border-line px-6 py-4 bg-ground/40">
              <button
                type="button"
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch((err) => console.warn(err));
                  }
                  clearCitizenCinematic();
                  void signOut();
                  onClose();
                  void navigate({ to: '/', search: () => ({}) });
                }}
                className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-panel text-brick hover:bg-brick-soft/40 hover:border-brick/30 font-medium text-sm transition-colors shadow-xs cursor-pointer"
              >
                <LogOut size={16} />
                {t('account.signOut')}
              </button>
            </div>
          </motion.aside>
        </div>
      </div>
      {parcel && (
        <OwnerPrivacyModal
          open={privacyModalOpen}
          onClose={() => setPrivacyModalOpen(false)}
          ulpin={parcel.ulpin}
          surveyNo={parcel.survey_no}
          village={parcel.village}
        />
      )}
    </AnimatePresence>
  );
}

export default AccountPanel;
