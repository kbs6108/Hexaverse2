"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface BentoItemProps {
  className?: string;
  children: React.ReactNode;
}

const BentoItem = ({ className, children }: BentoItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = item.getBoundingClientRect();
      item.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      item.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    };

    item.addEventListener("mousemove", handleMouseMove);
    return () => item.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={itemRef}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 hover:border-emerald-500 hover:shadow-2xl",
        "before:pointer-events-none before:absolute before:-inset-px before:rounded-3xl before:opacity-0 before:transition-opacity hover:before:opacity-100",
        "before:bg-[radial-gradient(500px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(16,185,129,0.08),transparent_80%)]",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const CyberneticBentoGrid = () => {
  return (
    <section className="relative w-full border-t border-slate-200 bg-slate-50 px-6 py-28 text-slate-900 transition-colors duration-500">
      <div className="z-10 mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-emerald-300 bg-emerald-100/80 px-4 py-1.5 text-xs font-mono font-bold tracking-widest text-emerald-700 shadow-sm">SPATIAL ARCHITECTURE</span>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">3-Tier Interoperable Data Engine</h2>
          <p className="mx-auto max-w-2xl text-base font-normal text-slate-600 sm:text-xl">Standardizing state land records, cadastral map vectors, and municipal utility layers into a single clean API ecosystem.</p>
        </div>

        <div className="grid auto-rows-[240px] grid-cols-1 gap-8 md:grid-cols-3">
          <BentoItem className="flex flex-col justify-between border-slate-300 md:col-span-2 md:row-span-2">
            <div><span className="mb-4 inline-block rounded-md bg-emerald-600 px-3 py-1 text-xs font-mono font-semibold text-white shadow-sm">TIER 01 • SPATIAL</span><h3 className="text-3xl font-bold tracking-tight text-slate-900">Base Spatial Layer</h3><p className="mt-2 max-w-xl text-base text-slate-600">Generates 14-digit ULPIN identifiers, overlays georeferenced cadastral boundaries, and aligns spatial centroid vectors across states.</p></div>
            <div className="mt-6 flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 font-mono text-xs font-bold text-emerald-700 shadow-inner">[ LIVE LIGHT-MODE CADASTRAL VECTOR CANVAS ]</div>
          </BentoItem>

          <BentoItem className="border-slate-300"><span className="mb-3 inline-block rounded-md border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-mono font-semibold text-amber-800">TIER 02 • LEGAL</span><h3 className="text-xl font-bold text-slate-900">Record of Rights Sync</h3><p className="mt-2 text-sm text-slate-600">Direct verification against state registries (PLRS, Patta, e-Services).</p></BentoItem>
          <BentoItem className="border-slate-300"><span className="mb-3 inline-block rounded-md border border-blue-300 bg-blue-100 px-2.5 py-1 text-xs font-mono font-semibold text-blue-800">TIER 03 • FISCAL</span><h3 className="text-xl font-bold text-slate-900">Utility &amp; Tax Overlays</h3><p className="mt-2 text-sm text-slate-600">Automated municipal property tax audits and circle rate valuation APIs.</p></BentoItem>

          <BentoItem className="flex flex-col justify-between border-slate-300 md:row-span-2"><div><span className="mb-3 inline-block rounded-md border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-800">LIVE API</span><h3 className="text-xl font-bold text-slate-900">Multi-State Sync</h3><p className="mt-2 text-sm text-slate-600">Normalizes state-specific data structures into standard OGC GeoJSON.</p></div><div className="rounded-xl border border-slate-200 bg-slate-100 p-4 font-mono text-xs text-slate-800 shadow-sm"><p className="font-bold text-emerald-700">&gt; GET /api/v1/parcel/1403-PB</p><p className="mt-1 text-slate-500">&gt; Status: 200 OK (18ms)</p></div></BentoItem>
          <BentoItem className="flex flex-col justify-center border-slate-300 md:col-span-2"><h3 className="text-xl font-bold text-slate-900">Cross-Departmental Workflow Engine</h3><p className="mt-2 text-sm text-slate-600">Connects revenue departments, urban planning authorities, and judicial registries in one audit trail.</p></BentoItem>
        </div>
      </div>
    </section>
  );
};
