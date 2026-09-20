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

/* -------------------------------------------------------------------------- */
/* LOCALIZED CONTENT ACCESSORS (English, Telugu, Hindi)                       */
/* -------------------------------------------------------------------------- */

export function getQuickStart(locale: string = 'en'): QuickStep[] {
  if (locale === 'te') {
    return [
      { title: 'రాష్ట్రం ఎంచుకోండి', detail: 'భారతదేశం మొత్తం నక్షా తెరవబడుతుంది — రాష్ట్ర కార్డు (AP · TN · TG) లేదా ప్రాంతాల ప్యానెల్ ద్వారా నేరుగా గ్రామంలోకి వెళ్ళండి.' },
      { title: 'ఒక పాత్రను ఎంచుకోండి', detail: 'రోల్ స్విచ్చర్ (డెవ్ మోడ్) లేదా సైన్ ఇన్ ఉపయోగించండి. ప్రతి పాత్ర తమ పరిధిలోని సమాచారాన్ని చూస్తుంది.' },
      { title: 'సర్వే నంబరుపై క్లిక్ చేయండి', detail: 'నక్షాపై ఏ పొలంపై క్లిక్ చేసినా దాని ప్రొఫైల్ తెరుచుకుంటుంది. కింది చిప్స్ లేదా జాబితా నుండి నమూనా క్షేత్రాన్ని చూడండి.' },
      { title: 'భూమి రికార్డులు పరిశీలించండి', detail: 'ప్రతి ట్యాబ్ — పట్టాదారు వివరాలు, రిజిస్ట్రేషన్, పన్ను, జోనింగ్, ఉపగ్రహ చిత్రాలు — సంబంధిత శాఖ మూల ధ్రువీకరణతో కనిపిస్తాయి.' },
      { title: 'సేవలు పొందండి', detail: 'రైతులు సేవల కోసం దరఖాస్తు చేస్తారు, రెవెన్యూ అధికారులు ఆమోదిస్తారు, నిర్వాహకులు పర్యవేక్షిస్తారు.' },
    ];
  }
  if (locale === 'hi') {
    return [
      { title: 'राज्य चुनें', detail: 'नक्शा पूरे भारत के दृश्य पर खुलता है — किसी राज्य कार्ड (AP · TN · TG) पर क्लिक करें या क्लस्टर में जाएं।' },
      { title: 'पहचान चुनें', detail: 'रोल स्विचर (डेव मोड) का उपयोग करें या साइन इन करें। प्रत्येक भूमिका ऐप का अलग भाग देखती है।' },
      { title: 'किसी पार्सल पर क्लिक करें', detail: 'नक्शे पर किसी भी पार्सल/खेत पर क्लिक करने से उसकी प्रोफ़ाइल खुलती है। नीचे दी गई सूची से किसी कथा पार्सल को आज़माएं।' },
      { title: 'अभिलेख एवं विवरण पढ़ें', detail: 'प्रत्येक टैब — अधिकार अभिलेख, रजिस्ट्री, योजना, कर, जन सुविधाएं, उपग्रह — अपना आधिकारिक स्रोत और प्रामाणिकता प्रदर्शित करता है।' },
      { title: 'भूमिका अनुसार कार्य करें', detail: 'नागरिक सेवाओं के लिए अनुरोध करते हैं, अधिकारी कतार में उन्हें स्वीकृत करते हैं, व्यवस्थापक एकीकरण प्रबंधित करते हैं।' },
    ];
  }
  return QUICK_START;
}

export function getRoles(locale: string = 'en'): RoleInfo[] {
  if (locale === 'te') {
    return [
      { role: 'రైతు / పౌరుడు', who: 'భూయజమానులు & సాధారణ ప్రజలు', can: 'సర్వే నంబర్ల కోసం వెతకడం, యాజమాన్య హక్కులను ధ్రువీకరించడం, దరఖాస్తులను ట్రాక్ చేయడం మరియు సేవలు కోరడం. సమ్మతి లేకుండా యజమాని వివరాలు రక్షించబడతాయి.', icon: Users, tone: 'primary' },
      { role: 'రెవెన్యూ / శాఖాధికారి', who: 'రెవెన్యూ · రిజిస్ట్రేషన్ · పట్టణ ప్రణాళిక', can: 'కార్యాలయ క్యూను పరిశీలించడం, మ్యుటేషన్ & నిర్మాణ అనుమతులను ఆమోదించడం, రికార్డ్ ఆఫ్ రైట్స్ కాలక్రమాన్ని చదవడం మరియు హెచ్చరికలను పరిష్కరించడం.', icon: Building2, tone: 'violet' },
      { role: 'వ్యవస్థాపక నిర్వాహకుడు', who: 'సమన్వయం & సాంకేతిక పర్యవేక్షణ', can: 'అధికారి చేయగల పనులతో పాటు కనెక్టర్లు, అడాప్టర్ మ్యాపింగ్‌లు, అనుగుణ్యతా పరిశీలనలు మరియు డెమో రీసెట్ నిర్వహణ.', icon: ShieldCheck, tone: 'slate' },
    ];
  }
  if (locale === 'hi') {
    return [
      { role: 'नागरिक / किसान', who: 'भू-स्वामी एवं आम जनता', can: 'पार्सल खोजें, स्वामित्व सत्यापित करें, आवेदन ट्रैक करें, सेवाओं का अनुरोध करें। सहमति के बिना स्वामी का व्यक्तिगत विवरण सुरक्षित रहता है।', icon: Users, tone: 'primary' },
      { role: 'विभागीय अधिकारी', who: 'राजस्व · निबंधन · नगर नियोजन', can: 'विभागीय कतार का संचालन, दाखिल-खारिज और भवन अनुमतियां स्वीकृत करना, अधिकार अभिलेख देखना और अलर्ट पर कार्रवाई करना।', icon: Building2, tone: 'violet' },
      { role: 'सिस्टम व्यवस्थापक', who: 'एकीकरण एवं तकनीकी निरीक्षण', can: 'अधिकारी के सभी कार्य, साथ ही कनेक्टर, एडेप्टर मैपिंग, डेटा विसंगति जांच और सिस्टम प्रबंधन।', icon: ShieldCheck, tone: 'slate' },
    ];
  }
  return ROLES;
}

