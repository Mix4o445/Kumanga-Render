import { Search } from "lucide-react";
import { searchManga } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { MangaGrid } from "@/components/ui/MangaGrid";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "البحث | قارئ مانجا" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q ?? "").trim();
  const results = query ? await searchManga(query) : [];

  return (
    <div>
      <PageHeader
        icon={Search}
        title="نتائج البحث"
        subtitle={
          query
            ? `عرض النتائج المطابقة لـ «${query}»`
            : "اكتب في شريط البحث بالأعلى للعثور على عمل."
        }
        count={query ? results.length : undefined}
        accent="blue"
      />

      {query ? (
        <MangaGrid
          items={results}
          emptyTitle="لا توجد نتائج مطابقة"
          emptyDescription={`لم نعثر على أي عمل يطابق «${query}». جرّب كلمات مختلفة.`}
        />
      ) : (
        <EmptyState
          icon={Search}
          title="ابدأ البحث"
          description="ابحث عن عنوان مانجا أو اسم مؤلف أو تصنيف."
        />
      )}
    </div>
  );
}
