import type { Config } from "tailwindcss";

/**
 * Tokens map to the CSS custom properties declared in src/app/globals.css,
 * which port the signed OKLCH palette from .agent/design-guidelines.md §4.
 * Do not hard-code hex/oklch here — change the variables, not these aliases.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        "surface-sunken": "var(--surface-sunken)",
        "border-subtle": "var(--border-subtle)",
        "border-strong": "var(--border-strong)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        brand: "var(--brand)",
        "brand-active": "var(--brand-active)",
        "brand-soft": "var(--brand-soft)",
        focus: "var(--focus)",
        // Figma accents & tints (rebrand 2026-07-09).
        "accent-return": "var(--accent-return)",
        "warning-cream": "var(--warning-cream)",
        "tint-brand-5": "var(--tint-brand-5)",
        "tint-brand-10": "var(--tint-brand-10)",
        "disabled-fill": "var(--disabled-fill)",
        "track-muted": "var(--track-muted)",
        info: "var(--info)",
        "info-surface": "var(--info-surface)",
        warning: "var(--warning)",
        "warning-surface": "var(--warning-surface)",
        error: "var(--error)",
        "error-surface": "var(--error-surface)",
        "error-strong": "var(--error-strong)",
        success: "var(--success)",
        // Risk-band ramp (§4.4) — non-green, monotonic lightness. Never used alone.
        "band-lower": "var(--band-lower)",
        "band-intermediate": "var(--band-intermediate)",
        "band-higher": "var(--band-higher)",
        // Focus ramp — salience only, NON-RISK (cream → deep orange). Marks
        // heuristic attention (cough pulse, result focus strip). Never a risk
        // or interaction color. See tokens.css.
        "focus-ramp-1": "var(--focus-ramp-1)",
        "focus-ramp-2": "var(--focus-ramp-2)",
        "focus-ramp-3": "var(--focus-ramp-3)",
        "focus-ramp-4": "var(--focus-ramp-4)",
        "focus-ramp-5": "var(--focus-ramp-5)",
      },
      fontFamily: {
        // Figtree for UI and headings; Ioskeley for numerics (design §5.4).
        serif: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SF Mono", "monospace"],
      },
      borderRadius: {
        // One radius scale, no exceptions (§5.5).
        bar: "4px",
        control: "6px",
        frame: "16px",
      },
      maxWidth: {
        flow: "32rem", // single-column form/flow cap (§5.5)
        "flow-wide": "56rem", // result/review evidence stage at lg+ (§5.6)
      },
      zIndex: {
        dropdown: "100",
        sticky: "200",
        backdrop: "300",
        modal: "400",
        toast: "500",
        tooltip: "600",
      },
    },
  },
  plugins: [],
};

export default config;
