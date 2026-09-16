/**
 * Static pitch content for the Landing (/welcome) and Help (/help) pages.
 * One source of truth so the two pages never drift. No network, no backend
 * contract — every string here is presentation copy. Story-parcel ULPINs mirror
 * data/samples/story_parcels.json (deterministic seed=42).
 */
import type { ComponentType } from 'react';
import {
  Landmark,
  PenLine,
  Sparkles,
  FileText,
  Building2,
  Receipt,
  Scale,
  Droplets,
  Map as MapIcon,
  Layers,
  Users,
  ShieldCheck,
  Satellite,
  Boxes,
  Workflow,
  Network,
} from 'lucide-react';
import type { Tone } from '@/components/Badge';

export type IconType = ComponentType<{ size?: number | string; className?: string; strokeWidth?: number }>;

export interface Department {
  key: string;
  name: string;
  vocab: string;
  blurb: string;
  icon: IconType;
  tone: Tone;
}

/** The six department systems the gateway unifies (CONTRACTS §7). */
export const DEPARTMENTS: Department[] = [
  { key: 'revenue', name: 'Revenue', vocab: 'Record of Rights', blurb: 'Ownership, khata, extent and classification (RoR) plus mutations.', icon: Landmark, tone: 'primary' },
  { key: 'registration', name: 'Registration', vocab: 'Deeds & encumbrances', blurb: 'Registered deeds and financial/legal charges such as mortgages.', icon: FileText, tone: 'slate' },
  { key: 'planning', name: 'Planning', vocab: 'Zoning & permits', blurb: 'Zone codes, permissible uses and building-permission status.', icon: Building2, tone: 'violet' },
  { key: 'fiscal', name: 'Fiscal', vocab: 'Tax & valuation', blurb: 'Property-tax demand, arrears and guideline (reference) value.', icon: Receipt, tone: 'amber' },
  { key: 'legal', name: 'Legal', vocab: 'Disputes', blurb: 'Court cases, their nature, status and next hearing.', icon: Scale, tone: 'brick' },
  { key: 'utilities', name: 'Utilities', vocab: 'Connections', blurb: 'Water, electricity, sewer and road access at the parcel.', icon: Droplets, tone: 'neutral' },
];

export interface Tier {
  n: number;
  name: string;
  blurb: string;
  items: string[];
}

/** Three-tier GIS exactly as the problem statement names them (CONTRACTS §9). */
export const TIERS: Tier[] = [
  { n: 1, name: 'Base', blurb: 'The canvas everyone starts from.', items: ['Parcels (fill + outline)', 'Survey-number labels', 'Village boundary', 'Streets / satellite basemap'] },
  { n: 2, name: 'Essential governance', blurb: 'Colour parcels by what matters.', items: ['Land use · ownership type', 'Registered · encumbrance · dispute', 'Zone · building permission', 'Planning zones'] },
  { n: 3, name: 'Use-case', blurb: 'The layers that drive decisions.', items: ['Tax arrears · guideline value', 'Roads · water lines', 'Restriction zones · projects', 'Change alerts · 3D units'] },
];

export interface Feature {
  title: string;
  blurb: string;
  icon: IconType;
  tone: Tone;
}

export const FEATURES: Feature[] = [
  { title: 'Map Explorer', blurb: 'Three tiers of layers over a fast PostGIS vector-tile map — click any parcel to open it.', icon: MapIcon, tone: 'primary' },
  { title: 'Parcel Profile', blurb: 'Every department’s record for one parcel in a single drawer, each with its own provenance badge.', icon: Layers, tone: 'slate' },
  { title: 'Citizen Services', blurb: 'Search, verify ownership, track applications and request services — no office visit.', icon: Users, tone: 'primary' },
  { title: 'Officer Console', blurb: 'Department queues, mutation & building-permission approvals, KPIs and an alerts inbox.', icon: Workflow, tone: 'violet' },
  { title: 'Admin & Integration', blurb: 'Connector health, adapter field-mappings, consistency findings and simulated upstream events.', icon: ShieldCheck, tone: 'amber' },
  { title: 'Satellite Change Detection', blurb: 'Sentinel-2 NDVI/NDBI flags likely unrecorded construction for officer review.', icon: Satellite, tone: 'brick' },
  { title: 'Open Interoperability', blurb: 'Adapter model with per-state field mappings, an event contract, consent-aware access and OGC-shaped APIs.', icon: Network, tone: 'slate' },
  { title: 'Vertical property (3D)', blurb: 'Buildings → floors → units with 3D-ULPINs: click a unit for its floor area, elevation band and basement level.', icon: Boxes, tone: 'neutral' },
  { title: 'AI risk briefs', blurb: 'Flagged parcels are auto-analysed — risk score, findings and recommended actions, with the engine labelled honestly.', icon: Sparkles, tone: 'violet' },
  { title: 'Bounded boundary edits', blurb: 'Officers correct parcel geometry within norms (±15% area, no overlap) through a two-step approval that syncs the RoR.', icon: PenLine, tone: 'primary' },
];

