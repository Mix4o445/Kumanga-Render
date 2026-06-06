import Link from "next/link";
import { LayoutGrid, ChevronLeft } from "lucide-react";
import { getAllManga } from "@/lib/db";
import { GENRE_NAV } from "@/lib/config";
import { PageHeader } from "@/components/ui/PageHeader";
import { StaggerGroup, StaggerItem } from "@/components/ui/motion";

export const metadata = { title: "المانجا حسب النوع | قارئ مانجا" };

export default async function GenresPage() {
  const all = await getAllManga();
  const counts = new Map<string, number>();
  for (const manga of all) {
    for (const genre of manga.genres) {
      counts.set(genre.slug, (counts.get(genre.slug) ?? 0) + 1);
    }
  }

  return (
    <div>
      <PageHeader
        icon={LayoutGrid}
        title="المانجا حسب النوع"
        subtitle="اختر تصنيفًا لاستكشاف الأعمال المرتبطة به."
        count={GENRE_NAV.length}
      />

      <StaggerGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {GENRE_NAV.map((genre) => {
          const Icon = genre.icon;
          return (
            <StaggerItem key={genre.id}>
              <Link
                href={`/genre/${genre.slug}`}
                className="group flex items-center gap-4 rounded-card border border-line bg-surface-raised/50 p-4 transition-all duration-300 ease-out-soft hover:-translate-y-1 hover:border-orange-500/30 hover:bg-surface-raised hover:shadow-card-hover"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-card bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-6" strokeWidth={2.1} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-fg">{genre.name}</p>
                  <p className="text-xs text-fg-subtle">
                    {(counts.get(genre.slug) ?? 0).toLocaleString("ar")} عنوان
                  </p>
                </div>
                <ChevronLeft className="size-5 text-fg-faint transition-all duration-300 group-hover:-translate-x-1 group-hover:text-orange-400" aria-hidden />
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </div>
  );
}
