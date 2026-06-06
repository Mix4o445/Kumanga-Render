import { BadgeCheck, ShieldCheck } from "lucide-react";
import type { BadgeKind } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Inline status badge shown next to a user's name.
 * - admin → gold shield
 * - verified → blue check
 */
export function UserBadge({
  badge,
  className,
}: {
  badge?: BadgeKind | null;
  className?: string;
}) {
  if (badge === "admin") {
    return (
      <ShieldCheck
        className={cn("inline-block size-4 shrink-0 text-amber-400", className)}
        aria-label="مشرف"
      >
        <title>مشرف</title>
      </ShieldCheck>
    );
  }
  if (badge === "verified") {
    return (
      <BadgeCheck
        className={cn("inline-block size-4 shrink-0 text-sky-400", className)}
        aria-label="حساب موثّق"
      >
        <title>حساب موثّق</title>
      </BadgeCheck>
    );
  }
  return null;
}
