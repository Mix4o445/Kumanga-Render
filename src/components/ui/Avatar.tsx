import { avatarGradient, avatarInitial } from "@/lib/avatar";
import { cn } from "@/lib/utils";

/**
 * User avatar. Renders the uploaded `image` when provided; otherwise falls
 * back to a gradient tile showing the user's initial. Decorative by default
 * (`aria-hidden`) since the username is announced alongside it; pass a
 * `title` to surface a tooltip. Size via `className` (e.g. "size-8 text-sm").
 */
export function Avatar({
  name,
  color,
  image,
  className,
  title,
}: {
  name: string;
  color?: string | null;
  /** Uploaded avatar image path. Falls back to the gradient tile when absent. */
  image?: string | null;
  className?: string;
  title?: string;
}) {
  const sizing = className ?? "size-8 text-sm";

  if (image) {
    return (
      // Local /uploads images; next/image adds no benefit at arbitrary avatar sizes.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        title={title}
        aria-hidden
        className={cn(
          "inline-block shrink-0 select-none rounded-card object-cover ring-1 ring-white/10",
          sizing,
        )}
      />
    );
  }

  return (
    <span
      title={title}
      aria-hidden
      className={cn(
        "inline-grid shrink-0 select-none place-items-center rounded-card bg-gradient-to-br font-bold leading-none text-white ring-1 ring-white/10",
        avatarGradient(color),
        sizing,
      )}
    >
      {avatarInitial(name)}
    </span>
  );
}
