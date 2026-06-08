import { notFound, redirect } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { getMangaBySlug } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { EditMangaForm } from "@/components/manga/EditMangaForm";
import { DeleteButton } from "@/components/manga/DeleteButton";
import { clearChapterTitlesAction } from "@/lib/actions";

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
  if (!admin) redirect(`/manga/${params.slug}`);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={Pencil}
        title="تعديل العمل"
        subtitle={`تعديل بيانات «${manga.title}».`}
        accent="blue"
      />
      <EditMangaForm manga={manga} />
      <div className="mt-8 rounded-card border border-rose-500/20 bg-rose-500/5 p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-rose-400">
          <Trash2 className="size-4" />
          أدوات متقدمة
        </h3>
        <p className="mb-4 text-xs text-fg-faint">
          مسح عناوين جميع الفصول دفعة واحدة. لا يمكن التراجع عن هذا الإجراء.
        </p>
        <DeleteButton
          action={clearChapterTitlesAction}
          fields={{ mangaId: manga.id, slug: manga.slug }}
          confirmMessage="هل أنت متأكد؟ سيتم حذف عناوين جميع الفصول."
          label="حذف عناوين الفصول"
        />
      </div>
    </div>
  );
}
