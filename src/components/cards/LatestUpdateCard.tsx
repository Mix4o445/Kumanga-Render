import Image from "next/image";
import Link from "next/link";
import type { MangaUpdate } from "@/types";
import { formatChapterLabel, formatRelativeTime } from "@/lib/utils";

export function LatestUpdateCard({ update }: { update: MangaUpdate }) {
  const { manga, chapter } = update;
  const chapters =
    update.recentChapters && update.recentChapters.length > 0
      ? update.recentChapters
      : [chapter];

  return (
    <div className="group flex gap-3 overflow-hidden rounded-card border border-line bg-surface p-3 transition-colors duration-150 hover:border-line-strong hover:bg-surface-raised">
      {/* Text column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link
            href={`/manga/${manga.slug}`}
            className="line-clamp-2 text-sm font-bold leading-snug text-fg transition-colors hover:text-accent"
          >
            {manga.title}
          </Link>
          <span className="shrink-0 text-[11px] font-bold text-accent">مانجا</span>
        </div>

        <ul className="mt-auto space-y-1">
          {chapters.map((c) => (
            <li key={c.id}>
              <Link
                href={`/manga/${manga.slug}/${c.number}`}
                className="flex items-center justify-between gap-2 rounded-md bg-overlay px-2.5 py-1.5 text-xs text-fg-muted transition-colors hover:bg-overlay-strong hover:text-fg"
              >
                <span className="truncate text-fg-faint" suppressHydrationWarning>
                  {formatRelativeTime(c.releasedAt)}
                </span>
                <span className="shrink-0 font-semibold">
                  {formatChapterLabel(c.number)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Cover — RTL start (right) */}
      <Link
        href={`/manga/${manga.slug}`}
        aria-label={manga.title}
        className="relative aspect-[2/3] w-20 shrink-0 self-stretch overflow-hidden rounded-md ring-1 ring-line"
      >
        <Image
          src={manga.coverImage}
          alt={manga.title}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
        />
      </Link>
    </div>
  );
}
