import type { StoredUser, UserProfile } from "@/types";
import { userStore } from "@/lib/db/store";
import { DEFAULT_AVATAR_COLOR, isAvatarColor } from "@/lib/avatar";
import { userBadge } from "@/lib/admin";

/**
 * Profile data access. Reads/writes the same file-backed user store as auth,
 * but only ever exposes the public-safe `UserProfile` shape (no email, no
 * password material). Server-only: never import from a Client Component.
 */

function toProfile(u: StoredUser, allUsers: StoredUser[]): UserProfile {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio,
    avatarColor: isAvatarColor(u.avatarColor) ? u.avatarColor : DEFAULT_AVATAR_COLOR,
    avatarImage: u.avatarImage,
    bannerImage: u.bannerImage,
    website: u.website,
    verified: Boolean(u.verified),
    badge: userBadge(u, allUsers),
    createdAt: u.createdAt,
  };
}

/** Look up a profile by handle (case-insensitive). */
export async function getProfileByUsername(
  username: string,
): Promise<UserProfile | null> {
  const target = username.trim().toLowerCase();
  if (!target) return null;
  const users = await userStore.all();
  const found = users.find((u) => u.username.toLowerCase() === target);
  return found ? toProfile(found, users) : null;
}

/** Look up a profile by id (used for the current user / uploader links). */
export async function getProfileById(id: string): Promise<UserProfile | null> {
  const users = await userStore.all();
  const found = users.find((u) => u.id === id);
  return found ? toProfile(found, users) : null;
}

export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  avatarColor?: string;
  /** Empty string clears the field; `undefined` leaves it unchanged. */
  website?: string;
  /** `null` clears the image; `undefined` leaves it unchanged. */
  avatarImage?: string | null;
  /** `null` clears the image; `undefined` leaves it unchanged. */
  bannerImage?: string | null;
}

/** Persist editable profile fields. Empty strings clear text fields. */
export async function updateProfile(
  userId: string,
  input: ProfileUpdate,
): Promise<UserProfile> {
  const users = await userStore.all();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("المستخدم غير موجود.");

  user.displayName = input.displayName?.trim() || undefined;
  user.bio = input.bio?.trim() || undefined;
  if (isAvatarColor(input.avatarColor)) user.avatarColor = input.avatarColor;
  if (input.website !== undefined) user.website = input.website.trim() || undefined;
  if (input.avatarImage !== undefined) user.avatarImage = input.avatarImage ?? undefined;
  if (input.bannerImage !== undefined) user.bannerImage = input.bannerImage ?? undefined;

  await userStore.save(users);
  return toProfile(user, users);
}

/** Admin-only: set a user's verified flag. Returns false if not found. */
export async function setUserVerified(
  userId: string,
  verified: boolean,
): Promise<boolean> {
  const users = await userStore.all();
  const user = users.find((u) => u.id === userId);
  if (!user) return false;
  user.verified = verified;
  await userStore.save(users);
  return true;
}
