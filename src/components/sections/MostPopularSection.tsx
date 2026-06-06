import { Flame, ChevronLeft, Compass } from "lucide-react";
import Link from "next/link";
import type { Manga } from "@/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerGroup, StaggerItem } from "@/components/ui/motion";
import { PosterCardSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/EmptyState";
import { MangaPosterCard } from "@/components/cards/MangaPosterCard";

interface MostPopularSectionProps {
  items: Manga[];
  isLoading?: boolean;
  viewAllHref?: string;
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-pill px-2 py-1 text-sm font-semibold text-fg-subtle transition-colors hover:text-orange-400"
    >
      عرض الكل
      <ChevronLeft className="size-4" aria-hidden />
    </Link>
  );
}

export function MostPopularSection({
  items,
  isLoading = false,
  viewAllHref = "/popular",
}: MostPopularSectionProps) {
  return (
    <section>
      <SectionHeading
        icon={Flame}
        title="الأكثر شعبية"
        accent="orange"
        action={<ViewAll href={viewAllHref} />}
        className="mb-5"
      />

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[150px] shrink-0 sm:w-[168px]">
              <PosterCardSkeleton />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <StaggerGroup className="flex snap-x gap-4 overflow-x-auto pb-3 scrollbar-hide">
          {items.map((manga) => (
            <StaggerItem
              key={manga.id}
              className="w-[150px] shrink-0 snap-start sm:w-[168px]"
            >
              <MangaPosterCard manga={manga} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <EmptyState
          icon={Compass}
          title="لا توجد عناوين شائعة بعد"
          description="بمجرد إضافة عناوين إلى قاعدة البيانات، ستظهر هنا أكثرها قراءةً."
        />
      )}
    </section>
  );
}
