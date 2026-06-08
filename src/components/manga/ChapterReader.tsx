"use client";

import { cn } from "@/lib/utils";
import {
  SETTINGS_KEYS,
  useStored,
  type ReaderMode,
  type ReaderQuality,
  type ReaderFit,
  type ReaderGap,
  type ReaderBg,
  type ReaderWidth,
} from "@/lib/clientSettings";

/** How many leading pages load eagerly for each quality preset. */
const EAGER_PAGES: Record<ReaderQuality, number> = {
  high: 3,
  medium: 1,
  data: 0,
};

const BG_CLASS: Record<ReaderBg, string> = {
  dark: "bg-black/30",
  gray: "bg-zinc-700",
  sepia: "bg-[#f4ecd8]",
  light: "bg-white",
};

const GAP_CLASS: Record<ReaderGap, string> = {
  none: "gap-0",
  small: "gap-2",
  large: "gap-6",
};

const WIDTH_CLASS: Record<ReaderWidth, string> = {
  narrow: "max-w-xl",
  medium: "max-w-3xl",
  wide: "max-w-5xl",
  full: "max-w-none",
};

/** Per-fit image classes for vertical (continuous) mode. */
const VFIT_CLASS: Record<ReaderFit, string> = {
  width: "block w-full",
  height: "mx-auto block max-h-screen w-auto object-contain",
  original: "mx-auto block w-auto max-w-full",
};

/** Per-fit image classes for horizontal (page-by-page) mode. */
const HFIT_CLASS: Record<ReaderFit, string> = {
  width: "w-full max-h-[90vh] object-contain",
  height: "max-h-[90vh] w-auto object-contain",
  original: "max-h-[90vh] w-auto max-w-full object-contain",
};

/**
 * Renders chapter pages according to the reader preferences:
 * - mode: continuous vertical scroll, or RTL page-by-page horizontal.
 * - quality: how many pages load eagerly vs. lazily.
 * - fit: scale pages to width / height / original size.
 * - gap: spacing between pages (vertical mode).
 * - background: surface color behind the pages.
 * - width: max width of the reading column.
 */
export function ChapterReader({ pages }: { pages: string[] }) {
  const [mode] = useStored<ReaderMode>(SETTINGS_KEYS.readerMode, "vertical");
  const [quality] = useStored<ReaderQuality>(SETTINGS_KEYS.readerQuality, "high");
  const [fit] = useStored<ReaderFit>(SETTINGS_KEYS.readerFit, "width");
  const [gap] = useStored<ReaderGap>(SETTINGS_KEYS.readerGap, "none");
  const [bg] = useStored<ReaderBg>(SETTINGS_KEYS.readerBg, "dark");
  const [width] = useStored<ReaderWidth>(SETTINGS_KEYS.readerWidth, "medium");
  const eager = EAGER_PAGES[quality] ?? 3;

  const container = cn("mx-auto w-full", WIDTH_CLASS[width]);

  if (mode === "horizontal") {
    return (
      <div className={container}>
        <div
          className={cn(
            "flex snap-x snap-mandatory overflow-x-auto rounded-card scrollbar-hide",
            BG_CLASS[bg],
          )}
        >
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
                className={HFIT_CLASS[fit]}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={container}>
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-card",
          GAP_CLASS[gap],
          BG_CLASS[bg],
        )}
      >
        {pages.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`صفحة ${index + 1}`}
            loading={index < eager ? "eager" : "lazy"}
            decoding="async"
            className={VFIT_CLASS[fit]}
          />
        ))}
      </div>
    </div>
  );
}
