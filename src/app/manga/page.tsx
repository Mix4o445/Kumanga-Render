import { List } from "lucide-react";
import { getAllManga } from "@/lib/db";
import { GENRE_NAV } from "@/lib/config";
import { PageHeader } from "@/components/ui/PageHeader";
import { MangaGrid } from "@/components/ui/MangaGrid";
import { FilterChips, type FilterOption } from "@/components/ui/FilterChips";

export const metadata = { title: "قائمة المانجا | قارئ مانجا" };

export default async function MangaListPage() {
  const items = await getAllManga();

  const chips: FilterOption[] = [
    { label: "الكل", href: "/manga", active: true },
    ...GENRE_NAV.map((g) => ({
      label: g.name,
      href: `/genre/${g.slug}`,
      icon: g.icon,
    })),
  ];

  return (
    <div>
      <PageHeader
        icon={List}
        title="قائمة المانجا"
        subtitle="كل العناوين المتوفرة على المنصة في مكان واحد."
        count={items.length}
      />
      <div className="mb-8">
        <FilterChips options={chips} />
      </div>
      <MangaGrid items={items} />
    </div>
  );
}
