import { randomUUID } from "node:crypto";
import type {
  Chapter,
  Genre,
  Manga,
  MangaStatus,
  MangaUpdate,
  ReviewStatus,
} from "@/types";
import { GENRES, GENRE_BY_SLUG } from "./seed-data";
import {
  mangaStore,
  type StoredChapter,
  type StoredManga,
} from "./store";

/**
 * Repository: the single data-access seam for the app. Reads/writes the JSON
 * store and maps persisted records to the UI's view types. All content here
 * originates from user uploads — there is no seeded/mock manga.
 */

/** Legacy records (no reviewStatus) are treated as approved. */
function approved(status?: ReviewStatus): boolean {
  return status === undefined || status === "approved";
}

function chaptersDesc(chapters: StoredChapter[]): StoredChapter[] {
  return [...chapters].sort((a, b) => b.number - a.number);
}

function toChapter(c: StoredChapter): Chapter {
  return {
    id: c.id,
    mangaId: c.mangaId,
    number: c.number,
    title: c.title,
    releasedAt: c.releasedAt,
    pages: c.pages,
    reviewStatus: c.reviewStatus,
  };
}

function toManga(s: StoredManga): Manga {
  // Public-facing metadata (latest chapter, counts) reflects approved chapters.
  const approvedChapters = s.chapters.filter((c) => approved(c.reviewStatus));
  const sorted = chaptersDesc(approvedChapters);
  const latest = sorted[0];
  const genres = s.genreSlugs
    .map((slug) => GENRE_BY_SLUG[slug])
    .filter((g): g is Genre => Boolean(g));

  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    author: s.authorName
      ? { id: `${s.id}-author`, name: s.authorName, role: "author" }
      : undefined,
    coverImage: s.coverImage,
    bannerImage: s.bannerImage,
    synopsis: s.synopsis,
    genres,
    status: s.status,
    totalChapters: sorted.length,
    latestChapter: latest ? toChapter(latest) : undefined,
    popularity: s.views,
    views: s.views,
    updatedAt: s.updatedAt,
    year: s.year,
    uploaderId: s.uploaderId,
    reviewStatus: s.reviewStatus,
  };
}

const byViews = (a: Manga, b: Manga) => (b.views ?? 0) - (a.views ?? 0);
const byUpdated = (a: Manga, b: Manga) =>
  new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();

async function publicManga(): Promise<Manga[]> {
  const stored = await mangaStore.all();
  return stored.filter((s) => approved(s.reviewStatus)).map(toManga);
}

/* ------------------------------- genres ------------------------------- */

export async function getGenres(): Promise<Genre[]> {
  return GENRES;
}

export async function getGenreBySlug(slug: string): Promise<Genre | null> {
  return GENRE_BY_SLUG[slug] ?? null;
}

/* ------------------------------- queries ------------------------------ */

export async function getAllManga(): Promise<Manga[]> {
  return (await publicManga()).sort(byViews);
}

export async function getFeatured(limit = 5): Promise<Manga[]> {
  const all = await publicManga();
  // Newest titles that actually have at least one chapter make the best hero.
  const items = all.filter((m) => m.totalChapters > 0).sort(byUpdated);
  return (items.length ? items : all).slice(0, limit);
}

export async function getMostPopular(limit = 12): Promise<Manga[]> {
  return (await publicManga()).sort(byViews).slice(0, limit);
}

export async function getTopRated(limit = 12): Promise<Manga[]> {
  return (await publicManga())
    .sort(
      (a, b) =>
        (b.rating ?? 0) - (a.rating ?? 0) || (b.views ?? 0) - (a.views ?? 0),
    )
    .slice(0, limit);
}

export async function getRecentlyUpdated(limit = 12): Promise<Manga[]> {
  return (await publicManga()).sort(byUpdated).slice(0, limit);
}

export async function getByStatus(
  status: MangaStatus,
  limit?: number,
): Promise<Manga[]> {
  const items = (await publicManga())
    .filter((m) => m.status === status)
    .sort(byViews);
  return limit ? items.slice(0, limit) : items;
}

export async function getCompleted(limit?: number): Promise<Manga[]> {
  return getByStatus("completed", limit);
}

