import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { 
  Compass, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Scale, 
  AlertTriangle, 
  Layers 
} from 'lucide-react';
import { Badge, type Tone } from '@/components/Badge';

interface StoryParcelData {
  surveyNo: string;
  ulpin: string;
  state: 'AP' | 'TN' | 'TG';
  location: string;
  statusTitle: string;
  tone: Tone;
  extent: string;
  ownerMasked: string;
  ownerUnmasked: string;
  latLon: string;
  geohash: string;
  flags: {
    dpdpConsent: boolean;
    hasDispute: boolean;
    hasMortgage: boolean;
    hasChangeAlert: boolean;
    hasTaxArrears: boolean;
    hasPendingMutation: boolean;
  };
  summary: string;
}

const STORY_PARCELS: StoryParcelData[] = [
  {
    surveyNo: '123/4',
    ulpin: 'TFCM91641E6C82',
    state: 'AP',
    location: 'Mangalagiri, Guntur, Andhra Pradesh',
    statusTitle: 'Clean Residential',
    tone: 'primary',
    extent: '0.42 Ha (1.04 Ac)',
    ownerMasked: 'R*** K**** (Masked under DPDP Act)',
    ownerUnmasked: 'Ravi Kumar S/o S. Venkat',
    latLon: '16.4392° N, 80.5621° E',
    geohash: 'tfcm9164',
    flags: {
      dpdpConsent: false,
      hasDispute: false,
      hasMortgage: false,
      hasChangeAlert: false,
      hasTaxArrears: false,
      hasPendingMutation: false,
    },
    summary: 'Fully registered title, clean 30-yr encumbrance, no court stays or tax arrears. 3D strata enabled.',
  },
  {
    surveyNo: '124',
    ulpin: 'TFCM91D3533DD2',
    state: 'AP',
    location: 'Mangalagiri, Guntur, Andhra Pradesh',
    statusTitle: 'Satellite Change Alert',
    tone: 'amber',
    extent: '0.81 Ha (2.00 Ac)',
    ownerMasked: 'K*** V**** (Masked under DPDP Act)',
    ownerUnmasked: 'K. Venkateswara Rao',
    latLon: '16.4410° N, 80.5645° E',
    geohash: 'tfcm91d3',
    flags: {
      dpdpConsent: false,
      hasDispute: false,
      hasMortgage: false,
      hasChangeAlert: true,
      hasTaxArrears: false,
      hasPendingMutation: false,
    },
    summary: 'Sentinel-2 earth observation flags unrecorded built-up structure on agricultural classification.',
  },
  {
    surveyNo: '125/2',
    ulpin: 'TFCM9167B91686',
    state: 'AP',
    location: 'Mangalagiri, Guntur, Andhra Pradesh',
    statusTitle: 'Disputed (e-Courts)',
    tone: 'brick',
    extent: '0.62 Ha (1.53 Ac)',
    ownerMasked: 'S*** N**** (Masked under DPDP Act)',
    ownerUnmasked: 'Smt. N. Lakshmi & Others',
    latLon: '16.4385° N, 80.5598° E',
    geohash: 'tfcm9167',
    flags: {
      dpdpConsent: false,
      hasDispute: true,
      hasMortgage: false,
      hasChangeAlert: false,
      hasTaxArrears: false,
      hasPendingMutation: false,
    },
    summary: 'Active partition civil suit OS 42/2024 before Senior Civil Judge Court. Parcel hatched on map.',
  },
  {
    surveyNo: '126',
    ulpin: 'TFCM916196F0FE',
    state: 'AP',
    location: 'Mangalagiri, Guntur, Andhra Pradesh',
    statusTitle: 'Bank Mortgage (Encumbered)',
    tone: 'violet',
    extent: '0.50 Ha (1.23 Ac)',
    ownerMasked: 'P*** R**** (Masked under DPDP Act)',
    ownerUnmasked: 'P. Rajesh Chowdary',
    latLon: '16.4432° N, 80.5612° E',
    geohash: 'tfcm9161',
    flags: {
      dpdpConsent: false,
      hasDispute: false,
      hasMortgage: true,
      hasChangeAlert: false,
      hasTaxArrears: false,
      hasPendingMutation: false,
    },
    summary: 'State Bank of India simple mortgage registered under Document 1892/2023. Encumbrance active.',
  },
  {
    surveyNo: '127/1',
    ulpin: 'TFCM91KDED50FD',
    state: 'AP',
    location: 'Mangalagiri, Guntur, Andhra Pradesh',
    statusTitle: 'Tax Arrears + Area Delta',
    tone: 'amber',
    extent: '0.38 Ha (0.94 Ac)',
    ownerMasked: 'B*** M**** (Masked under DPDP Act)',
    ownerUnmasked: 'B. Mohan Reddy',
    latLon: '16.4367° N, 80.5630° E',
    geohash: 'tfcm91kd',
    flags: {
      dpdpConsent: false,
      hasDispute: false,
      hasMortgage: false,
      hasChangeAlert: false,
      hasTaxArrears: true,
      hasPendingMutation: false,
    },
    summary: 'Municipal property tax arrears outstanding. Revenue extent differs by 4.2% from registration deed.',
  },
  {
    surveyNo: '128',
    ulpin: 'TFCM914291996F',
    state: 'AP',
    location: 'Mangalagiri, Guntur, Andhra Pradesh',
    statusTitle: 'Pending Mutation Desk',
    tone: 'slate',
    extent: '0.72 Ha (1.78 Ac)',
    ownerMasked: 'T*** G**** (Masked under DPDP Act)',
    ownerUnmasked: 'T. Govinda Rao',
    latLon: '16.4401° N, 80.5662° E',
    geohash: 'tfcm9142',
    flags: {
      dpdpConsent: false,
      hasDispute: false,
      hasMortgage: false,
      hasChangeAlert: false,
      hasTaxArrears: false,
      hasPendingMutation: true,
    },
    summary: 'Ownership transfer pending in 4-stage statutory queue (currently with Revenue Inspector).',
  },
  {
    surveyNo: '45/2',
    ulpin: 'TF2CEQ4ACED970',
    state: 'TN',
    location: 'Sriperumbudur, Kanchipuram, Tamil Nadu',
    statusTitle: 'Disputed · Tamil Nadu',
    tone: 'brick',
    extent: '0.40 Ha (1.00 Ac)',
    ownerMasked: 'K*** S**** (Masked under DPDP Act)',
    ownerUnmasked: 'K. Senthil Kumar',
    latLon: '12.9691° N, 79.9412° E',
    geohash: 'tf2ceq4a',
    flags: {
      dpdpConsent: false,
      hasDispute: true,
      hasMortgage: false,
      hasChangeAlert: false,
      hasTaxArrears: false,
      hasPendingMutation: false,
    },
    summary: 'Tamil Nadu Patta Chitta adapter running live dispute and stay order check across state borders.',
  },
  {
    surveyNo: '77',
    ulpin: 'TEPDPUQC13C0D7',
    state: 'TG',
    location: 'Shamshabad, Ranga Reddy, Telangana',
    statusTitle: 'Change Alert · Telangana',
    tone: 'amber',
    extent: '0.60 Ha (1.50 Ac)',
    ownerMasked: 'M*** A**** (Masked under DPDP Act)',
    ownerUnmasked: 'Md. Abdul Wahid',
    latLon: '17.2403° N, 78.4294° E',
    geohash: 'tepdpuqc',
    flags: {
      dpdpConsent: false,
      hasDispute: false,
      hasMortgage: false,
      hasChangeAlert: true,
      hasTaxArrears: false,
      hasPendingMutation: false,
    },
    summary: 'Dharani dialect parcel in Telangana displaying multi-temporal optical NDVI drop alert.',
  },
];

