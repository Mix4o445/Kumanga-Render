import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Manga } from "@/types";
import { formatChapterLabel, formatRating } from "@/lib/utils";

export function MangaPosterCard({ manga }: { manga: Manga }) {
  const chapterNumber = manga.latestChapter?.number ?? manga.totalChapters;

  return (
    <Link
      href={`/manga/${manga.slug}`}
      className="group block rounded-card outline-none"
    >
      <article className="relative aspect-[2/3] overflow-hidden rounded-card bg-surface-raised shadow-card ring-1 ring-line transition-all duration-200 ease-out-soft group-hover:-translate-y-1 group-hover:shadow-card-hover group-hover:ring-line-strong group-focus-visible:-translate-y-1">
        <Image
          src={manga.coverImage}
          alt={manga.title}
          fill
          sizes="(max-width: 768px) 40vw, 180px"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Rating / "new" chip — top start (right in RTL). */}
        {typeof manga.rating === "number" ? (
          <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
            <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
            {formatRating(manga.rating)}
          </span>
        ) : (
          <span className="absolute start-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            جديد
          </span>
        )}

        {/* Bottom vignette keeps the overlay text readable on any cover. */}
        <div className="poster-scrim pointer-events-none absolute inset-0" />

        <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-3">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">
            {manga.title}
          </h3>
          <span className="inline-block rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
            {formatChapterLabel(chapterNumber)}
          </span>
        </div>
      </article>
    </Link>
  );
}
