import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Library, Inbox, Check, Clock3, Ban } from "lucide-react";
import { getMangaByUploader, getChapters } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatChapterLabel } from "@/lib/utils";
import type { ReviewStatus } from "@/types";

export const metadata = { title: "أعمالي | قارئ مانجا" };

function ReviewBadge({ status }: { status?: ReviewStatus }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-500/25">
        <Clock3 className="size-3.5" aria-hidden />
        قيد المراجعة
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-pill bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-300 ring-1 ring-rose-500/25">
        <Ban className="size-3.5" aria-hidden />
        مرفوض
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/25">
      <Check className="size-3.5" aria-hidden />
      مقبول
    </span>
  );
}

/** Small inline status pill for a chapter row. */
function ChapterStatus({ status }: { status?: ReviewStatus }) {
  if (status === "pending") {
    return (
      <span className="shrink-0 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-amber-500/25">
        قيد المراجعة
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="shrink-0 rounded-md bg-rose-500/15 px-2 py-0.5 text-[11px] font-bold text-rose-300 ring-1 ring-rose-500/25">
        مرفوض
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/25">
      مقبول
    </span>
  );
}

export default async function MyUploadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my-uploads");

  const uploads = await getMangaByUploader(user.id, { includeUnapproved: true });
  // Fetch every chapter (including pending/rejected) for each upload.
  const chaptersByManga = await Promise.all(
    uploads.map((m) => getChapters(m.slug, { includeUnapproved: true })),
  );

  return (
    <div>
      <PageHeader
        icon={Library}
        title="أعمالي"
        subtitle="تابع حالة أعمالك وفصولك المرفوعة: قيد المراجعة، مقبولة، أو مرفوضة. ستصلك إشعارات القرار في صندوق الدعم."
        accent="orange"
      />

      {uploads.length > 0 ? (
        <ul className="space-y-4">
          {uploads.map((manga, i) => {
            const chapters = chaptersByManga[i];
            return (
              <li
                key={manga.id}
                className="rounded-card border border-line bg-surface-raised/40 p-3"
              >
                <div className="flex items-center gap-4">
                  <Link
                    href={`/manga/${manga.slug}`}
                    className="relative size-16 shrink-0 overflow-hidden rounded-md ring-1 ring-line"
                  >
                    <Image
                      src={manga.coverImage}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/manga/${manga.slug}`}
                      className="block truncate font-bold text-fg transition-colors hover:text-accent"
                    >
                      {manga.title}
                    </Link>
                    <p className="truncate text-xs text-fg-faint">
                      {chapters.length.toLocaleString("ar")} فصل
                    </p>
                  </div>
                  <ReviewBadge status={manga.reviewStatus} />
                </div>

                {chapters.length > 0 ? (
                  <ul className="mt-3 space-y-1 border-t border-line pt-3">
                    {chapters.map((chapter) => (
                      <li key={chapter.id}>
                        <Link
                          href={`/manga/${manga.slug}/${chapter.number}`}
                          className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-overlay"
                        >
                          <span className="truncate text-sm font-medium text-fg-muted">
                            {chapter.title
                              ? `${formatChapterLabel(chapter.number)} — ${chapter.title}`
                              : formatChapterLabel(chapter.number)}
                          </span>
                          <ChapterStatus status={chapter.reviewStatus} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={Inbox}
          title="لم ترفع أي عمل بعد"
          description="ابدأ بمشاركة عمل جديد مع القرّاء."
        />
      )}
    </div>
  );
}
