// One-off import: load existing data/*.json collections into the Postgres
// `app_store` table. Run AFTER provisioning the database, with DATABASE_URL set:
//
//   DATABASE_URL=postgres://... DATABASE_SSL=true node scripts/import-json-to-pg.cjs
//
// Safe to re-run: each collection is upserted (overwrites that key).
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const COLLECTIONS = {
  manga: "manga.json",
  users: "users.json",
  forum: "forum.json",
  support: "support.json",
  comments: "comments.json",
  ratings: "ratings.json",
};

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  await pool.query(
    "CREATE TABLE IF NOT EXISTS app_store (key TEXT PRIMARY KEY, data JSONB NOT NULL)",
  );

  for (const [key, fileName] of Object.entries(COLLECTIONS)) {
    const file = path.join(DATA_DIR, fileName);
    let data = [];
    try {
      const raw = fs.readFileSync(file, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) data = parsed;
    } catch {
      console.log(`  (skip) ${fileName} not found — importing empty []`);
    }
    await pool.query(
      `INSERT INTO app_store (key, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data`,
      [key, JSON.stringify(data)],
    );
    console.log(`  + ${key}: ${data.length} record(s)`);
  }

  await pool.end();
  console.log("\nImport complete.");
})().catch((e) => {
  console.error("IMPORT FAILED:", e.message || e);
  process.exit(1);
});
