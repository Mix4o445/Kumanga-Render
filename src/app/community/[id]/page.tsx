import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MessageSquare, Clock4, MessagesSquare } from "lucide-react";
import type { ForumAuthor } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { getThreadById, getCategory } from "@/lib/forum";
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
        <h1 className="text-xl font-extrabold leading-snug tracking-tight text-fg sm:text-2xl">
          {thread.title}
        </h1>
        <div className="mt-3">
          <AuthorChip author={thread.author} when={thread.createdAt} />
        </div>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-fg-muted">
          {thread.body}
        </p>
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
                <AuthorChip author={reply.author} when={reply.createdAt} />
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
