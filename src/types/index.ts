import type { LucideIcon } from "lucide-react";

/**
 * Domain data models for the manga platform.
 *
 * These describe the shape of data that will eventually come from your
 * database / API. Components are built strictly against these interfaces —
 * there is intentionally NO mock data anywhere in the UI.
 */

export type MangaStatus = "ongoing" | "completed" | "hiatus" | "cancelled";

/** Admin review state for user-uploaded content. */
export type ReviewStatus = "pending" | "approved" | "rejected";

/** A profile badge: gold for admins, blue for verified users. */
export type BadgeKind = "admin" | "verified";

export interface Genre {
  id: string;
  /** Localized display name, e.g. "أكشن". */
  name: string;
  /** URL-safe identifier, e.g. "action". */
  slug: string;
}

export interface Author {
  id: string;
  name: string;
  role: "author" | "artist" | "studio";
}

export interface Chapter {
  id: string;
  mangaId: string;
  /** Numeric chapter index (supports decimals, e.g. 10.5). */
  number: number;
  title?: string;
  /** ISO-8601 timestamp. */
  releasedAt: string;
  /** Ordered page image URLs (for the reader). */
  pages?: string[];
  isRead?: boolean;
  /** Admin review state. Absent = legacy/approved. */
  reviewStatus?: ReviewStatus;
}

export interface Manga {
  id: string;
  slug: string;
  title: string;
  author?: Author;
  /** Portrait cover (2:3). Absolute URL or path served by your CDN. */
  coverImage: string;
  /** Wide banner used by the hero. Falls back to `coverImage` if absent. */
  bannerImage?: string;
  synopsis: string;
  genres: Genre[];
  status: MangaStatus;
  /** Rating on a 0–10 scale. Optional — newly uploaded titles have none yet. */
  rating?: number;
  totalChapters: number;
  latestChapter?: Chapter;
  /** Aggregate popularity score (drives "most popular" ordering). */
  popularity?: number;
  /** Total view count (display + ordering). */
  views?: number;
  /** ISO-8601 timestamp of the most recent activity. */
  updatedAt?: string;
  /** Release year. */
  year?: number;
  /** Id of the user who uploaded the title. */
  uploaderId?: string;
  /** Admin review state. Absent = legacy/approved. */
  reviewStatus?: ReviewStatus;
  isFeatured?: boolean;
  isBookmarked?: boolean;
}

/** A single "latest update" entry: a manga + the chapter that just dropped. */
export interface MangaUpdate {
  id: string;
  manga: Manga;
  chapter: Chapter;
  /** ISO-8601 timestamp of when the update was published. */
  updatedAt: string;
  hasUnread?: boolean;
}

/* ------------------------------------------------------------------ */
/* Navigation / config models                                          */
/* ------------------------------------------------------------------ */

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional count badge (e.g. unread, new). */
  badge?: number;
}

export interface NavSection {
  id: string;
  /** Optional group label, e.g. "المكتبة". */
  title?: string;
  items: NavItem[];
}

export interface GenreNavItem extends Genre {
  icon: LucideIcon;
}

/* ------------------------------------------------------------------ */
/* Page-level aggregate                                                */
/* ------------------------------------------------------------------ */

/** Everything the home dashboard needs in one typed payload. */
export interface HomePageData {
  featured: Manga[];
  mostPopular: Manga[];
  latestUpdates: MangaUpdate[];
  sidebarUpdates: MangaUpdate[];
}

/* ------------------------------------------------------------------ */
/* Community / forum                                                   */
/* ------------------------------------------------------------------ */

/** A fixed forum category (controlled vocabulary, not user content). */
export interface ForumCategory {
  id: string;
  /** URL-safe identifier, e.g. "general". */
  slug: string;
  name: string;
  description: string;
}

/** Same as a category, plus how many threads it holds. */
export interface ForumCategoryWithCount extends ForumCategory {
  threadCount: number;
}

/** Public-safe author info for a thread/reply. */
export interface ForumAuthor {
  id: string;
  username: string;
  displayName?: string;
  avatarColor: AvatarColor;
  avatarImage?: string;
  /** Resolved badge (admin/verified) for display. */
  badge?: BadgeKind;
}