export function getMapReading(locale: string = 'en'): MapReading[] {
  if (locale === 'te') {
    return [
      { cue: 'క్షేత్రం రంగు (రంగు వర్గీకరణ)', meaning: 'భూ వినియోగం, యాజమాన్య రకం, రిజిస్ట్రేషన్, వివాదాలు లేదా జోనింగ్ ఆధారంగా రంగులు నిర్ణయించబడతాయి.' },
      { cue: 'గీతలు గీసిన పొలం (హ్యాచ్డ్)', meaning: 'కోర్టులో వివాదం ఉన్న భూమి. కేవలం రంగుపైనే ఆధారపడకుండా ప్రత్యేక గీతలతో స్పష్టంగా గుర్తించబడుతుంది.' },
      { cue: 'ఎరుపు గీతల బాక్స్ + మార్కర్', meaning: 'ఉపగ్రహ మార్పు హెచ్చరిక — అనుమతి లేని నిర్మాణం లేదా భూ వినియోగంలో మార్పును శాటిలైట్ గుర్తించింది.' },
      { cue: 'పసుపు / అంబర్ రంగు పొలం', meaning: 'శ్రద్ధ అవసరం: పెండింగ్ మ్యుటేషన్, పన్ను బకాయిలు లేదా ఓపెన్ అలర్ట్.' },
      { cue: 'సర్వే నంబర్ లేబుల్స్', meaning: 'జూమ్ 16 మరియు అంతకంటే దగ్గరగా చూసినప్పుడు ప్రతి పొలం సర్వే నంబర్ కనిపిస్తుంది.' },
      { cue: '3D భవనాలు & నిలువు యూనిట్లు', meaning: 'బహుళ అంతస్తుల భవనాలు మరియు ఫ్లాట్లను 3D-ULPIN కోడ్‌లతో స్పష్టంగా చూపుతుంది.' },
      { cue: 'రాష్ట్ర క్లస్టర్ కార్డులు', meaning: 'జాతీయ మ్యాప్‌లో AP, TN, TG రాష్ట్రాల కార్డులపై క్లిక్ చేసి నేరుగా ఆ ప్రాంతానికి వెళ్ళవచ్చు.' },
      { cue: 'రీసర్వే చుక్కల ప్రాంతాలు', meaning: 'ఆధునిక డిజిటల్ రీసర్వే పూర్తయిన (ఆకుపచ్చ) లేదా కొనసాగుతున్న (పసుపు) గ్రామాల సరిహద్దులు.' },
    ];
  }
  if (locale === 'hi') {
    return [
      { cue: 'पार्सल का रंग', meaning: 'भूमि उपयोग, स्वामित्व प्रकार, निबंधन, विवाद या अनुमतियों के आधार पर रंग का निर्धारण होता है।' },
      { cue: 'रेखांकित पार्सल (Hatched)', meaning: 'अदालती वाद के अधीन भूमि। स्पष्ट पहचान हेतु रेखांकित (hatch) किया गया है।' },
      { cue: 'लाल डैश बॉक्स + मार्कर', meaning: 'उपग्रह परिवर्तन अलर्ट — उपग्रह चित्रों द्वारा अनधिकृत निर्माण या भूमि उपयोग में परिवर्तन का संकेत।' },
      { cue: 'एम्बर / पीला पार्सल', meaning: 'ध्यान देने योग्य: लंबित दाखिल-खारिज, कर बकाया या खुला विभागीय अलर्ट।' },
      { cue: 'खसरा / सर्वे संख्या', meaning: 'ज़ूम 16 या अधिक पर प्रत्येक खेत या भूखंड का सर्वे नंबर दिखाई देता है।' },
      { cue: '3D बहुमंजिला इकाइयां', meaning: 'इमारतों को मंजिलों और 3D-ULPIN में प्रदर्शित करता है। विवरण के लिए क्लिक करें।' },
      { cue: 'राज्य क्लस्टर कार्ड', meaning: 'राष्ट्रीय स्तर पर राज्यों (AP, TN, TG) के कार्ड पर क्लिक करके सीधे उस क्लस्टर में जाएं।' },
      { cue: 'री-सर्वे रेखांकित क्षेत्र', meaning: 'आधुनिक सर्वेक्षण स्थिति: हरा = पूर्ण, पीला = प्रगति पर।' },
    ];
  }
  return MAP_READING;
}

