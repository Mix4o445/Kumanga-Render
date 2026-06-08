import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MessageSquare, Clock4, MessagesSquare, Pin } from "lucide-react";
import type { ForumAuthor } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getThreadById, getCategory } from "@/lib/forum";
import { deleteThreadAction, deleteReplyAction, setThreadPinnedAction } from "@/lib/actions";
import { DeleteButton } from "@/components/manga/DeleteButton";
import { Avatar } from "@/components/ui/Avatar";
import { UserBadge } from "@/components/ui/UserBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReplyForm } from "@/components/community/ReplyForm";
import { formatRelativeTime } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const thread = await getThreadById(params.id);
  return { title: thread ? `${thread.title} | المجتمع` : "النقاش غير موجود" };
}

function authorName(author: ForumAuthor | null): string {
  return author?.displayName || author?.username || "مستخدم محذوف";
}

/** Author chip — links to the profile when the user still exists. */
function AuthorChip({
  author,
  when,
}: {
  author: ForumAuthor | null;
  when: string;
}) {
  const name = authorName(author);
  const inner = (
    <>
      <Avatar
        name={name}
        color={author?.avatarColor}
        image={author?.avatarImage}
        className="size-9 text-sm"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1 truncate text-sm font-bold text-fg">
          {name}
          <UserBadge badge={author?.badge} />
        </span>
        <span
          className="inline-flex items-center gap-1 text-xs text-fg-faint"
          suppressHydrationWarning
        >
          <Clock4 className="size-3" aria-hidden />
          {formatRelativeTime(when)}
        </span>
      </span>
    </>
  );

  return author ? (
    <Link
      href={`/u/${encodeURIComponent(author.username)}`}
      className="flex items-center gap-3 transition-opacity hover:opacity-80"
    >
      {inner}
    </Link>
  ) : (
    <div className="flex items-center gap-3">{inner}</div>
  );
}

export default async function ThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const [thread, user] = await Promise.all([
    getThreadById(params.id),
    getCurrentUser(),
  ]);
  if (!thread) notFound();

  const category = getCategory(thread.categoryId);
  const admin = await isAdmin(user);
  const canDeleteThread = Boolean(
    user && (admin || thread.author?.id === user.id),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={category ? `/community?cat=${category.id}` : "/community"}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-subtle transition-colors hover:text-accent"
      >
        <ArrowRight className="size-4" aria-hidden />
        {category ? category.name : "المجتمع"}
      </Link>

      {/* Original post */}
      <article className="rounded-card border border-line bg-surface-raised/40 p-5 sm:p-6">
        {category ? (
          <span className="mb-3 inline-block rounded-md bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent ring-1 ring-accent/20">
            {category.name}
          </span>
        ) : null}
        {thread.pinned ? (
          <span className="mb-3 ms-2 inline-flex items-center gap-1 rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent ring-1 ring-accent/30">
            <Pin className="size-3" aria-hidden />
            مثبّت
          </span>
        ) : null}
        <h1 className="text-xl font-extrabold leading-snug tracking-tight text-fg sm:text-2xl">
          {thread.title}
        </h1>
        <div className="mt-3">
          <AuthorChip author={thread.author} when={thread.createdAt} />
        </div>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-fg-muted">
          {thread.body}
        </p>
        {admin || canDeleteThread ? (
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-3">
            {admin ? (
              <form action={setThreadPinnedAction}>
                <input type="hidden" name="threadId" value={thread.id} />
                <input type="hidden" name="pinned" value={thread.pinned ? "no" : "yes"} />
                <button
                  type="submit"
                  className={
                    thread.pinned
                      ? "inline-flex items-center gap-1.5 rounded-pill bg-accent/15 px-3 py-2 text-xs font-bold text-accent ring-1 ring-accent/30 transition-colors hover:bg-accent/25 active:scale-95"
                      : "inline-flex items-center gap-1.5 rounded-pill bg-overlay px-3 py-2 text-xs font-bold text-fg-muted ring-1 ring-line transition-colors hover:text-fg active:scale-95"
                  }
                >
                  <Pin className="size-4" aria-hidden />
                  {thread.pinned ? "إلغاء التثبيت" : "تثبيت"}
                </button>
              </form>
            ) : null}
            {canDeleteThread ? (
              <DeleteButton
                action={deleteThreadAction}
                fields={{ threadId: thread.id }}
                label="حذف النقاش"
                confirmMessage="هل أنت متأكد من حذف هذا النقاش وكل ردوده؟ لا يمكن التراجع."
              />
            ) : null}
          </div>
        ) : null}
      </article>

      {/* Replies */}
      <section>
        <div className="mb-4 flex items-center gap-2.5">
          <MessagesSquare className="size-4 text-fg-subtle" strokeWidth={2.25} aria-hidden />
          <h2 className="text-sm font-bold tracking-tight text-fg">
            الردود ({thread.replyCount.toLocaleString("ar")})
          </h2>
        </div>

        {thread.replies.length > 0 ? (
          <ul className="space-y-3">
            {thread.replies.map((reply) => (
              <li
                key={reply.id}
                className="rounded-card border border-line bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <AuthorChip author={reply.author} when={reply.createdAt} />
                  {user && (admin || reply.author?.id === user.id) ? (
                    <DeleteButton
                      action={deleteReplyAction}
                      fields={{ threadId: thread.id, replyId: reply.id }}
                      label="حذف الرد"
                      iconOnly
                      confirmMessage="هل أنت متأكد من حذف هذا الرد؟"
                      className="grid size-8 shrink-0 place-items-center rounded-pill text-fg-faint transition-colors hover:bg-rose-500/15 hover:text-rose-300 active:scale-95"
                    />
                  ) : null}
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg-muted">
                  {reply.body}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="لا توجد ردود بعد"
            description="كن أول من يشارك برأيه في هذا النقاش."
          />
        )}
      </section>

      {/* Reply box */}
      <section className="rounded-card border border-line bg-surface-raised/40 p-5">
        {user ? (
          <ReplyForm threadId={thread.id} />
        ) : (
          <p className="text-sm text-fg-subtle">
            <Link
              href={`/login?next=${encodeURIComponent(`/community/${thread.id}`)}`}
              className="font-bold text-accent transition-colors hover:text-accent-bright"
            >
              سجّل الدخول
            </Link>{" "}
            للمشاركة في النقاش وإضافة ردّك.
          </p>
        )}
      </section>
    </div>
  );
}
