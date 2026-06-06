import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  href: string;
  active?: boolean;
  icon?: LucideIcon;
}

export function FilterChips({ options }: { options: FilterOption[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <Link
            key={option.href}
            href={option.href}
            aria-current={option.active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-pill border px-3.5 py-1.5 text-sm font-medium transition-all active:scale-95",
              option.active
                ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                : "border-line bg-overlay text-fg-muted hover:border-line-strong hover:bg-overlay-strong hover:text-fg",
            )}
          >
            {Icon ? <Icon className="size-4" strokeWidth={2.1} aria-hidden /> : null}
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
