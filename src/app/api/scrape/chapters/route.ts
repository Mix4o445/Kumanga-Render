import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin";
import { scrapeMadaraChapters } from "@/lib/scraper/madara";
import { importScrapedChapters } from "@/lib/scraper/importer";

export const maxDuration = 300;

interface ChaptersRequest {
  mangaUrl: string;
  slug: string;
  images?: boolean;
  concurrency?: number;
  delay?: number;
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

  let body: ChaptersRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.mangaUrl || !body.slug) {
    return NextResponse.json(
      { error: "mangaUrl and slug are required" },
      { status: 400 },
    );
  }

  try {
    const startTime = Date.now();

    const result = await scrapeMadaraChapters({
      mangaUrl: body.mangaUrl,
      scrapeImages: body.images ?? false,
      concurrency: body.concurrency ?? 3,
      delay: body.delay ?? 1500,
      cookies: body.cookies,
      userAgent: body.userAgent,
    });

    if (body.dryRun) {
      return NextResponse.json({
        type: "dry-run",
        title: result.title,
        chapters: result.chapters.length,
        pages: result.stats.totalPages,
        errors: result.errors,
        stats: result.stats,
      });
    }

    const autoApprove = body.autoApprove !== false;
    const imp = await importScrapedChapters(body.slug, result.chapters, {
      autoApprove,
      overwrite: body.overwrite ?? false,
    });

    return NextResponse.json({
      type: "import",
      title: result.title,
      ...imp,
      stats: {
        ...result.stats,
        durationMs: Date.now() - startTime,
      },
      errors: [...result.errors, ...imp.errors],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
