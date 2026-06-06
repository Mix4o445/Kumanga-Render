"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { rateMangaAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function StarRating({
  mangaId,
  slug,
  average,
  count,
  mine,
  canRate,
}: {
  mangaId: string;
  slug: string;
  average: number;
  count: number;
  mine: number | null;
  canRate: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [hover, setHover] = useState(0);

  // What the stars show right now: hover preview → your rating → the average.
  const shown = hover || mine || Math.round(average);

  function rate(value: number) {
    if (!canRate || pending) return;
    startTransition(() => rateMangaAction(mangaId, value, slug));
  }

  return (
    <div className="rounded-card border border-line bg-surface-raised/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-fg-muted">
            {canRate ? "قيّم هذا العمل" : "تقييم القرّاء"}
          </p>
          <div
            className="mt-1.5 flex items-center gap-1"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                disabled={!canRate || pending}
                onMouseEnter={() => canRate && setHover(value)}
                onClick={() => rate(value)}
                aria-label={`${value} من ٥`}
                className={cn(
                  "transition-transform",
                  canRate && "hover:scale-110 active:scale-95",
                  !canRate && "cursor-default",
                  pending && "opacity-60",
                )}
              >
                <Star
                  className={cn(
                    "size-6",
                    value <= shown
                      ? "fill-amber-400 text-amber-400"
                      : "text-fg-faint",
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        </div>

        <div className="text-end">
          {count > 0 ? (
            <>
              <p className="text-2xl font-extrabold leading-none text-fg">
                {average.toLocaleString("ar", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                <span className="text-sm font-semibold text-fg-faint"> / ٥</span>
              </p>
              <p className="mt-1 text-xs text-fg-faint">
                {count.toLocaleString("ar")} تقييم
              </p>
            </>
          ) : (
            <p className="text-xs text-fg-faint">لا تقييمات بعد</p>
          )}
          {mine ? (
            <p className="mt-1 text-xs font-semibold text-amber-400">
              تقييمك: {mine.toLocaleString("ar")}
            </p>
          ) : null}
        </div>
      </div>

      {!canRate ? (
        <p className="mt-2 text-xs text-fg-faint">
          سجّل الدخول لتقييم هذا العمل.
        </p>
      ) : null}
    </div>
  );
}
