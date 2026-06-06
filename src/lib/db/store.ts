import fs from "node:fs/promises";
import path from "node:path";
import type { MangaStatus, ReviewStatus, StoredUser } from "@/types";

/**
 * Tiny JSON document store with two interchangeable backends:
 *
 *   • Postgres  — when DATABASE_URL is set. Each collection is one JSONB row in
 *     a single `app_store(key text primary key, data jsonb)` table. This is the
 *     production backend on Render (its filesystem is ephemeral).
 *   • Files     — fallback when DATABASE_URL is absent. Persists to `/data/*.json`
 *     at the project root, so local dev / builds work with zero config.
 *
 * Both backends expose the same `all()/save()` collection API, so the rest of
 * the app is backend-agnostic. Read-modify-write, server-only.
 */

/* ------------------------------ collections ----------------------------- */

const KEYS = {
  manga: "manga",
  users: "users",
  forum: "forum",
  support: "support",
  comments: "comments",
  ratings: "ratings",
} as const;
type StoreKey = (typeof KEYS)[keyof typeof KEYS];

/* --------------------------- Postgres backend --------------------------- */

const usePg = Boolean(process.env.DATABASE_URL);

// Lazily create a single pool + ensure the table exists exactly once.
let _pgReady: Promise<import("pg").Pool> | null = null;
async function pg(): Promise<import("pg").Pool> {
  if (!_pgReady) {
    _pgReady = (async () => {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        // Render's *external* connections require SSL; internal ones don't.
        // Opt in via DATABASE_SSL=true when using an external URL.
        ssl:
          process.env.DATABASE_SSL === "true"
            ? { rejectUnauthorized: false }
            : undefined,
      });
      await pool.query(
        "CREATE TABLE IF NOT EXISTS app_store (key TEXT PRIMARY KEY, data JSONB NOT NULL)",
      );
      return pool;
    })();
  }
  return _pgReady;
}

async function pgRead<T>(key: StoreKey): Promise<T[]> {
  const pool = await pg();
  const res = await pool.query("SELECT data FROM app_store WHERE key = $1", [key]);
  const data = res.rows[0]?.data;
  return Array.isArray(data) ? (data as T[]) : [];
}

async function pgWrite<T>(key: StoreKey, data: T[]): Promise<void> {
  const pool = await pg();
  await pool.query(
    `INSERT INTO app_store (key, data) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data`,
    [key, JSON.stringify(data)],
  );
}

/* ----------------------------- File backend ----------------------------- */

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const FILE_FOR: Record<StoreKey, string> = {
  manga: path.join(DATA_DIR, "manga.json"),
  users: path.join(DATA_DIR, "users.json"),
  forum: path.join(DATA_DIR, "forum.json"),
  support: path.join(DATA_DIR, "support.json"),
  comments: path.join(DATA_DIR, "comments.json"),
  ratings: path.join(DATA_DIR, "ratings.json"),
};

export interface StoredChapter {
  id: string;
  mangaId: string;
  number: number;
  title?: string;
  releasedAt: string;
  pages: string[];
  uploaderId: string;
  /** Admin review state. Absent = legacy/approved. */
  reviewStatus?: ReviewStatus;
}

export interface StoredManga {
  id: string;
  slug: string;
  title: string;
  authorName?: string;
  coverImage: string;
  bannerImage?: string;
  synopsis: string;
  genreSlugs: string[];
  status: MangaStatus;
  year?: number;
  views: number;
  uploaderId: string;
  createdAt: string;
  updatedAt: string;
  chapters: StoredChapter[];
  /** Admin review state. Absent = legacy/approved. */
  reviewStatus?: ReviewStatus;
}

/** A single reply within a forum thread. */
export interface StoredReply {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

/** A forum discussion thread with its replies embedded. */
export interface StoredThread {
  id: string;
  /** Category slug (controlled vocabulary, see src/lib/forum.ts). */
  categoryId: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
  /** Bumped whenever a reply is added (drives "latest activity"). */
  updatedAt: string;
  replies: StoredReply[];
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function fileRead<T>(key: StoreKey): Promise<T[]> {
  try {
    const raw = await fs.readFile(FILE_FOR[key], "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function fileWrite<T>(key: StoreKey, data: T[]): Promise<void> {
  await ensureDir();
  const file = FILE_FOR[key];
  const tmp = `${file}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file); // atomic replace
}

/* --------------------------- backend dispatch --------------------------- */

function readJson<T>(key: StoreKey): Promise<T[]> {
  return usePg ? pgRead<T>(key) : fileRead<T>(key);
}

function writeJson<T>(key: StoreKey, data: T[]): Promise<void> {
  return usePg ? pgWrite<T>(key, data) : fileWrite<T>(key, data);
}

export const mangaStore = {
  all: () => readJson<StoredManga>(KEYS.manga),
  save: (data: StoredManga[]) => writeJson(KEYS.manga, data),
};

export const userStore = {
  all: () => readJson<StoredUser>(KEYS.users),
  save: (data: StoredUser[]) => writeJson(KEYS.users, data),
};

export const forumStore = {
  all: () => readJson<StoredThread>(KEYS.forum),
  save: (data: StoredThread[]) => writeJson(KEYS.forum, data),
};

/** A single message in a user↔admin support conversation. */
export interface StoredSupportMessage {
  id: string;
  senderId: string;
  /** True when sent by an admin (the support team). */
  fromAdmin: boolean;
  body: string;
  createdAt: string;
}

/** One support conversation per user (the user and the admin team). */
export interface StoredSupportConversation {
  /** Id of the (non-admin) user the conversation belongs to. */
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredSupportMessage[];
  /** Last time the owning user opened the conversation (ISO). */
  userReadAt?: string;
  /** Last time an admin opened the conversation (ISO). */
  adminReadAt?: string;
}

export const supportStore = {
  all: () => readJson<StoredSupportConversation>(KEYS.support),
  save: (data: StoredSupportConversation[]) => writeJson(KEYS.support, data),
};

/** A comment attached to a manga or a chapter. */
export interface StoredComment {
  id: string;
  /** "manga" or "chapter". */
  targetType: string;
  /** The manga id (for "manga") or chapter id (for "chapter"). */
  targetId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

/** A user's 1–5 star rating of a manga (one per user per manga). */
export interface StoredRating {
  mangaId: string;
  userId: string;
  value: number;
  updatedAt: string;
}

export const commentsStore = {
  all: () => readJson<StoredComment>(KEYS.comments),
  save: (data: StoredComment[]) => writeJson(KEYS.comments, data),
};

export const ratingsStore = {
  all: () => readJson<StoredRating>(KEYS.ratings),
  save: (data: StoredRating[]) => writeJson(KEYS.ratings, data),
};
