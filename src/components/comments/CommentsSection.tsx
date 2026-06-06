import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { CommentTarget } from "@/types";
import { getComments } from "@/lib/comments";
import { getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { UserBadge } from "@/components/ui/UserBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CommentForm } from "@/components/comments/CommentForm";
import { formatRelativeTime } from "@/lib/utils";

/**
 * Comments for a manga or chapter. `path` is the current page route, passed
 * through to the action so it can revalidate after a new comment.
 */
export async function CommentsSection({
  targetType,
  targetId,
  path,
}: {
  targetType: CommentTarget;
  targetId: string;
  path: string;
}) {
  const [comments, user] = await Promise.all([
    getComments(targetType, targetId),
    getCurrentUser(),
  ]);

  return (
    <section id="comments" className="scroll-mt-24">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-card bg-accent/10 text-accent ring-1 ring-accent/20">
          <MessageSquare className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <h2 className="text-lg font-bold tracking-tight text-fg">
          التعليقات ({comments.length.toLocaleString("ar")})
        </h2>
      </div>

      {/* Composer */}
      <div className="mb-6">
        {user ? (
          <CommentForm targetType={targetType} targetId={targetId} path={path} />
        ) : (
          <p className="rounded-card border border-line bg-surface-raised/40 px-4 py-3 text-sm text-fg-subtle">
            <Link
              href={`/login?next=${encodeURIComponent(path)}`}
              className="font-bold text-accent transition-colors hover:text-accent-bright"
            >
              سجّل الدخول
            </Link>{" "}
            لإضافة تعليق.
          </p>
        )}
      </div>

      {comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const name =
              comment.author?.displayName ||
              comment.author?.username ||
              "مستخدم محذوف";
            return (
              <li
                key={comment.id}
                className="flex gap-3 rounded-card border border-line bg-surface-raised/40 p-4"
              >
                <Avatar
                  name={name}
                  color={comment.author?.avatarColor}
                  image={comment.author?.avatarImage}
                  className="size-9 shrink-0 text-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {comment.author ? (
                      <Link
                        href={`/u/${encodeURIComponent(comment.author.username)}`}
                        className="truncate text-sm font-bold text-fg transition-colors hover:text-accent"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="truncate text-sm font-bold text-fg">{name}</span>
                    )}
                    <UserBadge badge={comment.author?.badge} className="size-3.5" />
                    <span
                      className="text-xs text-fg-faint"
                      suppressHydrationWarning
                    >
                      · {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-fg-muted">
                    {comment.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="لا توجد تعليقات بعد"
          description="كن أول من يعلّق."
        />
      )}
    </section>
  );
}
