"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { MangaUpdate } from "@/types";
import { useFavorites } from "@/lib/useFavorites";
import { cn, formatChapterLabel, formatRelativeTime } from "@/lib/utils";

export function LatestUpdateCard({ update }: { update: MangaUpdate }) {
  const { manga, chapter, updatedAt } = update;
  const { isFavorite, toggle, ready } = useFavorites();
  const bookmarked = ready && isFavorite(manga.slug);

  return (
    <div className="group relative flex items-center gap-3 rounded-card border border-line bg-surface p-3 transition-colors duration-150 hover:border-line-strong hover:bg-surface-raised">
      {/* Stretched link makes the whole card clickable without nesting buttons. */}
      <Link
        href={`/manga/${manga.slug}`}
        className="absolute inset-0 rounded-card"
        aria-label={manga.title}
      />

      {/* Cover — RTL start (right) */}
      <div className="relative size-16 shrink-0 overflow-hidden rounded-md ring-1 ring-line">
        <Image
          src={manga.coverImage}
          alt={manga.title}
          fill
          sizes="64px"
          className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
        />
      </div>

      {/* Stacked text */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-fg transition-colors group-hover:text-accent">
          {manga.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="font-semibold text-accent">
            {formatChapterLabel(chapter.number)}
          </span>
          <span className="size-1 rounded-full bg-fg-faint" aria-hidden />
          <span className="truncate text-fg-subtle" suppressHydrationWarning>
            {formatRelativeTime(updatedAt)}
          </span>
        </div>
      </div>

      {/* Bookmark — RTL end (far left) */}
      <button
        type="button"
        onClick={() => toggle(manga.slug)}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "إزالة من المفضلة" : "أضف للمفضلة"}
        className={cn(
          "relative z-10 grid size-9 shrink-0 place-items-center rounded-md transition-colors active:scale-95",
          bookmarked
            ? "bg-accent text-white"
            : "border border-line bg-surface text-fg-faint hover:border-line-strong hover:text-fg",
        )}
      >
        <Bookmark
          className={cn("size-[18px]", bookmarked && "fill-white")}
          aria-hidden
        />
      </button>
    </div>
  );
}
