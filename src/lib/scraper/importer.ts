import { randomUUID } from "node:crypto";
import { mangaStore, type StoredManga, type StoredChapter } from "@/lib/db/store";
import { GENRE_BY_SLUG } from "@/lib/db/seed-data";
import type { ScrapedManga, ScrapedChapter } from "./types";

const GENRE_NAME_TO_SLUG: Record<string, string> = {};
for (const g of Object.values(GENRE_BY_SLUG)) {
  GENRE_NAME_TO_SLUG[g.name.toLowerCase()] = g.slug;
}

function mapGenre(scrapedGenre: string): string | null {
  const lower = scrapedGenre.toLowerCase().trim();
  if (GENRE_BY_SLUG[lower]) return lower;
  if (GENRE_NAME_TO_SLUG[lower]) return GENRE_NAME_TO_SLUG[lower];
  return null;
}

function uniqueSlug(base: string, existing: Set<string>): string {
  let slug = base || "manga";
  let i = 2;
  while (existing.has(slug)) slug = `${base}-${i++}`;
  return slug;
}

/**
 * Import scraped manga data into the JSON store.
 * Returns stats about what was imported vs skipped.
 */
export async function importScrapedManga(
  scrapedList: ScrapedManga[],
  options: {
    /** Auto-approve imported content (default: true) */
    autoApprove?: boolean;
    /** Overwrite existing manga with same slug? (default: false) */
    overwrite?: boolean;
  } = {},
): Promise<{
  imported: number;
  skipped: number;
  chaptersImported: number;
  errors: string[];
}> {
  const { autoApprove = true, overwrite = false } = options;
  const reviewStatus = autoApprove ? undefined : "pending";

  const stored = await mangaStore.all();
  const existingSlugs = new Set(stored.map((m) => m.slug));
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;
  let chaptersImported = 0;

  for (const scraped of scrapedList) {
    try {
      const slug = uniqueSlug(scraped.slug, existingSlugs);

      if (!overwrite && existingSlugs.has(slug)) {
        skipped++;
        continue;
      }

      const genreSlugs = scraped.genres
        .map(mapGenre)
        .filter((s): s is string => s !== null);

      const now = new Date().toISOString();
      const nowDate = new Date();

      const chapters: StoredChapter[] = scraped.chapters.map((ch: ScrapedChapter) => {
        chaptersImported++;
        const releasedAt = new Date(nowDate.getTime() - (scraped.chapters.length - ch.number) * 86400000).toISOString();
        return {
          id: randomUUID(),
          mangaId: "", // filled below
          number: ch.number,
          title: ch.title || undefined,
          releasedAt,
          pages: ch.pageImages || [],
          uploaderId: "scraper",
          reviewStatus: autoApprove ? undefined : "pending",
        };
      });

      const mangaId = randomUUID();
      for (const ch of chapters) {
        ch.mangaId = mangaId;
      }

      const record: StoredManga = {
        id: mangaId,
        slug,
        title: scraped.title,
        authorName: scraped.author || undefined,
        coverImage: scraped.coverImage,
        bannerImage: scraped.bannerImage,
        synopsis: scraped.synopsis,
        genreSlugs,
        status: scraped.status,
        year: scraped.year,
        views: 0,
        uploaderId: "scraper",
        createdAt: now,
        updatedAt: now,
        chapters,
        reviewStatus,
      };

      if (overwrite) {
        const idx = stored.findIndex((m) => m.slug === slug);
        if (idx !== -1) {
          stored[idx] = record;
          imported++;
          continue;
        }
      }

      stored.push(record);
      existingSlugs.add(slug);
      imported++;
    } catch (err) {
      errors.push(`${scraped.title}: ${err}`);
    }
  }

  await mangaStore.save(stored);
  return { imported, skipped, chaptersImported, errors };
}

export async function importScrapedMangaDryRun(
  scrapedList: ScrapedManga[],
): Promise<{
  wouldImport: number;
  wouldSkip: number;
  chaptersToImport: number;
  genreSummary: Record<string, number>;
}> {
  const stored = await mangaStore.all();
  const existingSlugs = new Set(stored.map((m) => m.slug));

  const genreSummary: Record<string, number> = {};
  let wouldImport = 0;
  let wouldSkip = 0;
  let chaptersToImport = 0;

  for (const scraped of scrapedList) {
    const slug = uniqueSlug(scraped.slug, existingSlugs);

    if (existingSlugs.has(slug)) {
      wouldSkip++;
      continue;
    }

    wouldImport++;
    chaptersToImport += scraped.chapters.length;

    for (const g of scraped.genres) {
      const slugG = mapGenre(g);
      if (slugG) genreSummary[slugG] = (genreSummary[slugG] || 0) + 1;
    }
  }

  return { wouldImport, wouldSkip, chaptersToImport, genreSummary };
}