export function getProfileTabs(locale: string = 'en'): ProfileTab[] {
  if (locale === 'te') {
    return [
      { tab: 'సమగ్ర వివరణ (Overview)', what: 'రిజిస్ట్రేషన్, వివాదం, తనఖా, పన్ను, మ్యుటేషన్ మరియు ఉపగ్రహ హెచ్చరికల సారాంశం.', source: 'అన్ని శాఖల సమగ్ర రికార్డు' },
      { tab: 'యాజమాన్యం & 1-B / RoR', what: 'భూయజమాని పేరు, తండ్రి పేరు, ఖాతా సంఖ్య, విస్తీర్ణం, భూమి వర్గీకరణ మరియు మ్యుటేషన్ చరిత్ర.', source: 'రెవెన్యూ శాఖ — రికార్డ్ ఆఫ్ రైట్స్' },
      { tab: 'రిజిస్ట్రేషన్ & ఈసీ', what: 'రిజిస్టర్డ్ దస్తావేజులు (అమ్మకం, దానం, తనఖా) మరియు బ్యాంకు తనఖా వివరాలు.', source: 'రిజిస్ట్రేషన్ మరియు స్టాంపుల శాఖ' },
      { tab: 'జోనింగ్ & అనుమతులు', what: 'మాస్టర్ ప్లాన్ జోన్, అనుమతించబడిన భూ వినియోగం మరియు నిర్మాణ అనుమతుల స్థితి.', source: 'పట్టణ ప్రణాళికా విభాగం' },
      { tab: 'పన్ను & మార్కెట్ విలువ', what: 'ఆస్తి పన్ను డిమాండ్, బకాయిలు మరియు రిజిస్ట్రేషన్ కోసం ప్రభుత్వ మార్గదర్శక విలువ.', source: 'పురపాలక / ఆర్థిక శాఖ' },
      { tab: 'కోర్టు కేసులు & వివాదాలు', what: 'భూమిపై ఉన్న కోర్టు కేసులు, కేస్ రకం, ప్రస్తుత స్థితి మరియు తదుపరి విచారణ తేదీ.', source: 'న్యాయ శాఖ / ఈ-కోర్టులు' },
      { tab: 'మౌలిక సదుపాయాలు', what: 'రహదారి సదుపాయం, విద్యుత్, మంచినీటి కనెక్షన్ మరియు మురుగునీటి పారుదల వివరాలు.', source: 'యుటిలిటీ సంస్థలు' },
      { tab: 'ఉపగ్రహ పర్యవేక్షణ', what: 'సెంటినెల్-2 శాటిలైట్ చిత్రాల ఆధారంగా అక్రమ నిర్మాణాలు లేదా మార్పులను గుర్తించడం.', source: 'AI ఉపగ్రహ విశ్లేషణ' },
      { tab: 'నమోదుల కాలక్రమం', what: 'భూమికి సంబంధించిన ప్రతి లావాదేవీ మరియు నమోదుల పూర్తి కాలక్రమం.', source: 'గేట్‌వే ఈవెంట్ లాగ్' },
    ];
  }
  if (locale === 'hi') {
    return [
      { tab: 'अवलोकन (Overview)', what: 'निबंधन, विवाद, बंधक, कर, दाखिल-खारिज और उपग्रह अलर्ट की समग्र स्थिति।', source: 'सभी छह विभागों का समेकित रिकॉर्ड' },
      { tab: 'स्वामित्व एवं खतौनी (RoR)', what: 'भू-स्वामी का नाम, पिता का नाम, खाता संख्या, रकबा/क्षेत्रफल, वर्गीकरण एवं नामांतरण इतिहास।', source: 'राजस्व विभाग — अधिकार अभिलेख' },
      { tab: 'निबंधन एवं भार (Encumbrance)', what: 'पंजीकृत विलेख (बैनामा, दान, बंधक) और बैंक बंधक/भार विवरण।', source: 'निबंधन एवं मुद्रांक विभाग' },
      { tab: 'योजना एवं निर्माण स्वीकृति', what: 'मास्टर प्लान ज़ोन, अनुमेय भूमि उपयोग और निर्माण स्वीकृति की स्थिति।', source: 'नगर एवं ग्राम नियोजन विभाग' },
      { tab: 'कर एवं सर्किल दर', what: 'संपत्ति कर मांग, बकाया और स्टाम्प शुल्क हेतु सरकारी सर्किल दर/मार्गदर्शक मूल्य।', source: 'नगर निकाय एवं वित्तीय प्रणाली' },
      { tab: 'विवाद एवं अदालती वाद', what: 'भूमि से संबंधित अदालती वाद, वाद का प्रकार, वर्तमान स्थिति और अगली सुनवाई।', source: 'न्यायिक प्रणाली / ई-कोर्ट' },
      { tab: 'नागरिक जन सुविधाएं', what: 'सड़क पहुंच, विद्युत कनेक्शन, पेयजल और सीवर लाइन की उपलब्धता।', source: 'जनोपयोगी सेवाएं' },
      { tab: 'उपग्रह निगरानी', what: 'सेंटिनल-2 उपग्रह द्वारा अनिबंधित निर्माण या भूमि उपयोग परिवर्तन की पहचान।', source: 'AI उपग्रह परिवर्तन विश्लेषण' },
      { tab: 'ऐतिहासिक समयरेखा', what: 'विलेख, नामांतरण, स्वीकृतियां और अलर्ट का पूर्ण कालानुक्रमिक विवरण।', source: 'गेटवे इवेंट लॉग' },
    ];
  }
  return PROFILE_TABS;
}

