"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export interface FolderCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
> {
  /** Headline shown inside the folder tab. */
  title?: string;
  /** Supporting line under the title. */
  subtitle?: string;
  /** Large figure in the footer, e.g. "24". */
  count?: React.ReactNode;
  /** Word next to the figure, e.g. "Files". */
  countLabel?: string;
  /** Right-aligned footer text, e.g. "312 Assets". */
  meta?: string;
  /** Cover image URL. Falls back to a CSS aurora gradient when omitted. */
  cover?: string;
  /** Alt text for the cover image. */
  coverAlt?: string;
  /** Hover motion. Default: true. */
  interactive?: boolean;
  /** Active selected state. */
  isActive?: boolean;
}

const FOLDER_PATH =
  "M-2,151 a16,16 0 0 1 16,-16 h247 " +
  "c26.6,0 59.3,59 76,59 " +
  "h149 a32,32 0 0 1 32,32 v368 " +
  "a32,32 0 0 1 -32,32 h-456 a32,32 0 0 1 -32,-32 Z";

const AURORA_GRADIENT = [
  "radial-gradient(60% 80% at 75% 110%, rgba(179,138,76,0.3) 0%, rgba(23,107,82,0.15) 45%, rgba(0,0,0,0) 80%)",
  "radial-gradient(100% 90% at 20% 120%, rgba(35,72,58,0.25) 0%, rgba(213,210,199,0.4) 50%, rgba(0,0,0,0) 85%)",
  "linear-gradient(172deg, #E9E5D8 0%, #F4F1E7 50%, #E1E6DE 100%)",
].join(",");

const FONT_STACK =
  '"Poppins", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

const LIGHT_TOKENS = [
  "[--folder-card-bezel:#D5D2C7]",
  "[--folder-card-surface:#F4F1E7]",
  "[--folder-card-panel-from:#F4F1E7]",
  "[--folder-card-panel-to:#E9E5D8]",
  "[--folder-card-title:#18231F]",
  "[--folder-card-subtitle:#4B5345]",
].join(" ");

const DARK_TOKENS = LIGHT_TOKENS; // Ensure light earth palette persists regardless of system dark mode

const SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
} as const;

const cardVariants: Variants = {
  rest: { y: 0 },
  hover: { y: -8 },
  tap: { y: -4, scale: 0.99 },
};

const panelVariants: Variants = {
  rest: { y: "0%" },
  hover: { y: "8%" },
};

const coverVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.07 },
};

export const FolderCard = React.forwardRef<HTMLDivElement, FolderCardProps>(
  function FolderCard(
    {
      title = "Brand kit",
      subtitle = "Logos & Typography",
      count = "18",
      countLabel = "Files",
      meta = "240 Assets",
      cover,
      coverAlt = "",
      interactive = true,
      isActive = false,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const gradientId = React.useId();
    const reduceMotion = useReducedMotion();
    const animate = interactive && !reduceMotion;

    return (
      <motion.div
        ref={ref}
        initial="rest"
        animate="rest"
        whileHover={animate ? "hover" : undefined}
        whileTap={animate ? "tap" : undefined}
        transition={SPRING}
        variants={animate ? cardVariants : undefined}
        style={
          {
            "--folder-card-font": FONT_STACK,
            fontFamily: "var(--folder-card-font)",
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "w-full max-w-full select-none [container-type:inline-size]",
          LIGHT_TOKENS,
          DARK_TOKENS,
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "relative box-border aspect-[544/522] w-full rounded-[8.46cqw] bg-[var(--folder-card-bezel)] p-[2.57cqw] shadow-[0_8px_32px_rgba(24,35,31,0.04)] border border-[#176B52]/15 hover:border-[#176B52]/30 hover:shadow-[0_12px_40px_rgba(24,35,31,0.08)] transition-all duration-200",
            isActive && "ring-2 ring-[#176B52] border-[#176B52]/30 shadow-[0_12px_40px_rgba(24,35,31,0.08)]"
          )}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[5.88cqw] bg-[var(--folder-card-surface)]">
            <div className="absolute left-px right-px top-0 h-[54%] overflow-hidden">
              <motion.div
                variants={animate ? coverVariants : undefined}
                transition={SPRING}
                className="h-full w-full origin-bottom"
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={coverAlt}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden
                    style={{ background: AURORA_GRADIENT }}
                    className="h-full w-full"
                  />
                )}
              </motion.div>
            </div>

            <div className="absolute -left-px -right-px inset-y-0 overflow-hidden">
              <motion.div
                variants={animate ? panelVariants : undefined}
                transition={SPRING}
                className="absolute inset-0"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 516 494"
                  preserveAspectRatio="none"
                  className="absolute inset-0 block h-full w-full"
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0"
                        stopColor="var(--folder-card-panel-from)"
                      />
                      <stop
                        offset="1"
                        stopColor="var(--folder-card-panel-to)"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d={FOLDER_PATH}
                    fill={"url(#" + gradientId + ")"}
                    stroke={"url(#" + gradientId + ")"}
                    strokeWidth="2"
                  />
                </svg>

                <div className="absolute left-[4.78cqw] top-[29cqw] leading-none">
                  <h3 className="m-0 text-[4.25cqw] font-semibold tracking-[0.005em] text-[var(--folder-card-title)]">
                    {title}
                  </h3>
                  <p className="mt-[2.15cqw] text-[4.4cqw] font-normal tracking-[0.005em] text-[var(--folder-card-subtitle)]">
                    {subtitle}
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="absolute inset-x-[4.78cqw] bottom-[4.3cqw] flex items-baseline justify-between leading-none text-[var(--folder-card-title)]">
              <p className="m-0">
                <span className="text-[9.2cqw] font-semibold tracking-[-0.01em]">
                  {count}
                </span>
                <span className="ml-[1.6cqw] text-[4.2cqw] font-normal text-[var(--folder-card-subtitle)]">
                  {countLabel}
                </span>
              </p>
              <p className="m-0 text-[4.2cqw] font-semibold">{meta}</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
);

export default FolderCard;
export { FolderCard as Component };
