import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin";
import { scrapeMangaDetailApi, scrapeMangaDetail, scrapeChapterPagesApi, scrapeChapterPages } from "@/lib/scraper/madara";
import { importScrapedManga, importScrapedMangaDryRun } from "@/lib/scraper/importer";
import type { ScrapedManga } from "@/lib/scraper/types";

export const maxDuration = 300;

interface MangaRequest {
  url: string;
  images?: boolean;
  dryRun?: boolean;
  autoApprove?: boolean;
  overwrite?: boolean;
  cookies?: string;
  userAgent?: string;
  maxChapters?: number;
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: MangaRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const startTime = Date.now();
    const headers = body.userAgent ? { "User-Agent": body.userAgent } : undefined;

    const manga: ScrapedManga | null = await scrapeMangaDetailApi(body.url, headers)
      ?? await scrapeMangaDetail(body.url, headers, body.cookies);

    if (!manga) {
      return NextResponse.json({ error: "Failed to scrape manga from URL" }, { status: 502 });
    }

    const maxChapters = body.maxChapters ?? 200;
    if (manga.chapters.length > maxChapters) {
      manga.chapters = manga.chapters.slice(-maxChapters);
    }

    if (body.images) {
      for (const ch of manga.chapters) {
        try {
          ch.pageImages = (await scrapeChapterPagesApi(ch.url, headers))
            ?? await scrapeChapterPages(ch.url, headers, body.cookies);
        } catch {
          // keep empty
        }
      }
    }

    if (body.dryRun) {
      const dry = await importScrapedMangaDryRun([manga]);
      return NextResponse.json({
        type: "dry-run",
        title: manga.title,
        slug: manga.slug,
        chapters: manga.chapters.length,
        ...dry,
        stats: { durationMs: Date.now() - startTime },
      });
    }

    const autoApprove = body.autoApprove !== false;
    const imp = await importScrapedManga([manga], {
      autoApprove,
      overwrite: body.overwrite ?? false,
    });

    return NextResponse.json({
      type: "import",
      title: manga.title,
      slug: manga.slug,
      chapters: manga.chapters.length,
      ...imp,
      stats: { durationMs: Date.now() - startTime },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
