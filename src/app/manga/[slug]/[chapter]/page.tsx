import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, List } from "lucide-react";
import { getChapterContext } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
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
}: {
  params: { slug: string; chapter: string };
}) {
  const number = Number(params.chapter);
  if (!Number.isFinite(number)) notFound();

  const user = await getCurrentUser();
  const admin = await isAdmin(user);

  // Try as a public reader first; if nothing's found, allow owner/admins to
  // preview pending content.
  let ctx = await getChapterContext(params.slug, number);
  if (!ctx && (admin || user)) {
    const preview = await getChapterContext(params.slug, number, {
      includeUnapproved: true,
    });
    if (preview && (admin || user?.id === preview.manga.uploaderId)) {
      ctx = preview;
    }
  }
  if (!ctx) notFound();

  const { manga, chapter, prev, next } = ctx;
  const pages = chapter.pages ?? [];

  return (
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

      <div className="mb-6">
        <ChapterNav slug={manga.slug} prev={prev} next={next} />
      </div>

      {/* Pages */}
      <ChapterReader pages={pages} />

      <div className="mt-6">
        <ChapterNav slug={manga.slug} prev={prev} next={next} />
      </div>

      <div className="mt-10">
        <CommentsSection
          targetType="chapter"
          targetId={chapter.id}
          path={`/manga/${manga.slug}/${chapter.number}`}
        />
      </div>
    </div>
  );
}
