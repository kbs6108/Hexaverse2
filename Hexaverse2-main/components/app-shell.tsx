"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, UserRound } from "lucide-react";
import { AuthProvider, demoUsers, useAuth } from "@/lib/auth";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth(); const [query, setQuery] = useState("");
  const canOfficer = user.role === "officer" || user.role === "admin";
  return <div className="min-h-screen bg-[#08100C] text-white">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08100C]/90 px-6 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4">
        <Link href="/" className="brand-tenrec mr-4 text-lg">Tenrec</Link>
        <nav className="flex flex-1 flex-wrap items-center gap-2 text-sm text-white/70">
          <Link className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white" href="/explorer">Map Explorer</Link>
          <Link className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white" href="/citizen">Citizen Portal</Link>
          {canOfficer && <Link className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white" href="/officer">Officer Console</Link>}
          {user.role === "admin" && <Link className="rounded-full px-3 py-2 hover:bg-white/10 hover:text-white" href="/admin">Admin Console</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <label className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 sm:flex"><Search size={14} className="text-white/50" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ULPIN / survey / owner" className="w-48 bg-transparent text-xs outline-none placeholder:text-white/35" /></label>
          <select aria-label="Development role switcher" value={user.id} onChange={(event) => setUser(event.target.value)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"><option className="bg-slate-900" disabled value="">Role</option>{demoUsers.map((item) => <option className="bg-slate-900" key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</select>
          <button type="button" title="User menu" onClick={() => setUser(user.id)} className="rounded-full border border-white/10 p-2 text-white/70 hover:text-white"><UserRound size={16} /></button>
        </div>
      </div>
    </header><main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
  </div>;
}
export function AppShell({ children }: { children: React.ReactNode }) { return <AuthProvider><ShellInner>{children}</ShellInner></AuthProvider>; }
