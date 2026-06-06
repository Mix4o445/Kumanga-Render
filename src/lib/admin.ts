import type { AuthUser, BadgeKind } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { userStore } from "@/lib/db/store";

/**
 * Admin access control + badge resolution.
 *
 * A user is an admin if any of these hold:
 *  1. their stored `role` is "admin";
 *  2. their username is listed in ADMIN_USERNAMES (comma-separated env var);
 *  3. bootstrap — when no admin is otherwise configured, the earliest-created
 *     account is treated as the admin so a fresh install has one out of the box.
 */

const ADMIN_USERNAMES = new Set(
  (process.env.ADMIN_USERNAMES ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

interface UserLike {
  id: string;
  username: string;
  role?: string;
  verified?: boolean;
}

function explicitlyAdmin(user: UserLike): boolean {
  return user.role === "admin" || ADMIN_USERNAMES.has(user.username.toLowerCase());
}

/** Synchronous admin check given the full user list (for the bootstrap rule). */
export function isAdminUser(user: UserLike | null, allUsers: UserLike[]): boolean {
  if (!user) return false;
  if (explicitlyAdmin(user)) return true;
  if (allUsers.some(explicitlyAdmin)) return false;
  const earliest = [...allUsers].sort(
    (a, b) =>
      new Date((a as { createdAt?: string }).createdAt ?? 0).getTime() -
      new Date((b as { createdAt?: string }).createdAt ?? 0).getTime(),
  )[0];
  return earliest?.id === user.id;
}

/** The display badge for a user: admin (gold) wins over verified (blue). */
export function userBadge(
  user: UserLike | null,
  allUsers: UserLike[],
): BadgeKind | undefined {
  if (!user) return undefined;
  if (isAdminUser(user, allUsers)) return "admin";
  if (user.verified) return "verified";
  return undefined;
}

export async function isAdmin(
  user: Pick<AuthUser, "id" | "username" | "role"> | null,
): Promise<boolean> {
  if (!user) return false;
  const users = await userStore.all();
  return isAdminUser(user, users);
}

/** The current user if (and only if) they are an admin, else null. */
export async function getCurrentAdmin(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  return (await isAdmin(user)) ? user : null;
}
