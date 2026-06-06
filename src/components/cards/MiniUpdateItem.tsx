import Image from "next/image";
import Link from "next/link";
import type { MangaUpdate } from "@/types";
import { formatChapterLabel } from "@/lib/utils";

export function MiniUpdateItem({ update }: { update: MangaUpdate }) {
  const { manga, chapter, hasUnread } = update;

  return (
    <Link
      href={`/manga/${manga.slug}`}
      className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-overlay"
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
        <Image
          src={manga.coverImage}
          alt={manga.title}
          fill
          sizes="40px"
          className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-110"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg transition-colors group-hover:text-fg">
          {manga.title}
        </p>
        <p className="truncate text-xs text-fg-subtle">
          {formatChapterLabel(chapter.number)}
        </p>
      </div>

      {hasUnread ? (
        <span className="relative grid size-2.5 shrink-0 place-items-center" aria-label="غير مقروء">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-royal/70" />
          <span className="relative inline-flex size-2 rounded-full bg-royal" />
        </span>
      ) : null}
    </Link>
  );
}
