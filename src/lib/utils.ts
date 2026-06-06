/** Minimal className joiner (filters falsy values). */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Localized ("ar") relative time, e.g. "قبل ٣ ساعات".
 * Falls back gracefully for invalid dates.
 */
export function formatRelativeTime(iso: string, locale = "ar"): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = then - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return rtf.format(Math.round(diffMs / 1000), "second");
}

/** Localized chapter label, e.g. "الفصل ١٤٢". */
export function formatChapterLabel(num: number, locale = "ar"): string {
  return `الفصل ${num.toLocaleString(locale)}`;
}

/** Rating on a 0–10 scale formatted to one decimal, e.g. "٨٫٧". */
export function formatRating(rating: number, locale = "ar"): string {
  return rating.toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Compact number, e.g. "٤٨ مليون" / "١٫٢ ألف". */
export function formatCompact(value: number, locale = "ar"): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Localized month + year, e.g. "يونيو ٢٠٢٦" — used for join dates. */
export function formatMonthYear(iso: string, locale = "ar"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
  }).format(date);
}
