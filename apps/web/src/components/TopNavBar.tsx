"use client";

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { HelpCircle, Maximize2, Minimize2 } from "lucide-react";
import { LimelightNav, type NavItem } from "@/components/ui/limelight-nav";
import { useAuth } from "@/lib/auth";

export interface TopNavBarProps {
  onOpenAccount?: () => void;
  items?: NavItem[];
}

export function TopNavBar({ onOpenAccount, items }: TopNavBarProps) {
  const { user } = useAuth();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const onFS = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFS);
    return () => document.removeEventListener("fullscreenchange", onFS);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <header className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl flex items-center justify-between px-6 py-2 rounded-full bg-[#F4F1E7]/80 backdrop-blur-xl border border-[#D5D2C7] shadow-[0_8px_32px_rgba(24,35,31,0.08)] text-[#18231F]">
      {/* Left: TENREC */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          to="/citizen"
          className="text-lg font-extrabold tracking-widest text-[#18231F] hover:opacity-85 transition-opacity select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B52] rounded-md px-1"
          aria-label="TENREC"
        >
          TENREC
        </Link>
      </div>

      {/* Center: Limelight Nav Dock */}
      <LimelightNav floating={false} items={items} className="border-0 shadow-none bg-transparent px-1 py-0.5" />

      {/* Right: Help / Fullscreen / Account Badge */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/help"
          className="hidden sm:flex size-8 items-center justify-center rounded-full text-[#6F7768] hover:text-[#18231F] hover:bg-[#E9E5D8]/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]"
          title="Citizen Help & Documentation"
          aria-label="Help"
        >
          <HelpCircle size={17} />
        </Link>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="flex size-8 items-center justify-center rounded-full text-[#6F7768] hover:text-[#18231F] hover:bg-[#E9E5D8]/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        <button
          type="button"
          onClick={onOpenAccount}
          className="flex items-center gap-2 rounded-full pl-2 pr-2.5 py-1 text-xs font-semibold bg-[#E9E5D8]/80 text-[#18231F] border border-[#D5D2C7] hover:bg-[#E1E6DE] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]"
          aria-label="Open account panel"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-[#23483A] text-[11px] font-bold text-[#F4F1E7]">
            {userInitials}
          </span>
          <span className="hidden md:inline max-w-[100px] truncate">{user?.name ?? "Account"}</span>
        </button>
      </div>
    </header>
  );
}

export default TopNavBar;
