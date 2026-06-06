import type { HomePageData } from "@/types";
import {
  getFeatured,
  getLatestUpdates,
  getMostPopular,
} from "@/lib/db";

/**
 * Aggregates everything the home dashboard needs in one typed payload.
 *
 * This pulls from the in-app database repository (src/lib/db). To move to a
 * real database, swap the repository internals — this function and every
 * component stay exactly the same.
 */
export async function getHomePageData(): Promise<HomePageData> {
  const [featured, mostPopular, latestUpdates] = await Promise.all([
    getFeatured(5),
    getMostPopular(12),
    getLatestUpdates(8),
  ]);

  return {
    featured,
    mostPopular,
    latestUpdates,
    sidebarUpdates: latestUpdates.slice(0, 6),
  };
}
