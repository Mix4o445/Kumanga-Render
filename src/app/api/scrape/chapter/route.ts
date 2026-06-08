import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentAdmin } from "@/lib/admin";
import { mangaStore } from "@/lib/db/store";
import { scrapeChapterPagesApi, scrapeChapterPages } from "@/lib/scraper/madara";

export const maxDuration = 300;

interface ChapterRequest {
  chapterUrl: string;
  mangaSlug: string;
  chapterNumber?: number;
  cookies?: string;
  userAgent?: string;
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ChapterRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.chapterUrl || !body.mangaSlug) {
    return NextResponse.json(
      { error: "chapterUrl and mangaSlug are required" },
      { status: 400 },
    );
  }

  try {
    const startTime = Date.now();
    const headers = body.userAgent ? { "User-Agent": body.userAgent } : undefined;

    const images = (await scrapeChapterPagesApi(body.chapterUrl, headers))
      ?? await scrapeChapterPages(body.chapterUrl, headers, body.cookies);

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images found on chapter page" }, { status: 502 });
    }

    const stored = await mangaStore.all();
    const manga = stored.find((m) => m.slug === body.mangaSlug);

    if (!manga) {
      return NextResponse.json({ error: `Manga "${body.mangaSlug}" not found in store` }, { status: 404 });
    }

    let chapterNumber = body.chapterNumber;
    if (!chapterNumber) {
      const numMatch = body.chapterUrl.match(/(\d+\.?\d*)\/?$/);
      chapterNumber = numMatch ? parseFloat(numMatch[1]) : undefined;
    }

    let chapter = chapterNumber
      ? manga.chapters.find((c) => c.number === chapterNumber)
      : undefined;

    if (!chapter) {
      chapter = {
        id: randomUUID(),
        mangaId: manga.id,
        number: chapterNumber ?? manga.chapters.length + 1,
        releasedAt: new Date().toISOString(),
        pages: images,
        uploaderId: "scraper",
      };
      manga.chapters.push(chapter);
      manga.chapters.sort((a, b) => a.number - b.number);
    } else {
      chapter.pages = images;
    }

    manga.updatedAt = new Date().toISOString();
    await mangaStore.save(stored);

    return NextResponse.json({
      chapterNumber: chapter.number,
      pages: images.length,
      newChapter: !chapterNumber || !manga.chapters.find((c) => c.id === chapter!.id && c !== chapter),
      stats: { durationMs: Date.now() - startTime },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
