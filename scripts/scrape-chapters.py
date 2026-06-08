#!/usr/bin/env python3
"""
Madara manga chapter scraper — bypasses Cloudflare using cloudscraper.

Usage:
    pip install cloudscraper beautifulsoup4 lxml
    python scripts/scrape-chapters.py https://lek-manga.net/manga/chainsaw-man/
    python scripts/scrape-chapters.py https://lek-manga.net/manga/chainsaw-man/ --images --output chainsaw-man.json

Output JSON format (compatible with the app's importScrapedChapters):
    [
      {
        "number": 1,
        "title": "Chapter 1",
        "url": "https://...",
        "pageImages": ["https://...", "https://..."]
      },
      ...
    ]
"""

import argparse
import json
import re
import sys
import time
from urllib.parse import urljoin

try:
    import cloudscraper
except ImportError:
    print("Missing cloudscraper. Install with: pip install cloudscraper")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing beautifulsoup4. Install with: pip install beautifulsoup4")
    sys.exit(1)

SCRAPER = cloudscraper.create_scraper(
    browser={"browser": "chrome", "platform": "windows", "mobile": False},
)


def fetch(url: str, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            resp = SCRAPER.get(url, timeout=30)
            resp.raise_for_status()
            return resp.text
        except Exception as e:
            if attempt == retries - 1:
                raise
            print(f"  ⚠️  Retry {attempt + 1}/{retries}: {e}", file=sys.stderr)
            time.sleep(2 * (attempt + 1))
    raise RuntimeError("unreachable")


def extract_chapters(html: str, base_url: str) -> list[dict]:
    """Extract chapter list from a Madara manga detail page."""
    soup = BeautifulSoup(html, "lxml")
    chapters: list[dict] = []
    seen = set()

    # Try multiple Madara selectors
    selectors = [
        "ul.main li.wp-manga-chapter",
        "li.wp-manga-chapter",
        ".chapter-item",
        ".wp-manga-list-chapter li",
        "ul.chapter-list li",
        ".c-chapters__item",
        ".listing-chapters_wrap li",
    ]

    for sel in selectors:
        items = soup.select(sel)
        if items:
            for item in items:
                link = item.find("a")
                if not link:
                    continue
                href = link.get("href", "").strip()
                if not href or href in seen:
                    continue
                seen.add(href)

                text = link.get_text(strip=True) or item.get_text(strip=True)
                num_match = re.search(r"(\d+\.?\d*)", text)
                number = float(num_match.group(1)) if num_match else len(chapters) + 1

                full_url = href if href.startswith("http") else urljoin(base_url, href)

                chapters.append({
                    "number": number,
                    "title": text or None,
                    "url": full_url,
                })
            break  # first matching selector wins

    chapters.sort(key=lambda c: c["number"])
    return chapters


def extract_chapter_pages(html: str, chapter_url: str) -> list[str]:
    """Extract page image URLs from a chapter reader page."""
    soup = BeautifulSoup(html, "lxml")
    images: list[str] = []
    seen = set()

    img_selectors = [
        ".reading-content img",
        ".page-break img",
        "#readerarea img",
        ".reading-content source",
        ".page-break source",
        ".chapter-images img",
        "div.text-center img",
        ".wp-manga-chapter-img",
        ".entry-content img",
    ]

    for sel in img_selectors:
        for img in soup.select(sel):
            src = (
                img.get("data-src")
                or img.get("src")
                or img.get("data-lazy-src")
                or ""
            )
            if not src or "data:image" in src or src in seen:
                continue
            seen.add(src)
            full = src if src.startswith("http") else urljoin(chapter_url, src)
            images.append(full)
        if images:
            break

    return images


def scrape_chapters(
    manga_url: str,
    scrape_images: bool = False,
    delay: float = 1.0,
    concurrency: int = 3,
) -> list[dict]:
    base_url = re.match(r"(https?://[^/]+)", manga_url)
    if not base_url:
        raise ValueError("Invalid URL")
    base_url = base_url.group(1)

    print(f"🔍 Fetching manga page: {manga_url}", file=sys.stderr)
    html = fetch(manga_url)
    chapters = extract_chapters(html, base_url)
    print(f"📚 Found {len(chapters)} chapters", file=sys.stderr)

    if scrape_images and chapters:
        print(f"🖼️  Scraping chapter page images...", file=sys.stderr)
        for i, ch in enumerate(chapters):
            try:
                print(f"   [{i + 1}/{len(chapters)}] Chapter {ch['number']}...", file=sys.stderr)
                ch_html = fetch(ch["url"])
                ch["pageImages"] = extract_chapter_pages(ch_html, ch["url"])
                print(f"      → {len(ch['pageImages'])} pages", file=sys.stderr)
                time.sleep(delay)
            except Exception as e:
                print(f"      ⚠️  Error: {e}", file=sys.stderr)
                ch["pageImages"] = []

    return chapters


def main():
    parser = argparse.ArgumentParser(
        description="Scrape chapters from a Madara WordPress manga site"
    )
    parser.add_argument("url", help="Full URL to the manga detail page")
    parser.add_argument("--images", action="store_true", help="Also scrape chapter page images")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between requests in seconds (default: 1.0)")
    parser.add_argument("--output", "-o", default="", help="Output JSON file path (default: print to stdout)")
    args = parser.parse_args()

    try:
        chapters = scrape_chapters(
            manga_url=args.url,
            scrape_images=args.images,
            delay=args.delay,
        )

        output = json.dumps(chapters, ensure_ascii=False, indent=2)

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output)
            print(f"\n💾 Saved to {args.output}", file=sys.stderr)
        else:
            print(output)

        print(
            f"\n✅ Done: {len(chapters)} chapters"
            + (f", {sum(len(c.get('pageImages', [])) for c in chapters)} pages" if args.images else ""),
            file=sys.stderr,
        )

    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
