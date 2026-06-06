"use client";

import { Bookmark, Check } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  slug: string;
  variant?: "icon" | "full" | "ghost";
  className?: string;
}

export function FavoriteButton({
  slug,
  variant = "icon",
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggle, ready } = useFavorites();
  const active = ready && isFavorite(slug);

  const label = active ? "في المفضلة" : "أضف للمفضلة";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggle(slug)}
        aria-pressed={active}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-pill border px-5 py-2.5 text-sm font-bold transition-all active:scale-95",
          active
            ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
            : "border-line-strong bg-overlay text-fg hover:bg-overlay-strong",
          className,
        )}
      >
        {active ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Bookmark className="size-4" aria-hidden />
        )}
        {label}
      </button>
    );
  }

  const base =
    variant === "ghost"
      ? "hover:bg-overlay"
      : "border border-line-strong bg-overlay backdrop-blur-sm hover:bg-overlay-strong";

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "grid place-items-center rounded-pill transition-colors active:scale-95",
        base,
        active ? "text-orange-400" : "text-fg hover:text-fg",
        className ?? "size-10",
      )}
    >
      <Bookmark className={cn("size-5", active && "fill-orange-400")} aria-hidden />
    </button>
  );
}
