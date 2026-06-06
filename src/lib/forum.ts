import { randomUUID } from "node:crypto";
import type {
  ForumAuthor,
  ForumCategory,
  ForumCategoryWithCount,
  ForumReply,
  ForumThread,
  ForumThreadSummary,
  StoredUser,
} from "@/types";
import { forumStore, type StoredReply, type StoredThread } from "@/lib/db/store";
import { userStore } from "@/lib/db/store";
import { DEFAULT_AVATAR_COLOR, isAvatarColor } from "@/lib/avatar";
import { userBadge } from "@/lib/admin";

/**
 * Community forum data access. Threads + replies are persisted in the
 * file-backed store (data/forum.json); categories are a fixed controlled
 * vocabulary (like genres) — not user content. Server-only.
 */

/** Fixed forum categories. `id` doubles as the URL slug. */
export const FORUM_CATEGORIES: ForumCategory[] = [
  {
    id: "general",
    slug: "general",
    name: "نقاشات عامة",
    description: "شارك آراءك وتوقعاتك مع بقية القرّاء.",
  },
  {
    id: "reviews",
    slug: "reviews",
    name: "المراجعات",
    description: "اكتب وقيّم مراجعات لأعمالك المفضّلة.",
  },
  {
    id: "recommendations",
    slug: "recommendations",
    name: "التوصيات",
    description: "اكتشف أعمالًا جديدة عبر اقتراحات المجتمع.",
  },
  {
    id: "translations",
    slug: "translations",
    name: "طلبات الترجمة",
    description: "اطلب ترجمة العمل الذي تنتظره.",
  },
];

const CATEGORY_BY_ID: Record<string, ForumCategory> = Object.fromEntries(
  FORUM_CATEGORIES.map((c) => [c.id, c]),
);

export function getCategory(id: string): ForumCategory | null {
  return CATEGORY_BY_ID[id] ?? null;
}

export function isValidCategory(id: string): boolean {
  return id in CATEGORY_BY_ID;
}

/* --------------------------- author resolution -------------------------- */

function toAuthor(u: StoredUser, allUsers: StoredUser[]): ForumAuthor {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarColor: isAvatarColor(u.avatarColor) ? u.avatarColor : DEFAULT_AVATAR_COLOR,
    avatarImage: u.avatarImage,
    badge: userBadge(u, allUsers),
  };
}

/** Build an id → author map once so listings avoid per-row lookups. */
async function authorMap(): Promise<Map<string, ForumAuthor>> {
  const users = await userStore.all();
  return new Map(users.map((u) => [u.id, toAuthor(u, users)]));
}

/* -------------------------------- mappers ------------------------------- */

function lastActivity(t: StoredThread): string {
  const last = t.replies[t.replies.length - 1];
  return last ? last.createdAt : t.updatedAt;
}

function toSummary(
  t: StoredThread,
  authors: Map<string, ForumAuthor>,
): ForumThreadSummary {
  return {
    id: t.id,
    categoryId: t.categoryId,
    title: t.title,
    author: authors.get(t.authorId) ?? null,
    createdAt: t.createdAt,
    updatedAt: lastActivity(t),
    replyCount: t.replies.length,
  };
}

function toReply(r: StoredReply, authors: Map<string, ForumAuthor>): ForumReply {
  return {
    id: r.id,
    body: r.body,
    author: authors.get(r.authorId) ?? null,
    createdAt: r.createdAt,
  };
}

/* -------------------------------- queries ------------------------------- */

/** Categories with their live thread counts. */
export async function getCategoriesWithCounts(): Promise<ForumCategoryWithCount[]> {
  const threads = await forumStore.all();
  const counts = new Map<string, number>();
  for (const t of threads) {
    counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1);
  }
  return FORUM_CATEGORIES.map((c) => ({
    ...c,
    threadCount: counts.get(c.id) ?? 0,
  }));
}

/** Thread summaries, newest activity first, optionally filtered by category. */
export async function getThreads(options?: {
  categoryId?: string;
  limit?: number;
}): Promise<ForumThreadSummary[]> {
  const threads = await forumStore.all();
  const authors = await authorMap();
  let list = threads.map((t) => toSummary(t, authors));
  if (options?.categoryId) {
    list = list.filter((t) => t.categoryId === options.categoryId);
  }
  list.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return options?.limit ? list.slice(0, options.limit) : list;
}

export async function getThreadCount(): Promise<number> {
  return (await forumStore.all()).length;
}

/** A full thread with its replies (oldest first). Null when not found. */
export async function getThreadById(id: string): Promise<ForumThread | null> {
  const threads = await forumStore.all();
  const t = threads.find((x) => x.id === id);
  if (!t) return null;
  const authors = await authorMap();
  return {
    ...toSummary(t, authors),
    body: t.body,
    replies: t.replies
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((r) => toReply(r, authors)),
  };
}

/* ------------------------------- mutations ------------------------------ */

export async function createThread(input: {
  categoryId: string;
  authorId: string;
  title: string;
  body: string;
}): Promise<StoredThread> {
  const threads = await forumStore.all();
  const now = new Date().toISOString();
  const record: StoredThread = {
    id: randomUUID(),
    categoryId: input.categoryId,
    authorId: input.authorId,
    title: input.title,
    body: input.body,
    createdAt: now,
    updatedAt: now,
    replies: [],
  };
  threads.push(record);
  await forumStore.save(threads);
  return record;
}

export async function addReply(input: {
  threadId: string;
  authorId: string;
  body: string;
}): Promise<StoredReply | null> {
  const threads = await forumStore.all();
  const thread = threads.find((t) => t.id === input.threadId);
  if (!thread) return null;
  const now = new Date().toISOString();
  const reply: StoredReply = {
    id: randomUUID(),
    threadId: thread.id,
    authorId: input.authorId,
    body: input.body,
    createdAt: now,
  };
  thread.replies.push(reply);
  thread.updatedAt = now;
  await forumStore.save(threads);
  return reply;
}
