import { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Scale, 
  Eye, 
  X, 
  UserCheck, 
  Check
} from 'lucide-react';
import { Badge } from '@/components/Badge';

interface StageData {
  id: number;
  stageName: string;
  role: string;
  designation: string;
  actSection: string;
  slaDays: number;
  tagline: string;
  checklist: string[];
  artifactType: string;
  artifactTitle: string;
  docReference: string;
  docDetails: {
    authority: string;
    proceedingsNumber: string;
    date: string;
    parties: string;
    surveyNumber: string;
    extent: string;
    village: string;
    findings: string[];
    operativeClause: string;
    signatory: string;
  };
}

const STAGES: StageData[] = [
  {
    id: 1,
    stageName: 'Stage 1: Ground Verification',
    role: 'VRO',
    designation: 'Village Revenue Officer',
    actSection: 'Section 4(1), AP Record of Rights Act / Village Administration Manual',
    slaDays: 7,
    tagline: 'Physical on-site inspection, boundary identification, and local elder attestations.',
    checklist: [
      'Physical possession verified on ground with applicant in person',
      'Boundary stones cross-referenced with Village Cadastral Map (FMB)',
      'Statements recorded from 3 adjacent boundary patta holders',
      'Zero informal encroachment or unregistered leases found',
      'Biometric e-KYC matching registered owner deed credentials',
    ],
    artifactType: 'Statutory Panchanama',
    artifactTitle: 'Village Ground Inspection & Panchanama Report',
    docReference: 'REV-PAN-MGL-2026-0814',
    docDetails: {
      authority: 'OFFICE OF THE VILLAGE REVENUE OFFICER · MANGALAGIRI',
      proceedingsNumber: 'VRO/MGL/PAN/2026/0814',
      date: '2026-09-18',
      parties: 'In re: Application for Title Mutation by Sri. Ravi Kumar S/o S. Venkat',
      surveyNumber: 'Sy. No. 123/4 (Old Sy. 123)',
      extent: '0.42 Hectares (1.04 Acres)',
      village: 'Mangalagiri Mandal, Guntur District, Andhra Pradesh',
      findings: [
        'The applicant is found to be in peaceful, uninterrupted, and lawful physical possession of Sy. No. 123/4.',
        'Physical boundaries correspond to North: Cart track (3.2m), South: Sy. 123/5, East: Sy. 124, West: R&B Road.',
        'Panchanama conducted in the presence of Panchas: Sri. K. Ramaiah and Sri. T. Bhaskar.',
        'No adverse claims, oral tenancy disputes, or pending informal mortgages were voiced during public spot enquiry.',
      ],
      operativeClause: 'The ground verification is concluded in the affirmative. File recommended for Mandal Cadastral Demarcation.',
      signatory: 'Village Revenue Officer, Mangalagiri North',
    },
  },
  {
    id: 2,
    stageName: 'Stage 2: Cadastral Demarcation',
    role: 'Surveyor',
    designation: 'Mandal Deputy Surveyor',
    actSection: 'Section 9, Survey and Boundaries Act 1923',
    slaDays: 14,
    tagline: 'High-precision Total Station & DGPS survey verifying FMB dimensions and traverse closure.',
    checklist: [
      'Authoritative Field Measurement Book (FMB) sheet retrieved from Taluk Archives',
      'Total Station traverse run from tri-junction GTS benchmark pillar',
      'Traverse closure linear error verified at 0.024m (threshold < 0.05m)',
      'Sub-division FMB sketch generated with exact Cartesian UTM coordinates',
      'Zero area conflict or geometry overlap with adjacent private holdings',
    ],
    artifactType: 'Demarcation Certificate',
    artifactTitle: 'Cadastral Sub-Division & Demarcation Certificate (FMB)',
    docReference: 'SUR-FMB-MGL-2026-0291',
    docDetails: {
      authority: 'DIRECTORATE OF SURVEY & LAND RECORDS · MANDAL SURVEY DESK',
      proceedingsNumber: 'SURV/FMB/DEMARC/2026/0291',
      date: '2026-09-21',
      parties: 'Survey & Sub-division Reference for Cadastral Parcel Sy. 123/4',
      surveyNumber: 'Sy. 123/4 (Sub-divided from Parent Sy. 123)',
      extent: 'Computed Area: 4,200.00 sq.m (RoR Extent: 4,200.00 sq.m · Delta: 0.00%)',
      village: 'Mangalagiri Cadastral Sheet 04, Guntur District',
      findings: [
        'Electronic Total Station (ETS) loop traverse closed within statutory tolerance: closure ratio 1:18,400.',
        'Tie-line distance from Tri-Junction Stone #42 measured 48.62m against recorded 48.60m (within ±0.05m tolerance).',
        'Cadastral corner stone pillars (P1 through P6) permanently embedded and GPS geo-tagged in EPSG:4326.',
        'No overlap detected with proposed NHAI / CRDA corridor alignment buffer (nearest edge clearance 28.4m).',
      ],
      operativeClause: 'Sub-division map approved and digitally appended to Village FMB Register. Transmitted to Revenue Inspector.',
      signatory: 'Mandal Deputy Surveyor, Mangalagiri Mandal',
    },
  },
  {
    id: 3,
    stageName: 'Stage 3: Statutory Scrutiny',
    role: 'RI',
    designation: 'Mandal Revenue Inspector',
    actSection: 'Section 5(2), Andhra Pradesh Rights in Land and Pattadar Pass Books Act 1971',
    slaDays: 21,
    tagline: 'Encumbrance trail audit, 1-B Khata reconciliation, and 15-day public objection notice.',
    checklist: [
      '30-year Encumbrance Certificate (EC) audited via SRO Registration Gateway',
      'Clean title verified with zero active bank charges, lis pendens, or court attachments',
      '15-day statutory public objection notice published on Village Notice Board and Portal',
      'Zero written or electronic objections received within statutory objection window',
      'Land revenue cesses and water rates verified paid up to current financial year',
    ],
    artifactType: 'Scrutiny Note',
    artifactTitle: 'Mandal Revenue Inspector Statutory Scrutiny & Objection Audit',
    docReference: 'REV-SCR-MGL-2026-1102',
    docDetails: {
      authority: 'OFFICE OF THE REVENUE INSPECTOR · MANGALAGIRI FIRKA',
      proceedingsNumber: 'RI/FIRKA/SCRUTINY/2026/1102',
      date: '2026-09-24',
      parties: 'Application Ref No. MUT/2026/AP/91641 · Sri. Ravi Kumar',
      surveyNumber: 'Sy. No. 123/4, Khata No. 408',
      extent: '1.04 Acres (Class: Dry / Patta Land)',
      village: 'Mangalagiri Rural Firka',
      findings: [
        'Registration Document No. 4182/2026 Registered at SRO Mangalagiri duly authenticated through IGRS Gateway.',
        'Encumbrance Certificate search from 1996 to 2026 reveals zero prior charges or court attachments.',
        'Form-VIII notice issued on 2026-09-08; 15 days elapsed without any objection from adjacent landholders or third parties.',
        'Verification with e-Courts National Judicial Data Grid confirms no pending civil suit in Munisif/Sub-Court.',
      ],
      operativeClause: 'Statutory compliance complete under §5(2). Case submitted to Tahsildar for final quasi-judicial Speaking Order.',
      signatory: 'Revenue Inspector, Mangalagiri Firka',
    },
  },
  {
    id: 4,
    stageName: 'Stage 4: Quasi-Judicial Order',
    role: 'Tahsildar',
    designation: 'Tahsildar & Executive Magistrate',
    actSection: 'Section 5(1), AP Rights in Land & Pattadar Pass Books Act 1971',
    slaDays: 30,
    tagline: 'Quasi-judicial determination, formal speaking order, digital signature, and RoR 1-B update.',
    checklist: [
      'Judicial examination of VRO Panchanama, Surveyor Demarcation, and RI Scrutiny notes',
      'Confirmation of statutory authority and jurisdiction under Section 5(1) of the RoR Act',
      'Automated Speaking Order generated citing statutory rationale and legal provisions',
      'Cryptographic officer digital signature applied with timestamp and audit hash',
      'Automated bidirectional sync to Village RoR 1-B Register and Citizen e-Passbook',
    ],
    artifactType: 'Speaking Order',
    artifactTitle: 'Formal Quasi-Judicial Speaking Order (§5(1) RoR Act)',
    docReference: 'REV-ROR-MGL-2026-MUT-8842',
    docDetails: {
      authority: 'COURT OF THE TAHSILDAR & EXECUTIVE MAGISTRATE · MANGALAGIRI',
      proceedingsNumber: 'ROC.No.MUT/8842/2026/A1',
      date: '2026-09-25',
      parties: 'Present: Smt. K. Sunitha, M.A., Tahsildar · In the matter of Mutation of Sy. 123/4',
      surveyNumber: 'Cadastral Survey No. 123/4 · ULPIN: TFCM91641E6C82',
      extent: '0.4200 Hectares (1.04 Acres) · Dry Land · Khata No. 408',
      village: 'Mangalagiri Mandal, Guntur District, Andhra Pradesh',
      findings: [
        'Having perused the registered sale deed 4182/2026, VRO Panchanama dated 18-09-2026, and Surveyor sub-division FMB.',
        'Whereas no objections were filed pursuant to statutory Form-VIII notification published under Rule 18(2).',
        'Being satisfied that the applicant has acquired valid legal title, lawful consideration, and physical possession.',
        'In exercise of the quasi-judicial powers vested under Section 5(1) of the Pattadar Pass Books Act 1971.',
      ],
      operativeClause: 'ORDER: The name of Sri. Ravi Kumar is hereby ordered to be entered as Pattadar in the Record of Rights 1-B Register for Sy. 123/4 (Extent 1.04 Ac). Title deed and e-Pattadar Pass Book ordered for digital issue.',
      signatory: 'Tahsildar & Joint Sub-Registrar, Mangalagiri',
    },
  },
];

