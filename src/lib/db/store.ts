import fs from "node:fs/promises";
import path from "node:path";
import type { MangaStatus, ReviewStatus, StoredUser } from "@/types";

/**
 * Tiny file-backed JSON database. Persists to `/data/*.json` at the project
 * root. It's intentionally simple (read-modify-write) — perfect for local /
 * self-hosted use and trivially swappable for SQL/Prisma later.
 *
 * Server-only: never import this from a Client Component.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const MANGA_FILE = path.join(DATA_DIR, "manga.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const FORUM_FILE = path.join(DATA_DIR, "forum.json");
const SUPPORT_FILE = path.join(DATA_DIR, "support.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const RATINGS_FILE = path.join(DATA_DIR, "ratings.json");

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

async function readJson<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

async function writeJson<T>(file: string, data: T[]): Promise<void> {
  await ensureDir();
  const tmp = `${file}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file); // atomic replace
}

export const mangaStore = {
  all: () => readJson<StoredManga>(MANGA_FILE),
  save: (data: StoredManga[]) => writeJson(MANGA_FILE, data),
};

export const userStore = {
  all: () => readJson<StoredUser>(USERS_FILE),
  save: (data: StoredUser[]) => writeJson(USERS_FILE, data),
};

export const forumStore = {
  all: () => readJson<StoredThread>(FORUM_FILE),
  save: (data: StoredThread[]) => writeJson(FORUM_FILE, data),
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
}

export const supportStore = {
  all: () => readJson<StoredSupportConversation>(SUPPORT_FILE),
  save: (data: StoredSupportConversation[]) => writeJson(SUPPORT_FILE, data),
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
  all: () => readJson<StoredComment>(COMMENTS_FILE),
  save: (data: StoredComment[]) => writeJson(COMMENTS_FILE, data),
};

export const ratingsStore = {
  all: () => readJson<StoredRating>(RATINGS_FILE),
  save: (data: StoredRating[]) => writeJson(RATINGS_FILE, data),
};
