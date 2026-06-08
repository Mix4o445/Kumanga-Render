export interface ScrapedChapter {
  number: number;
  title?: string;
  url: string;
  /** extracted page image URLs */
  pageImages?: string[];
}

export interface ScrapedManga {
  title: string;
  slug: string;
  coverImage: string;
  bannerImage?: string;
  synopsis: string;
  genres: string[];
  author?: string;
  artist?: string;
  status: "ongoing" | "completed" | "hiatus" | "cancelled";
  year?: number;
  chapters: ScrapedChapter[];
  /** Alternate titles found on the page */
  altTitles?: string[];
}

export interface ScraperOptions {
  /** Base URL of the Madara site (e.g. "https://mangasite.com") */
  baseUrl: string;
  /** How many manga pages to scrape (0 = all) */
  maxPages?: number;
  /** Concurrency for fetching detail pages */
  concurrency?: number;
  /** Whether to also scrape chapter page images */
  scrapeChapterPages?: boolean;
  /** Delay between requests in ms */
  delay?: number;
  /** Custom manga list URL path (default: /manga/) */
  listPath?: string;
  /** Custom headers to send */
  headers?: Record<string, string>;
}

export interface ScrapeResult {
  manga: ScrapedManga[];
  errors: { url: string; error: string }[];
  stats: {
    totalManga: number;
    totalChapters: number;
    totalPages: number;
    durationMs: number;
  };
}
