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
      return {
        userId: c.userId,
        user: authors.get(c.userId) ?? null,
        lastMessage: last ? toMessage(last) : undefined,
        messageCount: c.messages.length,
        updatedAt: c.updatedAt,
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
