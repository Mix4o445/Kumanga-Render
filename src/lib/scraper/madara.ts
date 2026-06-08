import * as cheerio from "cheerio";
import type { ScrapedManga, ScrapedChapter, ScraperOptions, ScrapeResult } from "./types";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

async function fetchWithRetry(url: string, retries = 3, headers?: Record<string, string>): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { ...DEFAULT_HEADERS, ...headers } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || `manga-${Date.now()}`;
}

function parseStatus(text: string): ScrapedManga["status"] {
  const t = text.toLowerCase().trim();
  if (t.includes("ongo") || t.includes("published")) return "ongoing";
  if (t.includes("complet") || t.includes("finished")) return "completed";
  if (t.includes("hiatus") || t.includes("dropped")) return "hiatus";
  if (t.includes("cancel")) return "cancelled";
  return "ongoing";
}

function parseYear(text: string): number | undefined {
  const m = text.match(/(\d{4})/);
  return m ? parseInt(m[1]) : undefined;
}

function cleanText($el: any): string {
  return $el.text().replace(/\s+/g, " ").trim();
}

/**
 * Extract manga URLs from a listing page.
 * Supports the common Madara listing layouts.
 */
export function extractMangaUrls(html: string, baseUrl: string): { url: string; title: string }[] {
  const $ = cheerio.load(html);
  const results: { url: string; title: string }[] = [];

  const selectors = [
    ".page-item-detail .item-thumb a",
    ".c-image-hover a",
    ".manga-title a",
    "article .post-title a",
    ".entry-title a",
    "h3 a[href*='manga']",
    ".c-tabs-item__content a",
  ];

  const seen = new Set<string>();
  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const href = $(el).attr("href");
      const title = cleanText($(el));
      if (href && title && !seen.has(href)) {
        seen.add(href);
        results.push({ url: href.startsWith("http") ? href : `${baseUrl}${href}`, title });
      }
    });
  }

  return results;
}

/**
 * Extract pagination info for the manga list.
 */
export function extractPagination(html: string): { current: number; total: number } {
  const $ = cheerio.load(html);
  let total = 1;
  let current = 1;

  const lastLink = $(".page-numbers:not(.next):not(.prev)").last();
  const pageNum = lastLink.text().trim();
  if (pageNum) {
    total = parseInt(pageNum) || 1;
  }

  const currentLink = $(".page-numbers.current");
  if (currentLink.length) {
    current = parseInt(cleanText(currentLink)) || 1;
  }

  if (total === 1) {
    const navText = $(".wp-pagenavi .pages").text();
    const m = navText.match(/page\s*(\d+)\s*of\s*(\d+)/i);
    if (m) {
      current = parseInt(m[1]) || 1;
      total = parseInt(m[2]) || 1;
    }
  }

  return { current, total };
}

/**
 * Determine the next listing page URL.
 */
function nextPageUrl(
  currentPage: number,
  baseUrl: string,
  listPath: string,
): string {
  if (currentPage === 1) {
    return `${baseUrl}${listPath}`;
  }
  return `${baseUrl}${listPath}page/${currentPage}/`;
}

/**
 * Try to detect if the site uses Madara's REST API by probing the endpoint.
 */
