import { Link } from '@tanstack/react-router';
import { ArrowRight, MapPinned } from 'lucide-react';

export function LandingPage() {
  return (
    <main className="relative flex min-h-full items-center overflow-hidden bg-[#07120d] px-6 py-20 text-white sm:px-12">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(72,180,135,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(72,180,135,.14)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative mx-auto w-full max-w-6xl">
        <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Tenrec</div>
        <div className="mt-20 max-w-4xl">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">SIH26014 · Ministry of Rural Development</p>
          <h1 className="mt-6 text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-8xl">One identity for every parcel.</h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">Explore a unified land record system where ULPIN connects cadastral maps, rights, registration, planning, and tax data across departments.</p>
          <Link to="/map" className="mt-10 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#07120d] transition hover:bg-emerald-200"><MapPinned size={17} /> Enter Parcel Explorer <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-24 flex flex-wrap gap-x-10 gap-y-3 text-xs uppercase tracking-[0.2em] text-white/40"><span>ULPIN connected</span><span>Mock state adapters</span><span>Citizen · Officer · Admin</span></div>
      </div>
    </main>
  );
}
