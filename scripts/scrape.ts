/**
 * Madara Manga Scraper — CLI
 *
 * Usage:
 *   npx tsx scripts/scrape.ts --url https://mangasite.com [options]
 *
 * Options:
 *   --url           Base URL of the Madara site (required)
 *   --pages         Max listing pages to scrape (0 = all, default: 1)
 *   --concurrency   Concurrent detail fetches (default: 3)
 *   --images        Also scrape chapter page images (default: false)
 *   --delay         Delay between requests in ms (default: 1000)
 *   --list-path     Manga list path (default: /manga/)
 *   --dry-run       Show what would be imported without writing (default: false)
 *   --no-approve    Require admin approval for imported content (default: approved)
 *   --overwrite     Overwrite existing manga with the same slug (default: false)
 *   --output        Save scraped data to JSON file instead of importing
 *   --import        Also import into the store (default: true when not --output)
 */

import { scrapeMadara } from "../src/lib/scraper/madara";
import { importScrapedManga, importScrapedMangaDryRun } from "../src/lib/scraper/importer";

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string): string | undefined => {
    const idx = args.indexOf(name);
    return idx !== -1 ? args[idx + 1] : undefined;
  };
  const hasFlag = (name: string): boolean => args.includes(name);

  const url = getArg("--url");
  if (!url) {
    console.error("Usage: npx tsx scripts/scrape.ts --url https://mangasite.com [options]");
    console.error("");
    console.error("Options:");
    console.error("  --url           Base URL of the Madara site (required)");
    console.error("  --pages         Max listing pages to scrape (0 = all, default: 1)");
    console.error("  --concurrency   Concurrent detail fetches (default: 3)");
    console.error("  --images        Also scrape chapter page images (default: false)");
    console.error("  --delay         Delay between requests in ms (default: 1000)");
    console.error("  --list-path     Manga list path (default: /manga/)");
    console.error("  --dry-run       Show what would be imported without writing");
    console.error("  --no-approve    Require admin approval for imported content");
    console.error("  --overwrite     Overwrite existing manga with the same slug");
    console.error("  --output        Save scraped data to JSON file instead of importing");
    process.exit(1);
  }

  const maxPages = parseInt(getArg("--pages") || "1", 10);
  const concurrency = parseInt(getArg("--concurrency") || "3", 10);
  const scrapeImages = hasFlag("--images");
  const delay = parseInt(getArg("--delay") || "1000", 10);
  const listPath = getArg("--list-path") || "/manga/";
  const dryRun = hasFlag("--dry-run");
  const autoApprove = !hasFlag("--no-approve");
  const overwrite = hasFlag("--overwrite");
  const outputFile = getArg("--output");
  const shouldImport = outputFile ? false : true;

  console.log("╔════════════════════════════════════════╗");
  console.log("║     Madara Manga Scraper                ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("");
  console.log(`  Target:     ${url}`);
  console.log(`  Max pages:  ${maxPages || "all"}`);
  console.log(`  Concurrency:${concurrency}`);
  console.log(`  Images:     ${scrapeImages ? "yes" : "no"}`);
  console.log(`  Delay:      ${delay}ms`);
  console.log(`  List path:  ${listPath}`);
  console.log(`  Auto-approve:${autoApprove ? "yes" : "no"}`);
  console.log(`  Overwrite:  ${overwrite ? "yes" : "no"}`);
  console.log(`  Dry run:    ${dryRun ? "yes" : "no"}`);
  console.log(`  Output:     ${outputFile || "(import to store)"}`);
  console.log("");

  if (maxPages === 0) {
    console.log("⚠️  Scraping ALL pages — this may take a while.");
    console.log("");
  }

  const result = await scrapeMadara({
    baseUrl: url,
    maxPages,
    concurrency,
    scrapeChapterPages: scrapeImages,
    delay,
    listPath,
  });

  console.log("");
  console.log("╔════════════════════════════════════════╗");
  console.log("║     Summary                             ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`  Manga scraped:     ${result.stats.totalManga}`);
  console.log(`  Chapters found:    ${result.stats.totalChapters}`);
  console.log(`  Page images:       ${result.stats.totalPages}`);
  console.log(`  Duration:          ${(result.stats.durationMs / 1000).toFixed(1)}s`);
  console.log(`  Errors:            ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log("\n⚠️  Errors:");
    for (const e of result.errors.slice(0, 10)) {
      console.log(`  • ${e.url}: ${e.error}`);
    }
    if (result.errors.length > 10) {
      console.log(`  … and ${result.errors.length - 10} more`);
    }
  }

  // Output to JSON file if requested
  if (outputFile) {
    const fs = await import("node:fs/promises");
    await fs.writeFile(outputFile, JSON.stringify(result.manga, null, 2));
    console.log(`\n💾 Saved scraped data to ${outputFile}`);
  }

  // Import into store
  if (shouldImport && result.manga.length > 0) {
    if (dryRun) {
      const dry = await importScrapedMangaDryRun(result.manga);
      console.log("\n📋 Dry Run Results:");
      console.log(`  Would import:  ${dry.wouldImport} manga`);
      console.log(`  Would skip:    ${dry.wouldSkip} manga`);
      console.log(`  Chapters:      ${dry.chaptersToImport}`);
      console.log(`  Genres found:  ${Object.keys(dry.genreSummary).length}`);
    } else {
      console.log("\n💾 Importing into store...");
      const imp = await importScrapedManga(result.manga, { autoApprove, overwrite });
      console.log(`  ✅ Imported:  ${imp.imported} manga`);
      console.log(`  ⏭️  Skipped:   ${imp.skipped} manga`);
      console.log(`  📖 Chapters:  ${imp.chaptersImported}`);

      if (imp.errors.length > 0) {
        console.log("\n⚠️  Import errors:");
        for (const e of imp.errors) {
          console.log(`  • ${e}`);
        }
      }
    }
  }

  if (!shouldImport && !outputFile) {
    console.log("\nℹ️  Scraped data was not imported. Use --output to save or add --import to store.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
