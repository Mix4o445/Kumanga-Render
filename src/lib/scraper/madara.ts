import * as cheerio from "cheerio";
import type { ScrapedManga, ScrapedChapter, ScraperOptions, ScrapeResult } from "./types";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

async function fetchWithRetry(
  url: string,
  retries = 3,
  headers?: Record<string, string>,
  cookies?: string,
): Promise<string> {
  const merged: Record<string, string> = { ...DEFAULT_HEADERS, ...headers };
  if (cookies) merged.Cookie = cookies;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: merged });
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
 * Extract manga URLs from a WordPress sitemap (fallback for JS-rendered listing pages).
 */
export async function extractMangaUrlsFromSitemap(
  baseUrl: string,
): Promise<{ url: string; title: string }[]> {
  const sitemapPaths = ["/wp-sitemap.xml", "/sitemap.xml", "/sitemap_index.xml"];
  for (const path of sitemapPaths) {
    try {
      const res = await fetch(`${baseUrl}${path}`, { headers: DEFAULT_HEADERS });
      if (!res.ok) continue;
      const text = await res.text();
      const slugs = new Set<string>();
      const regex = new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/manga/([^/<]+)`, "g");
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (match[1]) slugs.add(match[1]);
      }
      if (slugs.size > 0) {
        return Array.from(slugs).map((slug) => ({
          url: `${baseUrl}/manga/${slug}/`,
          title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        }));
      }
    } catch { /* try next */ }
  }
  return [];
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
      const href = ($(el).attr("href") || "").trim();
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
/**
 * Try to scrape manga detail via Madara's REST API (/wp-json/manga/v1/).
 * Returns null if the API is unavailable or the manga isn't found.
 */
export async function scrapeMangaDetailApi(
  mangaUrl: string,
  headers?: Record<string, string>,
): Promise<ScrapedManga | null> {
  const base = new URL(mangaUrl).origin;
  // Derive the slug from the URL path (last non-empty segment).
  const slug = mangaUrl.replace(/\/+$/, "").split("/").pop() || "";

  // Try the most common Madara API endpoint: /wp-json/manga/v1/manga?slug=
  const apiUrl = `${base}/wp-json/manga/v1/manga?slug=${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(apiUrl, {
      headers: { ...DEFAULT_HEADERS, ...headers, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();

    // API returns an array with one item or an object.
    const m = Array.isArray(data) ? data[0] : data;
    if (!m || !m.id) return null;

    const title = m.title || m.name || m.post_title || slug;
    const chapters: ScrapedChapter[] = [];

    // Chapters can be in m.chapters (array) or loaded via a separate endpoint.
    if (Array.isArray(m.chapters)) {
      for (const ch of m.chapters) {
        const num = parseFloat(ch.number) || parseFloat(ch.slug) || chapters.length + 1;
        const chUrl = ch.link || ch.url || `${base}/manga/${slug}/${ch.number}/`;
        chapters.push({
          number: num,
          title: ch.title || ch.name || undefined,
          url: chUrl,
        });
      }
    }

    // If no chapters in the response, try the chapter list endpoint.
    if (chapters.length === 0) {
      const chRes = await fetch(
        `${base}/wp-json/manga/v1/chapters?manga_id=${m.id}`,
        { headers: { ...DEFAULT_HEADERS, ...headers, Accept: "application/json" } },
      );
      if (chRes.ok) {
        const chData = await chRes.json();
        const chList = Array.isArray(chData) ? chData : (chData.posts || []);
        for (const ch of chList) {
          const num = parseFloat(ch.number) || parseFloat(ch.slug) || chapters.length + 1;
          chapters.push({
            number: num,
            title: ch.title || ch.name || undefined,
            url: ch.link || ch.url || `${base}/manga/${slug}/${ch.number}/`,
          });
        }
      }
    }

    chapters.sort((a, b) => a.number - b.number);

    return {
      title,
      slug: slugify(title),
      coverImage: m.thumbnail || m.cover_image || m.coverImage || m.image || "",
      synopsis: m.synopsis || m.description || m.excerpt || m.post_excerpt || "",
      genres: Array.isArray(m.genres)
        ? m.genres.map((g: any) => (typeof g === "string" ? g : g.name || g.slug || ""))
        : [],
      author: m.author || m.author_name || undefined,
      status: parseStatus(m.status || m.manga_status || ""),
      year: m.year ? parseYear(String(m.year)) : undefined,
      chapters,
    };
  } catch {
    return null;
  }
}

/**
 * Try to scrape chapter pages via Madara's REST API.
 */
export async function scrapeChapterPagesApi(
  chapterUrl: string,
  headers?: Record<string, string>,
): Promise<string[] | null> {
  const base = new URL(chapterUrl).origin;

  // Madara stores chapter IDs; the URL may contain the numeric ID.
  // Try /wp-json/manga/v1/chapter/<id> (the id is the last numeric segment).
  const segments = chapterUrl.replace(/\/+$/, "").split("/");
  const last = segments[segments.length - 1];
  const idMatch = last.match(/(\d+)/);
  const chapterId = idMatch ? idMatch[1] : "";

  if (!chapterId) return null;

  try {
    const res = await fetch(
      `${base}/wp-json/manga/v1/chapter/${chapterId}`,
      { headers: { ...DEFAULT_HEADERS, ...headers, Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.pages || data.images || data.page_images || [];
    if (Array.isArray(pages) && pages.length > 0) {
      return pages.map((p: any) =>
        typeof p === "string" ? p : p.src || p.url || p.image || "",
      ).filter(Boolean);
    }
    return null;
  } catch {
    return null;
  }
}

export async function scrapeMangaDetail(
  url: string,
  headers?: Record<string, string>,
  cookies?: string,
): Promise<ScrapedManga> {
  const html = await fetchWithRetry(url, 3, headers, cookies);
  const $ = cheerio.load(html);

  const title = cleanText($(".post-title, .entry-title, h1")).split("\n")[0].trim()
    || url.split("/").filter(Boolean).pop() || "Unknown";

  const cover =
    ($(".summary_image img, .wp-manga-cover img, .thumb img").first().attr("data-src") || "").trim()
    || ($(".summary_image img, .wp-manga-cover img, .thumb img").first().attr("src") || "").trim()
    || ($(".detail-bg img").first().attr("data-src") || "").trim()
    || ($(".detail-bg img").first().attr("src") || "").trim()
    || "";

  let synopsis = "";
  const synSel = $(".description-summary p, .summary__content p, .post-content p, .manga-excerpt p");
  if (synSel.length) {
    synopsis = synSel.map((_, el) => cleanText($(el))).get().filter(Boolean).join("\n\n");
  }
  // WP Fire fallback
  if (!synopsis) {
    synopsis = cleanText($(".description"));
  }

  const sidebarText = cleanText($(".sidebar"));
  const genres: string[] = [];
  $(".genres-content a, a[href*='/genre/'], .manga-genre a").each((_, el) => {
    const g = cleanText($(el));
    if (g) genres.push(g);
  });
  // WP Fire fallback: genres from sidebar "التصنيفات:"
  if (genres.length === 0 && sidebarText) {
    const gMatch = sidebarText.match(/التصنيفات:\s*([^\n]+)/);
    if (gMatch) {
      genres.push(...gMatch[1].split(",").map((s: string) => s.trim()).filter(Boolean));
    }
  }

  let author = cleanText($(".author-content a, .artist-content a").first()) || undefined;
  // WP Fire fallback
  if (!author && sidebarText) {
    const aMatch = sidebarText.match(/المؤلف:\s*([^\n]+)/);
    if (aMatch) author = aMatch[1].trim();
  }

  let statusText = cleanText(
    $(".post-status .status-content, .summary-content:contains('Status') .summary-content-value, .post-status_item:contains('Status') .summary-content"),
  ) || cleanText($(".post-status"));
  // WP Fire fallback: status is the text right before the title
  if (!statusText) {
    const mangaDetail = cleanText($(".manga-detail"));
    if (mangaDetail) {
      const sMatch = mangaDetail.match(/^(مستمر|مكتملة|متوقفة|ملغاة)/);
      if (sMatch) statusText = sMatch[1];
    }
  }
  const status = parseStatus(statusText);

  let year: number | undefined;
  const yearText = cleanText(
    $(".summary-content:contains('Year') .summary-content-value, .post-status_item:contains('Year') .summary-content"),
  );
  if (yearText) year = parseYear(yearText);
  // WP Fire fallback
  if (!year && sidebarText) {
    const yMatch = sidebarText.match(/سنة الصدور:\s*(\d{4})/);
    if (yMatch) year = parseInt(yMatch[1]);
  }

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
        const href = (link.attr("href") || "").trim();
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

  // Fallback: extract chapter links from #init-links (sites that load chapters via AJAX)
  if (chapters.length === 0) {
    const initLinks = $("#init-links a[href]");
    if (initLinks.length >= 2) {
      const firstUrl = ($(initLinks[0]).attr("href") || "").trim();
      const lastUrl = ($(initLinks[1]).attr("href") || "").trim();
      const firstMatch = firstUrl.match(/(\d+)\/?$/);
      const lastMatch = lastUrl.match(/(\d+)\/?$/);
      if (firstMatch && lastMatch) {
        const firstNum = parseInt(firstMatch[1]);
        const lastNum = parseInt(lastMatch[1]);
        const min = Math.min(firstNum, lastNum);
        const max = Math.max(firstNum, lastNum);
        const pad = firstMatch[1].length;
        const origin = new URL(url).origin;
        const slug = url.replace(/\/+$/, "").split("/").pop() || "";
        const seenUrls = new Set<string>();
        for (let n = min; n <= max; n++) {
          const padded = String(n).padStart(pad, "0");
          const chUrl = `${origin}/manga/${slug}/${padded}/`;
          if (seenUrls.has(chUrl)) continue;
          seenUrls.add(chUrl);
          chapters.push({
            number: n,
            title: undefined,
            url: chUrl,
          });
        }
      }
    }
  }

  // Fallback: extract chapter links from #manga-page (WP Fire / non-standard themes)
  if (chapters.length === 0) {
    const slug = url.replace(/\/+$/, "").split("/").pop() || "";
    const seen = new Set<string>();
    $("#manga-page a").each((_, el) => {
      const href = ($(el).attr("href") || "").trim();
      if (!href || seen.has(href)) return;
      if (!href.includes("/manga/") || (slug && !href.includes(slug))) return;
      const text = cleanText($(el));
      if (!text || !/الفصل|Chapter|ch\.?\s*\d/i.test(text)) return;

      const numMatch = text.match(/(?:الفصل|Chapter|Ch\.?)\s*([\d.]+)/i);
      const num = numMatch ? parseFloat(numMatch[1]) : chapters.length + 1;

      let title = text.replace(/^(?:الفصل\s*(?:الخاص\s*)?|Chapter|Ch\.?)\s*[\d.]*\s*[:/\-]?\s*/i, "").trim();
      if (/^[a-z/]/.test(title)) {
        title = "";
      } else {
        title = title.replace(/[a-z][\w.]+[\u0600-\u06FF].*$/i, "").trim();
        title = title.replace(/[/:,]?\s*[\u0600-\u06FF]+\s*\d+,?\s*\d*$/, "").trim();
      }

      seen.add(href);
      chapters.push({
        number: num,
        title: title || undefined,
        url: href.startsWith("http") ? href : `${new URL(url).origin}${href}`,
      });
    });
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
export async function scrapeChapterPages(
  url: string,
  headers?: Record<string, string>,
  cookies?: string,
): Promise<string[]> {
  const html = await fetchWithRetry(url, 3, headers, cookies);
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
    "#ch-images img",
    ".pages img",
    ".preload-image",
  ];

  for (const sel of imgSelectors) {
    $(sel).each((_, el) => {
      let src = ($(el).attr("data-src") || $(el).attr("src") || $(el).attr("data-lazy-src") || "").trim();
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
    headers: customHeaders,
    cookies,
    userAgent,
    skipExistingSlugs,
    maxManga = 0,
  } = options;

  const headers: Record<string, string> | undefined = userAgent
    ? { ...customHeaders, "User-Agent": userAgent }
    : customHeaders;

  const startTime = Date.now();
  const errors: { url: string; error: string }[] = [];
  const allManga: ScrapedManga[] = [];

  const base = baseUrl.replace(/\/+$/, "");

  // Gather all manga URLs from listing pages
  console.log(`🔍 Discovering manga from ${base}${listPath} ...`);
  let mangaEntries: { url: string; title: string }[] = [];

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const pageUrl = nextPageUrl(page, base, listPath);
    console.log(`  📄 Listing page ${page} → ${pageUrl}`);

    try {
      const html = await fetchWithRetry(pageUrl, 3, headers, cookies);
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

  // Fallback: if no manga found via listing pages, try the sitemap (JS-rendered sites)
  if (mangaEntries.length === 0) {
    console.log(`  ⚠️  No manga found on listing pages, trying sitemap...`);
    const sitemapEntries = await extractMangaUrlsFromSitemap(base);
    if (sitemapEntries.length > 0) {
      console.log(`  ✅ Found ${sitemapEntries.length} manga via sitemap`);
      mangaEntries.push(...sitemapEntries);
    }
  }

  // Filter out manga that already exist in the store
  if (skipExistingSlugs && skipExistingSlugs.size > 0) {
    const before = mangaEntries.length;
    mangaEntries = mangaEntries.filter((e) => {
      const slug = e.url.replace(/\/+$/, "").split("/").pop() || "";
      return !skipExistingSlugs.has(slug);
    });
    const skipped = before - mangaEntries.length;
    if (skipped > 0) console.log(`  ⏭️  Skipped ${skipped} existing manga`);
  }

  // Limit total manga to scrape per run (stay within Vercel 10s timeout)
  if (maxManga > 0 && mangaEntries.length > maxManga) {
    console.log(`  ⏱️  Limiting to ${maxManga} manga (${mangaEntries.length} discovered)`);
    mangaEntries = mangaEntries.slice(0, maxManga);
  }

  // Scrape each manga detail page
  console.log(`\n🔎 Scraping manga details (concurrency: ${concurrency})...`);

  const scrapeOne = async (entry: { url: string; title: string }): Promise<ScrapedManga | null> => {
    try {
      // Try REST API first (no Cloudflare issues), fall back to HTML.
      const manga = (await scrapeMangaDetailApi(entry.url, headers))
        ?? await scrapeMangaDetail(entry.url, headers, cookies);
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
          ch.pageImages = (await scrapeChapterPagesApi(ch.url, headers))
            ?? await scrapeChapterPages(ch.url, headers, cookies);
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
  /** Raw cookie string for bypassing Cloudflare */
  cookies?: string;
  /** User-Agent matching your browser (required when using cookies) */
  userAgent?: string;
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
    headers: customHeaders,
    cookies,
    userAgent,
  } = options;

  const headers: Record<string, string> | undefined = userAgent
    ? { ...customHeaders, "User-Agent": userAgent }
    : customHeaders;

  const startTime = Date.now();
  const errors: { url: string; error: string }[] = [];

  // Try REST API first (bypasses Cloudflare on most sites).
  const apiResult = await scrapeMangaDetailApi(mangaUrl, headers);
  const manga = apiResult ?? await scrapeMangaDetail(mangaUrl, headers, cookies);

  if (manga.chapters.length === 0) {
    // No chapters found via either API or HTML — nothing to do.
  }

  if (scrapeImages) {
    const scrapeOne = async (ch: ScrapedChapter): Promise<ScrapedChapter> => {
      try {
        ch.pageImages = (await scrapeChapterPagesApi(ch.url, headers))
          ?? await scrapeChapterPages(ch.url, headers, cookies);
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
