import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox, MessagesSquare, ChevronLeft } from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin";
import { getConversationSummaries } from "@/lib/support";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "صندوق الدعم | قارئ مانجا" };

export default async function AdminMessagesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const conversations = await getConversationSummaries();

  return (
    <div>
      <PageHeader
        icon={MessagesSquare}
        title="صندوق الدعم"
        subtitle="رسائل المستخدمين إلى فريق الإدارة."
        accent="blue"
      />

      {conversations.length > 0 ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface-raised/40">
          {conversations.map((convo) => {
            const name =
              convo.user?.displayName || convo.user?.username || "مستخدم محذوف";
            const preview = convo.lastMessage;
            return (
              <li key={convo.userId}>
                <Link
                  href={`/admin/messages/${convo.userId}`}
                  className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-overlay"
                >
                  <Avatar
                    name={name}
                    color={convo.user?.avatarColor}
                    image={convo.user?.avatarImage}
                    className="size-11 text-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-fg transition-colors group-hover:text-accent">
                        {name}
                      </p>
                      <span className="shrink-0 text-[11px] text-fg-faint">
                        ({convo.messageCount.toLocaleString("ar")})
                      </span>
                    </div>
                    {preview ? (
                      <p className="truncate text-xs text-fg-faint">
                        {preview.fromAdmin ? "أنت: " : ""}
                        {preview.body}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-fg-faint" suppressHydrationWarning>
                      {formatRelativeTime(convo.updatedAt)}
                    </span>
                    <ChevronLeft
                      className="size-4 text-fg-faint transition-all group-hover:-translate-x-0.5 group-hover:text-accent"
                      aria-hidden
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={Inbox}
          title="لا توجد رسائل"
          description="ستظهر هنا رسائل المستخدمين إلى الإدارة فور وصولها."
        />
      )}
    </div>
  );
}
