import Link from "next/link";
import { Clock4, LayoutGrid, Inbox, ChevronLeft } from "lucide-react";
import type { MangaUpdate } from "@/types";
import { GENRE_NAV } from "@/lib/config";
import { MiniUpdateItem } from "@/components/cards/MiniUpdateItem";
import { EmptyState } from "@/components/ui/EmptyState";

interface LeftSidebarProps {
  updates: MangaUpdate[];
}

function PanelHeading({
  icon: Icon,
  title,
  href,
}: {
  icon: typeof Clock4;
  title: string;
  href: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <Icon className="size-4 text-fg-subtle" strokeWidth={2.25} aria-hidden />
        <h3 className="text-sm font-bold tracking-tight text-fg">{title}</h3>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-0.5 rounded-pill px-1.5 py-1 text-xs font-semibold text-fg-faint transition-colors hover:text-orange-400"
      >
        عرض الكل
        <ChevronLeft className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

export function LeftSidebar({ updates }: LeftSidebarProps) {
  return (
    <aside className="sticky top-[var(--nav-height)] hidden h-[calc(100vh-var(--nav-height))] shrink-0 xl:block xl:w-[300px]">
      <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-6 scrollbar-hide">
        {/* Latest updates (mini list) */}
        <section className="rounded-card border border-line bg-surface-raised/40 p-4">
          <PanelHeading icon={Clock4} title="آخر التحديثات" href="/latest" />
          <div className="space-y-0.5">
            {updates.length > 0 ? (
              updates.map((update) => (
                <MiniUpdateItem key={update.id} update={update} />
              ))
            ) : (
              <EmptyState
                variant="inline"
                icon={Inbox}
                title="لا توجد تحديثات بعد"
                description="ستظهر آخر الفصول هنا فور توفرها."
              />
            )}
          </div>
        </section>

        {/* Browse by genre */}
        <section className="rounded-card border border-line bg-surface-raised/40 p-4">
          <PanelHeading icon={LayoutGrid} title="تصفح حسب النوع" href="/genres" />
          <ul className="space-y-0.5">
            {GENRE_NAV.map((genre) => {
              const Icon = genre.icon;
              return (
                <li key={genre.id}>
                  <Link
                    href={`/genre/${genre.slug}`}
                    className="group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-orange-400"
                  >
                    <Icon
                      className="size-[18px] text-fg-faint transition-all duration-200 ease-out-soft group-hover:-translate-x-1 group-hover:text-orange-400"
                      strokeWidth={2.1}
                      aria-hidden
                    />
                    <span className="flex-1">{genre.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </aside>
  );
}
