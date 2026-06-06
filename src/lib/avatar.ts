import type { AvatarColor } from "@/types";

/**
 * Avatar color presets. Each key maps to a Tailwind gradient used by the
 * <Avatar> component. The class strings are written out in full so Tailwind's
 * JIT picks them up (dynamically-built class names would be purged).
 */
export const AVATAR_GRADIENTS: Record<AvatarColor, string> = {
  orange: "from-orange-500 to-orange-700",
  blue: "from-blue-500 to-blue-700",
  emerald: "from-emerald-500 to-emerald-700",
  violet: "from-violet-500 to-violet-700",
  rose: "from-rose-500 to-rose-700",
  amber: "from-amber-400 to-amber-600",
  cyan: "from-cyan-500 to-cyan-700",
};

/** Default color for users who haven't picked one. */
export const DEFAULT_AVATAR_COLOR: AvatarColor = "orange";

/** Ordered list for the color picker (value + localized label). */
export const AVATAR_SWATCHES: { value: AvatarColor; label: string }[] = [
  { value: "orange", label: "برتقالي" },
  { value: "blue", label: "أزرق" },
  { value: "emerald", label: "أخضر" },
  { value: "violet", label: "بنفسجي" },
  { value: "rose", label: "وردي" },
  { value: "amber", label: "كهرماني" },
  { value: "cyan", label: "سماوي" },
];

const AVATAR_COLOR_KEYS = Object.keys(AVATAR_GRADIENTS) as AvatarColor[];

/** Narrowing guard for untrusted input (form values, stored JSON). */
export function isAvatarColor(value: unknown): value is AvatarColor {
  return typeof value === "string" && (AVATAR_COLOR_KEYS as string[]).includes(value);
}

/** Resolve a (possibly missing/invalid) color to a gradient class string. */
export function avatarGradient(color?: string | null): string {
  return isAvatarColor(color)
    ? AVATAR_GRADIENTS[color]
    : AVATAR_GRADIENTS[DEFAULT_AVATAR_COLOR];
}

/**
 * Fallback profile banner: a wide gradient built from the user's avatar color
 * so profiles without an uploaded banner still feel personalized.
 */
export function bannerGradient(color?: string | null): string {
  return `bg-gradient-to-bl ${avatarGradient(color)}`;
}

/** First character of a name, uppercased — the avatar fallback glyph. */
export function avatarInitial(name: string): string {
  return (name.trim().charAt(0) || "؟").toUpperCase();
}
