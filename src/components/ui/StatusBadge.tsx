import type { MangaStatus } from "@/types";
import { STATUS_META } from "@/lib/config";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  withDot = true,
  className,
}: {
  status: MangaStatus;
  withDot?: boolean;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
        meta.tone,
        className,
      )}
    >
      {withDot ? (
        <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      ) : null}
      {meta.label}
    </span>
  );
}