export function getWorkflows(locale: string = 'en'): Workflow[] {
  if (locale === 'te') {
    return [
      {
        title: 'రిజిస్ట్రేషన్ దస్తావేజు → ఆటోమేటిక్ మ్యుటేషన్',
        tagline: 'ఒక శాఖలో అమ్మకం జరిగితే మరొక శాఖలో యాజమాన్యం ఆటోమేటిక్‌గా మారుతుంది.',
        steps: [
          'రిజిస్ట్రేషన్ కార్యాలయంలో సేల్ డీడ్ రిజిస్టర్ చేయబడుతుంది.',
          'రిజిస్ట్రేషన్ అడాప్టర్ నుండి గేట్‌వేకి సమాచారం అందుతుంది.',
          'సర్వే నంబర్‌పై "మ్యుటేషన్ పెండింగ్" అని గుర్తు చేయబడుతుంది — నక్షాలో పసుపు రంగులోకి మారుతుంది.',
          'రెవెన్యూ అధికారి తన కార్యాలయ క్యూలో చూసి మ్యుటేషన్‌ను ఆమోదిస్తారు.',
          'రికార్డ్ ఆఫ్ రైట్స్ (1-B) లో కొత్త యజమాని పేరు ధ్రువీకరించిన మూలంతో నవీకరించబడుతుంది.',
        ],
      },
      {
        title: 'ఉపగ్రహ నిఘా → క్షేత్ర పరిశీలన',
        tagline: 'భూమిపై జరుగుతున్న వాస్తవ మార్పులను నక్షా స్వయంగా గుర్తిస్తుంది.',
        steps: [
          'వ్యవసాయ భూమి యొక్క రెండు ఉపగ్రహ చిత్రాలను (NDVI / NDBI) సరిపోల్చడం జరుగుతుంది.',
          'వ్యవసాయ భూమిపై ఏదైనా అనుమతి లేని నిర్మాణం జరిగితే అలర్ట్ జారీ అవుతుంది.',
          'ఈ హెచ్చరిక నేరుగా ప్రణాళికా అధికారి ఇన్బాక్స్‌కు చేరుతుంది.',
          'అధికారి క్షేత్ర ప్రొఫైల్ పరిశీలించి, అవసరమైన చర్యలు చేపడతారు.',
        ],
      },
      {
        title: 'రైతు / పౌర భూ ధ్రువీకరణ',
        tagline: 'భూమి కొనుగోలుకు ముందు ఎవరైనా నిశ్చింతగా మరియు సురక్షితంగా రికార్డులను తనిఖీ చేయవచ్చు.',
        steps: [
          'సర్వే నంబర్, ULPIN లేదా ఖాతా నంబరుతో భూమిని శోధించండి.',
          'రిజిస్టర్ అయిందా? వివాదాలు ఉన్నాయా? తనఖాలో ఉందా? పన్ను క్లియర్ అయిందా? అని చూడండి.',
          'యజమాని లేదా అనుమతి లేని వారికి వ్యక్తిగత వివరాలు సురక్షితంగా దాచబడతాయి.',
          'డిజిటల్ సంతకంతో కూడిన నివేదికను డౌన్‌లోడ్ చేసుకోండి — QR కోడ్ ద్వారా ఎవరైనా ధ్రువీకరించవచ్చు.',
        ],
      },
      {
        title: 'రీసర్వే → సరిహద్దుల సవరణ',
        tagline: 'సరైన నిబంధనలు మరియు అధికారి ఆమోదంతో మాత్రమే సరిహద్దులు మార్చబడతాయి.',
        steps: [
          'తహశీల్దార్ లేదా సర్వేయర్ నక్షాపై పాయింట్లను సరిచేయడం ద్వారా సరైన సరిహద్దును ప్రతిపాదిస్తారు.',
          'వ్యవస్థ నియమాలను తనిఖీ చేస్తుంది: ±15% విస్తీర్ణం పరిమితి, పక్క పొలాలతో అతివ్యాప్తి లేకపోవడం, గ్రామ పరిధిలో ఉండటం.',
          'స్నాపింగ్ సాధనం ద్వారా సరిహద్దులు సులభంగా సర్దుబాటు చేయబడతాయి.',
          'రెవెన్యూ క్యూలో ఆమోదం పొందిన తర్వాత కొత్త కొలతలు మరియు 1-B విస్తీర్ణం నవీకరించబడతాయి.',
          'ప్రతి చర్య ఆడిట్ లాగ్‌లో భద్రపరచబడుతుంది — నక్షాలో ఏదీ రహస్యంగా మారదు.',
        ],
      },
    ];
  }
  if (locale === 'hi') {
    return [
      {
        title: 'रजिस्ट्री विलेख → दाखिल-खारिज (नामांतरण)',
        tagline: 'एक विभाग में बैनामा होने पर दूसरे विभाग में स्वतः स्वामित्व अद्यतन होता है।',
        steps: [
          'निबंधन कार्यालय में बैनामा (सेल डीड) पंजीकृत होता है।',
          'निबंधन प्रणाली गेटवे को डिजिटल सूचना प्रेषित करती है।',
          'पार्सल पर "नामांतरण लंबित" का चिन्ह लग जाता है — नक्शे पर एम्बर रंग दिखता है।',
          'राजस्व अधिकारी अपनी कतार में विवरण देखकर दाखिल-खारिज स्वीकृत करते हैं।',
          'अधिकार अभिलेख (खतौनी) में नए स्वामी का नाम आधिकारिक स्रोत के साथ दर्ज हो जाता है।',
        ],
      },
      {
        title: 'उपग्रह निगरानी → स्थलीय सत्यापन',
        tagline: 'धरातलीय वास्तविकता और अभिलेख में अंतर को उपग्रह स्वतः पहचानता है।',
        steps: [
          'सेंटिनल-2 उपग्रह के दो चक्रों (NDVI / NDBI) की तुलना की जाती है।',
          'कृषि भूमि पर अनिधिकृत पक्का निर्माण होने पर अलर्ट जारी होता है।',
          'यह अलर्ट सीधे नियोजन अधिकारी के इनबॉक्स में संबंधित पार्सल से जुड़ जाता है।',
          'अधिकारी प्रोफ़ाइल देखकर जांच करते हैं और नियमानुसार निस्तारण करते हैं।',
        ],
      },
      {
        title: 'नागरिक भूमि सत्यापन',
        tagline: 'भूमि क्रय से पूर्व कोई भी व्यक्ति सुरक्षित रूप से प्रामाणिक रिकॉर्ड जांच सकता है।',
        steps: [
          'खसरा/सर्वे संख्या, ULPIN या खाता संख्या से पार्सल खोजें।',
          'स्थिति जांचें: पंजीकृत? विवादित? बंधक? कर अद्यतन?',
          'गोपनीयता हेतु अनधिकृत व्यक्तियों के लिए स्वामी का नाम सुरक्षित रहता है।',
          'डिजिटल हस्ताक्षरित रिपोर्ट डाउनलोड करें — QR कोड से कभी भी सत्यापन संभव।',
        ],
      },
      {
        title: 'पुनःसर्वेक्षण → सीमा संशोधन',
        tagline: 'कड़े सत्यापन और द्वित्तीय स्वीकृति के बाद ही सीमाएं संशोधित होती हैं।',
        steps: [
          'राजस्व अधिकारी नक्शे पर नोड्स को समायोजित कर संशोधित सीमा प्रस्तावित करते हैं।',
          'सत्यापन नियम लागू होते हैं: ±15% क्षेत्रफल सीमा, पड़ोसी खेतों से टकराव नहीं, ग्राम सीमा के भीतर।',
          'प्रस्ताव राजस्व कतार में जाता है; स्वीकृति के बाद खतौनी का रकबा स्वतः अपडेट होता है।',
          'प्रत्येक कार्रवाई का पूर्ण ऑडिट होता है — नक्शा कभी भी चुपके से नहीं बदलता।',
        ],
      },
    ];
  }
  return WORKFLOWS;
}

