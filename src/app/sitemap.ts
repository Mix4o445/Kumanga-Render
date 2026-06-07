import type { MetadataRoute } from "next";
import { getAllManga, getChapters, getGenres } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

// Content changes when manga/chapters are added, so don't cache indefinitely.
export const revalidate = 3600; // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Public, crawlable static routes.
  const staticPaths: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/latest", priority: 0.9 },
    { path: "/popular", priority: 0.8 },
    { path: "/top-rated", priority: 0.8 },
    { path: "/completed", priority: 0.7 },
    { path: "/explore", priority: 0.7 },
    { path: "/genres", priority: 0.7 },
    { path: "/manga", priority: 0.7 },
    { path: "/community", priority: 0.6 },
    { path: "/contact", priority: 0.3 },
    { path: "/terms", priority: 0.2 },
    { path: "/privacy", priority: 0.2 },
    { path: "/content-policy", priority: 0.2 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: now,
    changeFrequency: "daily",
    priority: p.priority,
  }));

  const genres = await getGenres();
  const genreEntries: MetadataRoute.Sitemap = genres.map((g) => ({
    url: absoluteUrl(`/genre/${g.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const manga = await getAllManga();

  const mangaEntries: MetadataRoute.Sitemap = manga.map((m) => ({
    url: absoluteUrl(`/manga/${encodeURIComponent(m.slug)}`),
    lastModified: m.updatedAt ? new Date(m.updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Per-chapter reader pages (fetched per title; fine for this catalog size).
  const chapterEntries: MetadataRoute.Sitemap = (
    await Promise.all(
      manga.map(async (m) => {
        const chapters = await getChapters(m.slug);
        return chapters.map((c) => ({
          url: absoluteUrl(
            `/manga/${encodeURIComponent(m.slug)}/${c.number}`,
          ),
          lastModified: c.releasedAt ? new Date(c.releasedAt) : now,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }));
      }),
    )
  ).flat();

  return [
    ...staticEntries,
    ...genreEntries,
    ...mangaEntries,
    ...chapterEntries,
  ];
}
