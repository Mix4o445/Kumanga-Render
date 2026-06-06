"use client";

import Link from "next/link";
import { Bookmark, Compass } from "lucide-react";
import type { Manga } from "@/types";
import { useFavorites } from "@/lib/useFavorites";
import { MangaGrid } from "@/components/ui/MangaGrid";

export function FavoritesView({ all }: { all: Manga[] }) {
  const { favorites, ready } = useFavorites();

  // Avoid a hydration flash before localStorage is read.
  if (!ready) {
    return <div className="min-h-[240px]" aria-hidden />;
  }

  const order = new Map(favorites.map((slug, i) => [slug, i]));
  const items = all
    .filter((m) => order.has(m.slug))
    .sort((a, b) => (order.get(a.slug)! - order.get(b.slug)!));

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-dashed border-line bg-surface-raised/30 px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-pill bg-overlay text-fg-faint ring-1 ring-line">
          <Bookmark className="size-7" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-base font-bold text-fg">قائمتك فارغة</p>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-fg-subtle">
            أضف الأعمال التي تعجبك إلى المفضلة بالضغط على أيقونة الحفظ، وستظهر هنا.
          </p>
        </div>
        <Link
          href="/explore"
          className="mt-1 inline-flex items-center gap-2 rounded-pill bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-glow-orange transition-all hover:bg-orange-500 active:scale-95"
        >
          <Compass className="size-4" aria-hidden />
          استكشف المكتبة
        </Link>
      </div>
    );
  }

  return <MangaGrid items={items} />;
}
