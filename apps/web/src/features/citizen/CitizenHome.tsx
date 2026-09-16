import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { MapPinned, ShieldCheck, FileSearch, ListChecks, Home, ArrowUpRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { LiquidGlassCard } from '@/components/ui/liquid-weather-glass';
import { FloatingDock } from '@/components/ui/floating-dock';

type CinematicPhase = 'idle' | 'hold' | 'retract' | 'settle';

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
  { id: 'search', to: '/map', label: 'Parcel Search & Quick Actions', desc: 'Find parcels and explore connected records instantly.', dockLabel: 'Search', icon: MapPinned },
  { id: 'verify', to: '/citizen/verify', label: 'Verify Ownership', desc: 'Compare claimed names against authoritative records.', dockLabel: 'Verify', icon: ShieldCheck },
  { id: 'request', to: '/citizen/request', label: 'Request Service', desc: 'Apply for mutations or building permissions.', dockLabel: 'Service', icon: FileSearch },
  { id: 'track', to: '/citizen/track', label: 'Track Application', desc: 'Follow your requests through each step.', dockLabel: 'Track', icon: ListChecks },
];

export function CitizenHome() {
  const [activeTask, setActiveTask] = useState<string | null>(null);
  
  // IMMEDIATELY mount the completely formed cinematic frame if in fullscreen
  const [cinematicPhase, setCinematicPhase] = useState<CinematicPhase>(
    document.fullscreenElement ? 'hold' : 'idle'
  );
  
  const timeoutsRef = useRef<number[]>([]);
  const navigate = useNavigate();

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    if (document.fullscreenElement) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        
        // At T = ~700-1000ms, start the reveal
        timeoutsRef.current.push(window.setTimeout(() => {
          setCinematicPhase('retract');
        }, 800));

        // Existing transition duration is 2100ms. Settle after it finishes.
        timeoutsRef.current.push(window.setTimeout(() => {
          setCinematicPhase('settle');
        }, 2900));
      } else {
        setCinematicPhase('idle');
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setCinematicPhase('idle');
        clearTimeouts();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearTimeouts();
    };
  }, []);

  const getTopBarClasses = () => {
    switch (cinematicPhase) {
      case 'idle': 
      case 'settle':
        return "hidden";
      case 'hold': 
        return "h-[15vh] translate-y-0"; // Instantly ready, STATIC fully-formed frame. No transitions.
      case 'retract': 
        return "h-[15vh] -translate-y-full transition-transform duration-[2100ms] ease-[cubic-bezier(0.33,1,0.68,1)]";
      default: 
        return "hidden";
    }
  };

  const getBottomBarClasses = () => {
    switch (cinematicPhase) {
      case 'idle': 
      case 'settle':
        return "hidden";
      case 'hold': 
        return "h-[15vh] translate-y-0"; // Instantly ready, STATIC fully-formed frame. No transitions.
      case 'retract': 
        return "h-[15vh] translate-y-full transition-transform duration-[2100ms] ease-[cubic-bezier(0.33,1,0.68,1)]";
      default: 
        return "hidden";
    }
  };

  const handleAction = (id: string, to: string) => {
    if (activeTask) return; 
    setActiveTask(id);
    // Smooth transition away
    setTimeout(() => {
      navigate({ to });
    }, 400);
  };

  const dockItems = [
    { id: 'home', label: 'Home', icon: Home },
    ...ACTIONS.map(action => ({
      id: action.id,
      label: action.dockLabel,
      icon: action.icon
    }))
  ];

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col items-center overflow-y-auto p-6 md:p-8 scroll-smooth">
      
      {/* Cinematic Letterbox Overlay */}
      {cinematicPhase !== 'idle' && cinematicPhase !== 'settle' && (
         <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col justify-between overflow-hidden">
            <div className={clsx("w-full bg-black origin-top", getTopBarClasses())} />
            <div className={clsx("w-full bg-black origin-bottom", getBottomBarClasses())} />
         </div>
      )}
      
      {/* 1. Top Edge-to-Edge Bar */}
      <header className="w-full max-w-7xl flex items-center justify-between pb-8">
        <button 
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.warn("Could not exit fullscreen", err));
            }
            navigate({ to: '/' });
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4F1E7]/80 backdrop-blur-md border border-[#D5D2C7] shadow-sm text-[#18231F] hover:bg-[#E1E6DE] transition-all font-medium text-sm"
        >
          &larr; Back to Portal
        </button>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E1E6DE]/90 text-[#23483A] text-xs font-semibold border border-[#D5D2C7]">
          <span className="w-2 h-2 rounded-full bg-[#176B52] animate-pulse" />
          All Systems Live
        </span>
      </header>

      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center py-4 px-4 md:px-12">
        
        {/* 2. Header & Branding */}
        <h1 className="uppercase font-extrabold text-2xl tracking-[0.25em] text-[#18231F] mb-6 drop-shadow-sm">
          TENRIC
        </h1>

        {/* 3. Top Horizontal Dock */}
        <div className="mb-10 md:mb-14 relative z-20">
          <FloatingDock 
            items={dockItems} 
            activeId={activeTask || 'home'} 
            onSelect={(id) => {
              if (id === 'home') {
                setActiveTask(null);
              } else {
                if (!activeTask) {
                  const action = ACTIONS.find(a => a.id === id);
                  if (action) handleAction(action.id, action.to);
                }
              }
            }}
          />
        </div>

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
                className="w-full h-full min-h-[260px] flex flex-col justify-between p-6 rounded-3xl bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/35 hover:border-white/60 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all cursor-pointer"
              >
                <button
                  onClick={() => handleAction(action.id, action.to)}
                  className="absolute inset-0 w-full h-full text-left focus-visible:outline-2 focus-visible:outline-[#176B52] rounded-3xl z-40"
                  aria-label={action.label}
                />
                
                <div className="flex items-start justify-between w-full mb-4 relative z-10 pointer-events-none">
                  <div className="p-3 rounded-2xl bg-white/30 border border-white/40">
                    <action.icon className="w-6 h-6 text-[#18231F]" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-[#6F7768] group-hover:text-[#18231F] transition-colors" />
                </div>

                <div className="relative z-10 mt-auto pointer-events-none">
                  <h3 className="text-[#18231F] font-bold text-xl mb-1 tracking-tight">
                    {action.label}
                  </h3>
                  <p className="text-[#6F7768] text-sm leading-relaxed mt-1 opacity-100 font-sans">
                    {action.desc}
                  </p>
                </div>
              </LiquidGlassCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
