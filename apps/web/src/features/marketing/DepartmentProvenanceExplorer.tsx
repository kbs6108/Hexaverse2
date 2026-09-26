import { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Layers, 
  Copy, 
  Check, 
  Code, 
  Database 
} from 'lucide-react';
import { Badge } from '@/components/Badge';

interface DeptConfig {
  id: string;
  name: string;
  shortCode: string;
  statutoryAuthority: string;
  icon: typeof Building2;
  sla: string;
  latencyMs: number;
  stateDialects: {
    ap: { name: string; localFields: Record<string, string> };
    tn: { name: string; localFields: Record<string, string> };
    tg: { name: string; localFields: Record<string, string> };
  };
  sampleJsonLd: object;
}

const DEPARTMENTS: DeptConfig[] = [
  {
    id: 'revenue',
    name: 'Revenue (Record of Rights)',
    shortCode: 'REV',
    statutoryAuthority: 'Directorate of Land Administration & Revenue Records',
    icon: Building2,
    sla: '15-30 Days',
    latencyMs: 32,
    stateDialects: {
      ap: {
        name: 'Meebhoomi (AP Revenue)',
        localFields: {
          'Khata No': '408',
          'Pattadar Name': 'Ravi Kumar',
          'Extent (Acres)': '1.04 Ac',
          'Land Classification': 'Dry (Metta)',
          'Sub-division Register': 'FMB Sheet 04',
        },
      },
      tn: {
        name: 'Tamil Nilam (TN Patta Chitta)',
        localFields: {
          'Patta No': '892',
          'Owner Name': 'K. Ramanathan',
          'Extent (Hectares)': '0.4200 Ha',
          'Land Class': 'Punjai',
          'Village A-Register': 'Sheet 12',
        },
      },
      tg: {
        name: 'Dharani Portal (TG Revenue)',
        localFields: {
          'Passbook No': 'T14200192',
          'Pattadar': 'Mohammed Irfan',
          'Guntas / Extent': '1 Ac 02 Gts',
          'Land Nature': 'Pattadar Agricultural',
          'Dharani Status': 'Green Tier Validated',
        },
      },
    },
    sampleJsonLd: {
      '@context': 'https://landstack.gov.in/contexts/clm-v1.jsonld',
      '@type': 'CadastralRecord',
      ulpin: 'TFCM91641E6C82',
      ror: {
        khataNumber: '408',
        pattadarName: 'Ravi Kumar',
        extentHectares: 0.42,
        classification: 'DRY_PATTA',
        mutationStatus: 'COMPLETED',
        lastSpeakingOrder: 'ROC.No.MUT/8842/2026/A1',
      },
      provenance: {
        sourceGateway: 'AP_MEEBHOOMI_V4',
        verifiedAt: '2026-09-25T14:30:00Z',
        signatureSha256: 'a9b2...84fc',
      },
    },
  },
  {
    id: 'registration',
    name: 'Registration & Stamps (IGRS)',
    shortCode: 'REG',
    statutoryAuthority: 'Inspector General of Registration & Stamps (SRO)',
    icon: FileText,
    sla: 'Real-time Gateway',
    latencyMs: 44,
    stateDialects: {
      ap: {
        name: 'CARD Portal (AP Registration)',
        localFields: {
          'Registered Deed': 'Doc No. 4182/2026',
          'SRO Office': 'Mangalagiri SRO',
          'Guideline Rate': '₹4,800 / sq.yard',
          '30-Yr EC Status': 'Nil Encumbrance',
          'Nature of Deed': 'Absolute Sale Deed',
        },
      },
      tn: {
        name: 'STAR 2.0 (TN Registration)',
        localFields: {
          'Document No': 'Doc No. 2011/2026',
          'Sub-Registrar': 'Sriperumbudur SRO',
          'Guideline Value': '₹5,200 / sq.m',
          'Villangam (EC)': 'Clear Certificate',
          'Doc Type': 'Krayapathiram (Sale)',
        },
      },
      tg: {
        name: 'Dharani SRO Gateway (TG)',
        localFields: {
          'Slot Booking Ref': 'SLOT/SHM/2026/91',
          'SRO Unit': 'Shamshabad Sub-Registrar',
          'Basic Market Value': '₹6,100 / sq.yard',
          'EC Search': 'Zero active mortgage',
          'Registry Mode': 'Direct Biometric Slot',
        },
      },
    },
    sampleJsonLd: {
      '@context': 'https://landstack.gov.in/contexts/clm-v1.jsonld',
      '@type': 'RegistrationDossier',
      ulpin: 'TFCM91641E6C82',
      registeredDeed: {
        documentNumber: '4182/2026',
        sroJurisdiction: 'SRO_MANGALAGIRI',
        executionDate: '2026-08-14',
        guidelineValuePerSqm: 5740,
        encumbranceAuditPeriodYears: 30,
        activeMortgages: [],
      },
      provenance: {
        sourceGateway: 'AP_IGRS_CARD_API',
        verifiedAt: '2026-09-25T14:30:00Z',
      },
    },
  },
  {
    id: 'planning',
    name: 'Town Planning & Urban Development',
    shortCode: 'PLN',
    statutoryAuthority: 'Capital Region Development Authority (CRDA / DTCP)',
    icon: Layers,
    sla: '21 Days',
    latencyMs: 65,
    stateDialects: {
      ap: {
        name: 'AP CRDA / DTCP Portal',
        localFields: {
          'Master Plan Zone': 'R-2 Medium Density Residential',
          'Permissible FAR / FSI': '2.25',
          'Building Permit Status': 'Approved (BP/2026/0412)',
          'Road Width Frontage': '18.0m Master Plan Road',
          'Corridor Clearance': 'Buffer Clear (No Encroachment)',
        },
      },
      tn: {
        name: 'CMDA / DTCP Tamil Nadu',
        localFields: {
          'Zoning Category': 'Mixed Commercial / Residential',
          'FSI Allowance': '2.00',
          'Planning Permission': 'PPA/CMDA/2025/119',
          'Right of Way': '24.0m Radial Corridor',
          'Open Space OSR': 'Handed over to local body',
        },
      },
      tg: {
        name: 'HMDA / TS-bPASS Telangana',
        localFields: {
          'Master Plan Zone': 'Peri-Urban Growth Corridor',
          'Allowed Floor Area': 'Standard G+5 Floors',
          'Building Sanction': 'TS-bPASS Instant Approval',
          'Green Buffer': '15m Setback Maintained',
          'Lake Buffer (FTL)': 'Clear (>120m from lake FTL)',
        },
      },
    },
    sampleJsonLd: {
      '@context': 'https://landstack.gov.in/contexts/clm-v1.jsonld',
      '@type': 'PlanningZoningRecord',
      ulpin: 'TFCM91641E6C82',
      planning: {
        masterPlanAuthority: 'AP_CRDA',
        zoneClassification: 'RESIDENTIAL_MEDIUM_DENSITY',
        fsiPermissible: 2.25,
        buildingPermissionNo: 'BP/2026/0412',
        status: 'SANCTIONED',
      },
      provenance: {
        sourceGateway: 'CRDA_SPATIAL_GATEWAY',
        verifiedAt: '2026-09-25T14:30:00Z',
      },
    },
  },
  {
    id: 'fiscal',
    name: 'Fiscal & Municipal Assessment',
    shortCode: 'TAX',
    statutoryAuthority: 'Municipal Corporation & Revenue Assessment Directorate',
    icon: Database,
    sla: 'Real-time Assessment',
    latencyMs: 28,
    stateDialects: {
      ap: {
        name: 'CDMA / Municipal Tax Gateway (AP)',
        localFields: {
          'Assessment No': 'VMC-PT-2026-0041',
          'Annual Demand': '₹14,200',
          'Arrears Balance': '₹0.00 (Nil)',
          'Current Status': 'PAID (Receipt #99104)',
          'Tax Zone Rating': 'Zone A Municipal',
        },
      },
      tn: {
        name: 'Urban Local Bodies (ULB TN)',
        localFields: {
          'Property Tax ID': 'PTN-CH-88412',
          'Half-Yearly Tax': '₹7,800',
          'Outstanding Balance': 'Nil',
          'Water Cess': 'Paid to CMWSSB',
          'Tax Period': '2026-2027 H1',
        },
      },
      tg: {
        name: 'GHMC / CDMA Property Tax (TG)',
        localFields: {
          'PTIN': 'GHMC-1092841',
          'Annual Assessment': '₹16,500',
          'Current Dues': '₹0.00 (Paid)',
          'Commercial Surcharge': 'N/A (Residential)',
          'Early Bird Rebate': 'Applied (5%)',
        },
      },
    },
    sampleJsonLd: {
      '@context': 'https://landstack.gov.in/contexts/clm-v1.jsonld',
      '@type': 'FiscalAssessmentRecord',
      ulpin: 'TFCM91641E6C82',
      fiscal: {
        assessmentNumber: 'VMC-PT-2026-0041',
        annualDemandInr: 14200,
        arrearsInr: 0,
        status: 'PAID',
        guidelineValueTotal: 24108000,
      },
      provenance: {
        sourceGateway: 'CDMA_TAX_INTEGRATION_HUB',
        verifiedAt: '2026-09-25T14:30:00Z',
      },
    },
  },
  {
    id: 'legal',
    name: 'Legal & e-Courts Judicial Grid',
    shortCode: 'LAW',
    statutoryAuthority: 'National Judicial Data Grid (NJDG) & High Court Registry',
    icon: Building2,
    sla: 'Hourly Sync',
    latencyMs: 51,
    stateDialects: {
      ap: {
        name: 'High Court of AP & District Judiciary',
        localFields: {
          'Litigation Status': 'Clean (No Pending Suits)',
          'Lis Pendens Flag': 'Unencumbered',
          'Prior Closed Suit': 'OS 112/2014 (Dismissed on Merits)',
          'Court Jurisdiction': 'Principal Junior Civil Judge, Mangalagiri',
          'Injunction Orders': 'Nil',
        },
      },
      tn: {
        name: 'Madras High Court & Sub-Courts',
        localFields: {
          'e-Courts Case No': 'Dispute Search: Zero Active Suits',
          'Title Litigation': 'None Recorded',
          'Revenue Appeal Status': 'No revision petitions before RDO',
          'Jurisdiction': 'Sub-Court Sriperumbudur',
          'Stay Orders': 'None',
        },
      },
      tg: {
        name: 'Telangana High Court & Civil Desks',
        localFields: {
          'Case Management': 'NJDG Query: Clean',
          'Land Grievance Appeal': 'Disposed by Special Tribunal',
          'Civil Injunction': 'Zero Open Matters',
          'Court': 'Senior Civil Judge Court, Shamshabad',
          'Status': 'Certified Dispute Free',
        },
      },
    },
    sampleJsonLd: {
      '@context': 'https://landstack.gov.in/contexts/clm-v1.jsonld',
      '@type': 'JudicialEncumbranceRecord',
      ulpin: 'TFCM91641E6C82',
      legal: {
        hasActiveLitigation: false,
        pendingSuitsCount: 0,
        injunctionOrders: [],
        lastNjdgSync: '2026-09-25T13:00:00Z',
      },
      provenance: {
        sourceGateway: 'NJDG_JUDICIAL_GRID_ADAPTER',
        verifiedAt: '2026-09-25T14:30:00Z',
      },
    },
  },
  {
    id: 'utilities',
    name: 'Utilities & Corridor Alignment',
    shortCode: 'UTL',
    statutoryAuthority: 'Public Infrastructure, DISCOM & Highway Authorities',
    icon: Layers,
    sla: 'Real-time & Spatial Overlay',
    latencyMs: 38,
    stateDialects: {
      ap: {
        name: 'APCPDCL & CRDA Infra Gateway',
        localFields: {
          'Power Connection': 'Active (APCPDCL-SC-44109)',
          'Water Supply': 'VMC Municipal Pipeline Connected',
          'Sewage Network': 'Underground Sewerage Connected',
          'Corridor Gazette Alert': 'Zero Corridor Impact (Passes 140m clear)',
          'Right of Way (RoW)': 'Public Road Access Unimpeded',
        },
      },
      tn: {
        name: 'TANGEDCO & CMDA Utilities',
        localFields: {
          'Electricity Meter': 'TANGEDCO LT-Tariff IA #8841',
          'Water Board (Metro)': 'Pipeline Connection Available',
          'Drainage Grid': 'Connected',
          'NHAI Corridor Overlap': 'Clear (>50m from Expressway corridor)',
          'Telecom Fiber Right': 'Underground Right of Way Approved',
        },
      },
      tg: {
        name: 'TSSPDCL & Hyderabad Growth Grid',
        localFields: {
          'Power Meter': 'TSSPDCL Consumer #102941',
          'HMWSSB Water Grid': 'Krishna Phase-III Supply Link',
          'ORR Radial Corridor': 'Non-impacted (No acquisition buffer)',
          'Gas Pipeline Buffer': 'Safe (>300m setback)',
          'Underground Cabling': 'Smart Grid Provisioned',
        },
      },
    },
    sampleJsonLd: {
      '@context': 'https://landstack.gov.in/contexts/clm-v1.jsonld',
      '@type': 'UtilityAndCorridorRecord',
      ulpin: 'TFCM91641E6C82',
      utilities: {
        electricityServiceNumber: 'APCPDCL-SC-44109',
        waterConnection: 'MUNICIPAL_PIPELINE_ACTIVE',
        sewerConnection: 'UNDERGROUND_NETWORK_ACTIVE',
      },
      corridorAcquisition: {
        hasCorridorNotice: false,
        nearestProject: 'Amaravati Outer Ring Road (Phase 2)',
        corridorClearanceMetres: 142.5,
      },
      provenance: {
        sourceGateway: 'AP_INFRA_SPATIAL_GATEWAY',
        verifiedAt: '2026-09-25T14:30:00Z',
      },
    },
  },
];

