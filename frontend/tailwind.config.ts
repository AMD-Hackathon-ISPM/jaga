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
        focus: "var(--focus)",
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
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        heading: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SF Mono", "monospace"],
      },
      letterSpacing: {
        serif: "-0.03em",
      },
      borderRadius: {
        // One radius scale, no exceptions (§5.5).
        bar: "4px",
        control: "8px",
        frame: "16px",
      },
      maxWidth: {
        flow: "32rem", // single-column form/flow cap (§5.5)
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
