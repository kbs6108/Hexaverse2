import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { 
  Box, 
  ShieldCheck, 
  Zap, 
  ArrowRight 
} from 'lucide-react';
import { Badge } from '@/components/Badge';

interface StratumUnit {
  id: string;
  levelCode: string;
  unitName: string;
  usageType: string;
  ulpin3D: string;
  elevationRange: string;
  volumeM3: number;
  carpetAreaSqFt: number;
  udsShareSqFt: number;
  ownerName: string;
  registeredDoc: string;
  taxAssessmentNo: string;
  powerMeterNo: string;
  encumbranceStatus: 'Clean' | 'Mortgaged' | 'Govt Lease';
  colorTone: string;
}

const STRATA_UNITS: StratumUnit[] = [
  {
    id: 'l3',
    levelCode: 'L03',
    unitName: 'Unit 301 · Penthouse & Terrace Garden',
    usageType: 'Residential (Luxury)',
    ulpin3D: 'TFCM91641E6C82-03-301',
    elevationRange: '+7.40m to +11.20m AOD',
    volumeM3: 980,
    carpetAreaSqFt: 2150,
    udsShareSqFt: 510,
    ownerName: 'Sri. Ravi Kumar & Smt. Deepa K.',
    registeredDoc: 'Doc No. 4182/2026 (SRO Mangalagiri)',
    taxAssessmentNo: 'CRDA-PT-2026-0041',
    powerMeterNo: 'APCPDCL-MTR-98412',
    encumbranceStatus: 'Clean',
    colorTone: 'primary',
  },
  {
    id: 'l2',
    levelCode: 'L02',
    unitName: 'Unit 201 · 3BHK Executive Suite',
    usageType: 'Residential',
    ulpin3D: 'TFCM91641E6C82-02-201',
    elevationRange: '+4.20m to +7.40m AOD',
    volumeM3: 840,
    carpetAreaSqFt: 1820,
    udsShareSqFt: 430,
    ownerName: 'Dr. M. Srinivasa Rao',
    registeredDoc: 'Doc No. 1290/2025 (SRO Mangalagiri)',
    taxAssessmentNo: 'CRDA-PT-2025-8812',
    powerMeterNo: 'APCPDCL-MTR-66129',
    encumbranceStatus: 'Mortgaged',
    colorTone: 'violet',
  },
  {
    id: 'g0',
    levelCode: 'G00',
    unitName: 'Unit 101 · Commercial Banking / Retail Plinth',
    usageType: 'Commercial (Retail)',
    ulpin3D: 'TFCM91641E6C82-00-101',
    elevationRange: '0.00m to +4.20m AOD',
    volumeM3: 1940,
    carpetAreaSqFt: 3400,
    udsShareSqFt: 820,
    ownerName: 'Andhra State Co-op Apex Bank Ltd.',
    registeredDoc: 'Doc No. 9104/2023 (SRO Mangalagiri)',
    taxAssessmentNo: 'CRDA-PT-2023-1104',
    powerMeterNo: 'APCPDCL-HT-00481',
    encumbranceStatus: 'Clean',
    colorTone: 'amber',
  },
  {
    id: 'b1',
    levelCode: 'B01',
    unitName: 'Unit B-01 · Basement EV Stacks & Sub-grade Utility Vault',
    usageType: 'Common Infrastructure & Services',
    ulpin3D: 'TFCM91641E6C82-B1-01',
    elevationRange: '-4.50m to 0.00m AOD',
    volumeM3: 1820,
    carpetAreaSqFt: 3600,
    udsShareSqFt: 0,
    ownerName: 'Mangalagiri Heights Owners Welfare Association',
    registeredDoc: 'Common Property Deed 001/2023',
    taxAssessmentNo: 'CRDA-PT-COMM-001',
    powerMeterNo: 'APCPDCL-COM-11002',
    encumbranceStatus: 'Clean',
    colorTone: 'slate',
  },
];

const DEFAULT_UNIT: StratumUnit = STRATA_UNITS[0] as StratumUnit;