const DEFAULT_DEPT: DeptConfig = DEPARTMENTS[0] as DeptConfig;

export function DepartmentProvenanceExplorer() {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('revenue');
  const [selectedState, setSelectedState] = useState<'ap' | 'tn' | 'tg'>('ap');
  const [copied, setCopied] = useState<boolean>(false);

  const activeDept: DeptConfig = DEPARTMENTS.find((d) => d.id === selectedDeptId) ?? DEFAULT_DEPT;
  const activeDialect = activeDept.stateDialects[selectedState];

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(activeDept.sampleJsonLd, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 shadow-panel">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary font-mono text-xs font-bold">
              <Database size={15} />
            </span>
            <h3 className="font-display text-base font-bold text-ink">
              6-Department Federation & Provenance Matrix
            </h3>
            <Badge tone="primary" mono>
              CLM 1.0
            </Badge>
          </div>
          <p className="mt-1 text-xs text-ink-2 max-w-2xl">
            Explore how Land Stack harmonizes isolated state departmental databases into a unified, 
            ISO 19152 compliant record without centralized data duplication.
          </p>
        </div>

        {/* State Dialect Switcher */}
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-panel-2 p-1 text-xs">
          <span className="text-[10px] font-mono uppercase text-ink-3 px-2 font-bold">State:</span>
          {(['ap', 'tn', 'tg'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedState(st)}
              className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold uppercase transition cursor-pointer ${
                selectedState === st
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-ink-2 hover:bg-ground-2 hover:text-ink'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Department Selector Chips */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {DEPARTMENTS.map((dept) => {
          const isSelected = dept.id === selectedDeptId;

          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => setSelectedDeptId(dept.id)}
              className={`flex flex-col rounded-xl border p-2.5 text-left transition cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                  : 'border-line bg-panel-2 hover:border-line-strong hover:bg-ground-2'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[10px] font-bold ${
                  isSelected ? 'text-primary' : 'text-ink-3'
                }`}>
                  {dept.shortCode}
                </span>
                <span className="font-mono text-[9px] text-ink-3">{dept.latencyMs}ms</span>
              </div>
              <span className="mt-1 font-display text-xs font-bold text-ink truncate">
                {dept.name.split('(')[0]?.trim()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Department Data Card */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* Left: Native State Dialect Fields (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-line bg-panel-2 p-4">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-ink-3">
                  Upstream State System
                </span>
                <h4 className="font-display text-sm font-bold text-ink mt-0.5">
                  {activeDialect.name}
                </h4>
              </div>
              <Badge mono tone="primary">
                {selectedState.toUpperCase()} GATEWAY
              </Badge>
            </div>

            <p className="mt-2 text-[11px] text-ink-3 leading-snug">
              {activeDept.statutoryAuthority}
            </p>

            {/* Local Fields Mapping */}
            <div className="mt-3 space-y-2">
              {Object.entries(activeDialect.localFields).map(([label, val]) => (
                <div
                  key={label}
                  className="rounded-lg border border-line bg-panel p-2.5 flex items-center justify-between text-xs"
                >
                  <span className="text-ink-3 font-medium">{label}</span>
                  <span className="font-mono font-bold text-ink">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-2.5 text-[11px] font-mono text-ink-3">
            <span>SLA: {activeDept.sla}</span>
            <span className="text-primary font-bold">Latency: {activeDept.latencyMs}ms</span>
          </div>
        </div>

        {/* Right: Normalized Common Land Model (CLM 1.0) JSON-LD (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-line bg-panel-2 p-4">
          <div>
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Code size={15} className="text-primary" />
                <span className="font-mono text-xs font-bold text-ink">
                  Normalized JSON-LD (ISO 19152 CLM 1.0)
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1 rounded-md border border-line bg-panel px-2 py-1 font-mono text-[11px] text-ink-2 hover:bg-ground-2 hover:text-ink transition cursor-pointer"
              >
                {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>

            {/* JSON Viewer */}
            <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-panel p-3 font-mono text-[11px] leading-relaxed text-ink shadow-inner max-h-[260px] scroll-thin">
              <pre>{JSON.stringify(activeDept.sampleJsonLd, null, 2)}</pre>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-[10px] text-ink-3 font-mono">
            <span>Schema: https://landstack.gov.in/contexts/clm-v1.jsonld</span>
            <span className="text-primary font-bold">SHA-256 Validated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
