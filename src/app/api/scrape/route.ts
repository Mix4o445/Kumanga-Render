import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin";
import { mangaStore } from "@/lib/db/store";
import { scrapeMadara } from "@/lib/scraper/madara";
import { importScrapedManga, importScrapedMangaDryRun } from "@/lib/scraper/importer";

export const maxDuration = 300; // Up to 5 min on Vercel Pro

interface ScrapeRequest {
  url: string;
  pages?: number;
  concurrency?: number;
  images?: boolean;
  delay?: number;
  listPath?: string;
  dryRun?: boolean;
  autoApprove?: boolean;
  overwrite?: boolean;
  cookies?: string;
  userAgent?: string;
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ScrapeRequest;
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

    // Only scrape manga that don't already exist in the store
    const stored = await mangaStore.all();
    const existingSlugs = new Set(stored.map((m) => m.slug));

    const result = await scrapeMadara({
      baseUrl: body.url,
      maxPages: body.pages ?? 1,
      skipExistingSlugs: existingSlugs,
      concurrency: body.concurrency ?? 3,
      scrapeChapterPages: body.images ?? false,
      delay: body.delay ?? 1500,
      listPath: body.listPath ?? "/manga/",
      cookies: body.cookies,
      userAgent: body.userAgent,
    });

    // Send progress update back
    if (body.dryRun) {
      const dry = await importScrapedMangaDryRun(result.manga);
      return NextResponse.json({
        type: "dry-run",
        ...dry,
        errors: result.errors,
        stats: result.stats,
      });
    }

    const autoApprove = body.autoApprove !== false;
    const imp = await importScrapedManga(result.manga, {
      autoApprove,
      overwrite: body.overwrite ?? false,
    });

    return NextResponse.json({
      type: "import",
      ...imp,
      stats: {
        ...result.stats,
        durationMs: Date.now() - startTime,
      },
      errors: result.errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
