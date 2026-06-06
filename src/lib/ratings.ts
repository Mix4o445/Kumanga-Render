import type { RatingSummary } from "@/types";
import { ratingsStore } from "@/lib/db/store";

/**
 * User star ratings for manga (1–5, one per user per manga). Server-only.
 */

export async function getRatingSummary(
  mangaId: string,
  userId?: string,
): Promise<RatingSummary> {
  const all = await ratingsStore.all();
  const forManga = all.filter((r) => r.mangaId === mangaId);
  const count = forManga.length;
  const average = count
    ? forManga.reduce((sum, r) => sum + r.value, 0) / count
    : 0;
  const mine = userId
    ? forManga.find((r) => r.userId === userId)?.value ?? null
    : null;
  return { average: Math.round(average * 10) / 10, count, mine };
}

/** Upsert the user's rating (clamped to 1–5). */
export async function rateManga(
  mangaId: string,
  userId: string,
  value: number,
): Promise<void> {
  const clamped = Math.min(5, Math.max(1, Math.round(value)));
  const all = await ratingsStore.all();
  const existing = all.find((r) => r.mangaId === mangaId && r.userId === userId);
  const now = new Date().toISOString();
  if (existing) {
    existing.value = clamped;
    existing.updatedAt = now;
  } else {
    all.push({ mangaId, userId, value: clamped, updatedAt: now });
  }
  await ratingsStore.save(all);
}
