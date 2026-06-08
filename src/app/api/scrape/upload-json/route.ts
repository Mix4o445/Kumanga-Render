import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin";
import { importScrapedChapters } from "@/lib/scraper/importer";
import type { ScrapedChapter } from "@/lib/scraper/types";

export const maxDuration = 300;

interface UploadRequest {
  slug: string;
  chapters: ScrapedChapter[];
  autoApprove?: boolean;
  overwrite?: boolean;
}

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UploadRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.slug || !Array.isArray(body.chapters)) {
    return NextResponse.json(
      { error: "slug and chapters[] are required" },
      { status: 400 },
    );
  }

  if (body.chapters.length === 0) {
    return NextResponse.json(
      { error: "chapters array is empty" },
      { status: 400 },
    );
  }

  if (body.chapters.length > 5000) {
    return NextResponse.json(
      { error: "Maximum 5000 chapters per upload" },
      { status: 400 },
    );
  }

  try {
    const autoApprove = body.autoApprove !== false;
    const result = await importScrapedChapters(body.slug, body.chapters, {
      autoApprove,
      overwrite: body.overwrite ?? false,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
