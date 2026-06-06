import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { getMangaBySlug } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { EditMangaForm } from "@/components/manga/EditMangaForm";

export const metadata = { title: "تعديل العمل | قارئ مانجا" };

export default async function EditMangaPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/manga/${params.slug}/edit`);

  const manga = await getMangaBySlug(params.slug, { includeUnapproved: true });
  if (!manga) notFound();

  const admin = await isAdmin(user);
  if (!admin && manga.uploaderId !== user.id) redirect(`/manga/${params.slug}`);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={Pencil}
        title="تعديل العمل"
        subtitle={`تعديل بيانات «${manga.title}».`}
        accent="blue"
      />
      <EditMangaForm manga={manga} />
    </div>
  );
}
