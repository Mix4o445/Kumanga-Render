import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, Check, X, BookOpen, Layers, Inbox } from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin";
import { getPendingManga, getPendingChapters } from "@/lib/db";
import { getProfileById } from "@/lib/profile";
import {
  approveMangaAction,
  rejectMangaAction,
  approveChapterAction,
  rejectChapterAction,
} from "@/lib/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatChapterLabel } from "@/lib/utils";

export const metadata = { title: "لوحة المراجعة | قارئ مانجا" };

function ApproveButton() {
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-1.5 rounded-pill bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30 transition-colors hover:bg-emerald-500/25 active:scale-95"
    >
      <Check className="size-4" aria-hidden />
      موافقة
    </button>
  );
}

function RejectButton() {
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-1.5 rounded-pill bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30 transition-colors hover:bg-rose-500/25 active:scale-95"
    >
      <X className="size-4" aria-hidden />
      رفض
    </button>
  );
}

export default async function AdminReviewPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const [pendingManga, pendingChapters] = await Promise.all([
    getPendingManga(),
    getPendingChapters(),
  ]);

  // Resolve uploader display names in one pass.
  const ids = Array.from(
    new Set(
      [
        ...pendingManga.map((m) => m.uploaderId),
        ...pendingChapters.map((c) => c.uploaderId),
      ].filter((x): x is string => Boolean(x)),
    ),
  );
  const profiles = await Promise.all(ids.map((id) => getProfileById(id)));
  const nameById = new Map(
    ids.map((id, i) => [id, profiles[i]?.displayName || profiles[i]?.username || "مستخدم"]),
  );

  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        title="لوحة المراجعة"
        subtitle="راجع الأعمال والفصول المرفوعة ووافق عليها قبل ظهورها للقرّاء."
        accent="blue"
      />

      <div className="space-y-10">
        {/* Pending manga */}
        <section>
          <div className="mb-4 flex items-center gap-2.5">
            <BookOpen className="size-4 text-fg-subtle" strokeWidth={2.25} aria-hidden />
            <h2 className="text-sm font-bold tracking-tight text-fg">
              أعمال بانتظار المراجعة ({pendingManga.length.toLocaleString("ar")})
            </h2>
          </div>

          {pendingManga.length > 0 ? (
            <ul className="space-y-3">
              {pendingManga.map((manga) => (
                <li
                  key={manga.id}
                  className="flex items-center gap-4 rounded-card border border-line bg-surface-raised/40 p-3"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-md ring-1 ring-line">
                    <Image
                      src={manga.coverImage}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/manga/${manga.slug}`}
                      className="truncate font-bold text-fg transition-colors hover:text-accent"
                    >
                      {manga.title}
                    </Link>
                    <p className="truncate text-xs text-fg-faint">
                      بواسطة {nameById.get(manga.uploaderId ?? "") ?? "مستخدم"} ·{" "}
                      {manga.totalChapters.toLocaleString("ar")} فصل معتمد
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form action={approveMangaAction}>
                      <input type="hidden" name="mangaId" value={manga.id} />
                      <ApproveButton />
                    </form>
                    <form action={rejectMangaAction}>
                      <input type="hidden" name="mangaId" value={manga.id} />
                      <RejectButton />
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Inbox}
              title="لا توجد أعمال بانتظار المراجعة"
              description="ستظهر هنا الأعمال الجديدة التي يرفعها المستخدمون."
            />
          )}
        </section>

        {/* Pending chapters */}
        <section>
          <div className="mb-4 flex items-center gap-2.5">
            <Layers className="size-4 text-fg-subtle" strokeWidth={2.25} aria-hidden />
            <h2 className="text-sm font-bold tracking-tight text-fg">
              فصول بانتظار المراجعة ({pendingChapters.length.toLocaleString("ar")})
            </h2>
          </div>

          {pendingChapters.length > 0 ? (
            <ul className="space-y-3">
              {pendingChapters.map(({ manga, chapter, uploaderId }) => (
                <li
                  key={chapter.id}
                  className="flex items-center gap-4 rounded-card border border-line bg-surface-raised/40 p-3"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-md bg-overlay text-sm font-bold text-fg-muted ring-1 ring-line">
                    {chapter.number.toLocaleString("ar")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/manga/${manga.slug}`}
                      className="truncate font-bold text-fg transition-colors hover:text-accent"
                    >
                      {manga.title}
                    </Link>
                    <p className="truncate text-xs text-fg-faint">
                      {chapter.title
                        ? `${formatChapterLabel(chapter.number)} — ${chapter.title}`
                        : formatChapterLabel(chapter.number)}{" "}
                      · بواسطة {nameById.get(uploaderId) ?? "مستخدم"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form action={approveChapterAction}>
                      <input type="hidden" name="mangaId" value={chapter.mangaId} />
                      <input type="hidden" name="chapterId" value={chapter.id} />
                      <ApproveButton />
                    </form>
                    <form action={rejectChapterAction}>
                      <input type="hidden" name="mangaId" value={chapter.mangaId} />
                      <input type="hidden" name="chapterId" value={chapter.id} />
                      <RejectButton />
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Inbox}
              title="لا توجد فصول بانتظار المراجعة"
              description="ستظهر هنا الفصول الجديدة التي يرفعها المستخدمون."
            />
          )}
        </section>
      </div>
    </div>
  );
}
