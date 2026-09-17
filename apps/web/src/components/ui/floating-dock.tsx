"use client";

import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  disabled?: boolean;
  match?: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "#", disabled: true },
  { id: "explore", label: "Explore", href: "/map", match: (p) => p === "/map" && !window.location.search.includes("tab=parcels") },
  { id: "parcels", label: "Parcels", href: "/map?tab=parcels", match: (p) => p.startsWith("/citizen/verify") || (p === "/map" && window.location.search.includes("tab=parcels")) },
  { id: "vault", label: "Vault", href: "/citizen/vault", match: (p) => p.startsWith("/citizen/vault") },
  { id: "services", label: "Services", href: "/citizen/request", match: (p) => p.startsWith("/citizen/request") },
  { id: "applications", label: "Applications", href: "/citizen/applications", match: (p) => p.startsWith("/citizen/applications") || p.startsWith("/citizen/track") },
];

export interface FloatingDockProps {
  activeTab?: string;
  onTabChange?: (id: string) => void;
  onOpenAccount?: () => void;
  className?: string;
}

export function FloatingDock({
  activeTab: controlledActiveTab,
  onTabChange,
  onOpenAccount,
  className,
}: FloatingDockProps = {}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Auto-detect current active tab from current route (ignoring disabled items)
  const currentRouteTab = NAV_ITEMS.filter((item) => !item.disabled).find((item) =>
    item.match ? item.match(pathname) : pathname === item.href
  )?.id ?? "explore";

  const [internalActiveTab, setInternalActiveTab] = useState(currentRouteTab);
  const activeTab = controlledActiveTab ?? (controlledActiveTab === undefined ? currentRouteTab : internalActiveTab);

  const handleSelect = (id: string) => {
    setInternalActiveTab(id);
    onTabChange?.(id);
  };

  return (
    <header
      className={cn(
        "fixed top-4 left-4 right-4 z-50 mx-auto max-w-5xl flex items-center justify-between px-6 py-2.5 rounded-full bg-[#F4F1E7]/85 backdrop-blur-xl border border-[#D5D2C7] shadow-[0_8px_30px_rgba(24,35,31,0.08)]",
        className
      )}
    >
      {/* Clean Logo Branding */}
      <div className="flex items-center gap-2">
        <Link to="/citizen" className="text-base font-black tracking-widest text-[#18231F] select-none hover:opacity-85 transition-opacity">
          TENREC
        </Link>
      </div>

      {/* Center Animated Dock with Streetlight Light Cone Beam */}
      <nav className="relative flex items-center gap-2 h-full py-2.5">
        {NAV_ITEMS.map((item) => {
          const isActive = !item.disabled && activeTab === item.id;
          return (
            <Link
              key={item.id}
              to={item.href as any}
              onClick={(e) => {
                if (item.disabled) {
                  e.preventDefault();
                } else {
                  handleSelect(item.id);
                }
              }}
              className={cn(
                "relative z-20 px-4 py-2 text-xs font-bold select-none transition-colors duration-200 outline-none focus-visible:ring-1 focus-visible:ring-[#176B52] rounded-md",
                item.disabled
                  ? "cursor-not-allowed opacity-40 hover:text-[#6F7768]"
                  : isActive
                    ? "text-[#18231F]"
                    : "text-[#6F7768] hover:text-[#18231F]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-streetlight"
                  className="absolute inset-0 pointer-events-none -my-2.5"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                >
                  {/* 1. Top Lamp Fixture */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-[#B38A4C] shadow-[0_0_12px_#B38A4C] rounded-full z-20" />

                  {/* 2. Spreading Streetlight Light Cone (Full Bar Height) */}
                  <div
                    className="absolute inset-0 z-10"
                    style={{
                      background: "radial-gradient(ellipse 90% 100% at 50% 0%, rgba(179,138,76,0.4) 0%, rgba(23,107,82,0.15) 60%, transparent 100%)",
                      clipPath: "polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)",
                    }}
                  />

                  {/* 3. Soft Bottom Floor Glow */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-[#B38A4C]/30 to-transparent blur-xs z-10" />
                </motion.div>
              )}
              <span className="relative z-30">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Utility Section: Fullscreen Toggle & User Badge */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
          className="p-1.5 rounded-full bg-[#E9E5D8]/70 hover:bg-[#E1E6DE] text-[#18231F] border border-[#D5D2C7] transition-colors cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={onOpenAccount}
          className="flex items-center gap-2 bg-[#23483A] text-[#F4F1E7] px-3 py-1 rounded-full text-xs font-semibold shadow-xs hover:bg-[#23483A]/90 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]"
          aria-label="Account menu"
        >
          <span className="w-2 h-2 rounded-full bg-[#176B52] animate-pulse" />
          <span>RK Ravi Kumar</span>
        </button>
      </div>
    </header>
  );
}

export default FloatingDock;
