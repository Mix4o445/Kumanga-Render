import "server-only";
import { SITE_URL } from "@/lib/seo";

/**
 * IndexNow — instant URL submission to Bing & Yandex (and partners).
 * https://www.indexnow.org/
 *
 * The key is published as a static file at `/<key>.txt` (in public/) so the
 * search engines can verify ownership. Submitting is best-effort: failures are
 * swallowed so they never block a publish action.
 */

const KEY = "bea24a8218aa16db8f65bff94a0aa6f7";

function host(): string {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "www.kumanga.xyz";
  }
}

/**
 * Submit one or more absolute URLs to IndexNow. Silently no-ops for empty
 * input or non-absolute URLs.
 */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  const urlList = Array.from(
    new Set(urls.filter((u) => /^https?:\/\//i.test(u))),
  );
  if (urlList.length === 0) return;

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: host(),
        key: KEY,
        keyLocation: `${SITE_URL}/${KEY}.txt`,
        urlList,
      }),
    });
  } catch {
    /* best-effort — never block the caller */
  }
}
