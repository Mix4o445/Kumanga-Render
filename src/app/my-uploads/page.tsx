import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Library, Inbox, Check, Clock3, Ban } from "lucide-react";
import { getMangaByUploader } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
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

export default async function MyUploadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my-uploads");

  const uploads = await getMangaByUploader(user.id, { includeUnapproved: true });

  return (
    <div>
      <PageHeader
        icon={Library}
        title="أعمالي"
        subtitle="تابع حالة أعمالك المرفوعة: قيد المراجعة، مقبولة، أو مرفوضة. ستصلك إشعارات القرار في صندوق الدعم."
        accent="orange"
      />

      {uploads.length > 0 ? (
        <ul className="space-y-3">
          {uploads.map((manga) => (
            <li
              key={manga.id}
              className="flex items-center gap-4 rounded-card border border-line bg-surface-raised/40 p-3"
            >
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
                  {manga.totalChapters.toLocaleString("ar")} فصل معتمد
                </p>
              </div>
              <ReviewBadge status={manga.reviewStatus} />
            </li>
          ))}
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
