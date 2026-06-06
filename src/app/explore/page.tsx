import { Compass } from "lucide-react";
import { getAllManga } from "@/lib/db";
import { GENRE_NAV } from "@/lib/config";
import { PageHeader } from "@/components/ui/PageHeader";
import { MangaGrid } from "@/components/ui/MangaGrid";
import { FilterChips, type FilterOption } from "@/components/ui/FilterChips";

export const metadata = { title: "استكشاف | قارئ مانجا" };

export default async function ExplorePage() {
  const items = await getAllManga();

  const chips: FilterOption[] = [
    { label: "الكل", href: "/explore", active: true },
    ...GENRE_NAV.map((g) => ({
      label: g.name,
      href: `/genre/${g.slug}`,
      icon: g.icon,
    })),
  ];

  return (
    <div>
      <PageHeader
        icon={Compass}
        title="استكشاف"
        subtitle="تصفّح المكتبة بالكامل واكتشف عملك القادم."
        count={items.length}
      />
      <div className="mb-8">
        <FilterChips options={chips} />
      </div>
      <MangaGrid items={items} />
    </div>
  );
}
