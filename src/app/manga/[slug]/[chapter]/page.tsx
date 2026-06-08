import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, List, Layers, UserRound } from "lucide-react";
import { getChapterContext, incrementMangaViews } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getProfileById } from "@/lib/profile";
import { formatChapterLabel } from "@/lib/utils";
import { ChapterReader } from "@/components/manga/ChapterReader";
import { CommentsSection } from "@/components/comments/CommentsSection";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; chapter: string };
}) {
  const ctx = await getChapterContext(params.slug, Number(params.chapter));
  return {
    title: ctx
      ? `${ctx.manga.title} — ${formatChapterLabel(ctx.chapter.number)} | قارئ مانجا`
      : "الفصل غير موجود",
  };
}

function ChapterNav({
  slug,
  prev,
  next,
}: {
  slug: string;
  prev: number | null;
  next: number | null;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-bold transition-all active:scale-95";
  return (
    <div className="flex items-center justify-between gap-3">
      {prev !== null ? (
        <Link href={`/manga/${slug}/${prev}`} className={`${base} bg-overlay text-fg hover:bg-overlay-strong`}>
          <ChevronRight className="size-4" aria-hidden />
          الفصل السابق
        </Link>
      ) : (
        <span className={`${base} cursor-not-allowed bg-overlay text-fg-faint opacity-60`}>
          <ChevronRight className="size-4" aria-hidden />
          الفصل السابق
        </span>
      )}

      <Link
        href={`/manga/${slug}`}
        className="inline-flex items-center gap-1.5 rounded-pill border border-line px-4 py-2 text-sm font-semibold text-fg-muted transition-colors hover:text-orange-400"
      >
        <List className="size-4" aria-hidden />
        الفصول
      </Link>

      {next !== null ? (
        <Link href={`/manga/${slug}/${next}`} className={`${base} bg-royal text-white shadow-glow-blue hover:bg-blue-500`}>
          الفصل التالي
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={`${base} cursor-not-allowed bg-overlay text-fg-faint opacity-60`}>
          الفصل التالي
          <ChevronLeft className="size-4" aria-hidden />
        </span>
      )}
    </div>
  );
}

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: { slug: string; chapter: string };
  searchParams: { v?: string };
}) {
  const number = Number(params.chapter);
  if (!Number.isFinite(number)) notFound();

  const versionId = searchParams.v;
  const user = await getCurrentUser();
  const admin = await isAdmin(user);

  // Try as a public reader first; if nothing's found, allow owner/admins to
  // preview pending content.
  let ctx = await getChapterContext(params.slug, number, { versionId });
  const publicView = Boolean(ctx);
  if (!ctx && (admin || user)) {
    const preview = await getChapterContext(params.slug, number, {
      includeUnapproved: true,
      versionId,
    });
    if (preview && (admin || user?.id === preview.manga.uploaderId)) {
      ctx = preview;
    }
  }
  if (!ctx) notFound();

  // Count a view only for public (approved) reads, so owner/admin previews of
  // pending content don't inflate the counter.
  if (publicView) {
    await incrementMangaViews(ctx.manga.id);
  }

  const { manga, chapter, prev, next, versions } = ctx;
  const pages = chapter.pages ?? [];

  // Resolve uploader display names for the version switcher.
  const versionUploaders: Record<string, { username: string; displayName?: string }> = {};
  if (versions.length > 1) {
    const ids = Array.from(
      new Set(versions.map((v) => v.uploaderId).filter((x): x is string => Boolean(x))),
    );
    const profiles = await Promise.all(ids.map((id) => getProfileById(id)));
    ids.forEach((id, i) => {
      const p = profiles[i];
      if (p) versionUploaders[id] = { username: p.username, displayName: p.displayName };
    });
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/manga/${manga.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-subtle transition-colors hover:text-orange-400"
        >
          <ArrowRight className="size-4" aria-hidden />
          {manga.title}
        </Link>
        <h1 className="mt-2 text-xl font-extrabold tracking-tight text-fg">
          {chapter.title
            ? `${formatChapterLabel(chapter.number)} — ${chapter.title}`
            : formatChapterLabel(chapter.number)}
        </h1>
        <p className="mt-1 text-sm text-fg-subtle">
          {pages.length.toLocaleString("ar")} صفحة
        </p>
      </div>

      {versions.length > 1 ? (
        <div className="mb-6 rounded-card border border-line bg-surface-raised/40 p-4">
          <p className="mb-2.5 flex items-center gap-2 text-sm font-bold text-fg">
            <Layers className="size-4 shrink-0 text-orange-400" aria-hidden />
            النسخ المتاحة ({versions.length.toLocaleString("ar")})
          </p>
          <div className="flex flex-wrap gap-2">
            {versions.map((v) => {
              const up = v.uploaderId ? versionUploaders[v.uploaderId] : undefined;
              const name = up ? up.displayName || up.username : "مجهول";
              const isActive = v.id === chapter.id;
              return (
                <Link
                  key={v.id}
                  href={`/manga/${manga.slug}/${chapter.number}?v=${v.id}`}
                  scroll={false}
                  className={
                    isActive
                      ? "inline-flex items-center gap-1.5 rounded-pill border border-orange-500/50 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-400"
                      : "inline-flex items-center gap-1.5 rounded-pill border border-line bg-overlay px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                  }
                >
                  <UserRound className="size-3.5" aria-hidden />
                  {name}
                  <span className="text-fg-faint">
                    · {v.pageCount.toLocaleString("ar")} ص
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mb-6">
        <ChapterNav slug={manga.slug} prev={prev} next={next} />
      </div>
      </div>

      {/* Pages — width controlled by the reader settings */}
      <ChapterReader pages={pages} />

      <div className="mx-auto mt-6 max-w-3xl">
        <ChapterNav slug={manga.slug} prev={prev} next={next} />
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <CommentsSection
          targetType="chapter"
          targetId={chapter.id}
          path={`/manga/${manga.slug}/${chapter.number}`}
        />
      </div>
    </div>
  );
}
