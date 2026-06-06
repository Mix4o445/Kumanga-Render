import { cn } from "@/lib/utils";

/**
 * Brand mark rendered from `/logo.png`. The PNG is used as a CSS mask and
 * filled with the theme foreground color, so it shows white in dark mode and
 * black in light mode automatically.
 */
export function FoxMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "block shrink-0 bg-fg [mask-image:url(/logo.png)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-image:url(/logo.png)] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain]",
        className,
      )}
      aria-hidden
    />
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