async function tryApi(baseUrl: string): Promise<{ available: boolean; pages?: number } | null> {
  try {
    const res = await fetch(`${baseUrl}/wp-json/manga/v1/manga?page=1&posts_per_page=1`, {
      headers: DEFAULT_HEADERS,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return { available: true, pages: undefined };
      }
      if (data?.posts) {
        const total = Math.ceil(data.total / data.posts_per_page);
        return { available: true, pages: total };
      }
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Scrape a manga detail page and extract all metadata + chapter list.
 */
export async function scrapeMangaDetail(url: string, headers?: Record<string, string>): Promise<ScrapedManga> {
  const html = await fetchWithRetry(url, 3, headers);
  const $ = cheerio.load(html);

  const title = cleanText($(".post-title, .entry-title, h1")).split("\n")[0].trim()
    || url.split("/").filter(Boolean).pop() || "Unknown";

  const cover =
    $(".summary_image img, .wp-manga-cover img, .thumb img").first().attr("data-src")
    || $(".summary_image img, .wp-manga-cover img, .thumb img").first().attr("src")
    || "";

  let synopsis = "";
  const synSel = $(".description-summary p, .summary__content p, .post-content p, .manga-excerpt p");
  if (synSel.length) {
    synopsis = synSel.map((_, el) => cleanText($(el))).get().filter(Boolean).join("\n\n");
  }

  const genres: string[] = [];
  $(".genres-content a, a[href*='/genre/'], .manga-genre a").each((_, el) => {
    const g = cleanText($(el));
    if (g) genres.push(g);
  });

  const author = cleanText($(".author-content a, .artist-content a").first()) || undefined;

  const statusText = cleanText(
    $(".post-status .status-content, .summary-content:contains('Status') .summary-content-value, .post-status_item:contains('Status') .summary-content"),
  ) || cleanText($(".post-status"));
  const status = parseStatus(statusText);

  const yearText = cleanText(
    $(".summary-content:contains('Year') .summary-content-value, .post-status_item:contains('Year') .summary-content"),
  );
  const year = parseYear(yearText);

  const altTitles: string[] = [];
  $(".alternative, .post-content_item:contains('Alternative') .summary-content, .alternative-font a").each((_, el) => {
    const t = cleanText($(el));
    if (t) altTitles.push(t);
  });

  const chapters: ScrapedChapter[] = [];
  const chapterSelectors = [
    "ul.main li.wp-manga-chapter",
    ".chapter-item",
    ".wp-manga-list-chapter li",
    "ul.chapter-list li",
    ".c-chapters__item",
  ];

  for (const sel of chapterSelectors) {
    const items = $(sel);
    if (items.length > 0) {
      items.each((_, el) => {
        const link = $(el).find("a").first();
        const href = link.attr("href");
        const chapterTitle = cleanText($(el).find("a").first());
        const chapterText = cleanText($(el).find(".chapter-number").length ? $(el).find(".chapter-number") : $(el));

        if (href) {
          const numMatch = chapterText.match(/(\d+\.?\d*)/);
          const num = numMatch ? parseFloat(numMatch[1]) : chapters.length + 1;
          chapters.push({
            number: num,
            title: chapterTitle || undefined,
            url: href.startsWith("http") ? href : `${new URL(url).origin}${href}`,
          });
        }
      });
      break;
    }
  }

  chapters.sort((a, b) => a.number - b.number);

  return {
    title,
    slug: slugify(title),
    coverImage: cover,
    synopsis: synopsis || "No synopsis available.",
    genres: [...new Set(genres)],
    author,
    status,
    year,
    altTitles: altTitles.length > 0 ? altTitles : undefined,
    chapters,
  };
}

/**
 * Scrape a chapter page to extract image URLs.
 */
export async function scrapeChapterPages(url: string, headers?: Record<string, string>): Promise<string[]> {
  const html = await fetchWithRetry(url, 3, headers);
  const $ = cheerio.load(html);

  const images: string[] = [];
  const imgSelectors = [
    ".reading-content img",
    ".page-break img",
    "#readerarea img",
    ".reading-content source",
    ".page-break source",
    ".chapter-images img",
    "div.text-center img",
    ".wp-manga-chapter-img",
  ];

  for (const sel of imgSelectors) {
    $(sel).each((_, el) => {
      const src = $(el).attr("data-src") || $(el).attr("src") || $(el).attr("data-lazy-src") || "";
      if (src && !src.includes("data:image")) {
        images.push(src.startsWith("http") ? src : `${new URL(url).origin}${src}`);
      }
    });
    if (images.length > 0) break;
  }

  return images;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function mapConcurrent<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(fn));
    for (const r of batchResults) {
      if (r.status === "fulfilled") results.push(r.value);
    }
  }
  return results;
}

/**
 * Main entry: scrape all manga from a Madara-based site.
 */
export async function scrapeMadara(options: ScraperOptions): Promise<ScrapeResult> {
  const {
    baseUrl,
    maxPages = 0,
    concurrency = 3,
    scrapeChapterPages: scrapeImages = false,
    delay = 1000,
    listPath = "/manga/",
    headers,
  } = options;

  const startTime = Date.now();
  const errors: { url: string; error: string }[] = [];
  const allManga: ScrapedManga[] = [];

  const base = baseUrl.replace(/\/+$/, "");

  // Gather all manga URLs from listing pages
  console.log(`🔍 Discovering manga from ${base}${listPath} ...`);
  const mangaEntries: { url: string; title: string }[] = [];

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const pageUrl = nextPageUrl(page, base, listPath);
    console.log(`  📄 Listing page ${page} → ${pageUrl}`);

    try {
      const html = await fetchWithRetry(pageUrl, 3, headers);
      const entries = extractMangaUrls(html, base);
      const existingSlugs = new Set(mangaEntries.map((e) => e.url));
      const newEntries = entries.filter((e) => !existingSlugs.has(e.url));
      mangaEntries.push(...newEntries);

      if (newEntries.length === 0) {
        hasMore = false;
        console.log(`  ✅ No new entries found on page ${page}, stopping.`);
        break;
      }

      const pagination = extractPagination(html);
      console.log(`     Found ${newEntries.length} manga (total: ${mangaEntries.length})`);

      if (maxPages > 0 && page >= maxPages) {
        hasMore = false;
      } else if (pagination.total > page) {
        page++;
      } else {
        hasMore = false;
      }
    } catch (err) {
      errors.push({ url: pageUrl, error: String(err) });
      hasMore = false;
    }

    if (hasMore) await sleep(delay);
  }

  console.log(`\n📚 Total manga discovered: ${mangaEntries.length}`);

  // Scrape each manga detail page
  console.log(`\n🔎 Scraping manga details (concurrency: ${concurrency})...`);

  const scrapeOne = async (entry: { url: string; title: string }): Promise<ScrapedManga | null> => {
    try {
      const manga = await scrapeMangaDetail(entry.url, headers);
      await sleep(delay);
      return manga;
    } catch (err) {
      errors.push({ url: entry.url, error: String(err) });
      return null;
    }
  };

  const results = await mapConcurrent(mangaEntries, scrapeOne, concurrency);
  for (const r of results) {
    if (r) allManga.push(r);
  }

  // Optionally scrape chapter page images
  if (scrapeImages) {
    console.log(`\n🖼️  Scraping chapter page images...`);
    let totalChapters = 0;
    for (const manga of allManga) {
      const chEntries = manga.chapters;
      const scrapeChapter = async (ch: ScrapedChapter): Promise<ScrapedChapter> => {
        try {
          ch.pageImages = await scrapeChapterPages(ch.url, headers);
          await sleep(delay / 2);
        } catch (err) {
          errors.push({ url: ch.url, error: String(err) });
        }
        return ch;
      };
      const scrapedChapters = await mapConcurrent(chEntries, scrapeChapter, concurrency);
      manga.chapters = scrapedChapters;
      totalChapters += scrapedChapters.length;
      console.log(`  ✅ ${manga.title}: ${scrapedChapters.length} chapters scraped`);
    }
  }

  const totalChapters = allManga.reduce((sum, m) => sum + m.chapters.length, 0);
  const totalPages = allManga.reduce((sum, m) => sum + m.chapters.reduce((s, c) => s + (c.pageImages?.length || 0), 0), 0);

  return {
    manga: allManga,
    errors,
    stats: {
      totalManga: allManga.length,
      totalChapters,
      totalPages,
      durationMs: Date.now() - startTime,
    },
  };
}

