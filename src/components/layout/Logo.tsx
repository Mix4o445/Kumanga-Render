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
  className?: string;
}

/**
 * The site logo: just the `/logo.png` brand mark, themed white (dark mode) /
 * black (light mode) via the CSS mask in {@link FoxMark}.
 */
export function Logo({ className }: LogoProps) {
  return <FoxMark className={cn("h-9 w-auto aspect-[75/56]", className)} />;
}
