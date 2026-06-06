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
];

export const GENRE_BY_SLUG: Record<string, Genre> = Object.fromEntries(
  GENRES.map((g) => [g.slug, g]),
);
