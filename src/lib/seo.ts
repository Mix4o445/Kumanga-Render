/**
 * Centralized SEO constants and helpers.
 *
 * SITE_URL drives `metadataBase`, canonical links, sitemap entries and Open
 * Graph URLs, so set APP_URL in the environment to your canonical domain in
 * production (falls back to the kumanga.xyz domain, then localhost).
 */

export const SITE_URL = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "https://kumanga.xyz"
).replace(/\/$/, "");

export const SITE_NAME = "Kumanga";

/** Localized site name used in Arabic-facing copy. */
export const SITE_NAME_AR = "كومانجا";

export const SITE_DESCRIPTION =
  "كومانجا منصة عربية متكاملة لقراءة المانجا والمانهوا والمانهوا الكورية بجودة عالية، مع فصول محدّثة باستمرار وتجربة قراءة سلسة على الجوال والحاسوب.";

export const SITE_KEYWORDS = [
  "مانجا",
  "مانهوا",
  "مانها",
  "قراءة مانجا",
  "مانجا عربي",
  "مانجا مترجمة",
  "manga",
  "manhwa",
  "read manga",
  "kumanga",
];

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
