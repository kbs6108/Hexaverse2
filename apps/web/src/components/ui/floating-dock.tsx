import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Search, ShieldCheck, FilePlus, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createTopDockController } from "@/features/landing/top-dock-controller";

export interface DockItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const DEFAULT_DOCK_ITEMS: DockItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "verify", label: "Verify", icon: ShieldCheck },
  { id: "service", label: "Service", icon: FilePlus },
  { id: "track", label: "Track", icon: Activity },
];

interface FloatingDockProps {
  items?: DockItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export function FloatingDock({
  items = DEFAULT_DOCK_ITEMS,
  activeId: externalActiveId,
  onSelect,
  className = "",
}: FloatingDockProps) {
  const [internalActiveId, setInternalActiveId] = useState(items[0]?.id ?? "home");
  const activeId = externalActiveId ?? internalActiveId;
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    return createTopDockController(nav, () => ({
      proximity: 140,
      spring: 0.22,
      damping: 0.55,
      widthGrowth: 28,
      heightGrowth: 28,
      drop: 10
    }));
  }, [items.length]);

  const handleSelect = (id: string) => {
    setInternalActiveId(id);
    onSelect?.(id);
  };

  return (
    <nav
      ref={navRef}
      aria-label="Floating Navigation Dock"
      className={`relative inline-flex h-14 items-center gap-1.5 p-1.5 rounded-full bg-white/25 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] ${className}`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;

        return (
          <button
            key={item.id}
            data-dock-item
            onClick={() => handleSelect(item.id)}
            className={`relative flex-shrink-0 h-full origin-center flex items-center justify-center gap-2 rounded-full px-4 text-[14px] transition-colors will-change-transform z-10 select-none ${
              isActive ? "text-[#18231F] font-bold" : "text-[#6F7768] font-medium hover:text-[#18231F]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="dock-active-pill"
                className="absolute inset-0 bg-white/50 rounded-full border border-white/60 shadow-sm -z-10"
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
              />
            )}
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-200 ${
                isActive ? "text-[#18231F]" : "text-[#6F7768]"
              }`}
            />
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