export interface ChaptersScrapeOptions {
  /** Full URL to the Madara manga detail page */
  mangaUrl: string;
  /** Whether to scrape chapter page images */
  scrapeImages?: boolean;
  /** Concurrency for scraping chapter pages */
  concurrency?: number;
  /** Delay between requests in ms */
  delay?: number;
  /** Custom headers */
  headers?: Record<string, string>;
}

export interface ChaptersScrapeResult {
  title: string;
  slug: string;
  chapters: ScrapedChapter[];
  errors: { url: string; error: string }[];
  stats: {
    totalChapters: number;
    totalPages: number;
    durationMs: number;
  };
}

/**
 * Scrape chapters from a single Madara manga detail page.
 * Optionally scrapes page images for each chapter.
 */
export async function scrapeMadaraChapters(
  options: ChaptersScrapeOptions,
): Promise<ChaptersScrapeResult> {
  const {
    mangaUrl,
    scrapeImages = false,
    concurrency = 3,
    delay = 1000,
    headers,
  } = options;

  const startTime = Date.now();
  const errors: { url: string; error: string }[] = [];

  const manga = await scrapeMangaDetail(mangaUrl, headers);

  if (scrapeImages) {
    const scrapeOne = async (ch: ScrapedChapter): Promise<ScrapedChapter> => {
      try {
        ch.pageImages = await scrapeChapterPages(ch.url, headers);
      } catch (err) {
        errors.push({ url: ch.url, error: String(err) });
      }
      return ch;
    };
    manga.chapters = await mapConcurrent(manga.chapters, scrapeOne, concurrency);
  }

  const totalPages = manga.chapters.reduce(
    (s, c) => s + (c.pageImages?.length || 0),
    0,
  );

  return {
    title: manga.title,
    slug: manga.slug,
    chapters: manga.chapters,
    errors,
    stats: {
      totalChapters: manga.chapters.length,
      totalPages,
      durationMs: Date.now() - startTime,
    },
  };
}