const DEFAULT_PARCEL: StoryParcelData = STORY_PARCELS[0] as StoryParcelData;

export function ParcelDecoderWidget() {
  const [selectedUlpin, setSelectedUlpin] = useState<string>('TFCM91641E6C82');
  const [unmaskRequested, setUnmaskRequested] = useState<boolean>(false);

  const parcel: StoryParcelData = STORY_PARCELS.find((p) => p.ulpin === selectedUlpin) ?? DEFAULT_PARCEL;

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 shadow-panel">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary font-mono text-xs font-bold">
              <Compass size={15} />
            </span>
            <h3 className="font-display text-base font-bold text-ink">
              Interactive ULPIN & Story Parcel Decoder
            </h3>
            <Badge tone="primary" mono>
              14-DIGIT PIN
            </Badge>
          </div>
          <p className="mt-1 text-xs text-ink-2 max-w-2xl">
            Select any pre-seeded scenario parcel to deconstruct its ULPIN syntax, 
            inspect privacy protections under the DPDP Act 2023, and see live multi-department flags.
          </p>
        </div>

        <Link
          to="/map"
          search={{ ulpin: parcel.ulpin }}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:brightness-105 transition cursor-pointer"
        >
          <span>Open {parcel.surveyNo} on Map</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Quick Select Story Parcel Chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scroll-thin">
        {STORY_PARCELS.map((p) => {
          const isSelected = p.ulpin === selectedUlpin;
          const statusTitlePart = p.statusTitle.split('·')[0] ?? p.statusTitle;

          return (
            <button
              key={p.ulpin}
              type="button"
              onClick={() => {
                setSelectedUlpin(p.ulpin);
                setUnmaskRequested(false);
              }}
              className={`shrink-0 rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                  : 'border-line bg-panel-2 hover:border-line-strong hover:bg-ground-2'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-ink">Sy. {p.surveyNo}</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-ground-2 text-ink-3">
                  {p.state}
                </span>
              </div>
              <p className="text-[11px] text-ink-3 mt-0.5 truncate max-w-[120px]">
                {statusTitlePart}
              </p>
            </button>
          );
        })}
      </div>

      {/* Decoder Grid */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* Left: Syntax & Geometry (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-line bg-panel-2 p-4">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <span className="font-mono text-[10px] font-bold uppercase text-ink-3">
                ULPIN Syntax Architecture
              </span>
              <Badge tone={parcel.tone}>{parcel.statusTitle}</Badge>
            </div>

            {/* Visual 14-char syntax box */}
            <div className="mt-3 rounded-lg border border-line bg-panel p-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-ink-3 mb-1">
                <span>State Dialect</span>
                <span>Geohash Centroid</span>
                <span>Checksum</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs">
                <span className="rounded bg-primary-soft px-2 py-1 font-bold text-primary">
                  {parcel.ulpin.slice(0, 4)}
                </span>
                <span className="rounded bg-ground-2 px-2 py-1 font-bold text-ink">
                  {parcel.ulpin.slice(4, 10)}
                </span>
                <span className="rounded bg-amber-500/10 px-2 py-1 font-bold text-amber-600 dark:text-amber-400">
                  {parcel.ulpin.slice(10)}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-ink-3 font-mono">
                Centroid: {parcel.latLon}
              </div>
            </div>

            {/* Extent & Location */}
            <div className="mt-3 space-y-2">
              <div className="rounded-lg border border-line bg-panel p-2.5 flex items-center justify-between text-xs">
                <span className="text-ink-3">Village & District</span>
                <span className="font-bold text-ink truncate max-w-[200px]">{parcel.location}</span>
              </div>
              <div className="rounded-lg border border-line bg-panel p-2.5 flex items-center justify-between text-xs">
                <span className="text-ink-3">Cadastral Extent</span>
                <span className="font-mono font-bold text-primary">{parcel.extent}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-2 text-[11px] text-ink-2">
            {parcel.summary}
          </div>
        </div>

        {/* Right: DPDP Privacy Consent & Status Flags (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-line bg-panel-2 p-4">
          <div>
            {/* DPDP Section */}
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-primary" />
                <span className="font-display text-xs font-bold text-ink">
                  DPDP Act 2023 Privacy Protection
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUnmaskRequested(!unmaskRequested)}
                className="inline-flex items-center gap-1 rounded-md border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-ground-2 hover:text-ink transition cursor-pointer"
              >
                {unmaskRequested ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{unmaskRequested ? 'Mask Details' : 'Simulate Consent Grant'}</span>
              </button>
            </div>

            <div className="mt-3 rounded-lg border border-line bg-panel p-3">
              <span className="font-mono text-[10px] uppercase font-bold text-ink-3">
                Registered Title Holder
              </span>
              <p className="mt-1 font-mono text-sm font-bold text-ink">
                {unmaskRequested ? parcel.ownerUnmasked : parcel.ownerMasked}
              </p>
              <p className="text-[10px] text-ink-3 mt-1">
                {unmaskRequested
                  ? 'Verified with active OTP / cryptographic token consent. Unmasked for 15-minute statutory audit session.'
                  : 'Citizens see masked identity unless explicitly granted access by the owner or holding statutory officer clearance.'}
              </p>
            </div>

            {/* Cross-Department Status Indicators */}
            <div className="mt-3">
              <span className="font-mono text-[10px] uppercase font-bold text-ink-3">
                Live Department Status Flags
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className={`rounded-lg border p-2 flex items-center gap-2 ${
                  parcel.flags.hasDispute ? 'border-brick/40 bg-brick/5 text-brick' : 'border-line bg-panel text-ink-2'
                }`}>
                  <Scale size={14} className={parcel.flags.hasDispute ? 'text-brick' : 'text-primary'} />
                  <span>{parcel.flags.hasDispute ? 'Court Stay / Lis Pendens' : 'Dispute-Free'}</span>
                </div>

                <div className={`rounded-lg border p-2 flex items-center gap-2 ${
                  parcel.flags.hasMortgage ? 'border-violet/40 bg-violet/5 text-violet' : 'border-line bg-panel text-ink-2'
                }`}>
                  <ShieldCheck size={14} className={parcel.flags.hasMortgage ? 'text-violet' : 'text-primary'} />
                  <span>{parcel.flags.hasMortgage ? 'Active Bank Charge' : 'Zero Encumbrance'}</span>
                </div>

                <div className={`rounded-lg border p-2 flex items-center gap-2 ${
                  parcel.flags.hasChangeAlert ? 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300' : 'border-line bg-panel text-ink-2'
                }`}>
                  <AlertTriangle size={14} className={parcel.flags.hasChangeAlert ? 'text-amber-500' : 'text-primary'} />
                  <span>{parcel.flags.hasChangeAlert ? 'Optical Delta Alert' : 'Satellite Match'}</span>
                </div>

                <div className={`rounded-lg border p-2 flex items-center gap-2 ${
                  parcel.flags.hasPendingMutation ? 'border-line-strong bg-ground-2 text-ink' : 'border-line bg-panel text-ink-2'
                }`}>
                  <Layers size={14} className={parcel.flags.hasPendingMutation ? 'text-ink' : 'text-primary'} />
                  <span>{parcel.flags.hasPendingMutation ? 'In Revenue Queue' : 'RoR Synchronized'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-2 text-[10px] text-ink-3 font-mono">
            <span>Audit Trail: Immutable SHA-256</span>
            <span className="text-primary font-bold">Consolidated Gateway v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
