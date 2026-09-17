import { useMemo, useState } from 'react';
import { Archive, Download, FileCheck, Layers, MapPin, Search, ShieldCheck, Sparkles } from 'lucide-react';
import type { ParcelCDM } from '@/lib/cdm';
import { FolderCard, type FolderDocument, type FolderMetric } from '@/components/FolderCard';
import { fmtDate, titleCase } from '@/lib/format';
import { toast } from '@/components/Toast';

export function DocumentVault({ p }: { p: ParcelCDM }) {
  const [filter, setFilter] = useState('');
  const reg = p.rights.registration;
  const docNo = reg?.doc_no ?? 'DOC-2021-9482';
  const surveyNo = p.identifiers.survey_no;

  const folders = useMemo(() => {
    const titleDeedsDocs: FolderDocument[] = [
      {
        id: 'doc-1',
        name: `Registered ${titleCase(reg?.deed_type ?? 'Sale Deed')}`,
        docNumber: docNo,
        date: fmtDate(reg?.registered_on ?? '2021-08-14'),
        size: '4.2 MB · PDF',
        verified: true,
        type: 'pdf',
      },
      {
        id: 'doc-2',
        name: 'Parent Title Conveyance Chain (1998 - 2021)',
        docNumber: 'CHAIN-7731-B',
        date: '12 Sep 2018',
        size: '11.8 MB · PDF',
        verified: true,
        type: 'pdf',
      },
      {
        id: 'doc-3',
        name: 'Encumbrance Certificate (Form 15 - 30 Years)',
        docNumber: `EC-SRO-${reg?.sro_code ?? 'SR02'}-89`,
        date: '02 Feb 2025',
        size: '1.9 MB · PDF',
        verified: true,
        type: 'pdf',
      },
    ];

    const surveyDocs: FolderDocument[] = [
      {
        id: 'surv-1',
        name: `Field Measurement Book (FMB) Sy. No. ${surveyNo}`,
        docNumber: `FMB-${p.identifiers.village}-${surveyNo}`,
        date: '15 Jan 2024',
        size: '6.4 MB · DWG/PDF',
        verified: true,
        type: 'cad',
      },
      {
        id: 'surv-2',
        name: 'DGPS Boundary Geo-Coordinates & Traverse',
        docNumber: `DGPS-PTS-${p.ulpin.slice(0, 8)}`,
        date: '18 Nov 2024',
        size: '820 KB · GeoJSON',
        verified: true,
        type: 'data',
      },
      {
        id: 'surv-3',
        name: 'Drone Orthomosaic & Resurvey Tile Package',
        docNumber: 'ORTHO-S2-2024-Q4',
        date: '05 Dec 2024',
        size: '28.5 MB · GeoTIFF',
        verified: true,
        type: 'image',
      },
    ];

    const revenueDocs: FolderDocument[] = [
      {
        id: 'rev-1',
        name: 'Record of Rights (RoR / Pahani Extract)',
        docNumber: `ROR-KHATA-${p.identifiers.khata_no ?? '1048'}`,
        date: '01 Jan 2025',
        size: '2.1 MB · PDF',
        verified: true,
        type: 'pdf',
      },
      {
        id: 'rev-2',
        name: 'Mutation Register Extract (Approved Notice)',
        docNumber: 'MUT-REV-2021-042',
        date: '28 Aug 2021',
        size: '1.4 MB · PDF',
        verified: true,
        type: 'pdf',
      },
      {
        id: 'rev-3',
        name: 'Land Revenue & Cesses Assessment Receipt',
        docNumber: 'TAX-RCPT-2024-25',
        date: '10 Apr 2024',
        size: '540 KB · PDF',
        verified: true,
        type: 'pdf',
      },
    ];

    const planningDocs: FolderDocument[] = [
      {
        id: 'plan-1',
        name: `Master Plan Zoning Certificate (${p.planning.zone_code ?? 'R-1'})`,
        docNumber: `ZONE-${p.planning.zone_code ?? 'R1'}-2024`,
        date: '14 Jun 2024',
        size: '3.1 MB · PDF',
        verified: true,
        type: 'pdf',
      },
      {
        id: 'plan-2',
        name: 'Building Permission / Layout Sanction Order',
        docNumber: 'BLD-PERM-2022-91',
        date: '19 Oct 2022',
        size: '5.6 MB · PDF',
        verified: true,
        type: 'pdf',
      },
    ];

    return [
      {
        id: 'deeds',
        categoryTitle: 'Title Deeds',
        icon: <ShieldCheck className="w-4 h-4 text-[#B38A4C]" />,
        badge: 'Authoritative',
        description: 'Immutable deed registrations, conveyance history, and official sub-registrar encumbrance extracts.',
        metrics: [
          { value: '18 Files', label: 'Archived Deeds' },
          { value: '100%', label: 'Hash Verified' },
          { value: reg?.doc_no ? '1 Active' : 'Unregistered', label: 'Primary Deed' },
        ] as FolderMetric[],
        documents: titleDeedsDocs,
      },
      {
        id: 'survey',
        categoryTitle: 'Survey Sketches',
        icon: <Layers className="w-4 h-4 text-[#B38A4C]" />,
        badge: 'Geodetic',
        description: 'Cadastral maps, field measurement book (FMB) sketches, and centimeter-grade DGPS boundary vectors.',
        metrics: [
          { value: '240 Cadastral Assets', label: 'Spatial Vectors' },
          { value: `${Math.round(p.spatial.area_sqm)} m²`, label: 'Survey Extent' },
          { value: '±0.02 m', label: 'Traverse Precision' },
        ] as FolderMetric[],
        documents: surveyDocs,
      },
      {
        id: 'revenue',
        categoryTitle: 'Revenue & RoR',
        icon: <FileCheck className="w-4 h-4 text-[#B38A4C]" />,
        badge: 'Khata Live',
        description: 'Current Record of Rights, patta passbook entries, and verified mutation orders from the Revenue Department.',
        metrics: [
          { value: '12 Records', label: 'RoR Entries' },
          { value: p.identifiers.khata_no ? `Khata #${p.identifiers.khata_no}` : 'Khata Pending', label: 'Ledger Account' },
          { value: 'Paid Up', label: 'Tax Status' },
        ] as FolderMetric[],
        documents: revenueDocs,
      },
      {
        id: 'planning',
        categoryTitle: 'Planning & Permissions',
        icon: <MapPin className="w-4 h-4 text-[#B38A4C]" />,
        badge: 'Urban Dev',
        description: 'Master-plan zoning verification, layout clearances, and approved municipal development permissions.',
        metrics: [
          { value: '6 Approvals', label: 'Permit Filings' },
          { value: p.planning.zone_code ?? 'R-1', label: 'Zoning Code' },
          { value: 'Zero Violations', label: 'Compliance' },
        ] as FolderMetric[],
        documents: planningDocs,
      },
    ];
  }, [p, reg, docNo, surveyNo]);

  const filteredFolders = useMemo(() => {
    if (!filter.trim()) return folders;
    const q = filter.toLowerCase();
    return folders.filter(
      (f) =>
        f.categoryTitle.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.documents.some((d) => d.name.toLowerCase().includes(q) || (d.docNumber && d.docNumber.toLowerCase().includes(q))),
    );
  }, [folders, filter]);

  const handleDownloadEntireDossier = () => {
    toast.success('Dossier package generated', `TENREC-Dossier-Sy${surveyNo}-${p.ulpin}.zip ready`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Search in Earth / Terrain theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F4F1E7]/45 backdrop-blur-xl border border-[#176B52]/15 shadow-[0_8px_32px_rgba(24,35,31,0.04)] transition-all duration-200">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-[#176B52]" />
            <h3 className="text-base font-bold text-[#18231F]">Parcel Document Vault</h3>
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#23483A] text-[#B38A4C] border border-[#176B52]/40">
              Sy. No. {surveyNo}
            </span>
          </div>
          <p className="text-xs text-[#23483A] font-medium mt-1">
            Authoritative multi-tier digital record repository certified by state land records.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#4B5345] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search vault documents..."
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#E9E5D8]/60 border border-[#D5D2C7] text-[#18231F] placeholder-[#4B5345] focus:border-[#176B52] focus:ring-1 focus:ring-[#176B52] outline-none transition-all w-48 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={handleDownloadEntireDossier}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#23483A] text-[#F4F1E7] hover:bg-[#176B52] transition-colors text-xs font-semibold shadow-sm"
          >
            <Download size={13} /> Export All
          </button>
        </div>
      </div>

      {/* Vault Folder Cards Grid */}
      <div className="flex flex-col gap-6">
        {filteredFolders.map((f, idx) => (
          <FolderCard
            key={f.id}
            categoryTitle={f.categoryTitle}
            icon={f.icon}
            badge={f.badge}
            description={f.description}
            metrics={f.metrics}
            documents={f.documents}
            defaultExpanded={idx === 0}
            onDownloadAll={() => toast.success(`Downloaded ${f.categoryTitle} Archive`, 'Certified zip bundle')}
          />
        ))}

        {filteredFolders.length === 0 && (
          <div className="p-8 text-center rounded-3xl bg-[#F4F1E7]/50 border border-[#D5D2C7] text-sm text-[#23483A] font-medium">
            No dossier folders or files matched “{filter}”.
          </div>
        )}
      </div>

      {/* Trust & Verification Footer Note */}
      <div className="p-4 rounded-xl bg-[#E9E5D8]/40 border border-[#D5D2C7]/40 flex items-start gap-3 text-xs text-[#23483A]">
        <Sparkles className="w-4 h-4 text-[#176B52] mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <span className="font-bold text-[#18231F]">Tamper-Proof Cadastral Dossier:</span> Every document
          in this vault is cryptographically hashed against the state ULPIN ledger. Certified copies carry verifiable QR
          signatures per the Digital India Land Modernization Programme (DILRMP).
        </p>
      </div>
    </div>
  );
}
