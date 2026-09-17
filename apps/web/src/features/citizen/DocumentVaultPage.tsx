import { useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Archive,
  Download,
  Eye,
  FileCheck,
  FileText,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { api, qk } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ParcelPicker } from '@/components/ParcelPicker';
import { Field } from '@/components/Field';
import { FolderCard } from '@/components/ui/folder-card';
import { DocumentVault } from '@/features/parcel/sections/DocumentVault';
import { toast } from '@/components/Toast';

interface DossierCategory {
  id: string;
  title: string;
  subtitle: string;
  count: string;
  countLabel: string;
  meta: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
  documents: {
    id: string;
    name: string;
    docNumber?: string;
    date?: string;
    size?: string;
    verified?: boolean;
    type?: string;
  }[];
}

export function DocumentVaultPage() {
  const search = useSearch({ from: '/citizen/vault' });
  const [ulpin, setUlpin] = useState(search.ulpin ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string>('title');
  const { user } = useAuth();
  const identity = user?.uid ?? 'anon';

  const q = useQuery({
    queryKey: qk.parcel(ulpin, identity),
    queryFn: () => api.parcel(ulpin),
    enabled: !!ulpin.trim(),
  });

  const p = q.data;

  // Master Dossier Categories
  const masterDossierCategories: DossierCategory[] = [
    {
      id: 'title-deeds',
      title: 'Title Deeds',
      subtitle: 'Registered Conveyances',
      count: '18',
      countLabel: 'Files',
      meta: '240 Cadastral Assets',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-[#176B52]" />,
      badge: 'Certified',
      description: 'Registered conveyances, stamp-duty certified deeds, and Sub-Registrar Office encumbrance certificates.',
      documents: [
        { id: 'sc-1', name: 'Authoritative Sale Deed (Reg. No. 4892/2021)', docNumber: 'DOC-4892-SRO', date: '14 Aug 2021', size: '4.2 MB · PDF', verified: true, type: 'pdf' },
        { id: 'sc-2', name: 'Prior Title Deed Chain & Partition Conveyance', docNumber: 'DEED-1998-A4', date: '22 Mar 1998', size: '9.1 MB · PDF', verified: true, type: 'pdf' },
        { id: 'sc-3', name: 'Encumbrance Certificate (Nil Encumbrance 1994-2024)', docNumber: 'EC-FORM15-883', date: '04 Jan 2025', size: '1.8 MB · PDF', verified: true, type: 'pdf' },
      ],
    },
    {
      id: 'survey-sketches',
      title: 'Survey Sketches',
      subtitle: 'FMB Tippan & DGPS Vectors',
      count: '240',
      countLabel: 'Assets',
      meta: '±0.02m Precision',
      icon: <Layers className="w-3.5 h-3.5 text-[#176B52]" />,
      badge: 'DGPS Vectors',
      description: 'Cadastral maps, field measurement book (FMB) sketches, and centimeter-grade DGPS boundary vectors.',
      documents: [
        { id: 'sc-4', name: 'Field Measurement Book (FMB) Digital Tippan Sketch', docNumber: 'FMB-VIL-45-2', date: '12 Nov 2023', size: '5.8 MB · DWG', verified: true, type: 'cad' },
        { id: 'sc-5', name: 'Centimeter-Grade DGPS Boundary Survey Traverse', docNumber: 'DGPS-TRV-894', date: '10 May 2024', size: '640 KB · GeoJSON', verified: true, type: 'data' },
        { id: 'sc-6', name: 'Drone Orthomosaic & Resurvey Tile Package', docNumber: 'ORTHO-TILE-2024', date: '19 Oct 2024', size: '24.2 MB · GeoTIFF', verified: true, type: 'image' },
      ],
    },
    {
      id: 'revenue-ror',
      title: 'Revenue & RoR',
      subtitle: 'Pahani & Verified Mutations',
      count: '12',
      countLabel: 'Records',
      meta: 'Khata #784',
      icon: <FileCheck className="w-3.5 h-3.5 text-[#176B52]" />,
      badge: 'Khata Live',
      description: 'Official Record of Rights, patta passbook entries, and verified mutation orders from the Revenue Department.',
      documents: [
        { id: 'sc-7', name: 'Record of Rights Extract (Adangal / Pahani 2024-25)', docNumber: 'ROR-2024-784', date: '01 Jan 2025', size: '1.9 MB · PDF', verified: true, type: 'pdf' },
        { id: 'sc-8', name: 'Certified Mutation Order & Proceeding Notice', docNumber: 'MUT-ORD-5542', date: '08 Sep 2021', size: '1.2 MB · PDF', verified: true, type: 'pdf' },
      ],
    },
    {
      id: 'cadastral-assets',
      title: 'Cadastral Assets',
      subtitle: '3D Parcels & Elevation Bands',
      count: '3D',
      countLabel: 'Units',
      meta: '14 Levels',
      icon: <MapPin className="w-3.5 h-3.5 text-[#176B52]" />,
      badge: '3D Spatial',
      description: '3D unit parcels, elevation bands, village boundary links, and spatial geo-indexes.',
      documents: [
        { id: 'sc-9', name: '3D Cadastral Unit Footprint & Extrusion Mesh', docNumber: '3D-MESH-772', date: '15 Feb 2025', size: '14.5 MB · GLB', verified: true, type: 'cad' },
        { id: 'sc-10', name: 'Spatial Geo-Index & Cadastral Overlay Map', docNumber: 'GEO-IDX-2025', date: '20 Jan 2025', size: '3.4 MB · GeoJSON', verified: true, type: 'data' },
      ],
    },
  ];

  const activeCategory: DossierCategory =
    masterDossierCategories.find((c) => c.id === selectedCategory || c.id.startsWith(selectedCategory)) ?? masterDossierCategories[0]!;

  const handleViewDoc = (docName: string) => {
    toast.info('Opening preview', `${docName} · Verified Digital Record`);
  };

  const handleDownloadDoc = (docName: string) => {
    toast.success('Document downloaded', docName);
  };

  return (
    <div className="w-full max-w-6xl flex flex-col gap-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-[#18231F] font-black text-3xl tracking-tight">Document Vault</h1>
        <p className="text-[#4B5345] text-sm font-medium mt-1">
          Physical folder-card archive for cadastral dossiers, title deeds, and geodetic survey records.
        </p>
      </div>

      {/* Parcel Selection Bar */}
      <div className="p-5 rounded-2xl bg-[#F4F1E7]/45 backdrop-blur-xl border border-[#176B52]/15 shadow-[0_8px_32px_rgba(24,35,31,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-200">
        <div className="w-full md:w-80">
          <Field
            label={<span className="text-[#18231F] font-bold">Select Parcel for Dossier</span>}
            htmlFor="vault-picker"
            hint={<span className="text-[#4B5345] font-medium">Choose any parcel to inspect its verified vault</span>}
          >
            <ParcelPicker id="vault-picker" value={ulpin} onChange={setUlpin} />
          </Field>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            type="button"
            onClick={() => toast.success('Dossier package generated', 'Exporting all folder records (.ZIP)')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#23483A] text-[#F4F1E7] hover:bg-[#176B52] transition-colors text-xs font-semibold shadow-sm"
          >
            <Download size={14} /> Download Entire Vault (.ZIP)
          </button>
        </div>
      </div>

      {/* When a parcel is loaded */}
      {p ? (
        <DocumentVault p={p} />
      ) : (
        /* Master Dossier Showcase with Folder Silhouette Cards */
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-[#176B52]" />
              <h3 className="text-base font-bold text-[#18231F] tracking-tight">Master Dossier Archives</h3>
            </div>
            <span className="text-[#176B52] font-semibold text-xs px-3 py-1 rounded-full bg-[#E1E6DE] border border-[#D5D2C7]">
              Standard Land Registry Tier
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <FolderCard
              title="Title Deeds"
              subtitle="Registered Conveyances"
              count="18"
              countLabel="Files"
              meta="240 Assets"
              className="cursor-pointer"
              isActive={selectedCategory === "title"}
              onClick={() => setSelectedCategory("title")}
            />
            <FolderCard
              title="Survey Sketches"
              subtitle="FMB Tippan & DGPS Vectors"
              count="240"
              countLabel="Assets"
              meta="±0.02m Precision"
              className="cursor-pointer"
              isActive={selectedCategory === "survey"}
              onClick={() => setSelectedCategory("survey")}
            />
            <FolderCard
              title="Revenue & RoR"
              subtitle="Pahani & Verified Mutations"
              count="12"
              countLabel="Records"
              meta="Khata #784"
              className="cursor-pointer"
              isActive={selectedCategory === "revenue"}
              onClick={() => setSelectedCategory("revenue")}
            />
            <FolderCard
              title="Cadastral Assets"
              subtitle="3D Parcels & Elevation Bands"
              count="3D"
              countLabel="Units"
              meta="14 Levels"
              className="cursor-pointer"
              isActive={selectedCategory === "cadastral"}
              onClick={() => setSelectedCategory("cadastral")}
            />
          </div>

          {/* 4. Selected Folder Panel Below Grid */}
          <div className="bg-[#F4F1E7]/45 backdrop-blur-xl border border-[#176B52]/15 rounded-2xl p-6 shadow-[0_8px_32px_rgba(24,35,31,0.04)] flex flex-col gap-4 transition-all duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D5D2C7]/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#23483A] text-[#F4F1E7]">
                  {activeCategory.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-[#18231F] tracking-tight">{activeCategory.title}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#E1E6DE] text-[#23483A] border border-[#D5D2C7]">
                      {activeCategory.badge}
                    </span>
                  </div>
                  <p className="text-[#4B5345] text-xs font-medium mt-0.5">{activeCategory.description}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast.success(`Exporting ${activeCategory.title}`, 'Zip package generated')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#23483A] text-[#F4F1E7] hover:bg-[#176B52] transition-colors text-xs font-semibold shadow-sm self-start sm:self-center shrink-0"
              >
                <Download size={13} /> Download Folder ({activeCategory.count} {activeCategory.countLabel})
              </button>
            </div>

            {/* File List Item Rows */}
            <ul className="flex flex-col gap-2.5">
              {activeCategory.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="bg-[#E9E5D8]/40 border border-[#D5D2C7]/40 rounded-xl p-3 hover:bg-[#E9E5D8]/60 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-[#23483A] text-[#F4F1E7] shrink-0">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[#18231F] font-semibold text-sm truncate">{doc.name}</p>
                        {doc.verified && (
                          <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-[#176B52] shrink-0">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-[#4B5345] text-xs truncate mt-0.5">
                        {doc.docNumber && <span className="font-mono">{doc.docNumber} · </span>}
                        {doc.date && <span>{doc.date} · </span>}
                        {doc.size && <span>{doc.size}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleViewDoc(doc.name)}
                      aria-label={`View ${doc.name}`}
                      title="Preview Document"
                      className="p-1.5 rounded-lg text-[#176B52] hover:text-[#23483A] hover:bg-[#D5D2C7]/60 transition-colors font-semibold"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(doc.name)}
                      aria-label={`Download ${doc.name}`}
                      title="Download Certified Copy"
                      className="p-1.5 rounded-lg text-[#176B52] hover:text-[#23483A] hover:bg-[#D5D2C7]/60 transition-colors"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* DILRMP Trust Footer */}
          <div className="p-4 rounded-xl bg-[#E9E5D8]/40 border border-[#D5D2C7]/40 flex items-start gap-3 text-xs text-[#4B5345]">
            <Sparkles className="w-4 h-4 text-[#176B52] mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <span className="font-bold text-[#18231F]">DILRMP Certified Cadastral Vault:</span> All folders
              integrate directly with the Survey Settlement and Land Records (SSLR) and Inspector General of Registration (IGR)
              department nodes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
