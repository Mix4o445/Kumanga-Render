import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  icon: LucideIcon;
  title: string;
  /** Accent color of the leading bar + icon. */
  accent?: "orange" | "blue";
  /** Optional trailing action (e.g. a "view all" link). */
  action?: React.ReactNode;
  className?: string;
}

const BAR = {
  orange: "bg-accent",
  blue: "bg-royal",
} as const;

const ICON = {
  orange: "text-accent",
  blue: "text-royal",
} as const;

export function SectionHeading({
  icon: Icon,
  title,
  accent = "orange",
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-2.5">
        <span className={cn("h-5 w-1 rounded-full", BAR[accent])} aria-hidden />
        <Icon
          className={cn("size-[18px]", ICON[accent])}
          strokeWidth={2.3}
          aria-hidden
        />
        <h2 className="text-lg font-bold tracking-tight text-fg">{title}</h2>
      </div>
      {action}
    </div>
  );
}
