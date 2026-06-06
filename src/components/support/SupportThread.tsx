import { MessagesSquare, ShieldCheck } from "lucide-react";
import type { ForumAuthor, SupportMessage } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { UserBadge } from "@/components/ui/UserBadge";
import { cn, formatRelativeTime } from "@/lib/utils";

/**
 * Renders a support conversation as chat bubbles. A message is "mine" when
 * its sender matches the viewer (the admin sees their own replies on the
 * start side; the user sees their own messages there).
 */
export function SupportThread({
  messages,
  viewerIsAdmin,
  user,
}: {
  messages: SupportMessage[];
  viewerIsAdmin: boolean;
  user: ForumAuthor | null;
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-card bg-accent/10 text-accent ring-1 ring-accent/20">
          <MessagesSquare className="size-6" aria-hidden />
        </span>
        <p className="text-sm font-bold text-fg">لا توجد رسائل بعد</p>
        <p className="max-w-xs text-xs leading-relaxed text-fg-faint">
          {viewerIsAdmin
            ? "لم يرسل هذا المستخدم أي رسالة بعد."
            : "اكتب رسالتك أدناه وسيتواصل معك فريق الإدارة."}
        </p>
      </div>
    );
  }

  const userName = user?.displayName || user?.username || "مستخدم";

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const mine = viewerIsAdmin === message.fromAdmin;
        return (
          <div
            key={message.id}
            className={cn("flex items-end gap-2.5", mine ? "justify-start" : "justify-end")}
          >
            {!mine ? (
              message.fromAdmin ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-card bg-accent/15 text-accent ring-1 ring-accent/25">
                  <ShieldCheck className="size-4" aria-hidden />
                </span>
              ) : (
                <Avatar
                  name={userName}
                  color={user?.avatarColor}
                  image={user?.avatarImage}
                  className="size-8 text-xs"
                />
              )
            ) : null}

            <div
              className={cn(
                "max-w-[78%] rounded-card px-3.5 py-2.5",
                mine
                  ? "bg-accent text-white"
                  : "bg-surface-raised text-fg ring-1 ring-line",
              )}
            >
              <p className="mb-1 flex items-center gap-1 text-[11px] font-bold opacity-80">
                {message.fromAdmin ? "فريق الإدارة" : userName}
                {!message.fromAdmin ? (
                  <UserBadge badge={user?.badge} className="size-3.5" />
                ) : null}
              </p>
              <p className="whitespace-pre-line text-sm leading-6">{message.body}</p>
              <p
                className={cn(
                  "mt-1 text-[11px]",
                  mine ? "text-white/70" : "text-fg-faint",
                )}
                suppressHydrationWarning
              >
                {formatRelativeTime(message.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
