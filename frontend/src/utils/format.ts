/** Small presentation helpers. Locale-aware per design §10. */

/** Format a 0..1 probability as a whole percent string. */
export function formatPercent(value: number, locale = "en"): string {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(value);
}

/** Title-case a single token (e.g. "male" -> "Male"). */
export function titleCase(value: string): string {
  return value.length ? value[0].toUpperCase() + value.slice(1) : value;
}
