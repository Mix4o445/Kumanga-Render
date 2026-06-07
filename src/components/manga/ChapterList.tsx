import Link from "next/link";
import { BookOpen, ChevronLeft, Inbox, Pencil, UserRound } from "lucide-react";
import type { Chapter } from "@/types";
import { formatChapterLabel, formatRelativeTime } from "@/lib/utils";
import { deleteChapterAction } from "@/lib/actions";
import { DeleteButton } from "@/components/manga/DeleteButton";

export function ChapterList({
  slug,
  chapters,
  canManage = false,
  mangaId,
  uploaders = {},
}: {
  slug: string;
  chapters: Chapter[];
  canManage?: boolean;
  mangaId?: string;
  uploaders?: Record<string, { username: string; displayName?: string }>;
}) {
  // Readers see one row per chapter number (newest version represents the
  // group, with a badge counting alternative versions). Managers keep a flat
  // list so they can edit/delete each uploaded version individually.
  const byNumber = new Map<number, Chapter[]>();
  for (const c of chapters) {
    const list = byNumber.get(c.number) ?? [];
    list.push(c);
    byNumber.set(c.number, list);
  }
  const groups = Array.from(byNumber.values()).map((versions) => {
    const sorted = [...versions].sort(
      (a, b) =>
        new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime(),
    );
    return { rep: sorted[0], count: versions.length };
  });
  groups.sort((a, b) => b.rep.number - a.rep.number);

  const rows = canManage
    ? chapters.map((c) => ({ rep: c, count: 1 }))
    : groups;
  const distinctCount = byNumber.size;
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
          {distinctCount.toLocaleString("ar")} فصل
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
          {rows.map(({ rep: chapter, count }) => (
            <li key={chapter.id} className="flex items-center">
              <div className="min-w-0 flex-1">
              <Link
                href={`/manga/${slug}/${chapter.number}`}
                className="group flex min-w-0 items-center justify-between gap-4 px-4 pt-3 transition-colors hover:bg-overlay"
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
                  {!canManage && count > 1 ? (
                    <span className="shrink-0 rounded-md bg-orange-500/15 px-2 py-0.5 text-[11px] font-bold text-orange-300 ring-1 ring-orange-500/25">
                      {count.toLocaleString("ar")} نسخ
                    </span>
                  ) : null}
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
              {(() => {
                const up = chapter.uploaderId
                  ? uploaders[chapter.uploaderId]
                  : undefined;
                return up ? (
                  <div className="px-4 pb-2.5 ps-16">
                    <Link
                      href={`/u/${encodeURIComponent(up.username)}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-fg-faint transition-colors hover:text-orange-400"
                    >
                      <UserRound className="size-3.5" aria-hidden />
                      رفعه {up.displayName || up.username}
                    </Link>
                  </div>
                ) : (
                  <div className="pb-2.5" />
                );
              })()}
              </div>
              {canManage && mangaId ? (
                <div className="flex shrink-0 items-center gap-1.5 pe-3">
                  <Link
                    href={`/manga/${slug}/${chapter.number}/edit?v=${chapter.id}`}
                    aria-label="تعديل الفصل"
                    title="تعديل الفصل"
                    className="grid size-9 place-items-center rounded-pill bg-overlay text-fg-muted ring-1 ring-line transition-colors hover:text-fg active:scale-95"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Link>
                  <DeleteButton
                    action={deleteChapterAction}
                    fields={{ mangaId, chapterId: chapter.id }}
                    label="حذف الفصل"
                    iconOnly
                    confirmMessage={`هل أنت متأكد من حذف الفصل ${chapter.number}؟ لا يمكن التراجع.`}
                    className="grid size-9 place-items-center rounded-pill bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30 transition-colors hover:bg-rose-500/25 active:scale-95"
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
