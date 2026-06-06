import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin";
import { getConversation } from "@/lib/support";
import { Avatar } from "@/components/ui/Avatar";
import { SupportThread } from "@/components/support/SupportThread";
import { SupportComposer } from "@/components/support/SupportComposer";

export const metadata = { title: "محادثة الدعم | قارئ مانجا" };

export default async function AdminConversationPage({
  params,
}: {
  params: { userId: string };
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const conversation = await getConversation(params.userId);
  // No such user at all → 404; an existing user with no messages is fine.
  if (!conversation.user && conversation.messages.length === 0) notFound();

  const name =
    conversation.user?.displayName ||
    conversation.user?.username ||
    "مستخدم محذوف";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/messages"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-fg-subtle transition-colors hover:text-accent"
      >
        <ArrowRight className="size-4" aria-hidden />
        العودة إلى صندوق الدعم
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <Avatar
          name={name}
          color={conversation.user?.avatarColor}
          image={conversation.user?.avatarImage}
          className="size-12 text-lg"
        />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-fg">{name}</h1>
          {conversation.user ? (
            <Link
              href={`/u/${encodeURIComponent(conversation.user.username)}`}
              className="text-xs font-medium text-fg-subtle transition-colors hover:text-accent"
            >
              <span dir="ltr">@{conversation.user.username}</span>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface-raised/40 p-4 sm:p-5">
        <SupportThread
          messages={conversation.messages}
          viewerIsAdmin
          user={conversation.user}
        />
      </div>

      <div className="mt-4">
        <SupportComposer variant="admin" userId={params.userId} />
      </div>
    </div>
  );
}