export function Cadastral3DStrataExplorer() {
  const [selectedId, setSelectedId] = useState<string>('l3');
  const [activeMode, setActiveMode] = useState<'volumetric' | 'statutory' | 'utilities'>('volumetric');

  const selectedUnit: StratumUnit = STRATA_UNITS.find((u) => u.id === selectedId) ?? DEFAULT_UNIT;

  const ulpinParts = selectedUnit.ulpin3D.split('-');
  const floorPart = ulpinParts[1] ?? '00';
  const unitPart = ulpinParts[2] ?? '101';

  return (
    <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5 shadow-panel">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary font-mono text-xs font-bold">
              <Box size={15} />
            </span>
            <h3 className="font-display text-base font-bold text-ink">
              3D Cadastre & Volumetric Strata Explorer
            </h3>
            <Badge tone="primary" mono>
              ISO 19152 LADM
            </Badge>
          </div>
          <p className="mt-1 text-xs text-ink-2 max-w-2xl">
            Vertical land governance. See how a single ground survey parcel (Sy. 123/4) is 
            stratified into legally sovereign 3D-ULPIN units with volumetric boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex rounded-lg border border-line bg-panel-2 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('volumetric')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeMode === 'volumetric'
                  ? 'bg-panel text-ink shadow-xs'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              Volumetric
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('statutory')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeMode === 'statutory'
                  ? 'bg-panel text-ink shadow-xs'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              Rights & UDS
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('utilities')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeMode === 'utilities'
                  ? 'bg-panel text-ink shadow-xs'
                  : 'text-ink-3 hover:text-ink'
              }`}
            >
              Utilities
            </button>
          </div>

          <Link
            to="/map"
            search={{ ulpin: 'TFCM91641E6C82' }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:brightness-105 transition cursor-pointer"
          >
            <span>Open in 3D Map</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* Left: Interactive Isometric Strata Stack (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-line bg-panel-2 p-4">
          <div className="flex items-center justify-between border-b border-line pb-2 text-xs">
            <span className="font-mono text-ink-3 uppercase text-[10px] font-bold">
              Parcel: Sy. 123/4 · Mangalagiri
            </span>
            <span className="font-mono text-[10px] text-primary font-bold">
              Parent ULPIN: TFCM91641E6C82
            </span>
          </div>

          {/* Interactive Strata Building Stack */}
          <div className="my-4 flex flex-col gap-2">
            {STRATA_UNITS.map((unit) => {
              const isSelected = unit.id === selectedId;
              const titlePart = unit.unitName.split('·')[0] ?? unit.unitName;
              const elevPart = unit.elevationRange.split(' ')[0] ?? unit.elevationRange;

              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setSelectedId(unit.id)}
                  className={`group relative flex items-center justify-between rounded-xl border p-3 text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-panel shadow-sm ring-2 ring-primary/20'
                      : 'border-line/70 bg-panel hover:border-line-strong hover:bg-ground-2'
                  }`}
                >
                  {/* Left accent bar */}
                  <div
                    className={`absolute left-0 top-2 bottom-2 w-1 rounded-r ${
                      isSelected ? 'bg-primary' : 'bg-line group-hover:bg-ink-3'
                    }`}
                  />

                  <div className="pl-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-ground-2 text-ink">
                        {unit.levelCode}
                      </span>
                      <span className="font-display text-xs font-bold text-ink">
                        {titlePart}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-3 mt-0.5 truncate max-w-[200px]">
                      {unit.usageType}
                    </p>
                  </div>

                  <div className="text-right font-mono text-[10px]">
                    <span className="text-primary font-bold">{elevPart}</span>
                    <p className="text-ink-3">{unit.volumeM3} m³</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Base Ground Parcel Foundation */}
          <div className="rounded-lg border border-dashed border-line bg-panel p-2.5 text-center">
            <div className="flex items-center justify-between text-[11px] font-mono text-ink-3">
              <span>Ground Footprint Cadastre</span>
              <span>Extent: 4,200 m²</span>
            </div>
            <p className="text-[10px] text-ink-3 mt-1">
              Registered RoR 1-B Parent holding legally partitioned into 4 vertical sub-tenures.
            </p>
          </div>
        </div>

        {/* Right: Selected Stratum Deep-Inspection Dossier (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-line bg-panel-2 p-4">
          <div>
            {/* Unit Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                  Selected Stratum Property Card
                </span>
                <h4 className="font-display text-base font-bold text-ink mt-0.5">
                  {selectedUnit.unitName}
                </h4>
              </div>
              <Badge tone={selectedUnit.encumbranceStatus === 'Clean' ? 'primary' : 'violet'}>
                {selectedUnit.encumbranceStatus}
              </Badge>
            </div>

            {/* 3D-ULPIN Syntax Highlight Box */}
            <div className="mt-3 rounded-lg border border-line bg-panel p-3">
              <span className="font-mono text-[10px] font-bold uppercase text-ink-3 tracking-wide">
                Full 3D-ULPIN Geocode (ISO 19152 LADM)
              </span>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 font-mono text-xs">
                <span className="rounded bg-primary-soft px-2 py-0.5 font-bold text-primary">
                  TFCM91641E6C82
                </span>
                <span className="text-ink-3">-</span>
                <span className="rounded bg-ground-2 px-2 py-0.5 font-bold text-ink">
                  {floorPart}
                </span>
                <span className="text-ink-3">-</span>
                <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
                  {unitPart}
                </span>
              </div>
              <p className="text-[10px] text-ink-3 mt-1">
                Parent Geohash (14-char) + Vertical Level Code + Unique Volumetric Unit Identifier.
              </p>
            </div>

            {/* Dynamic View Panels */}
            {activeMode === 'volumetric' && (
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <div className="rounded-lg border border-line bg-panel p-2.5">
                  <span className="font-mono text-[10px] text-ink-3 uppercase">Vertical Extent</span>
                  <p className="mt-1 font-mono text-xs font-bold text-ink">
                    {selectedUnit.elevationRange}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-panel p-2.5">
                  <span className="font-mono text-[10px] text-ink-3 uppercase">Enclosed Volume</span>
                  <p className="mt-1 font-mono text-xs font-bold text-ink">
                    {selectedUnit.volumeM3} m³
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-panel p-2.5">
                  <span className="font-mono text-[10px] text-ink-3 uppercase">Carpet Area</span>
                  <p className="mt-1 font-mono text-xs font-bold text-ink">
                    {selectedUnit.carpetAreaSqFt} sq.ft
                  </p>
                </div>
              </div>
            )}

            {activeMode === 'statutory' && (
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-line bg-panel p-2.5 flex items-center justify-between text-xs">
                  <span className="text-ink-3">Title Owner</span>
                  <span className="font-bold text-ink">{selectedUnit.ownerName}</span>
                </div>
                <div className="rounded-lg border border-line bg-panel p-2.5 flex items-center justify-between text-xs">
                  <span className="text-ink-3">Undivided Share of Land (UDS)</span>
                  <span className="font-mono font-bold text-primary">{selectedUnit.udsShareSqFt} sq.ft</span>
                </div>
                <div className="rounded-lg border border-line bg-panel p-2.5 flex items-center justify-between text-xs">
                  <span className="text-ink-3">Registered Deed (SRO)</span>
                  <span className="font-mono font-semibold text-ink">{selectedUnit.registeredDoc}</span>
                </div>
              </div>
            )}

            {activeMode === 'utilities' && (
              <div className="mt-3 space-y-2">
                <div className="rounded-lg border border-line bg-panel p-2.5 flex items-center justify-between text-xs">
                  <span className="text-ink-3 flex items-center gap-1.5">
                    <Zap size={13} className="text-amber-500" /> Power Meter RR No.
                  </span>
                  <span className="font-mono font-bold text-ink">{selectedUnit.powerMeterNo}</span>
                </div>
                <div className="rounded-lg border border-line bg-panel p-2.5 flex items-center justify-between text-xs">
                  <span className="text-ink-3">Municipal Property Tax ID</span>
                  <span className="font-mono font-bold text-ink">{selectedUnit.taxAssessmentNo}</span>
                </div>
                <div className="rounded-lg border border-line bg-panel p-2.5 flex items-center justify-between text-xs">
                  <span className="text-ink-3">Water Board Consumer No.</span>
                  <span className="font-mono font-semibold text-ink">WTR-VMC-88102</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Card */}
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-3">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-primary" />
              Cryptographically bound to Parent RoR 1-B
            </span>
            <span className="font-mono text-[10px]">LADM ISO 19152 Edition 2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
