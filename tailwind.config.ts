import type { Config } from "tailwindcss";

/**
 * Clean, MangaDex-inspired design system.
 * Neutral-dark (and light) surfaces driven by CSS variables (globals.css),
 * a single warm coral/orange accent, medium rounded corners and soft, subtle
 * shadows. The built-in `orange` scale is mapped to the coral accent so brand
 * buttons stay on-theme; `blue` keeps Tailwind's default (used for the
 * "completed" status tint only).
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--c-surface-raised) / <alpha-value>)",
        "surface-overlay": "rgb(var(--c-canvas) / <alpha-value>)",
        fg: "rgb(var(--c-fg) / <alpha-value>)",
        "fg-muted": "rgb(var(--c-fg-muted) / <alpha-value>)",
        "fg-subtle": "rgb(var(--c-fg-subtle) / <alpha-value>)",
        "fg-faint": "rgb(var(--c-fg-faint) / <alpha-value>)",
        line: "var(--c-line)",
        "line-strong": "var(--c-line-strong)",
        overlay: "var(--c-overlay)",
        "overlay-strong": "var(--c-overlay-strong)",
        input: "var(--c-input)",
        // Single accent: MangaDex coral. Constant across themes.
        accent: {
          DEFAULT: "rgb(var(--c-accent) / <alpha-value>)",
          bright: "rgb(var(--c-accent-bright) / <alpha-value>)",
        },
        // Legacy accent aliases kept on-theme.
        brand: { DEFAULT: "#ff6740", soft: "#ff855f" },
        royal: { DEFAULT: "#3b82f6", soft: "#60a5fa" },
        // Remap the built-in ORANGE scale → coral accent family.
        orange: {
          50: "#fff4f0",
          100: "#ffe5db",
          200: "#ffc8b6",
          300: "#ffa588",
          400: "#ff855f",
          500: "#ff6740",
          600: "#f5512a",
          700: "#dc3f1c",
          800: "#b5331a",
          900: "#932e1b",
          950: "#50140a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "Segoe UI", "Tahoma", "sans-serif"],
        // Headings use the same clean family (no decorative display face).
        display: ["var(--font-sans)", "system-ui", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        card: "0.5rem",
        hero: "0.625rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.18)",
        "card-hover": "0 12px 30px -14px rgb(0 0 0 / 0.55)",
        panel: "0 1px 2px 0 rgb(0 0 0 / 0.18)",
        "panel-lg": "0 16px 40px -20px rgb(0 0 0 / 0.6)",
        sticker: "none",
        "glow-orange": "0 10px 26px -12px rgb(255 103 64 / 0.55)",
        "glow-blue": "0 10px 26px -12px rgb(0 0 0 / 0.45)",
        "inner-line": "inset 0 1px 0 0 rgb(255 255 255 / 0.04)",
        "search-inner": "inset 0 1px 2px rgb(0 0 0 / 0.22)",
      },
      letterSpacing: {
        "tight-display": "-0.015em",
        wider: "0.06em",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s ease-in-out infinite",
        "fade-up": "fade-up 0.35s ease-out both",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