export function getStoryParcels(locale: string = 'en'): StoryParcel[] {
  if (locale === 'te') {
    return [
      { survey_no: '123/4', ulpin: 'TFCM91641E6C82', title: 'స్పష్టమైన నివాస స్థలం', note: 'యజమాని రవి కుమార్ — పూర్తి రిజిస్టర్డ్, ఎలాంటి వివాదాలు లేవు. మంగళగిరి, AP.', tone: 'primary' },
      { survey_no: '124', ulpin: 'TFCM91D3533DD2', title: 'ఉపగ్రహ మార్పు హెచ్చరిక', note: 'వ్యవసాయ భూమిపై అనధికార నిర్మాణం జరిగినట్లు సెంటినెల్-2 గుర్తించింది. మంగళగిరి, AP.', tone: 'amber' },
      { survey_no: '125/2', ulpin: 'TFCM9167B91686', title: 'కోర్టు వివాదంలో ఉన్న భూమి', note: 'కోర్టు కేసు విచారణలో ఉన్నందున ఎలాంటి లావాదేవీలకు అనుమతి లేదు. మంగళగిరి, AP.', tone: 'brick' },
      { survey_no: '126', ulpin: 'TFCM916196F0FE', title: 'బ్యాంకు తనఖా', note: 'బ్యాంకు రుణం కోసం తాకట్టు పెట్టిన భూమి (ఈసీ చార్జ్). మంగళగిరి, AP.', tone: 'violet' },
      { survey_no: '127/1', ulpin: 'TFCM91KDED50FD', title: 'పన్ను బకాయిలు + విస్తీర్ణం తేడా', note: 'పురపాలక పన్ను బకాయి ఉంది మరియు రెవెన్యూ, రిజిస్ట్రేషన్ విస్తీర్ణంలో తేడా ఉంది. మంగళగిరి, AP.', tone: 'amber' },
      { survey_no: '128', ulpin: 'TFCM914291996F', title: 'మ్యుటేషన్ పెండింగ్', note: 'యాజమాన్య బదిలీ దరఖాస్తు రెవెన్యూ అధికారి పరిశీలనలో ఉంది. మంగళగిరి, AP.', tone: 'slate' },
      { survey_no: '45/2', ulpin: 'TF2CEQ4ACED970', title: 'వివాదం · తమిళనాడు', note: 'శ్రీపెరంబుదూర్ పార్సెల్‌పై కోర్టు వివాద ప్రక్రియ TN అడాప్టర్ ద్వారా పనిచేస్తుంది.', tone: 'brick' },
      { survey_no: '77', ulpin: 'TEPDPUQC13C0D7', title: 'ఉపగ్రహ హెచ్చరిక · తెలంగాణ', note: 'శంషాబాద్ భూమిపై శాటిలైట్ చేంజ్ డిటెక్షన్ — ఒకే వ్యవస్థ, మూడు రాష్ట్రాలు.', tone: 'amber' },
    ];
  }
  if (locale === 'hi') {
    return [
      { survey_no: '123/4', ulpin: 'TFCM91641E6C82', title: 'विवादमुक्त आवासीय पार्सल', note: 'स्वामी रवि कुमार — पूर्णतः पंजीकृत, कोई विवाद नहीं। मंगलागिरी, AP.', tone: 'primary' },
      { survey_no: '124', ulpin: 'TFCM91D3533DD2', title: 'उपग्रह परिवर्तन अलर्ट', note: 'कृषि भूमि जिस पर सेंटिनल-2 उपग्रह ने अनधिकृत निर्माण चिह्नित किया है। मंगलागिरी, AP.', tone: 'amber' },
      { survey_no: '125/2', ulpin: 'TFCM9167B91686', title: 'अदालती वाद / विवादित', note: 'न्यायालय में विचाराधीन वाद, विधिक स्थिति प्रतिबंधित। मंगलागिरी, AP.', tone: 'brick' },
      { survey_no: '126', ulpin: 'TFCM916196F0FE', title: 'बैंक बंधक / भार', note: 'निबंधन विभाग में दर्ज सक्रिय बैंक बंधक/ऋण भार। मंगलागिरी, AP.', tone: 'violet' },
      { survey_no: '127/1', ulpin: 'TFCM91KDED50FD', title: 'कर बकाया + रकबा अंतर', note: 'वित्तीय बकाया एवं राजस्व व निबंधन के रकबे में विसंगति। मंगलागिरी, AP.', tone: 'amber' },
      { survey_no: '128', ulpin: 'TFCM914291996F', title: 'दाखिल-खारिज लंबित', note: 'स्वामित्व अंतरण अधिकारी की कतार में विचाराधीन है। मंगलागिरी, AP.', tone: 'slate' },
      { survey_no: '45/2', ulpin: 'TF2CEQ4ACED970', title: 'विवादित · तमिलनाडु', note: 'श्रीपेरुम्बुदूर पार्सल पर तमिलनाडु एडेप्टर के माध्यम से संचालित वाद।', tone: 'brick' },
      { survey_no: '77', ulpin: 'TEPDPUQC13C0D7', title: 'उपग्रह अलर्ट · तेलंगाना', note: 'शमशाबाद पार्सल पर उपग्रह परिवर्तन पहचान — एक मंच, तीन राज्य।', tone: 'amber' },
    ];
  }
  return STORY_PARCELS;
}