export interface RoleInfo {
  role: string;
  who: string;
  can: string;
  icon: IconType;
  tone: Tone;
}

export const ROLES: RoleInfo[] = [
  { role: 'Citizen', who: 'Landowners & the public', can: 'Search parcels, verify ownership, track applications, request services. Owner details are masked without consent.', icon: Users, tone: 'primary' },
  { role: 'Officer', who: 'Revenue · Registration · Planning', can: 'Work the department queue, approve mutations & building permissions, read the RoR timeline, action alerts.', icon: Building2, tone: 'violet' },
  { role: 'Admin', who: 'Integration & oversight', can: 'Everything an officer can, plus connectors, adapter mappings, consistency findings, simulate upstream events and reset the demo.', icon: ShieldCheck, tone: 'slate' },
];

export interface StoryParcel {
  survey_no: string;
  ulpin: string;
  title: string;
  note: string;
  tone: Tone;
}

/** The named demo parcels (CONTRACTS §10) — ULPINs from story_parcels.json.
 *  Six in AP (Mangalagiri) plus one signature parcel each in TN and Telangana,
 *  showing the same platform running across three states. */
export const STORY_PARCELS: StoryParcel[] = [
  { survey_no: '123/4', ulpin: 'TFCM91641E6C82', title: 'Clean residential', note: 'Owner Ravi Kumar — fully registered, no flags. The happy path. Mangalagiri, AP.', tone: 'primary' },
  { survey_no: '124', ulpin: 'TFCM91D3533DD2', title: 'Change alert', note: 'Agricultural parcel where Sentinel-2 flags unrecorded built-up. Mangalagiri, AP.', tone: 'amber' },
  { survey_no: '125/2', ulpin: 'TFCM9167B91686', title: 'Disputed', note: 'An open court case restricts what can happen here. Mangalagiri, AP.', tone: 'brick' },
  { survey_no: '126', ulpin: 'TFCM916196F0FE', title: 'Mortgaged', note: 'Carries an active bank encumbrance from registration. Mangalagiri, AP.', tone: 'violet' },
  { survey_no: '127/1', ulpin: 'TFCM91KDED50FD', title: 'Tax arrears + area mismatch', note: 'Fiscal arrears, and revenue vs. registration extent disagree. Mangalagiri, AP.', tone: 'amber' },
  { survey_no: '128', ulpin: 'TFCM914291996F', title: 'Pending mutation', note: 'An ownership transfer is mid-workflow in the officer queue. Mangalagiri, AP.', tone: 'slate' },
  { survey_no: '45/2', ulpin: 'TF2CEQ4ACED970', title: 'Disputed · Tamil Nadu', note: 'The same dispute workflow running on a Sriperumbudur parcel through the TN adapter.', tone: 'brick' },
  { survey_no: '77', ulpin: 'TEPDPUQC13C0D7', title: 'Change alert · Telangana', note: 'Satellite change detection on a Shamshabad parcel — one platform, three states.', tone: 'amber' },
];

export interface Term {
  term: string;
  def: string;
}

export const GLOSSARY: Term[] = [
  { term: 'ULPIN', def: 'Unique Land Parcel Identification Number — the single key that ties every record together.' },
  { term: 'RoR', def: 'Record of Rights — the revenue department’s ownership record (khata, extent, classification).' },
  { term: 'Encumbrance', def: 'A financial or legal claim on a parcel, e.g. a mortgage, held by the registration department.' },
  { term: 'Mutation', def: 'The official update of ownership in the RoR after a sale, gift or inheritance.' },
  { term: 'Provenance', def: 'For each field: which source system it came from, whether that system responded, and when.' },
  { term: 'CDM', def: 'Common Data Model — the unified parcel record the gateway assembles from all six departments.' },
  { term: 'Guideline value', def: 'The government reference price per sqm used for valuation and stamp duty.' },
  { term: 'Patta', def: "Tamil Nadu's record of land ownership (with the chitta, its extent register) — the TN equivalent of the RoR." },
  { term: 'Pattadar passbook', def: "Telangana's owner document under Dharani — the passbook number identifies the holding." },
  { term: 'Meebhoomi', def: "Andhra Pradesh's online land-records portal; the AP revenue system in this demo speaks its vocabulary." },
  { term: 'Patta Chitta', def: "Tamil Nadu's online land-records service; the TN dialect the demo's adapter translates." },
  { term: 'Dharani', def: "Telangana's integrated land records and registration portal; the TG dialect in this demo." },
  { term: 'Resurvey', def: 'A state programme re-measuring land with modern survey methods; parcels here carry a resurvey status of completed, in progress or pending.' },
];

