"use client";

import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Compass,
  FileText,
  Folder,
  Home,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  match?: (pathname: string) => boolean;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    to: "/",
    icon: Home,
    match: (p) => p === "/" || p === "/citizen" || p === "/citizen/",
  },
  {
    id: "explore",
    label: "Explore",
    to: "/map",
    icon: Compass,
    match: (p) => p === "/map" && !window.location.search.includes("tab=parcels"),
  },
  {
    id: "parcels",
    label: "Parcels",
    to: "/map?tab=parcels",
    icon: ShieldCheck,
    match: (p) =>
      p.startsWith("/citizen/verify") ||
      (p === "/map" && window.location.search.includes("tab=parcels")),
  },
  {
    id: "vault",
    label: "Vault",
    to: "/citizen/vault",
    icon: Folder,
    match: (p) => p.startsWith("/citizen/vault"),
  },
  {
    id: "services",
    label: "Services",
    to: "/citizen/request",
    icon: FileText,
    match: (p) => p.startsWith("/citizen/request"),
  },
  {
    id: "applications",
    label: "Applications",
    to: "/citizen/applications",
    icon: ListChecks,
    match: (p) =>
      p.startsWith("/citizen/applications") || p.startsWith("/citizen/track"),
  },
];

export interface LimelightNavProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  items?: NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  floating?: boolean;
}

export function LimelightNav({
  items = DEFAULT_NAV_ITEMS,
  activeId: controlledActiveId,
  onSelect,
  floating = true,
  className,
  ...props
}: LimelightNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  // Determine which item is currently active based on route match or controlled prop
  const currentActiveId =
    controlledActiveId ??
    items.find((item) =>
      item.match ? item.match(pathname) : pathname === item.to
    )?.id ??
    items[0]?.id;

  return (
    <nav
      aria-label="Limelight navigation dock"
      className={cn(
        floating
          ? "fixed top-4 left-1/2 -translate-x-1/2 z-50"
          : "relative",
        "flex items-center gap-1 px-4 py-2 rounded-full bg-[#F4F1E7]/80 backdrop-blur-xl border border-[#D5D2C7] shadow-[0_8px_32px_rgba(24,35,31,0.08)]",
        className
      )}
      onMouseLeave={() => setHoveredId(null)}
      {...props}
    >
      {items.map((item) => {
        const isActive = item.id === currentActiveId;
        const isHovered = item.id === hoveredId;
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            to={item.to as any}
            onClick={() => onSelect?.(item.id)}
            onMouseEnter={() => setHoveredId(item.id)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-colors duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#176B52]",
              isActive
                ? "text-[#18231F] font-bold"
                : "text-[#6F7768] hover:text-[#18231F]"
            )}
          >
            {/* Active Limelight Beam Indicator */}
            {isActive && (
              <motion.div
                layoutId="limelight-active"
                className="absolute inset-0 rounded-full overflow-hidden pointer-events-none -z-10"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                  mass: 0.8,
                }}
              >
                {/* Top Accent Line with Warm Gold Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-[#B38A4C] shadow-[0_0_12px_#B38A4C] rounded-full" />

                {/* Limelight Cone Beam Gradient */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(ellipse at top, rgba(179,138,76,0.35) 0%, rgba(23,107,82,0.15) 50%, transparent 80%)",
                  }}
                />

                {/* Subtle Base Tint */}
                <div className="absolute inset-0 bg-[#23483A]/5 rounded-full" />
              </motion.div>
            )}

            {/* Inactive Hover Spotlight Effect */}
            {!isActive && isHovered && (
              <motion.div
                layoutId="limelight-hover"
                className="absolute inset-0 rounded-full bg-[#E9E5D8]/70 -z-10"
                transition={{ duration: 0.15 }}
              />
            )}

            <Icon
              size={15}
              className={cn(
                "shrink-0 transition-transform duration-200",
                isActive
                  ? "text-[#18231F] scale-105"
                  : "text-[#6F7768] group-hover:text-[#18231F]"
              )}
            />
            <span className="tracking-tight hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default LimelightNav;
