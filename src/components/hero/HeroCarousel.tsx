"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
} from "lucide-react";
import type { Manga } from "@/types";
import { STATUS_META } from "@/lib/config";
import { formatRating } from "@/lib/utils";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/EmptyState";

const AUTOPLAY_MS = 7000;

interface HeroCarouselProps {
  items: Manga[];
  isLoading?: boolean;
}

/** Localized two-digit slide index, e.g. "٠٣". */
function pad2(n: number) {
  return n.toLocaleString("ar", { minimumIntegerDigits: 2, useGrouping: false });
}

export function HeroCarousel({ items, isLoading = false }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = items.length;
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  // Auto-advance; re-arms whenever the slide, pause state, or count changes.
  useEffect(() => {
    if (paused || count <= 1) return;
    const id = window.setTimeout(next, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, count, next]);

  if (isLoading) return <HeroSkeleton />;

  if (count === 0) {
    return (
      <div className="aspect-[16/7] w-full overflow-hidden rounded-hero bg-surface-raised ring-1 ring-line">
        <EmptyState
          className="h-full border-0 bg-transparent"
          icon={Sparkles}
          title="لا يوجد عمل مميّز بعد"
          description="ستظهر العناوين المميّزة هنا فور ربط قاعدة البيانات."
        />
      </div>
    );
  }

  const active = items[index];
  const banner = active.bannerImage ?? active.coverImage;
  const status = STATUS_META[active.status];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="عناوين رائجة"
      className="relative min-h-[24rem] w-full overflow-hidden rounded-hero ring-1 ring-line sm:min-h-[20rem] lg:min-h-[22rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Blurred cover-art backdrop (crossfades between slides). */}
      <AnimatePresence>
        <motion.div
          key={active.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={banner}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="scale-110 object-cover blur-xl"
          />
        </motion.div>
      </AnimatePresence>

      {/* Uniform dark wash + bottom depth keep white text legible over any art. */}
      <div className="pointer-events-none absolute inset-0 bg-black/65" />
      <div className="hero-scrim-bottom pointer-events-none absolute inset-0" />

      {/* Content */}
      <div className="relative flex min-h-[24rem] items-center gap-5 p-5 sm:min-h-[20rem] sm:gap-6 sm:p-7 lg:min-h-[22rem] lg:gap-8 lg:p-8">
        {/* Portrait cover (RTL start → right). Sharp foreground over blurred bg. */}
        <Link
          href={`/manga/${active.slug}`}
          className="relative hidden aspect-[2/3] w-32 shrink-0 self-center overflow-hidden rounded-card shadow-panel-lg ring-1 ring-white/15 transition-transform duration-300 ease-out-soft hover:scale-[1.02] sm:block lg:w-40"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={active.coverImage}
                alt={active.title}
                fill
                priority
                sizes="160px"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </Link>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 flex-1"
          >
            <p className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
              <Sparkles className="size-3.5" aria-hidden />
              عناوين رائجة
            </p>

            <h2 className="line-clamp-2 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
              <Link href={`/manga/${active.slug}`} className="hover:text-white/90">
                {active.title}
              </Link>
            </h2>

            {active.author ? (
              <p className="mt-1.5 text-sm font-medium text-slate-300">
                {active.author.name}
              </p>
            ) : null}

            {/* Flat tag pills: rating · status · genres */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {typeof active.rating === "number" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-black/45 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                  <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                  {formatRating(active.rating)}
                </span>
              ) : null}
              <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-white">
                {status.label}
              </span>
              {active.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:line-clamp-3">
              {active.synopsis}
            </p>

            <div className="mt-5 flex items-center gap-3">
              <Link
                href={`/manga/${active.slug}`}
                className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-glow-orange transition-all hover:bg-accent-bright active:scale-95"
              >
                <BookOpen className="size-4" aria-hidden />
                اقرأ الآن
              </Link>
              <button
                type="button"
                aria-label="حفظ"
                className="grid size-11 place-items-center rounded-pill bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Bookmark className="size-5" aria-hidden />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide counter + arrows (RTL end → bottom-left) */}
        {count > 1 ? (
          <div className="absolute bottom-5 end-5 flex items-center gap-2.5">
            <span className="text-xs font-bold tabular-nums text-white/75">
              {pad2(index + 1)}
              <span className="mx-1 text-white/40">/</span>
              {pad2(count)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prev}
                aria-label="السابق"
                className="grid size-8 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="التالي"
                className="grid size-8 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
