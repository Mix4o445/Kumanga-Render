import { History, Inbox, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { MangaUpdate } from "@/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, StaggerItem } from "@/components/ui/motion";
import { UpdateRowSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import { LatestUpdateCard } from "@/components/cards/LatestUpdateCard";

interface LatestUpdatesSectionProps {
  items: MangaUpdate[];
  isLoading?: boolean;
}

const GRID = "grid grid-cols-1 gap-3 sm:grid-cols-2";

function ViewAll() {
  return (
    <Link
      href="/latest"
      className="inline-flex items-center gap-1 rounded-pill px-2 py-1 text-sm font-semibold text-fg-subtle transition-colors hover:text-orange-400"
    >
      عرض الكل
      <ChevronLeft className="size-4" aria-hidden />
    </Link>
  );
}

export function LatestUpdatesSection({
  items,
  isLoading = false,
}: LatestUpdatesSectionProps) {
  return (
    <section>
      <SectionHeading
        icon={History}
        title="آخر التحديثات"
        accent="blue"
        action={<ViewAll />}
        className="mb-5"
      />

      {isLoading ? (
        <div className={GRID}>
          {Array.from({ length: 8 }).map((_, i) => (
            <UpdateRowSkeleton key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <StaggerGroup className={GRID}>
          {items.map((update) => (
            <StaggerItem key={update.id}>
              <LatestUpdateCard update={update} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <EmptyState
          icon={Inbox}
          title="لا توجد تحديثات حالياً"
          description="ستظهر الفصول الجديدة هنا فور نشرها."
        />
      )}
    </section>
  );
}
