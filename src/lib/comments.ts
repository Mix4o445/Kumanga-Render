import { randomUUID } from "node:crypto";
import type { Comment, CommentTarget, ForumAuthor, StoredUser } from "@/types";
import { commentsStore, userStore } from "@/lib/db/store";
import { DEFAULT_AVATAR_COLOR, isAvatarColor } from "@/lib/avatar";
import { userBadge } from "@/lib/admin";

/**
 * Comments on manga and chapters. Persisted in a single file-backed store,
 * keyed by (targetType, targetId). Server-only.
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

/** Comments for a target, newest first. */
export async function getComments(
  targetType: CommentTarget,
  targetId: string,
): Promise<Comment[]> {
  const [comments, users] = await Promise.all([
    commentsStore.all(),
    userStore.all(),
  ]);
  const authors = new Map(users.map((u) => [u.id, toAuthor(u, users)]));
  return comments
    .filter((c) => c.targetType === targetType && c.targetId === targetId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((c) => ({
      id: c.id,
      body: c.body,
      author: authors.get(c.authorId) ?? null,
      createdAt: c.createdAt,
    }));
}

export async function getCommentCount(
  targetType: CommentTarget,
  targetId: string,
): Promise<number> {
  const comments = await commentsStore.all();
  return comments.filter(
    (c) => c.targetType === targetType && c.targetId === targetId,
  ).length;
}

export async function addComment(input: {
  targetType: CommentTarget;
  targetId: string;
  authorId: string;
  body: string;
}): Promise<void> {
  const comments = await commentsStore.all();
  comments.push({
    id: randomUUID(),
    targetType: input.targetType,
    targetId: input.targetId,
    authorId: input.authorId,
    body: input.body,
    createdAt: new Date().toISOString(),
  });
  await commentsStore.save(comments);
}
