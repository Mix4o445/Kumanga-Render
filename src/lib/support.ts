import { randomUUID } from "node:crypto";
import type {
  ForumAuthor,
  StoredUser,
  SupportConversation,
  SupportConversationSummary,
  SupportMessage,
} from "@/types";
import {
  supportStore,
  userStore,
  type StoredSupportMessage,
} from "@/lib/db/store";
import { DEFAULT_AVATAR_COLOR, isAvatarColor } from "@/lib/avatar";
import { userBadge } from "@/lib/admin";

/**
 * "Contact an admin" support chat. Each user has a single conversation with
 * the admin team, persisted in the file-backed store. Server-only.
 */

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

async function authorMap(): Promise<Map<string, ForumAuthor>> {
  const users = await userStore.all();
  return new Map(users.map((u) => [u.id, toAuthor(u, users)]));
}

function toMessage(m: StoredSupportMessage): SupportMessage {
  return {
    id: m.id,
    fromAdmin: m.fromAdmin,
    body: m.body,
    createdAt: m.createdAt,
  };
}

/** A user's conversation (empty messages list when none exists yet). */
export async function getConversation(
  userId: string,
): Promise<SupportConversation> {
  const convos = await supportStore.all();
  const convo = convos.find((c) => c.userId === userId);
  const authors = await authorMap();
  return {
    userId,
    user: authors.get(userId) ?? null,
    messages: (convo?.messages ?? []).map(toMessage),
    createdAt: convo?.createdAt ?? "",
    updatedAt: convo?.updatedAt ?? "",
  };
}

/** All conversations for the admin inbox, most recently active first. */
export async function getConversationSummaries(): Promise<
  SupportConversationSummary[]
> {
  const convos = await supportStore.all();
  const authors = await authorMap();
  return convos
    .map<SupportConversationSummary>((c) => {
      const last = c.messages[c.messages.length - 1];
      const readAt = c.adminReadAt ? new Date(c.adminReadAt).getTime() : 0;
      const unread = c.messages.some(
        (m) => !m.fromAdmin && new Date(m.createdAt).getTime() > readAt,
      );
      return {
        userId: c.userId,
        user: authors.get(c.userId) ?? null,
        lastMessage: last ? toMessage(last) : undefined,
        messageCount: c.messages.length,
        updatedAt: c.updatedAt,
        unread,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

/** Append a message, creating the conversation on the first send. */
export async function sendMessage(input: {
  userId: string;
  senderId: string;
  fromAdmin: boolean;
  body: string;
}): Promise<void> {
  const convos = await supportStore.all();
  const now = new Date().toISOString();
  let convo = convos.find((c) => c.userId === input.userId);
  if (!convo) {
    convo = { userId: input.userId, createdAt: now, updatedAt: now, messages: [] };
    convos.push(convo);
  }
  convo.messages.push({
    id: randomUUID(),
    senderId: input.senderId,
    fromAdmin: input.fromAdmin,
    body: input.body,
    createdAt: now,
  });
  convo.updatedAt = now;
  await supportStore.save(convos);
}

/* ----------------------------- read state ----------------------------- */

/** True when the user has an admin reply newer than their last view. */
export async function hasUnreadForUser(userId: string): Promise<boolean> {
  const convos = await supportStore.all();
  const convo = convos.find((c) => c.userId === userId);
  if (!convo) return false;
  const readAt = convo.userReadAt ? new Date(convo.userReadAt).getTime() : 0;
  return convo.messages.some(
    (m) => m.fromAdmin && new Date(m.createdAt).getTime() > readAt,
  );
}

/** Number of conversations with a user message newer than the admin's last view. */
export async function adminUnreadCount(): Promise<number> {
  const convos = await supportStore.all();
  return convos.reduce((n, convo) => {
    const readAt = convo.adminReadAt ? new Date(convo.adminReadAt).getTime() : 0;
    const hasNew = convo.messages.some(
      (m) => !m.fromAdmin && new Date(m.createdAt).getTime() > readAt,
    );
    return n + (hasNew ? 1 : 0);
  }, 0);
}

/** Mark the user's own conversation as read up to now. */
export async function markUserRead(userId: string): Promise<void> {
  const convos = await supportStore.all();
  const convo = convos.find((c) => c.userId === userId);
  if (!convo) return;
  convo.userReadAt = new Date().toISOString();
  await supportStore.save(convos);
}

/** Mark a single conversation as read by the admin up to now. */
export async function markAdminRead(userId: string): Promise<void> {
  const convos = await supportStore.all();
  const convo = convos.find((c) => c.userId === userId);
  if (!convo) return;
  convo.adminReadAt = new Date().toISOString();
  await supportStore.save(convos);
}