/** A single reply within a thread. */
export interface ForumReply {
  id: string;
  body: string;
  author: ForumAuthor | null;
  createdAt: string;
}

/** A thread as shown in a list (no reply bodies). */
export interface ForumThreadSummary {
  id: string;
  categoryId: string;
  title: string;
  author: ForumAuthor | null;
  createdAt: string;
  /** ISO-8601 of the most recent activity (thread or last reply). */
  updatedAt: string;
  replyCount: number;
}

/** A full thread with its replies (detail view). */
export interface ForumThread extends ForumThreadSummary {
  body: string;
  replies: ForumReply[];
}

/* ------------------------------------------------------------------ */
/* Support chat (contact an admin)                                     */
/* ------------------------------------------------------------------ */

/** A single message in a user↔admin conversation. */
export interface SupportMessage {
  id: string;
  /** True when the message is from the admin team. */
  fromAdmin: boolean;
  body: string;
  createdAt: string;
}

/** A user's full support conversation. */
export interface SupportConversation {
  userId: string;
  /** The user the conversation belongs to (for display). */
  user: ForumAuthor | null;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

/** A conversation row for the admin inbox. */
export interface SupportConversationSummary {
  userId: string;
  user: ForumAuthor | null;
  lastMessage?: SupportMessage;
  messageCount: number;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Comments & ratings                                                  */
/* ------------------------------------------------------------------ */

export type CommentTarget = "manga" | "chapter";

/** A comment on a manga or a chapter. */
export interface Comment {
  id: string;
  body: string;
  author: ForumAuthor | null;
  createdAt: string;
}

/** Aggregate rating for a manga (1–5 scale). */
export interface RatingSummary {
  /** Mean rating, 0 when there are no ratings yet. */
  average: number;
  count: number;
  /** The current viewer's own rating, if any. */
  mine: number | null;
}

/* ------------------------------------------------------------------ */
/* Auth & profiles                                                     */
/* ------------------------------------------------------------------ */

/** Preset avatar colors (resolve to gradients in `src/lib/avatar.ts`). */
export type AvatarColor =
  | "orange"
  | "blue"
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "cyan";

/** Public-safe user shape (never includes the password hash). */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  /** Optional friendly name shown instead of the handle. */
  displayName?: string;
  /** Chosen avatar color preset. */
  avatarColor?: AvatarColor;
  /** Uploaded avatar image path (e.g. "/uploads/avatars/…"). */
  avatarImage?: string;
  /** Access role. Absent = normal user. */
  role?: "user" | "admin";
  /** Verified users bypass upload review and get a blue badge. */
  verified?: boolean;
}

/** Stored user record (server-only). */
export interface StoredUser extends AuthUser {
  passwordHash: string;
  salt: string;
  createdAt: string;
  /** Short, user-authored "about me". */
  bio?: string;
  /** Uploaded profile banner image path. */
  bannerImage?: string;
  /** Optional external link (normalized, absolute http(s) URL). */
  website?: string;
  /** Moderation: number of profanity strikes accrued before a ban is issued. */
  strikes?: number;
  /** Moderation: ISO-8601 timestamp until which the user is barred from posting. */
  bannedUntil?: string;
}

/** Public profile shape — safe to render on a public page (no email). */
export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarColor: AvatarColor;
  /** Uploaded avatar image path, if any. */
  avatarImage?: string;
  /** Uploaded profile banner image path, if any. */
  bannerImage?: string;
  /** Optional external link (normalized, absolute http(s) URL). */
  website?: string;
  /** Whether the user is verified (blue badge, bypasses review). */
  verified: boolean;
  /** Resolved badge (admin/verified) for display. */
  badge?: BadgeKind;
  /** ISO-8601 join date. */
  createdAt: string;
}

/** Aggregate counts shown on a profile. */
export interface ProfileStats {
  /** Number of titles the user has uploaded. */
  uploads: number;
  /** Total chapters across all their uploads. */
  chapters: number;
  /** Total views across all their uploads. */
  views: number;
}
