import Link from "next/link";
import { BookOpen, ChevronLeft, Inbox } from "lucide-react";
import type { Chapter } from "@/types";
import { formatChapterLabel, formatRelativeTime } from "@/lib/utils";

export function ChapterList({
  slug,
  chapters,
}: {
  slug: string;
  chapters: Chapter[];
}) {
  return (
    <section id="chapters" className="scroll-mt-24">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-card bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
            <BookOpen className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <h2 className="text-lg font-bold tracking-tight text-fg">الفصول</h2>
        </div>
        <span className="text-sm text-fg-faint">
          {chapters.length.toLocaleString("ar")} فصل
        </span>
      </div>

      {chapters.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-surface-raised/30 px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-pill bg-overlay text-fg-faint ring-1 ring-line">
            <Inbox className="size-6" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-fg-muted">لا توجد فصول بعد</p>
          <p className="max-w-xs text-xs leading-relaxed text-fg-faint">
            كن أول من يرفع فصلًا لهذا العمل.
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface-raised/40">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <Link
                href={`/manga/${slug}/${chapter.number}`}
                className="group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-overlay"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-overlay text-sm font-bold text-fg-muted ring-1 ring-line transition-colors group-hover:text-orange-400">
                    {chapter.number.toLocaleString("ar")}
                  </span>
                  <span className="truncate text-sm font-semibold text-fg-muted transition-colors group-hover:text-fg">
                    {chapter.title
                      ? `${formatChapterLabel(chapter.number)} — ${chapter.title}`
                      : formatChapterLabel(chapter.number)}
                  </span>
                  {chapter.reviewStatus === "pending" ? (
                    <span className="shrink-0 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-amber-500/25">
                      قيد المراجعة
                    </span>
                  ) : chapter.reviewStatus === "rejected" ? (
                    <span className="shrink-0 rounded-md bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-300 ring-1 ring-rose-500/25">
                      مرفوض
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-fg-faint" suppressHydrationWarning>
                    {formatRelativeTime(chapter.releasedAt)}
                  </span>
                  <ChevronLeft
                    className="size-4 text-fg-faint transition-all group-hover:-translate-x-0.5 group-hover:text-orange-400"
                    aria-hidden
                  />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
