import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        emerald: { 450: "#16C784" },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "Inter", "system-ui", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 50px rgba(16, 185, 129, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
