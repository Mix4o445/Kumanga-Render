import { cn } from "@/lib/utils";

/**
 * Brand mark: a flat coral rounded-square tile with a simple brush "マ"
 * (manga). Clean and modern — no textures or hard shadows.
 */
export function FoxMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-card bg-accent text-white",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 64"
        className="size-[58%]"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21 L48 18" />
        <path d="M42 22 C41 35 34 43 22 48" />
      </svg>
    </span>
  );
}

interface LogoProps {
  /** Show the Arabic wordmark next to the mark. */
  withWordmark?: boolean;
  className?: string;
}

export function Logo({ withWordmark = true, className }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <FoxMark className="size-9" />
      {withWordmark ? (
        <span className="hidden flex-col leading-none sm:flex">
          <span className="text-lg font-extrabold tracking-tight-display text-fg">
            قارئ مانجا
          </span>
          <span className="mt-1 text-[11px] font-medium text-fg-subtle">
            منصة القراءة العربية
          </span>
        </span>
      ) : null}
    </span>
  );
}
