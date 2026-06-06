"use client";

import {
  SETTINGS_KEYS,
  useStored,
  type ReaderMode,
  type ReaderQuality,
} from "@/lib/clientSettings";

/** How many leading pages load eagerly for each quality preset. */
const EAGER_PAGES: Record<ReaderQuality, number> = {
  high: 3,
  medium: 1,
  data: 0,
};

/**
 * Renders chapter pages according to the reader preferences:
 * - mode "vertical": continuous top-to-bottom scroll (default).
 * - mode "horizontal": RTL page-by-page scroll-snap.
 * - quality: controls how many pages load eagerly vs. lazily (data saver
 *   defers every page until it scrolls into view).
 */
export function ChapterReader({ pages }: { pages: string[] }) {
  const [mode] = useStored<ReaderMode>(SETTINGS_KEYS.readerMode, "vertical");
  const [quality] = useStored<ReaderQuality>(SETTINGS_KEYS.readerQuality, "high");
  const eager = EAGER_PAGES[quality] ?? 3;

  if (mode === "horizontal") {
    return (
      <div className="flex snap-x snap-mandatory overflow-x-auto rounded-card bg-black/30 scrollbar-hide">
        {pages.map((src, index) => (
          <div
            key={src}
            className="flex min-w-full snap-center items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`صفحة ${index + 1}`}
              loading={index < eager ? "eager" : "lazy"}
              decoding="async"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card bg-black/30">
      {pages.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`صفحة ${index + 1}`}
          loading={index < eager ? "eager" : "lazy"}
          decoding="async"
          className="block w-full"
        />
      ))}
    </div>
  );
}
