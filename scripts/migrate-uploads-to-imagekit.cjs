// One-off migration: upload every local /uploads/* image referenced in the
// JSON store to ImageKit, then rewrite the stored URL to the returned CDN URL.
// Backs up data/*.json before writing. Safe to re-run (skips already-migrated).
const fs = require("fs");
const path = require("path");

// Load .env
fs.readFileSync(".env", "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
});

const IK_ROOT = process.env.IMAGEKIT_FOLDER || "manga-site";
const DATA_FILES = ["data/manga.json", "data/users.json"];

(async () => {
  const mod = await import("@imagekit/nodejs");
  const ImageKit = mod.default;
  const toFile = mod.toFile;
  const client = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });

  const cache = new Map(); // local path -> remote url
  let uploaded = 0;

  async function migrateUrl(url) {
    if (typeof url !== "string" || !url.startsWith("/uploads/")) return url;
    if (cache.has(url)) return cache.get(url);

    const abs = path.join(process.cwd(), "public", url);
    if (!fs.existsSync(abs)) {
      console.warn("  MISSING local file, leaving as-is:", url);
      return url;
    }
    const rel = url.replace(/^\/uploads\//, ""); // covers/x.jpg or chapters/<id>/<n>/001.jpg
    const fileName = path.basename(rel);
    const folder = `${IK_ROOT}/${path.dirname(rel)}`;
    const buffer = fs.readFileSync(abs);

    const res = await client.files.upload({
      file: await toFile(buffer, fileName),
      fileName,
      folder,
      useUniqueFileName: false,
    });
    if (!res.url) throw new Error("no URL returned for " + url);
    console.log("  +", url, "->", res.url);
    cache.set(url, res.url);
    uploaded++;
    return res.url;
  }

  // Recursively walk any JSON value and migrate string URLs.
  async function walk(node) {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) node[i] = await walk(node[i]);
      return node;
    }
    if (node && typeof node === "object") {
      for (const k of Object.keys(node)) node[k] = await walk(node[k]);
      return node;
    }
    if (typeof node === "string") return await migrateUrl(node);
    return node;
  }

  for (const file of DATA_FILES) {
    if (!fs.existsSync(file)) continue;
    console.log("Processing", file);
    const raw = fs.readFileSync(file, "utf8");
    fs.writeFileSync(file + ".bak", raw); // backup
    const data = JSON.parse(raw);
    const migrated = await walk(data);
    fs.writeFileSync(file, JSON.stringify(migrated, null, 2));
  }

  console.log(`\nDone. Uploaded ${uploaded} file(s). Backups written as *.json.bak`);
})().catch((e) => {
  console.error("MIGRATION FAILED:", e.message || e);
  process.exit(1);
});
