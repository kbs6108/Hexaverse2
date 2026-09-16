import { useNavigate, useRouterState, Outlet } from '@tanstack/react-router';
import { clsx } from 'clsx';
import { MapPinned, FileSearch, ShieldCheck, ListChecks, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LiquidGlassCard } from '@/components/ui/liquid-weather-glass';

export function CitizenLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === '/citizen' || pathname === '/citizen/';
  
  return (
    <div className={clsx(
      isHome 
        ? "relative isolate min-h-screen w-full flex flex-col items-center" 
        : "mx-auto w-full max-w-5xl px-6 py-12 md:py-20 flex flex-col items-center"
    )}>
      <Outlet />
    </div>
  );
}

const ACTIONS = [
  { id: 'search', to: '/map', label: 'Parcel Search & Quick Actions', desc: 'Find parcels and explore connected records instantly.', subtext: '1,024 parcels indexed in Guntur pilot', dockLabel: 'Search', icon: MapPinned },
  { id: 'verify', to: '/citizen/verify', label: 'Verify Ownership', desc: 'Compare claimed names against authoritative records.', subtext: 'Instant match against RoR + registration records', dockLabel: 'Verify', icon: ShieldCheck },
  { id: 'request', to: '/citizen/request', label: 'Request Service', desc: 'Apply for mutations or building permissions.', subtext: 'Mutation · Building permission', dockLabel: 'Service', icon: FileSearch },
  { id: 'track', to: '/citizen/track', label: 'Track Application', desc: 'Follow your requests through each step.', subtext: 'Check status of submitted applications', dockLabel: 'Track', icon: ListChecks },
];

export function CitizenHome() {
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ connected: number; total: number } | null>(null);

  useEffect(() => {
    fetch('/landstack/connectors')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.items)) {
          const total = data.items.length;
          const connected = data.items.filter((item: any) => item.ok).length;
          setHealthStatus({ connected, total });
        }
      })
      .catch(() => {
        // Silently fail
      });
  }, []);

  const navigate = useNavigate();

  const handleAction = (id: string, to: string) => {
    if (activeTask) return; 
    setActiveTask(id);
    // Smooth transition away
    setTimeout(() => {
      navigate({ to });
    }, 400);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center overflow-x-hidden bg-ground text-ink">
      <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen">
      
      {/* 1. Top Edge-to-Edge Bar */}
      <header className="w-full max-w-7xl flex items-center justify-between pb-8">
        <button 
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.warn("Could not exit fullscreen", err));
            }
            navigate({ to: '/' });
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-sm text-slate-700 hover:text-slate-900 transition-all font-medium text-sm"
        >
          &larr; Back to home
        </button>
        {healthStatus && (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-semibold border border-emerald-200/60">
            <span className={clsx("w-2 h-2 rounded-full animate-pulse", healthStatus.connected === healthStatus.total ? "bg-emerald-500" : "bg-amber-500")} />
            {healthStatus.connected}/{healthStatus.total} departments connected
          </span>
        )}
      </header>

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center py-4 px-4 md:px-12">
        
        {/* 2. Header & Branding */}
        <h1 className="uppercase font-extrabold text-2xl tracking-[0.25em] text-slate-900 mb-10 md:mb-14 drop-shadow-sm" data-grid-avoid>
          TENREC
        </h1>

        {/* 4. The 2x2 Bento Glass Grid */}
        <div className={clsx(
          "grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full transition-all duration-[400ms] ease-out",
          activeTask ? "opacity-0 scale-95 blur-md pointer-events-none" : "opacity-100 scale-100 blur-0"
        )}>
          {ACTIONS.map((action) => (
            <div key={action.id} className="relative group">
              <LiquidGlassCard
                blurIntensity="xl"
                shadowIntensity="md"
                glowIntensity="sm"
                borderRadius="1.5rem"
                className="w-full h-full min-h-[260px] flex flex-col justify-between bg-white/60 backdrop-blur-xl border border-white/80 shadow-lg shadow-slate-900/5 rounded-3xl p-6 transition-all duration-300 hover:bg-white/80 hover:shadow-xl hover:-translate-y-1"
              >
                <button
                  onClick={() => handleAction(action.id, action.to)}
                  className="absolute inset-0 w-full h-full text-left focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-3xl z-40"
                  aria-label={action.label}
                />
                
                {/* Dynamic Inner Glow */}
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/20 blur-[50px] rounded-full group-hover:bg-emerald-500/30 transition-colors duration-500 pointer-events-none z-0" />
                
                <div className="flex items-start justify-between w-full mb-8 relative z-10 pointer-events-none">
                  <span className="flex items-center justify-center bg-white/90 border border-slate-200/80 shadow-sm p-3 rounded-2xl text-emerald-800 transition-colors duration-300">
                    <action.icon size={26} strokeWidth={1.5} />
                  </span>
                  <span className="flex items-center justify-center p-2 rounded-full bg-slate-900/5 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ArrowUpRight size={24} strokeWidth={2} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                  </span>
                </div>

                <div className="relative z-10 mt-auto pointer-events-none">
                  <h3 className="text-slate-900 font-bold text-xl mb-2 tracking-tight" data-grid-avoid>
                    {action.label}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mt-1 opacity-100 font-sans" data-grid-avoid>
                    {action.desc}
                  </p>
                  {action.subtext && (
                    <p className="text-slate-500 text-xs font-medium mt-4 pt-4 border-t border-slate-200/50" data-grid-avoid>
                      {action.subtext}
                    </p>
                  )}
                </div>
              </LiquidGlassCard>
            </div>
          ))}
        </div>
      </div>
      </main>
    </div>
  );
}




