import { Outlet, useNavigate, useRouterState, Link } from '@tanstack/react-router';
import { MapPinned, ShieldCheck, Folder, FileSearch, ListChecks, ArrowUpRight, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { consumeCitizenCinematic } from '@/lib/cinematic';

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

const SECONDARY_ACTIONS = [
  { id: 'verify', to: '/citizen/verify', label: 'Verify Ownership', desc: 'Compare claimed names against authoritative records.', icon: ShieldCheck },
  { id: 'vault', to: '/citizen/vault', label: 'Document Vault', desc: 'Inspect physical folder-card archives of deeds, survey sketches, and cadastral assets.', icon: Folder },
  { id: 'request', to: '/citizen/request', label: 'Request Service', desc: 'Apply for mutations or building permissions.', icon: FileSearch },
  { id: 'track', to: '/citizen/track', label: 'Track Application', desc: 'Follow your requests through each step.', icon: ListChecks },
];

export function CitizenHome() {
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Consume one-time flag strictly on fresh authentication entry
  const [isCinematicEntry] = useState(() => consumeCitizenCinematic());
  
  // IMMEDIATELY mount the completely formed cinematic frame ONLY if fresh auth entry in fullscreen
  const [cinematicPhase, setCinematicPhase] = useState<CinematicPhase>(() => {
    return isCinematicEntry && !!document.fullscreenElement ? 'hold' : 'idle';
  });
  
  const timeoutsRef = useRef<number[]>([]);
  const navigate = useNavigate();

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => {
    if (!isCinematicEntry) return;

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
  }, [isCinematicEntry]);

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
    setTimeout(() => {
      navigate({ to });
    }, 300);
  };

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col items-center overflow-y-auto p-6 md:p-8 scroll-smooth">
      {/* Cinematic Letterbox Overlay */}
      {cinematicPhase !== 'idle' && cinematicPhase !== 'settle' && (
         <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col justify-between overflow-hidden">
            <div className={clsx("w-full bg-black origin-top", getTopBarClasses())} />
            <div className={clsx("w-full bg-black origin-bottom", getBottomBarClasses())} />
         </div>
      )}
      
      {/* 1. Top Utility Bar */}
      <header className="w-full max-w-7xl flex items-center justify-between pb-4">
        {/* Left: Back to Portal */}
        <button 
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.warn("Could not exit fullscreen", err));
            }
            navigate({ to: '/' });
          }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F4F1E7]/80 backdrop-blur-md border border-[#D5D2C7] shadow-sm text-[#18231F] hover:bg-[#E1E6DE] transition-all text-xs font-semibold"
        >
          &larr; Back to Portal
        </button>

        {/* Center: Clean branding TENREC */}
        <span className="text-2xl font-black tracking-widest text-[#18231F] select-none">
          TENREC
        </span>

        {/* Right: Status badge */}
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F1E7]/80 border border-[#D5D2C7] text-[#176B52] text-xs font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#176B52] animate-pulse" />
          All Systems Live
        </span>
      </header>

      {/* 2. Asymmetric Bento Grid Layout Container */}
      <div className="max-w-7xl mx-auto px-8 py-12 min-h-[80vh] flex flex-col justify-center w-full">
        <div className={clsx(
          "grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch transition-all duration-300 ease-out",
          activeTask ? "opacity-0 scale-95 blur-md pointer-events-none" : "opacity-100 scale-100 blur-0"
        )}>
          {/* Card 1: Featured Hero Card (Parcel Search & Quick Actions) */}
          <div
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('form') || target.closest('button')) {
                return;
              }
              handleAction('search', '/map');
            }}
            role="button"
            className="lg:col-span-1 lg:row-span-2 p-8 min-h-[440px] flex flex-col justify-between group relative bg-[#F4F1E7]/60 backdrop-blur-2xl border border-[#176B52]/20 shadow-[0_10px_30px_rgba(24,35,31,0.05)] rounded-3xl transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.015] hover:bg-[#F4F1E7]/85 hover:border-[#176B52]/50 hover:shadow-[0_24px_60px_rgba(23,107,82,0.14)] select-none cursor-pointer"
          >
            <div>
              {/* Top Row: Icon Badge & Arrow */}
              <div className="flex items-start justify-between w-full">
                <div className="w-12 h-12 rounded-2xl bg-[#E9E5D8] border border-[#D5D2C7] flex items-center justify-center text-[#176B52] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-[#176B52] group-hover:text-[#F4F1E7]">
                  <MapPinned size={22} />
                </div>
                <span
                  className="p-1.5 rounded-full text-[#6F7768] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#176B52]"
                  aria-label="Open Parcel Explorer"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </span>
              </div>

              {/* Header & Description */}
              <div className="mt-6">
                <h3 className="text-[#18231F] text-2xl font-black tracking-tight">
                  Parcel Search & Quick Actions
                </h3>
                <p className="text-[#4B5345] text-xs font-medium mt-1.5 leading-relaxed">
                  Find parcels and explore connected records instantly.
                </p>
              </div>

              {/* Interactive Search Input inside card */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate({ to: '/map', search: { ulpin: searchQuery.trim() } });
                  } else {
                    handleAction('search', '/map');
                  }
                }}
                className="mt-6 flex items-center gap-2 bg-[#E9E5D8]/80 border border-[#D5D2C7] rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#176B52]/60 focus-within:border-transparent transition-all shadow-inner"
              >
                <Search className="w-4 h-4 text-[#176B52] shrink-0" />
                <input
                  type="text"
                  placeholder="Enter Survey #, ULPIN, or Khata..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-[#18231F] placeholder-[#6F7768] outline-none w-full font-medium"
                />
              </form>
            </div>

            {/* Quick Action Pill Buttons below search */}
            <div className="mt-6 pt-5 border-t border-[#D5D2C7]/60 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAction('verify', '/citizen/verify')}
                className="px-4 py-2 rounded-full bg-[#E9E5D8]/90 hover:bg-[#176B52] hover:text-[#F4F1E7] border border-[#D5D2C7] text-xs font-semibold text-[#18231F] transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Quick Verify
              </button>
              <button
                type="button"
                onClick={() => handleAction('search', '/map')}
                className="px-4 py-2 rounded-full bg-[#E9E5D8]/90 hover:bg-[#176B52] hover:text-[#F4F1E7] border border-[#D5D2C7] text-xs font-semibold text-[#18231F] transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Locate Boundary
              </button>
            </div>
          </div>

          {/* Cards 2, 3, 4, 5 (Verify, Vault, Request, Track) */}
          {SECONDARY_ACTIONS.map((action) => (
            <Link
              key={action.id}
              to={action.to}
              onClick={(e) => {
                e.preventDefault();
                handleAction(action.id, action.to);
              }}
              role="button"
              className="lg:col-span-1 group relative block w-full h-full min-h-[210px] p-8 flex flex-col justify-between bg-[#F4F1E7]/60 backdrop-blur-2xl border border-[#176B52]/20 shadow-[0_10px_30px_rgba(24,35,31,0.05)] rounded-3xl transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-[1.015] hover:bg-[#F4F1E7]/85 hover:border-[#176B52]/50 hover:shadow-[0_24px_60px_rgba(23,107,82,0.14)] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]"
            >
              {/* Top Row: Icon Badge & Top-Right Arrow */}
              <div className="flex items-start justify-between w-full">
                <div className="w-12 h-12 rounded-2xl bg-[#E9E5D8] border border-[#D5D2C7] flex items-center justify-center text-[#176B52] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-[#176B52] group-hover:text-[#F4F1E7]">
                  <action.icon size={22} />
                </div>
                <span className="text-[#6F7768] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#176B52]">
                  <ArrowUpRight className="w-5 h-5" />
                </span>
              </div>

              {/* Bottom Content: Headings & Descriptions */}
              <div className="mt-4">
                <h3 className="text-[#18231F] text-lg font-bold tracking-tight">
                  {action.label}
                </h3>
                <p className="text-[#4B5345] text-xs font-medium mt-1 leading-relaxed">
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
