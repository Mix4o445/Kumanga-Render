import { SearchX, type LucideIcon } from "lucide-react";
import type { Manga } from "@/types";
import { MangaPosterCard } from "@/components/cards/MangaPosterCard";
import { StaggerGroup, StaggerItem } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/EmptyState";

interface MangaGridProps {
  items: Manga[];
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function MangaGrid({
  items,
  emptyIcon = SearchX,
  emptyTitle = "لا توجد نتائج",
  emptyDescription = "جرّب تصنيفًا آخر أو عُد لاحقًا.",
}: MangaGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <StaggerGroup className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {items.map((manga) => (
        <StaggerItem key={manga.id}>
          <MangaPosterCard manga={manga} />
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
