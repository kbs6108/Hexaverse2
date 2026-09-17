"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const GRADIENT_LAYERS = [
  { delay: "0s", duration: "25s" },
  { delay: "0.15s", duration: "15.9s" },
  { delay: "0.53s", duration: "26.4s" },
  { delay: "0.45s", duration: "17.8s" },
  { delay: "1.6s", duration: "19.2s" },
  { delay: "1.6s", duration: "29.2s" },
  { delay: "1.6s", duration: "20.2s" },
];

export const GradientButton = React.forwardRef<
  HTMLButtonElement,
  GradientButtonProps
>(({ className, children = "Continue in fullscreen", type = "button", ...props }, ref) => {
  return (
    <>
      <style>{`
        .btn-wrapper-root {
          --rad: 9999px;
          --color-wrapper-border: rgba(23, 107, 82, 0.4);
          --color-btn-bg: #11382B;
          --color-btn-text: #FFFFFF;
          --color-btn-text-shadow: rgba(0, 0, 0, 0.5);
          --color-btn-inset-shadow: #0A221A;
          --color-layer-a: #176B52;
          --color-layer-b: #B38A4C;
          --color-overlay-text: #FFFFFF;
          --color-overlay-glow: rgba(255, 255, 255, 0.6);
          --color-overlay-shadow: rgba(0, 0, 0, 0.2);
          --color-overlay-highlight: rgba(255, 255, 255, 0.25);

          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 44px;
          overflow: hidden;
          padding: 0;
          background: transparent;
          cursor: pointer;
          border: 1.5px solid var(--color-wrapper-border);
          border-radius: var(--rad);
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 700;
          user-select: none;
          outline: none;
          transition: transform 0.15s ease, filter 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 14px rgba(17, 56, 43, 0.2);
        }

        .btn-wrapper-root:hover {
          filter: brightness(1.1);
          box-shadow: 0 6px 18px rgba(23, 107, 82, 0.3);
        }

        .btn-wrapper-root:active {
          transform: scale(0.97);
        }

        .btn-wrapper-root:focus-visible {
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5);
        }

        .btn-wrapper-root .gradient-layer {
          position: absolute;
          pointer-events: none;
          left: -160px;
          width: 500%;
          aspect-ratio: 1;
          background: radial-gradient(
            ellipse at 65% 180%,
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b)
          );
          mix-blend-mode: difference;
          animation: rotate-anim 8s linear infinite;
        }

        .btn-wrapper-root .gradient-layer:nth-child(8) {
          mix-blend-mode: color-dodge;
        }

        @keyframes rotate-anim {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .btn-wrapper-root .gradient-bg {
          position: relative;
          z-index: 0;
          width: 100%;
          height: 100%;
          border: none;
          border-radius: var(--rad);
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          letter-spacing: 0.025em;
          color: transparent;
          background-color: var(--color-btn-bg);
          background-size: 200% 200%;
          box-shadow: inset 0 0 10px 9px var(--color-btn-inset-shadow);
          mix-blend-mode: color-dodge;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-wrapper-root .gradient-bg::after {
          content: "";
          position: absolute;
          pointer-events: none;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          border-radius: var(--rad);
          background-size: 200% 200%;
          mix-blend-mode: difference;
          z-index: 1;
        }

        .btn-wrapper-root .text-overlay {
          position: absolute;
          pointer-events: none;
          z-index: 10;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF !important;
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.025em;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
          mix-blend-mode: normal !important;
          opacity: 1 !important;
        }

        .btn-wrapper-root .light-bar {
          position: absolute;
          pointer-events: none;
          z-index: 1;
          border-radius: 50px;
          width: 80%;
          height: 1.5rem;
          aspect-ratio: 1;
          background-color: rgba(255, 255, 255, 0.333);
          filter: blur(5px);
          animation: pulse-light-anim 3s ease-in-out infinite;
        }

        @keyframes pulse-light-anim {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.1; }
        }
      `}</style>

      <button
        ref={ref}
        type={type}
        className={cn("btn-wrapper-root", className)}
        {...props}
      >
        <div className="light-bar" />
        {GRADIENT_LAYERS.map((layer, index) => (
          <div
            key={index}
            className="gradient-layer"
            style={{
              animationDelay: layer.delay,
              animationDuration: layer.duration,
            }}
          />
        ))}
        <div className="gradient-bg" aria-hidden="true">{children}</div>
        <div className="text-overlay">{children}</div>
      </button>
    </>
  );
});

GradientButton.displayName = "GradientButton";
