import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Users,
  FileText,
  Building2,
  Zap,
  CheckCircle2,
  X,
  Scale,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import type { ParcelCDM, ParcelPrivacyPreferences } from '@/lib/cdm';

interface Props {
  open: boolean;
  onClose: () => void;
  parcel?: ParcelCDM | null;
  ulpin?: string;
  surveyNo?: string;
  village?: string;
}

const DEFAULT_PREFS: ParcelPrivacyPreferences = {
  public_owner_name: false,
  public_nominees: false,
  public_deed_details: false,
  public_building_units: true,
  public_utilities: true,
};

export function OwnerPrivacyModal({ open, onClose, parcel, ulpin, surveyNo, village }: Props) {
  const qc = useQueryClient();
  const targetUlpin = parcel?.ulpin || ulpin || '';
  const targetSurveyNo = parcel?.identifiers?.survey_no || surveyNo || '';
  const targetVillage = parcel?.identifiers?.village || village || '';

  const { data: privacyData } = useQuery({
    queryKey: ['parcel-privacy', targetUlpin],
    queryFn: () => api.getPrivacy(targetUlpin),
    enabled: open && !!targetUlpin,
  });

  const [prefs, setPrefs] = useState<ParcelPrivacyPreferences>(
    parcel?.privacy_preferences || DEFAULT_PREFS
  );

  useEffect(() => {
    if (privacyData?.preferences) {
      setPrefs(privacyData.preferences);
    } else if (parcel?.privacy_preferences) {
      setPrefs(parcel.privacy_preferences);
    }
  }, [privacyData, parcel?.privacy_preferences]);

  const mutation = useMutation({
    mutationFn: (updated: ParcelPrivacyPreferences) =>
      api.updatePrivacy(targetUlpin, {
        ...updated,
        public_owner_name: false,
        public_nominees: false,
        public_deed_details: false,
      }),
    onSuccess: () => {
      toast.success('Privacy preferences updated', 'Public map viewers will now see records according to your settings.');
      void qc.invalidateQueries({ queryKey: ['parcel', targetUlpin] });
      void qc.invalidateQueries({ queryKey: ['parcel-privacy', targetUlpin] });
      void qc.invalidateQueries({ queryKey: ['citizen', 'my-parcels'] });
      onClose();
    },
    onError: (err: Error) => {
      toast.error('Failed to update privacy preferences', err.message);
    },
  });

  if (!open) return null;

  const toggle = (key: keyof ParcelPrivacyPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[88vh] rounded-2xl border border-line bg-panel text-ink shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-ground-2/60">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h2 id="privacy-modal-title" className="text-base font-semibold text-ink">
                Owner Privacy & Public Disclosure Controls
              </h2>
              <p className="text-xs text-ink-3">
                {targetSurveyNo ? `Survey No. ${targetSurveyNo}` : targetUlpin}{targetVillage ? ` · ${targetVillage}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-3 hover:bg-ground-3 hover:text-ink transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-6 text-sm scroll-thin">
          {/* Statutory Mandatory Disclosures (Read Only) */}
          <div className="rounded-xl border border-line bg-ground-1 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-xs text-ink">
                <Lock size={13} className="text-primary" />
                Statutory Mandatory Disclosures (Public by Law)
              </span>
              <Badge tone="primary">Protected by Statute</Badge>
            </div>
            <p className="text-[12px] text-ink-2 leading-relaxed">
              Under the <strong>Transfer of Property Act (Section 3)</strong>, <strong>Stamp Act</strong>, and <strong>Municipal Laws</strong>, certain records are statutory public notices to prevent real estate fraud and cannot be concealed:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11.5px]">
              <div className="flex items-center gap-1.5 text-ink-2 bg-white/80 dark:bg-ground-2 px-2.5 py-1.5 rounded-lg border border-line/60">
                <CheckCircle2 size={13} className="text-primary shrink-0" />
                <span>Cadastre & Land Boundaries</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-2 bg-white/80 dark:bg-ground-2 px-2.5 py-1.5 rounded-lg border border-line/60">
                <CheckCircle2 size={13} className="text-primary shrink-0" />
                <span>Master Plan Zoning (R2, C1)</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-2 bg-white/80 dark:bg-ground-2 px-2.5 py-1.5 rounded-lg border border-line/60">
                <CheckCircle2 size={13} className="text-primary shrink-0" />
                <span>Bank Mortgages & Encumbrances</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-2 bg-white/80 dark:bg-ground-2 px-2.5 py-1.5 rounded-lg border border-line/60">
                <CheckCircle2 size={13} className="text-primary shrink-0" />
                <span>Court Disputes & Sec 22A List</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-2 bg-white/80 dark:bg-ground-2 px-2.5 py-1.5 rounded-lg border border-line/60">
                <CheckCircle2 size={13} className="text-primary shrink-0" />
                <span>Property Tax Arrears & Demand</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-2 bg-white/80 dark:bg-ground-2 px-2.5 py-1.5 rounded-lg border border-line/60">
                <CheckCircle2 size={13} className="text-primary shrink-0" />
                <span>SRO Guideline Valuation</span>
              </div>
            </div>
          </div>

          {/* Strictly Protected Citizen Privacy (Non-Negotiable Enforced Masking) */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-ink">
                  Strictly Protected Personal Data (Permanently Masked)
                </h3>
              </div>
              <p className="text-xs text-ink-3 mt-0.5">
                Under the DPDP Act 2023 and land fraud prevention norms, these sensitive identifiers are permanently masked or hidden. Toggling is disabled to prevent accidental public exposure.
              </p>
            </div>

            <div className="divide-y divide-line rounded-xl border border-line bg-panel overflow-hidden">
              {/* 1. Full Legal Name - Strictly Protected */}
              <div className="p-3.5 flex items-start justify-between gap-3 bg-ground-1/30">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <UserCheck size={16} className="text-primary shrink-0" />
                    <span className="font-semibold text-xs text-ink">Legal Owner Identity on Public Map</span>
                    <Badge tone="neutral" className="text-[10.5px]">
                      <Lock size={10} className="mr-0.5 text-primary" /> Masked (R*** K***)
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-3 leading-relaxed">
                    Protected under the Digital Personal Data Protection (DPDP) Act. Your name is always masked to the general public to prevent identity theft and unsolicited contact. Permanently protected and cannot be turned on by mistake.
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ground-2 text-[10.5px] font-semibold text-ink-2 border border-line">
                  <Lock size={10} className="text-primary" />
                  Locked
                </span>
              </div>

              {/* 2. Nominees / Succession Heirs - Strictly Protected */}
              <div className="p-3.5 flex items-start justify-between gap-3 bg-ground-1/30">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Users size={16} className="text-slate shrink-0" />
                    <span className="font-semibold text-xs text-ink">Family Nominees & Succession Heirs</span>
                    <Badge tone="neutral" className="text-[10.5px]">
                      <Lock size={10} className="mr-0.5 text-slate" /> Hidden from Public
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-3 leading-relaxed">
                    Succession nominees, relationship ties, and family shares are confidential. Only verified title holders and authorized revenue officers can inspect them.
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ground-2 text-[10.5px] font-semibold text-ink-2 border border-line">
                  <Lock size={10} className="text-slate" />
                  Locked
                </span>
              </div>

              {/* 3. Registered Deed Number - Strictly Protected */}
              <div className="p-3.5 flex items-start justify-between gap-3 bg-ground-1/30">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText size={16} className="text-amber-700 shrink-0" />
                    <span className="font-semibold text-xs text-ink">Registered Deed & SRO Document Number</span>
                    <Badge tone="neutral" className="text-[10.5px]">
                      <Lock size={10} className="mr-0.5 text-amber-700" /> Masked (****0001)
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-3 leading-relaxed">
                    Document registration numbers are masked to prevent unauthorized deed harvesting, fraudulent impersonation, or duplicate registrations.
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ground-2 text-[10.5px] font-semibold text-ink-2 border border-line">
                  <Lock size={10} className="text-amber-700" />
                  Locked
                </span>
              </div>
            </div>
          </div>

          {/* Owner-Configurable Public Disclosures */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-ink-3">
                Discretionary Asset Disclosures
              </h3>
              <p className="text-xs text-ink-2 mt-0.5">
                Choose whether physical structural units and utility connections are visible to prospective buyers or tenants browsing the public map.
              </p>
            </div>

            <div className="divide-y divide-line rounded-xl border border-line bg-panel overflow-hidden">
              {/* 4. Building Units & Footprint */}
              <div className="p-3.5 flex items-start justify-between gap-4 hover:bg-ground-1/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-600" />
                    <span className="font-medium text-xs text-ink">Show Building 3D Units & Floors</span>
                    {prefs.public_building_units ? (
                      <Badge tone="primary">Visible</Badge>
                    ) : (
                      <Badge tone="neutral">Hidden from Public</Badge>
                    )}
                  </div>
                  <p className="text-xs text-ink-3 leading-relaxed">
                    {prefs.public_building_units
                      ? 'The internal floor-by-floor unit breakdown and 3D building structure is visible on the map.'
                      : 'Internal unit breakdown is hidden from casual public searchers.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('public_building_units')}
                  className={clsx(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    prefs.public_building_units ? 'bg-primary' : 'bg-line'
                  )}
                  aria-pressed={prefs.public_building_units}
                >
                  <span
                    className={clsx(
                      'pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      prefs.public_building_units ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* 5. Utility Connections */}
              <div className="p-3.5 flex items-start justify-between gap-4 hover:bg-ground-1/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    <span className="font-medium text-xs text-ink">Show Utility Connections (Water / Power / Sewer)</span>
                    {prefs.public_utilities ? (
                      <Badge tone="primary">Visible</Badge>
                    ) : (
                      <Badge tone="neutral">Hidden from Public</Badge>
                    )}
                  </div>
                  <p className="text-xs text-ink-3 leading-relaxed">
                    {prefs.public_utilities
                      ? 'Water supply, electricity line, and sewerage connection status are publicly visible.'
                      : 'Utility connection status is hidden from public viewers.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle('public_utilities')}
                  className={clsx(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    prefs.public_utilities ? 'bg-primary' : 'bg-line'
                  )}
                  aria-pressed={prefs.public_utilities}
                >
                  <span
                    className={clsx(
                      'pointer-events-none inline-block size-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      prefs.public_utilities ? 'translate-x-4' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Statutory Officer Guarantee Note */}
          <div className="rounded-xl border border-line bg-ground-2/60 p-3 flex items-start gap-2.5 text-xs text-ink-2">
            <Scale size={16} className="text-ink-3 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Statutory Officer Access:</strong> Under Section 5 of the RoR Act, revenue officers (VRO, Surveyor, RI, Tahsildar) and urban planning authorities always maintain full, unmasked access to all records during the performance of official duties.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3 bg-ground-2/40">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={mutation.isPending}
            onClick={() => mutation.mutate(prefs)}
          >
            Save Privacy Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
