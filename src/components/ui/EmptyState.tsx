import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** "panel" = bordered card; "inline" = compact, for sidebars. */
  variant?: "panel" | "inline";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  variant = "panel",
  className,
}: EmptyStateProps) {
  const isPanel = variant === "panel";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isPanel
          ? "gap-3 rounded-card border border-dashed border-line-strong bg-surface px-6 py-12"
          : "gap-2 px-4 py-8",
        className,
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-card",
          isPanel
            ? "size-12 bg-accent/10 text-accent ring-1 ring-accent/20"
            : "size-10 bg-overlay text-fg-faint ring-1 ring-line",
        )}
      >
        <Icon className={isPanel ? "size-6" : "size-5"} aria-hidden />
      </span>
      <p className="text-sm font-bold text-fg">{title}</p>
      {description ? (
        <p className="max-w-xs text-xs leading-relaxed text-fg-faint">
          {description}
        </p>
      ) : null}
    </div>
  );
}
