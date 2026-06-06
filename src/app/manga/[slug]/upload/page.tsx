import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Upload } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getChapters, getMangaBySlug } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { AddChapterForm } from "@/components/upload/AddChapterForm";

export const metadata = { title: "رفع فصل | قارئ مانجا" };

export default async function UploadChapterPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/manga/${params.slug}/upload`)}`);
  const canPublish = (await isAdmin(user)) || Boolean(user.verified);

  const manga = await getMangaBySlug(params.slug, { includeUnapproved: true });
  if (!manga) notFound();

  const chapters = await getChapters(params.slug, { includeUnapproved: true });
  const suggestedNumber = (chapters[0]?.number ?? 0) + 1;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/manga/${manga.slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-subtle transition-colors hover:text-orange-400"
      >
        <ArrowRight className="size-4" aria-hidden />
        العودة إلى {manga.title}
      </Link>

      <PageHeader
        icon={Upload}
        title={`رفع فصل جديد — ${manga.title}`}
        subtitle="ارفع صور صفحات الفصل بالترتيب الصحيح."
      />

      <AddChapterForm
        slug={manga.slug}
        suggestedNumber={suggestedNumber}
        requiresReview={!canPublish}
      />
    </div>
  );
}