export async function getByGenre(slug: string, limit?: number): Promise<Manga[]> {
  const items = (await publicManga())
    .filter((m) => m.genres.some((g) => g.slug === slug))
    .sort(byViews);
  return limit ? items.slice(0, limit) : items;
}

/**
 * Look up a manga by slug. By default only approved titles are returned;
 * pass `includeUnapproved` (for the owner or an admin) to bypass the gate.
 */
export async function getMangaBySlug(
  slug: string,
  { includeUnapproved = false }: { includeUnapproved?: boolean } = {},
): Promise<Manga | null> {
  const stored = await mangaStore.all();
  const found = stored.find((m) => m.slug === slug);
  if (!found) return null;
  if (!includeUnapproved && !approved(found.reviewStatus)) return null;
  return toManga(found);
}

/** Every title uploaded by a given user, newest activity first. */
export async function getMangaByUploader(
  uploaderId: string,
  { includeUnapproved = false }: { includeUnapproved?: boolean } = {},
): Promise<Manga[]> {
  const stored = await mangaStore.all();
  return stored
    .filter((m) => m.uploaderId === uploaderId)
    .filter((m) => includeUnapproved || approved(m.reviewStatus))
    .map(toManga)
    .sort(byUpdated);
}

export async function searchManga(query: string): Promise<Manga[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return (await publicManga())
    .filter((m) => {
      const haystack = [m.title, m.author?.name ?? "", ...m.genres.map((g) => g.name)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort(byViews);
}

export async function getRelated(slug: string, limit = 6): Promise<Manga[]> {
  const items = await publicManga();
  const base = items.find((m) => m.slug === slug);
  if (!base) return [];
  const baseGenres = new Set(base.genres.map((g) => g.slug));
  return items
    .filter((m) => m.slug !== slug)
    .map((m) => ({ m, score: m.genres.filter((g) => baseGenres.has(g.slug)).length }))
    .sort((a, b) => b.score - a.score || (b.m.views ?? 0) - (a.m.views ?? 0))
    .slice(0, limit)
    .map((x) => x.m);
}

/**
 * Chapters for a manga, newest first. Public callers get approved chapters
 * only; the owner/admin can pass `includeUnapproved` to see pending ones.
 */
export async function getChapters(
  slug: string,
  { includeUnapproved = false }: { includeUnapproved?: boolean } = {},
): Promise<Chapter[]> {
  const stored = await mangaStore.all();
  const manga = stored.find((m) => m.slug === slug);
  if (!manga) return [];
  const source = includeUnapproved
    ? manga.chapters
    : manga.chapters.filter((c) => approved(c.reviewStatus));
  return chaptersDesc(source).map(toChapter);
}

/** A single chapter plus its neighbours — powers the reader. */
export async function getChapterContext(
  slug: string,
  number: number,
  { includeUnapproved = false }: { includeUnapproved?: boolean } = {},
) {
  const stored = await mangaStore.all();
  const manga = stored.find((m) => m.slug === slug);
  if (!manga) return null;
  if (!includeUnapproved && !approved(manga.reviewStatus)) return null;
  const source = includeUnapproved
    ? manga.chapters
    : manga.chapters.filter((c) => approved(c.reviewStatus));
  const asc = [...source].sort((a, b) => a.number - b.number);
  const index = asc.findIndex((c) => c.number === number);
  if (index === -1) return null;
  return {
    manga: toManga(manga),
    chapter: toChapter(asc[index]),
    prev: index > 0 ? asc[index - 1].number : null,
    next: index < asc.length - 1 ? asc[index + 1].number : null,
  };
}

export async function getLatestUpdates(limit = 12): Promise<MangaUpdate[]> {
  return (await publicManga())
    .filter((m) => m.latestChapter)
    .sort(byUpdated)
    .slice(0, limit)
    .map<MangaUpdate>((m, index) => ({
      id: `${m.slug}-update`,
      manga: m,
      chapter: m.latestChapter!,
      updatedAt: m.updatedAt ?? m.latestChapter!.releasedAt,
      hasUnread: index < 4,
    }));
}

/* ------------------------------- review ------------------------------- */

/** A chapter awaiting review, with its manga and the uploader's id. */
export interface PendingChapterReview {
  manga: Manga;
  chapter: Chapter;
  uploaderId: string;
}

/** Manga awaiting admin review (newest first). */
export async function getPendingManga(): Promise<Manga[]> {
  const stored = await mangaStore.all();
  return stored
    .filter((m) => m.reviewStatus === "pending")
    .map(toManga)
    .sort(byUpdated);
}

/** Chapters awaiting admin review across all manga (newest first). */
export async function getPendingChapters(): Promise<PendingChapterReview[]> {
  const stored = await mangaStore.all();
  const out: PendingChapterReview[] = [];
  for (const m of stored) {
    for (const c of m.chapters) {
      if (c.reviewStatus === "pending") {
        out.push({ manga: toManga(m), chapter: toChapter(c), uploaderId: c.uploaderId });
      }
    }
  }
  return out.sort(
    (a, b) =>
      new Date(b.chapter.releasedAt).getTime() -
      new Date(a.chapter.releasedAt).getTime(),
  );
}

export async function setMangaReview(
  mangaId: string,
  status: ReviewStatus,
): Promise<boolean> {
  const stored = await mangaStore.all();
  const manga = stored.find((m) => m.id === mangaId);
  if (!manga) return false;
  manga.reviewStatus = status;
  await mangaStore.save(stored);
  return true;
}

export async function setChapterReview(
  mangaId: string,
  chapterId: string,
  status: ReviewStatus,
): Promise<boolean> {
  const stored = await mangaStore.all();
  const manga = stored.find((m) => m.id === mangaId);
  if (!manga) return false;
  const chapter = manga.chapters.find((c) => c.id === chapterId);
  if (!chapter) return false;
  chapter.reviewStatus = status;
  await mangaStore.save(stored);
  return true;
}

/* ------------------------------ mutations ----------------------------- */

async function uniqueSlug(base: string): Promise<string> {
  const stored = await mangaStore.all();
  const taken = new Set(stored.map((m) => m.slug));
  let slug = base || "manga";
  let i = 2;
  while (taken.has(slug)) slug = `${base}-${i++}`;
  return slug;
}

export async function createManga(
  input: Omit<StoredManga, "id" | "slug" | "views" | "createdAt" | "updatedAt" | "chapters"> & {
    slugBase: string;
    reviewStatus: ReviewStatus;
  },
): Promise<StoredManga> {
  const stored = await mangaStore.all();
  const now = new Date().toISOString();
  const record: StoredManga = {
    id: randomUUID(),
    slug: await uniqueSlug(input.slugBase),
    title: input.title,
    authorName: input.authorName,
    coverImage: input.coverImage,
    bannerImage: input.bannerImage,
    synopsis: input.synopsis,
    genreSlugs: input.genreSlugs,
    status: input.status,
    year: input.year,
    views: 0,
    uploaderId: input.uploaderId,
    createdAt: now,
    updatedAt: now,
    chapters: [],
    reviewStatus: input.reviewStatus,
  };
  stored.push(record);
  await mangaStore.save(stored);
  return record;
}

export async function addChapter(input: {
  slug: string;
  number: number;
  title?: string;
  pages: string[];
  uploaderId: string;
  reviewStatus: ReviewStatus;
}): Promise<StoredManga | null> {
  const stored = await mangaStore.all();
  const manga = stored.find((m) => m.slug === input.slug);
  if (!manga) return null;
  const now = new Date().toISOString();
  manga.chapters.push({
    id: randomUUID(),
    mangaId: manga.id,
    number: input.number,
    title: input.title,
    releasedAt: now,
    pages: input.pages,
    uploaderId: input.uploaderId,
    reviewStatus: input.reviewStatus,
  });
  // Only an approved chapter counts as fresh "activity" for public ordering.
  if (approved(input.reviewStatus)) manga.updatedAt = now;
  await mangaStore.save(stored);
  return manga;
}

export async function chapterExists(slug: string, number: number): Promise<boolean> {
  const stored = await mangaStore.all();
  const manga = stored.find((m) => m.slug === slug);
  return Boolean(manga?.chapters.some((c) => c.number === number));
}
