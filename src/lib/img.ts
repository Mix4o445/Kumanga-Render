/**
 * ImageKit image transformation helper.
 *
 * Covers/banners are stored on ImageKit (ik.imagekit.io). Since Next's own
 * optimizer is disabled (`unoptimized: true`), we resize/compress at the CDN by
 * appending a `tr` (transformation) query param. This is the single biggest
 * lever on LCP: we request images at the size they're actually displayed and in
 * a modern format (f-auto → WebP/AVIF) instead of shipping full-resolution.
 *
 * Non-ImageKit URLs (e.g. placeholder hosts, legacy paths) pass through
 * unchanged.
 */

interface IkOptions {
  /** Target width in px (image is scaled to fit). */
  width?: number;
  /** Quality 1–100 (default 75). */
  quality?: number;
  /** Gaussian blur amount (1–100) — used for tiny background images. */
  blur?: number;
}

export function ikImage(url: string, opts: IkOptions = {}): string {
  if (!url || !url.includes("ik.imagekit.io")) return url;

  const parts: string[] = [];
  if (opts.width) parts.push(`w-${Math.round(opts.width)}`);
  parts.push(`q-${opts.quality ?? 75}`);
  if (opts.blur) parts.push(`bl-${opts.blur}`);
  parts.push("f-auto"); // serve WebP/AVIF when the browser supports it

  const tr = `tr=${parts.join(",")}`;
  // Preserve any existing query string.
  return url.includes("?") ? `${url}&${tr}` : `${url}?${tr}`;
}