const DEFAULT_STAGE: StageData = STAGES[3] as StageData;

export function StatutoryHierarchySimulator() {
  const [activeStageId, setActiveStageId] = useState<number>(4);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [completedSimulations, setCompletedSimulations] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });

  const activeStage: StageData = STAGES.find((s) => s.id === activeStageId) ?? DEFAULT_STAGE;

  const handleSimulate = (stageId: number) => {
    setCompletedSimulations((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 shadow-panel">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary font-mono text-xs font-bold">
              <Scale size={15} />
            </span>
            <h3 className="font-display text-base font-bold text-ink">
              Interactive Statutory Revenue Hierarchy
            </h3>
            <Badge tone="primary" mono>
              §5(1) RoR ACT
            </Badge>
          </div>
          <p className="mt-1 text-xs text-ink-2 max-w-2xl">
            Simulate how a mutation progresses through the mandatory 4-stage administrative hierarchy 
            before a quasi-judicial Speaking Order can alter the Record of Rights.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowDocModal(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft/50 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-soft hover:border-primary active:scale-95 cursor-pointer shadow-xs"
        >
          <Eye size={13} />
          <span>Inspect {activeStage.artifactType}</span>
        </button>
      </div>

      {/* Stage Stepper Tabs */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((stage) => {
          const isSelected = stage.id === activeStageId;
          const isSimDone = completedSimulations[stage.id];

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStageId(stage.id)}
              className={`flex flex-col text-left rounded-xl border p-3 transition cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                  : 'border-line bg-panel-2 hover:border-line-strong hover:bg-ground-2'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isSelected ? 'text-primary' : 'text-ink-3'
                }`}>
                  Stage 0{stage.id}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                  isSimDone ? 'text-primary' : 'text-ink-3'
                }`}>
                  {isSimDone ? <CheckCircle2 size={11} className="text-primary" /> : <Clock size={11} />}
                  {isSimDone ? 'Passed' : 'Pending'}
                </span>
              </div>
              <span className="mt-1 font-display text-xs font-bold text-ink truncate">
                {stage.role} · {stage.designation.split(' ')[0]}
              </span>
              <span className="text-[11px] text-ink-3 truncate mt-0.5">
                {stage.stageName.split(':')[1]?.trim() || stage.stageName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Detail Panel */}
      <div className="mt-4 rounded-xl border border-line bg-panel-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone="primary" mono>{activeStage.role} DESK</Badge>
              <h4 className="font-display text-sm font-bold text-ink">
                {activeStage.stageName} — {activeStage.designation}
              </h4>
            </div>
            <p className="mt-1 text-xs text-ink-2">
              {activeStage.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-ink-3 flex items-center gap-1">
              <Clock size={12} /> Statutory SLA: <strong>{activeStage.slaDays} Days</strong>
            </span>
            <button
              type="button"
              onClick={() => handleSimulate(activeStage.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-ground-2 hover:text-ink transition cursor-pointer"
            >
              {completedSimulations[activeStage.id] ? (
                <>
                  <Check size={12} className="text-primary" /> Reset Simulation
                </>
              ) : (
                <>
                  <UserCheck size={12} /> Simulate Approval
                </>
              )}
            </button>
          </div>
        </div>

        {/* Legal Authority & Checklist Grid */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {/* Statutory Authority Card */}
          <div className="flex flex-col justify-between rounded-lg border border-line bg-panel p-3">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-3">
                Legal Basis & Statutory Provision
              </span>
              <p className="mt-1 text-xs font-semibold text-ink leading-snug">
                {activeStage.actSection}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-2">
                Mandates jurisdictional competence. No officer can bypass or compress this desk 
                without triggering an automatic administrative audit exception.
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-[11px]">
              <span className="font-mono text-ink-3">Artifact Generated:</span>
              <span className="font-mono font-bold text-primary">{activeStage.docReference}</span>
            </div>
          </div>

          {/* Statutory Verification Checklist */}
          <div className="rounded-lg border border-line bg-panel p-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-line/60">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-3">
                Mandatory Verification Checklist
              </span>
              <span className="text-[10px] font-mono text-primary font-bold">5 / 5 Verified</span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {activeStage.checklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] leading-snug text-ink-2">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Live Document Preview Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-panel p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                  Official Statutory Artifact Preview
                </span>
                <h3 className="font-display text-lg font-bold text-ink">
                  {activeStage.artifactTitle}
                </h3>
                <p className="font-mono text-xs text-ink-3 mt-0.5">
                  Ref: {activeStage.docDetails.proceedingsNumber} · Date: {activeStage.docDetails.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="rounded-lg p-1.5 text-ink-3 hover:bg-ground-2 hover:text-ink transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Document Body (Statutory Style) */}
            <div className="mt-4 rounded-xl border border-line bg-panel-2 p-5 font-serif text-ink space-y-4 shadow-inner">
              {/* Seal & Heading */}
              <div className="text-center border-b border-line pb-3">
                <p className="font-mono text-[11px] font-bold tracking-widest text-ink uppercase">
                  {activeStage.docDetails.authority}
                </p>
                <p className="text-xs italic text-ink-3 mt-1">
                  Government of Andhra Pradesh · Revenue & Land Administration Department
                </p>
              </div>

              {/* Proceedings Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs font-sans text-ink-2 border-b border-line/60 pb-3">
                <div>
                  <span className="font-semibold text-ink">Case Reference: </span>
                  {activeStage.docDetails.proceedingsNumber}
                </div>
                <div>
                  <span className="font-semibold text-ink">Date: </span>
                  {activeStage.docDetails.date}
                </div>
                <div>
                  <span className="font-semibold text-ink">Subject Parcel: </span>
                  {activeStage.docDetails.surveyNumber}
                </div>
                <div>
                  <span className="font-semibold text-ink">Extent / Class: </span>
                  {activeStage.docDetails.extent}
                </div>
              </div>

              {/* Sub-heading / Parties */}
              <div className="text-xs font-sans font-medium text-ink bg-panel p-2.5 rounded-lg border border-line">
                {activeStage.docDetails.parties}
              </div>

              {/* Findings */}
              <div className="text-xs leading-relaxed space-y-2 font-sans text-ink-2">
                <p className="font-bold text-ink uppercase tracking-wide text-[11px]">
                  Statutory Findings & On-Record Evidence:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5">
                  {activeStage.docDetails.findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ol>
              </div>

              {/* Operative Clause */}
              <div className="rounded-lg border border-primary/30 bg-primary-soft/40 p-3 text-xs font-sans text-ink leading-relaxed">
                <strong className="text-primary font-bold">OPERATIVE DIRECTIVE: </strong>
                {activeStage.docDetails.operativeClause}
              </div>

              {/* Signature Block */}
              <div className="pt-3 flex items-center justify-between border-t border-line text-xs font-sans">
                <div className="text-[10px] font-mono text-ink-3">
                  <p>SHA-256 Digest: 8f4c...3e91</p>
                  <p>e-Sign Timestamp: {activeStage.docDetails.date}T14:32:00 IST</p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded border border-primary/30 bg-panel text-[11px] font-bold text-primary font-mono">
                    [DIGITALLY SIGNED]
                  </div>
                  <p className="font-bold text-ink mt-1 text-[11px]">{activeStage.docDetails.signatory}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <span className="text-xs text-ink-3">
                Authoritative record generated under ISO 19152 LADM
              </span>
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:brightness-105 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
