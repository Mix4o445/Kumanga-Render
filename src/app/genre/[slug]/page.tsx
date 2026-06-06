import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { getByGenre, getGenreBySlug } from "@/lib/db";
import { GENRE_NAV } from "@/lib/config";
import { PageHeader } from "@/components/ui/PageHeader";
import { MangaGrid } from "@/components/ui/MangaGrid";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const genre = await getGenreBySlug(params.slug);
  return { title: genre ? `${genre.name} | قارئ مانجا` : "تصنيف غير موجود" };
}

export default async function GenrePage({
  params,
}: {
  params: { slug: string };
}) {
  const genre = await getGenreBySlug(params.slug);
  if (!genre) notFound();

  const items = await getByGenre(params.slug);
  const icon = GENRE_NAV.find((g) => g.slug === params.slug)?.icon ?? LayoutGrid;

  return (
    <div>
      <PageHeader
        icon={icon}
        title={genre.name}
        subtitle={`كل أعمال تصنيف «${genre.name}».`}
        count={items.length}
      />
      <MangaGrid
        items={items}
        emptyTitle="لا توجد أعمال في هذا التصنيف"
        emptyDescription="جرّب تصنيفًا آخر من القائمة."
      />
    </div>
  );
}
