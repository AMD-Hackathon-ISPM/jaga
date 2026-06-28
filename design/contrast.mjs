// OKLCH/hex -> linear sRGB -> WCAG contrast verifier for Jaga's palette.
// Asserts every text pair meets AA. Run: node design/contrast.mjs
// Palette: cream #FFFFEB, deep green #024F46, ink #1A1A1A (Billy, 2026-06-28 v2).

function oklchToLinearRgb(L, C, Hdeg) {
  const H = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
function hexToLinearRgb(hex) {
  const h = hex.replace("#", "");
  const to = (i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return [to(0), to(2), to(4)];
}
const lin = (t) => (typeof t === "string" ? hexToLinearRgb(t) : oklchToLinearRgb(...t));
const clamp01 = (x) => Math.min(1, Math.max(0, x));
function luminance(rgb) {
  const [r, g, b] = rgb.map(clamp01);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg, bg) {
  const L1 = luminance(lin(fg)), L2 = luminance(lin(bg));
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---- Tokens (hex where Billy specified, OKLCH where designed) ----
const T = {
  canvas:        "#FFFFEB",            // pale warm cream
  surface:       "#FFFFF7",            // cards (lighter)
  sunken:        "#F4F4DC",            // input wells
  borderSubtle:  "#E8E8D0",            // decorative dividers
  borderStrong:  [0.62, 0.020, 95],    // essential outlines (>=3:1)
  ink:           "#1A1A1A",            // near-black
  inkMuted:      [0.49, 0.018, 95],    // labels / placeholder (>=4.5:1)
  brand:         "#024F46",            // deep pine green: links, accent, button
  white:         "#FFFFFF",
  focus:         [0.50, 0.090, 165],   // brighter green ring
  warnSurface:   [0.95, 0.040, 85],
  warnInk:       [0.45, 0.085, 70],
  errSurface:    [0.95, 0.045, 25],
  errInk:        [0.47, 0.155, 28],
  errStrong:    "#B3261E",
  infoSurface:   [0.95, 0.030, 240],
  infoInk:       [0.45, 0.095, 245],
  // risk ramp (non-green, monotonic, CVD-safe; clean on yellow cream)
  riskLower:     [0.78, 0.035, 78],    // light taupe (exempt; label+position carry it)
  riskInter:     [0.65, 0.110, 58],    // ochre
  riskHigher:    [0.49, 0.140, 36],    // deep brick
};

const TEXT_PAIRS = [
  ["ink / canvas",           T.ink,      T.canvas,   4.5],
  ["ink / surface",          T.ink,      T.surface,  4.5],
  ["ink / sunken",           T.ink,      T.sunken,   4.5],
  ["inkMuted / canvas",      T.inkMuted, T.canvas,   4.5],
  ["inkMuted / surface",     T.inkMuted, T.surface,  4.5],
  ["brand / canvas",         T.brand,    T.canvas,   4.5],
  ["brand / surface",        T.brand,    T.surface,  4.5],
  ["white / brand (button)", T.white,    T.brand,    4.5],
  ["white / errStrong",      T.white,    T.errStrong,4.5],
  ["warnInk / warnSurface",  T.warnInk,  T.warnSurface, 4.5],
  ["errInk / errSurface",    T.errInk,   T.errSurface,  4.5],
  ["infoInk / infoSurface",  T.infoInk,  T.infoSurface, 4.5],
];
const NONTEXT_PAIRS = [
  ["borderStrong / canvas",  T.borderStrong, T.canvas, 3.0],
  ["focus / canvas",         T.focus,        T.canvas, 3.0],
  ["brand / canvas (ui)",    T.brand,        T.canvas, 3.0],
  ["riskInter / canvas",     T.riskInter,    T.canvas, 3.0],
  ["riskHigher / canvas",    T.riskHigher,   T.canvas, 3.0],
];
const REPORT_ONLY = [["riskLower / canvas (exempt)", T.riskLower, T.canvas]];

let fails = 0;
const fmt = (n) => n.toFixed(2).padStart(5);
console.log("TEXT (>=target):");
for (const [name, fg, bg, min] of TEXT_PAIRS) {
  const c = contrast(fg, bg); const ok = c >= min; if (!ok) fails++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${fmt(c)} (>=${min})  ${name}`);
}
console.log("NON-TEXT / UI (>=3.0):");
for (const [name, fg, bg, min] of NONTEXT_PAIRS) {
  const c = contrast(fg, bg); const ok = c >= min; if (!ok) fails++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${fmt(c)} (>=${min})  ${name}`);
}
console.log("REPORT-ONLY:");
for (const [name, fg, bg] of REPORT_ONLY) console.log(`  ----  ${fmt(contrast(fg, bg))}         ${name}`);
const lum = (t) => luminance(lin(t));
const mono = lum(T.riskLower) > lum(T.riskInter) && lum(T.riskInter) > lum(T.riskHigher);
console.log(`risk-band luminance monotonic (CVD-safe): ${mono ? "PASS" : "FAIL"}`);
if (!mono) fails++;
console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAIL`);
process.exit(fails === 0 ? 0 : 1);
