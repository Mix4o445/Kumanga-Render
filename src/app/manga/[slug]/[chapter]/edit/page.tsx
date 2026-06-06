import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { getChapterContext } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { EditChapterForm } from "@/components/manga/EditChapterForm";

export const metadata = { title: "تعديل الفصل | قارئ مانجا" };

export default async function EditChapterPage({
  params,
}: {
  params: { slug: string; chapter: string };
}) {
  const user = await getCurrentUser();
  const number = parseFloat(params.chapter);
  if (!user)
    redirect(`/login?next=/manga/${params.slug}/${params.chapter}/edit`);
  if (!Number.isFinite(number)) notFound();

  const ctx = await getChapterContext(params.slug, number, {
    includeUnapproved: true,
  });
  if (!ctx) notFound();

  const admin = await isAdmin(user);
  if (!admin)
    redirect(`/manga/${params.slug}`);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        icon={Pencil}
        title="تعديل الفصل"
        subtitle={`تعديل فصل من «${ctx.manga.title}».`}
        accent="blue"
      />
      <EditChapterForm
        mangaId={ctx.manga.id}
        chapterId={ctx.chapter.id}
        defaultNumber={ctx.chapter.number}
        defaultTitle={ctx.chapter.title}
      />
    </div>
  );
}
