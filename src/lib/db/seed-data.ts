import type { Genre } from "@/types";

/**
 * Genre taxonomy — the only fixed reference data in the app.
 *
 * This is NOT content: it's the controlled vocabulary uploaders pick from.
 * All actual manga/chapter content is created by users and persisted by the
 * database layer (src/lib/db/store.ts). There is no mock manga data.
 */
export const GENRES: Genre[] = [
  { id: "action", slug: "action", name: "أكشن" },
  { id: "adventure", slug: "adventure", name: "مغامرة" },
  { id: "comedy", slug: "comedy", name: "كوميديا" },
  { id: "drama", slug: "drama", name: "دراما" },
  { id: "fantasy", slug: "fantasy", name: "خيال" },
  { id: "romance", slug: "romance", name: "رومانسي" },
  { id: "horror", slug: "horror", name: "رعب" },
  { id: "school", slug: "school", name: "مدرسي" },
  { id: "shounen", slug: "shounen", name: "شونين" },
  { id: "shoujo", slug: "shoujo", name: "شوجو" },
  { id: "seinen", slug: "seinen", name: "سينين" },
  { id: "josei", slug: "josei", name: "جوسي" },
  { id: "supernatural", slug: "supernatural", name: "خارق للطبيعة" },
  { id: "isekai", slug: "isekai", name: "عالم آخر" },
  { id: "sci-fi", slug: "sci-fi", name: "خيال علمي" },
  { id: "slice-of-life", slug: "slice-of-life", name: "شريحة من الحياة" },
  { id: "sports", slug: "sports", name: "رياضة" },
  { id: "mystery", slug: "mystery", name: "غموض" },
  { id: "thriller", slug: "thriller", name: "إثارة" },
  { id: "psychological", slug: "psychological", name: "نفسي" },
  { id: "historical", slug: "historical", name: "تاريخي" },
  { id: "military", slug: "military", name: "عسكري" },
  { id: "music", slug: "music", name: "موسيقى" },
  { id: "martial-arts", slug: "martial-arts", name: "فنون قتالية" },
  { id: "magic", slug: "magic", name: "سحر" },
  { id: "mecha", slug: "mecha", name: "ميكا" },
  { id: "harem", slug: "harem", name: "حريم" },
  { id: "tragedy", slug: "tragedy", name: "مأساة" },
  { id: "demons", slug: "demons", name: "شياطين" },
  { id: "vampire", slug: "vampire", name: "مصاصو دماء" },
  { id: "game", slug: "game", name: "ألعاب" },
  { id: "cooking", slug: "cooking", name: "طبخ" },
  { id: "medical", slug: "medical", name: "طبي" },
  { id: "super-power", slug: "super-power", name: "قوى خارقة" },
  { id: "crime", slug: "crime", name: "جريمة" },
  { id: "police", slug: "police", name: "شرطة" },
  { id: "space", slug: "space", name: "فضاء" },
  { id: "magical-girl", slug: "magical-girl", name: "فتاة سحرية" },
  { id: "martial", slug: "martial", name: "قتال" },
  { id: "mature", slug: "mature", name: "للكبار" },
];

export const GENRE_BY_SLUG: Record<string, Genre> = Object.fromEntries(
  GENRES.map((g) => [g.slug, g]),
);