export function getGlossary(locale: string = 'en'): Term[] {
  if (locale === 'te') {
    return [
      { term: 'ULPIN (భూ ఆధార్)', def: 'యూనిక్ ల్యాండ్ పార్సెల్ ఐడెంటిఫికేషన్ నంబర్ — ప్రతి సర్వే నంబర్‌ను అనుసంధానించే 14 అంకెల గుర్తింపు సంఖ్య.' },
      { term: 'RoR (1-B / రికార్డ్ ఆఫ్ రైట్స్)', def: 'రెవెన్యూ శాఖ నిర్వహించే అధికారిక యాజమాన్య హక్కుల పత్రం (ఖాతా, విస్తీర్ణం, భూమి రకం).' },
      { term: 'Encumbrance (ఈసీ / తనఖా)', def: 'భూమిపై ఉన్న బ్యాంకు రుణం, తాకట్టు లేదా కోర్టు అటాచ్‌మెంట్ వివరాలు (రిజిస్ట్రేషన్ శాఖ రికార్డు).' },
      { term: 'Mutation (మ్యుటేషన్)', def: 'క్రయవిక్రయాలు లేదా వారసత్వం తర్వాత రెవెన్యూ రికార్డులలో కొత్త యజమాని పేరును నమోదు చేసే చట్టబద్ధమైన ప్రక్రియ.' },
      { term: 'Provenance (మూల ధ్రువీకరణ)', def: 'ప్రతి సమాచారం ఏ ప్రభుత్వ శాఖ నుండి వచ్చింది, ఎప్పుడు సమాధానమిచ్చింది అనే విశ్వసనీయత.' },
      { term: 'CDM (కామన్ డేటా మోడల్)', def: 'ఆరు ప్రభుత్వ శాఖల రికార్డులను సమన్వయం చేసే ఏకీకృత డిజిటల్ డేటా వ్యవస్థ.' },
      { term: 'Guideline value (మార్కెట్ విలువ)', def: 'స్టాంప్ డ్యూటీ మరియు రిజిస్ట్రేషన్ కోసం ప్రభుత్వం నిర్ణయించిన ప్రామాణిక కనీస విలువ.' },
      { term: 'Patta / Chitta (పట్టా చిట్టా)', def: 'తమిళనాడు భూ యాజమాన్య రికార్డు — ఆంధ్రప్రదేశ్ 1-B కి సమానం.' },
      { term: 'Pattadar passbook (పాస్ పుస్తకం)', def: 'తెలంగాణ ధరణి వ్యవస్థ కింద రైతులకు ఇచ్చే అధికారిక యాజమాన్య ధ్రువీకరణ పత్రం.' },
      { term: 'Meebhoomi (మీభూమి)', def: 'ఆంధ్రప్రదేశ్ ఆన్‌లైన్ భూ రికార్డుల వ్యవస్థ; ఈ డెమో మీభూమి పదజాలాన్ని అనుసరిస్తుంది.' },
      { term: 'Dharani (ధరణి)', def: 'తెలంగాణ సమగ్ర భూ రికార్డులు మరియు రిజిస్ట్రేషన్ల పోర్టల్.' },
      { term: 'Resurvey (వైఎస్సార్ జగనన్న శాశ్వత భూహక్కు / రీసర్వే)', def: 'డ్రోన్లు మరియు జీపీఎస్ సాంకేతికతతో భూమి సరిహద్దులను సరిదిద్దే ఆధునిక సర్వే కార్యక్రమం.' },
    ];
  }
  if (locale === 'hi') {
    return [
      { term: 'ULPIN (भू-आधार)', def: 'विशिष्ट भूखंड पहचान संख्या — प्रत्येक पार्सल को जोड़ने वाली 14 अंकों की विशिष्ट राष्ट्रीय कुंजी।' },
      { term: 'RoR (खतौनी / अधिकार अभिलेख)', def: 'राजस्व विभाग का आधिकारिक स्वामित्व अभिलेख (खाता संख्या, रकबा, भूमि वर्गीकरण)।' },
      { term: 'Encumbrance (भार / बंधक)', def: 'पार्सल पर वित्तीय या कानूनी दावा, जैसे बैंक बंधक, जो निबंधन विभाग द्वारा दर्ज किया जाता है।' },
      { term: 'Mutation (दाखिल-खारिज)', def: 'बैनामा या उत्तराधिकार के बाद राजस्व अभिलेखों में नवीन स्वामी का नाम दर्ज करने की विधिक प्रक्रिया।' },
      { term: 'Provenance (स्रोत प्रामाणिकता)', def: 'प्रत्येक विवरण किस विभाग से प्राप्त हुआ, कब अद्यतन हुआ और उसकी आधिकारिक स्थिति क्या है।' },
      { term: 'CDM (कॉमन डेटा मॉडल)', def: 'सभी छह विभागों के डेटा को समेकित करने वाला केंद्रीय डेटा ढांचा।' },
      { term: 'Guideline value (सर्किल दर)', def: 'स्टाम्प शुल्क व मूल्यांकन हेतु सरकार द्वारा निर्धारित प्रति वर्गमीटर न्यूनतम मूल्य।' },
      { term: 'Patta (पट्टा)', def: 'भूमि पर विधिक अधिकार अभिलेख।' },
      { term: 'Pattadar passbook', def: 'तेलंगाना की धरणी प्रणाली के अंतर्गत जारी भू-स्वामी पासबुक।' },
      { term: 'Meebhoomi', def: 'आंध्र प्रदेश का भू-अभिलेख पोर्टल; एपी राजस्व प्रणाली इसी शब्दावली का उपयोग करती है।' },
      { term: 'Dharani', def: 'तेलंगाना का एकीकृत भू-अभिलेख एवं निबंधन पोर्टल।' },
      { term: 'Resurvey (पुनःसर्वेक्षण)', def: 'आधुनिक डिजिटल तकनीकों (ETS/ड्रोन) द्वारा भूमि की सीमाओं का पुनर्मापन कार्यक्रम।' },
    ];
  }
  return GLOSSARY;
}