export interface QuickStep {
  title: string;
  detail: string;
}

export const QUICK_START: QuickStep[] = [
  { title: 'Pick a state', detail: 'The map opens on all of India — click a state card (AP · TN · TG) or use the Regions panel to fly into a cluster.' },
  { title: 'Pick an identity', detail: 'Use the role switcher (dev mode) or sign in. Each role sees a different slice of the app.' },
  { title: 'Click a parcel', detail: 'Any parcel on the map opens its profile. Try a story parcel from the chips or the list below.' },
  { title: 'Read the profile', detail: 'Each tab — ownership, registration, planning, fiscal, utilities, satellite — shows its source and provenance.' },
  { title: 'Act by role', detail: 'Citizens request services, officers approve them in the queue, admins wire up integrations.' },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQ: Faq[] = [
  { q: 'Why is an owner’s name masked?', a: 'Citizens see masked owner details on parcels they neither own nor have consent for. The owner and officers see full detail; consent can be granted for time-boxed access.' },
  { q: 'Is this real land data?', a: 'No. The cadastre is synthetic demo data generated over three real bounding boxes — Mangalagiri (AP), Sriperumbudur (TN) and Shamshabad (TG) — so the places are real but nothing here is a genuine government record.' },
  { q: 'What do the parcel colours mean?', a: 'Status is never colour-only, but as a guide: amber = attention (pending mutation, tax arrears, change alert), brick = disputed, violet = mortgaged, green = clean.' },
  { q: 'How do six departments become one record?', a: 'A gateway calls each department through an adapter, maps its vocabulary into the Common Data Model, and returns the merged parcel with per-source provenance and consistency checks.' },
  { q: 'Where does the AI run?', a: 'Risk briefs and officer advice run on NVIDIA Build (an OpenAI-compatible hosted model) when a key is configured; without one, a deterministic rule engine produces the same structure. Every insight is labelled with the engine that produced it.' },
  { q: 'Can boundaries be edited?', a: 'Only through the bounded workflow: a revenue officer proposes, validation enforces the norms (±15% area, no overlaps, inside the village), and a second approval applies the change and syncs the Record of Rights. Nothing on the map changes silently.' },
];

export interface PitchFigure {
  value: string;
  label: string;
}

/** Illustrative figures for the landing "at a glance" strip — from the demo seed,
 *  NOT a live count (the stats endpoint is officer-gated). Shown with a demo tag. */
export const PITCH_FIGURES: PitchFigure[] = [
  { value: '3', label: 'States · AP TN TG' },
  { value: '575', label: 'Parcels indexed' },
  { value: '6', label: 'Departments unified' },
  { value: '1 key', label: 'ULPIN per parcel' },
];

export interface ProfileTab {
  tab: string;
  what: string;
  source: string;
}

/** The parcel-profile tabs, in order — what each shows and which system answers it. */
export const PROFILE_TABS: ProfileTab[] = [
  { tab: 'Overview', what: 'Status cards (registered, dispute, mortgage, tax, mutation, change alert), open alerts, area, land use, zone, khata, valuation and quick actions.', source: 'All six departments, merged' },
  { tab: 'Ownership & RoR', what: 'Owner name and parentage, ownership type, khata number, extent and classification, plus the mutation history of the parcel.', source: 'Revenue — Record of Rights' },
  { tab: 'Registration & Encumbrance', what: 'Registered deeds (sale, gift, mortgage) with dates and parties, and any active encumbrances such as bank mortgages.', source: 'Registration department' },
  { tab: 'Planning & Permission', what: 'Master-plan zone, permissible land uses, and the status of building-permission applications on the parcel.', source: 'Planning department' },
  { tab: 'Tax & Valuation', what: 'Property-tax demand and arrears, payment status, and the guideline (reference) value used for stamp duty.', source: 'Fiscal / municipal systems' },
  { tab: 'Disputes', what: 'Court cases touching the parcel — case type, current status and next hearing date. Disputed parcels are hatched on the map.', source: 'Legal / eCourts' },
  { tab: 'Utilities', what: 'Water, electricity and sewer connections and road access recorded at the parcel.', source: 'Utility providers' },
  { tab: 'Satellite', what: 'Sentinel-2 change detection: NDVI/NDBI comparison between passes, flagging possible unrecorded construction or land-use change.', source: 'AI change-detection service' },
  { tab: 'Timeline', what: 'Every recorded event on the parcel — deeds, mutations, permissions, alerts — in one chronological view.', source: 'Gateway event log' },
];

export interface Workflow {
  title: string;
  tagline: string;
  steps: string[];
}

/** Cross-department workflows the demo shows end to end (CONTRACTS §8). */
export const WORKFLOWS: Workflow[] = [
  {
    title: 'Deed → Mutation',
    tagline: 'A sale in one department updates ownership in another — automatically.',
    steps: [
      'A sale deed is registered in the registration system.',
      'The registration adapter emits an event to the gateway.',
      'The parcel is flagged "mutation pending" — it turns amber on the map.',
      'The revenue officer sees it in their queue and approves the mutation.',
      'The Record of Rights updates; the new owner appears with full provenance.',
    ],
  },
  {
    title: 'Satellite → Officer review',
    tagline: 'The map notices ground reality drifting from the record.',
    steps: [
      'Two Sentinel-2 passes of the parcel are compared (NDVI / NDBI indices).',
      'A significant built-up change on an agricultural parcel raises an alert.',
      'The alert lands in the planning officer’s inbox, linked to the parcel.',
      'The officer opens the profile, checks the evidence, and resolves or escalates.',
    ],
  },
  {
    title: 'Citizen verification',
    tagline: 'Anyone can check a parcel before a transaction — safely.',
    steps: [
      'Search the parcel by survey number, ULPIN or khata.',
      'Read its status: registered? disputed? mortgaged? tax clear?',
      'Owner details stay masked unless you own it or hold consent.',
      'Download a signed report — anyone can verify it later via its QR code.',
    ],
  },
  {
    title: 'Resurvey → Boundary correction',
    tagline: 'Geometry changes only through validation and a second officer.',
    steps: [
      'A Tahsildar proposes a corrected boundary by dragging the parcel’s vertices on the map.',
      'Validation bounds the edit: ±15% area, no overlap with neighbours, inside the village limit.',
      'An assistive fix can snap the shape to neighbouring boundaries and remove slivers.',
      'The proposal enters the revenue queue; approval re-validates, applies the geometry and syncs the RoR extent.',
      'Every step is audited — the map never changes silently.',
    ],
  },
];

export interface Principle {
  title: string;
  detail: string;
}

/** Plain-language design principles — the "why you can trust this" section. */
export const PRINCIPLES: Principle[] = [
  { title: 'Data stays home', detail: 'No central copy. Each department keeps its records and its authority; the gateway asks live and assembles the answer.' },
  { title: 'Every fact has a source', detail: 'Each block of the profile names the system it came from, when it answered, and whether it was healthy.' },
  { title: 'Partial beats broken', detail: 'If one department is down, its block says so — the rest of the record still loads.' },
  { title: 'Privacy by consent', detail: 'Citizens see masked personal details unless the owner grants time-boxed consent. Officers see what their role allows.' },
  { title: 'Everything is audited', detail: 'Every read and every approval is written to an audit log — who, what, when.' },
];

export interface MapReading {
  cue: string;
  meaning: string;
}

/** How to read the map — visual cues and what they mean. */
export const MAP_READING: MapReading[] = [
  { cue: 'Parcel colour', meaning: 'Set by the "Colour parcels by" picker — land use by default; switch to ownership, registration, dispute, zone or permission.' },
  { cue: 'Hatched parcel', meaning: 'Under an active court dispute. Hatching is used so the status is never colour-only.' },
  { cue: 'Red dashed box + marker', meaning: 'Satellite change alert — imagery suggests unrecorded construction or land-use change.' },
  { cue: 'Amber parcel', meaning: 'Needs attention: a pending mutation, tax arrears, or an open alert.' },
  { cue: 'Survey-number labels', meaning: 'Appear at zoom 16 and closer, from the Base layer tier.' },
  { cue: '3D units · preview', meaning: 'Extrudes seeded buildings into floors and units (3D-ULPIN), tilting the camera. Units are clickable for their data card.' },
  { cue: 'State cluster cards', meaning: 'At national zoom each state shows one card (name, district, parcel count) — click it to fly into that cluster.' },
  { cue: 'Dotted green/amber areas', meaning: 'The Settlement / resurvey layer: green = resurvey completed, amber = in progress, per state programme.' },
];
