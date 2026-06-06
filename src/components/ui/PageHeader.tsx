import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  count?: number;
  accent?: "orange" | "blue";
  /** Optional trailing controls (e.g. sort). */
  action?: React.ReactNode;
  className?: string;
}

const CHIP = {
  orange: "bg-accent/10 text-accent ring-1 ring-accent/25",
  blue: "bg-royal/10 text-royal ring-1 ring-royal/25",
} as const;

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  count,
  accent = "orange",
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-card",
            CHIP[accent],
          )}
        >
          <Icon className="size-6" strokeWidth={2.3} aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
              {title}
            </h1>
            {typeof count === "number" ? (
              <span className="rounded-md bg-overlay px-2.5 py-0.5 text-xs font-bold text-fg-muted ring-1 ring-line">
                {count.toLocaleString("ar")}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1.5 text-sm leading-relaxed text-fg-subtle">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {action}
    </header>
  );
}