export function getFaq(locale: string = 'en'): Faq[] {
  if (locale === 'te') {
    return [
      { q: 'యజమాని పేరు ఎందుకు దాచబడింది (మాస్క్)?', a: 'భూ యజమాని అనుమతి లేదా స్వంత హక్కు లేని సాధారణ పౌరులకు గోప్యతా నియమాల ప్రకారం వివరాలు దాచబడతాయి. యజమాని మరియు అధికారులకు పూర్తి వివరాలు కనిపిస్తాయి; సమ్మతి ద్వారా పరిమిత సమయానికి అనుమతించవచ్చు.' },
      { q: 'ఇది నిజమైన ప్రభుత్వ భూమి డేటానా?', a: 'కాదు, ఇది మూడు వాస్తవ ప్రాంతాలపై (మంగళగిరి, శ్రీపెరంబుదూర్, శంషాబాద్) అభివృద్ధి చేసిన వాస్తవిక సిమ్యులేషన్ డెమో డేటా. విధానాలు మరియు పద్ధతులు నిజమైన ప్రభుత్వ వ్యవస్థల నమూనాలోనే ఉంటాయి.' },
      { q: 'నక్షాలోని రంగుల అర్థం ఏమిటి?', a: 'రంగు కేవలం ఒక సూచన మాత్రమే: ఆకుపచ్చ = క్లీన్/స్పష్టమైనది, పసుపు = శ్రద్ధ అవసరం (పెండింగ్ మ్యుటేషన్, పన్ను బకాయి), ఎరుపు గీతలు = కోర్టు వివాదం, ఊదా = బ్యాంకు తనఖా.' },
      { q: 'ఆరు శాఖల రికార్డులు ఎలా అనుసంధానించబడ్డాయి?', a: 'ఒక ప్రత్యేక గేట్‌వే ద్వారా ప్రతి శాఖ అడాప్టర్‌ను పిలిచి, కామన్ డేటా మోడల్‌లోకి మార్చి, సమాచారాన్ని మూల ధ్రువీకరణతో క్షణాల్లో ఒకే చోట చేరుస్తుంది.' },
      { q: 'AI ఎలా పనిచేస్తుంది?', a: 'భూ సమస్యల విశ్లేషణ మరియు రిస్క్ అసెస్‌మెంట్ కోసం అధునాతన మోడల్ లేదా నియమ ఆధారిత వ్యవస్థ ఉపయోగపడుతుంది. ప్రతి సమాచారం ఏ ఇంజిన్ ద్వారా వచ్చిందో స్పష్టంగా లేబుల్ చేయబడుతుంది.' },
      { q: 'భూ సరిహద్దులను మార్చవచ్చా?', a: 'ఖచ్చితమైన నిబంధనలతో మాత్రమే: రెవెన్యూ అధికారి ప్రతిపాదిస్తారు, వ్యవస్థ నియమాలను (±15% విస్తీర్ణం, అతివ్యాప్తి లేకపోవడం) పరీక్షిస్తుంది, రెండవ అధికారి ఆమోదిస్తేనే రికార్డులలో మారుతుంది.' },
    ];
  }
  if (locale === 'hi') {
    return [
      { q: 'स्वामी का नाम क्यों छिपाया (मास्क) गया है?', a: 'नागरिकों को उन पार्सलों पर स्वामी विवरण सुरक्षित रूप में दिखता है जिनके वे स्वामी नहीं हैं। स्वामी एवं अधिकारियों को पूर्ण विवरण दिखता है; सहमति द्वारा सीमित समय हेतु पहुंच दी जा सकती है।' },
      { q: 'क्या यह वास्तविक सरकारी भूमि डेटा है?', a: 'नहीं, यह वास्तविक भौगोलिक सीमाओं (मंगलागिरी, श्रीपेरुम्बुदूर, शमशाबाद) पर आधारित एक सुरक्षित सिमुलेशन डेमो है। स्थान वास्तविक हैं पर अभिलेख प्रदर्शनी हेतु हैं।' },
      { q: 'पार्सल के रंगों का क्या अर्थ है?', a: 'हरा = स्पष्ट/निर्विरोध, पीला = ध्यान देने योग्य (दाखिल-खारिज लंबित, कर बकाया), ईंट जैसा लाल = अदालती वाद, बैंगनी = बैंक बंधक।' },
      { q: 'छह विभाग एक रिकॉर्ड में कैसे बदलते हैं?', a: 'एक सुरक्षित गेटवे एडेप्टर के माध्यम से प्रत्येक विभाग से जुड़ता है, डेटा को समेकित करता है और स्रोत प्रामाणिकता के साथ प्रस्तुत करता है।' },
      { q: 'AI कहां संचालित होता है?', a: 'जोखिम विश्लेषण और अधिकारी सहायता हेतु पारदर्शी नियम एवं मॉडल कार्य करते हैं। प्रत्येक निष्कर्ष के साथ प्रयुक्त प्रणाली का नाम अंकित होता है।' },
      { q: 'क्या सीमाओं में संशोधन संभव है?', a: 'केवल कड़े नियमों के तहत: राजस्व अधिकारी प्रस्ताव करते हैं, सिस्टम सीमा जांचता है (±15% क्षेत्रफल, कोई अतिव्यापन नहीं), और द्वितीय अनुमोदन के बाद ही खतौनी में अद्यतन होता है।' },
    ];
  }
  return FAQ;
}
