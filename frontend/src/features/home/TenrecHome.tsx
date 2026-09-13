import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  Building2,
  CheckCircle2,
  FileCheck2,
  Gavel,
  Landmark,
  Layers,
  MapPin,
  Map as MapIcon,
  Satellite,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
  ArrowRight,
  Database,
  Globe2,
} from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useOpenParcel } from '@/features/map/SearchBox';

export function TenrecHome() {
  const [query, setQuery] = useState('');
  const openParcel = useOpenParcel();
  const navigate = useNavigate();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      void openParcel(query.trim());
    } else {
      void navigate({ to: '/map' });
    }
  };

  const storyParcels = [
    { ulpin: 'TFCM2ZE184B55E', label: '123/4', status: 'Disputed & Pending Mutation', tone: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' },
    { ulpin: 'TFCM91641E6C82', label: '124', status: 'Clean Patta (Ravi Kumar)', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
    { ulpin: 'TFCM8H172A4F90', label: '125/2', status: 'Satellite Change Alert', tone: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30' },
    { ulpin: 'TFCM3K901B3E12', label: '126', status: 'Residential R1 Zone', tone: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  ];

  const departments = [
    {
      name: 'Revenue Department',
      hindi: 'राजस्व विभाग',
      icon: Landmark,
      records: 'Record of Rights (RoR), Pattas, Jamabandi, Mutations',
      solution: 'Live digital ownership ledger tied to 14-digit ULPIN.',
      color: 'border-blue-500/30 text-blue-600 dark:text-blue-400',
    },
    {
      name: 'Registration (Sub-Registrar)',
      hindi: 'पंजीकरण विभाग',
      icon: FileCheck2,
      records: 'Registered deeds, non-encumbrance certificates (EC), sale history',
      solution: 'Instant deed validity checks preventing duplicate registrations.',
      color: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
    },
    {
      name: 'Survey & Town Planning',
      hindi: 'नगर नियोजन एवं सर्वेक्षण',
      icon: Layers,
      records: 'Master plan zoning, building permissions, layout sanctions',
      solution: 'Cadastral GIS overlays preventing illegal construction permits.',
      color: 'border-amber-500/30 text-amber-600 dark:text-amber-400',
    },
    {
      name: 'Fiscal & Municipal Revenue',
      hindi: 'नगर निगम एवं कर विभाग',
      icon: Database,
      records: 'Property tax assessments, guideline market values, dues',
      solution: 'Automated valuation and clearance check before property transfer.',
      color: 'border-purple-500/30 text-purple-600 dark:text-purple-400',
    },
    {
      name: 'Judiciary (e-Courts)',
      hindi: 'न्यायिक एवं ई-कोर्ट्स',
      icon: Gavel,
      records: 'Civil court disputes, lis pendens litigation, stay orders',
      solution: 'Active case hatching and caveat alerts visible directly on map.',
      color: 'border-rose-500/30 text-rose-600 dark:text-rose-400',
    },
    {
      name: 'Utilities & Infrastructure',
      hindi: 'जनोपयोगी सेवाएं (विद्युत/जल)',
      icon: Zap,
      records: 'DISCOM electricity connections, municipal water lines',
      solution: 'Infrastructure availability verified before building approvals.',
      color: 'border-teal-500/30 text-teal-600 dark:text-teal-400',
    },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-ground">
      {/* Official Government of India Top Banner */}
      <div className="border-b border-line bg-panel-2 px-4 py-2 text-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-3.5 w-5 overflow-hidden rounded-[1px] shadow-xs">
              <span className="h-full w-1/3 bg-[#FF9933]" />
              <span className="h-full w-1/3 bg-white" />
              <span className="h-full w-1/3 bg-[#138808]" />
            </span>
            <span className="font-medium text-ink">भारत सरकार | Government of India</span>
            <span className="hidden text-ink-3 md:inline">•</span>
            <span className="hidden text-ink-2 md:inline">ग्रामीण विकास मंत्रालय | Ministry of Rural Development</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="primary" size="sm">
              DoLR · SIH 2026
            </Badge>
            <span className="hidden text-ink-3 sm:inline">Problem Statement: SIH26014</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-panel via-panel to-ground px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-soft/50 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles size={13} />
            <span>Digital Public Infrastructure (DPI) for Land Governance</span>
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            Tenrec <span className="font-normal text-ink-3">(टेनरैक)</span>
          </h1>
          <p className="mt-2 text-lg font-medium text-primary sm:text-xl">
            Department of Land Resources (DoLR) · Ministry of Rural Development
          </p>

          <p className="mx-auto mt-4 max-w-3xl text-base text-ink-2 sm:text-lg">
            Unifying India’s fragmented land records. Connecting siloed information across{' '}
            <strong>Revenue</strong>, <strong>Registration</strong>, <strong>Planning</strong>,{' '}
            <strong>Taxation</strong>, <strong>Courts</strong>, and <strong>Utilities</strong> into a single{' '}
            <strong>Bhu-Aadhaar (ULPIN)</strong> Common Data Model.
          </p>

          {/* Universal Parcel Search */}
          <div className="mx-auto mt-8 max-w-2xl">
            <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter 14-digit ULPIN (e.g. TFCM2ZE184B55E) or Survey No. 123/4..."
                  className="w-full rounded-md border border-line bg-panel py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-3 focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>
              <Button type="submit" variant="primary" className="h-11 px-6">
                <MapIcon size={16} />
                <span>Search & Open Map</span>
              </Button>
            </form>

            {/* Quick Demo Parcels */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-ink-3">Try Story Parcels:</span>
              {storyParcels.map((p) => (
                <button
                  key={p.ulpin}
                  onClick={() => void openParcel(p.ulpin)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition hover:scale-105 ${p.tone}`}
                >
                  <span>Plot {p.label}</span>
                  <span className="opacity-75">({p.status})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/map">
              <Button variant="primary" size="lg" className="shadow-sm">
                <MapIcon size={18} />
                <span>Explore GIS Cadastre Map</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/citizen">
              <Button variant="secondary" size="lg">
                <Users size={18} />
                <span>Citizen Portal</span>
              </Button>
            </Link>
            <Link to="/officer">
              <Button variant="secondary" size="lg">
                <Building2 size={18} />
                <span>Officer Console</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem & The Solution Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <Badge tone="neutral" size="sm">
            Institutional Interoperability
          </Badge>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Stitching 6 Disconnected Government Institutions
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-2">
            In India today, land information is maintained in fragmented, disconnected silos. Tenrec connects every
            department through a standardized, consent-aware API layer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <Card key={d.name} className="flex flex-col justify-between border-line p-5 transition hover:shadow-md">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className={`rounded-md border p-2 ${d.color}`}>
                    <d.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-ink">{d.name}</h3>
                    <p className="text-xs text-ink-3">{d.hindi}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-3">Siloed Records</p>
                  <p className="mt-1 text-xs text-ink-2">{d.records}</p>
                </div>
              </div>

              <div className="mt-4 border-t border-line/60 pt-3">
                <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Tenrec Integration</span>
                </p>
                <p className="mt-0.5 text-xs text-ink-3">{d.solution}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Key Innovation Highlights */}
      <section className="border-y border-line bg-panel px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MapPin size={22} />
              </div>
              <h3 className="text-base font-semibold text-ink">One Parcel · One ULPIN</h3>
              <p className="text-sm text-ink-2">
                Every land plot receives a tamper-evident 14-character Bhu-Aadhaar key derived from its exact coordinates,
                acting as the master key across all state departments.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Satellite size={22} />
              </div>
              <h3 className="text-base font-semibold text-ink">Autonomous Satellite Change Detection</h3>
              <p className="text-sm text-ink-2">
                Integrated Sentinel-2 multi-spectral NDVI/NDBI change tracking flags unrecorded construction and green-cover
                encroachments before mutations are approved.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-base font-semibold text-ink">Privacy & Cryptographic Provenance</h3>
              <p className="text-sm text-ink-2">
                Citizen identities remain masked by default under consent-aware access protocols, with full audit logging
                and verifiable digital land certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Gateway Cards */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight text-ink sm:text-3xl">Access Portals by Persona</h2>
        <p className="mx-auto mt-2 text-center text-sm text-ink-2">
          Tailored interfaces built for citizens, departmental officers, and system administrators.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Card className="flex flex-col justify-between border-line p-6 hover:border-primary/50">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Users size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">Citizen Services</h3>
              <p className="mt-1 text-xs text-ink-3">नागरिक सेवा पोर्टल</p>
              <p className="mt-3 text-sm text-ink-2">
                Search your land parcel, verify deed authenticity, download digitally signed Land Passbooks (Form-1B), and
                track mutation applications.
              </p>
            </div>
            <div className="mt-6">
              <Link to="/citizen">
                <Button variant="secondary" className="w-full justify-between">
                  <span>Enter Citizen Portal</span>
                  <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="flex flex-col justify-between border-line p-6 hover:border-primary/50">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">Officer Console</h3>
              <p className="mt-1 text-xs text-ink-3">अधिकारी डैशबोर्ड</p>
              <p className="mt-3 text-sm text-ink-2">
                Department queues for mutation review, inter-department discrepancy alerts, building permission conflict
                detection, and tax recovery.
              </p>
            </div>
            <div className="mt-6">
              <Link to="/officer">
                <Button variant="secondary" className="w-full justify-between">
                  <span>Open Officer Console</span>
                  <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="flex flex-col justify-between border-line p-6 hover:border-primary/50">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Globe2 size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">GIS Cadastre Map</h3>
              <p className="mt-1 text-xs text-ink-3">भू-मानचित्र एक्सप्लोरर</p>
              <p className="mt-3 text-sm text-ink-2">
                Full-screen MapLibre GL 3-tier cadastral viewer with vector tiles, satellite base maps, and 3D unit extrusion
                preview.
              </p>
            </div>
            <div className="mt-6">
              <Link to="/map">
                <Button variant="primary" className="w-full justify-between">
                  <span>Launch Map Explorer</span>
                  <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Official Footer */}
      <footer className="mt-auto border-t border-line bg-panel-2 px-4 py-8 text-xs text-ink-3">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-medium text-ink">
              Tenrec · Department of Land Resources (DoLR), Ministry of Rural Development
            </p>
            <p className="mt-0.5">
              Developed for Smart India Hackathon (SIH 2026) · Digital Public Infrastructure for Land Governance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/map" className="hover:text-ink">
              GIS Map
            </Link>
            <span>•</span>
            <Link to="/citizen" className="hover:text-ink">
              Citizen Portal
            </Link>
            <span>•</span>
            <Link to="/officer" className="hover:text-ink">
              Officer Console
            </Link>
            <span>•</span>
            <Link to="/admin" className="hover:text-ink">
              Admin Hub
            </Link>
            <span>•</span>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-ink">
              API Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
