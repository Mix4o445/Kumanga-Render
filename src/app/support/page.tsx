import Link from "next/link";
import { redirect } from "next/navigation";
import { MessagesSquare, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getConversation } from "@/lib/support";
import { PageHeader } from "@/components/ui/PageHeader";
import { SupportThread } from "@/components/support/SupportThread";
import { SupportComposer } from "@/components/support/SupportComposer";

export const metadata = { title: "مراسلة الإدارة | قارئ مانجا" };

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/support");

  const [admin, conversation] = await Promise.all([
    isAdmin(user),
    getConversation(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={MessagesSquare}
        title="مراسلة الإدارة"
        subtitle="تواصل مباشرة مع فريق الإدارة. سنردّ على رسالتك في أقرب وقت."
      />

      {admin ? (
        <Link
          href="/admin/messages"
          className="mb-6 flex items-center gap-2 rounded-card border border-line bg-surface-raised/40 px-4 py-3 text-sm text-fg-muted transition-colors hover:bg-overlay hover:text-fg"
        >
          <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden />
          أنت مشرف — لإدارة رسائل المستخدمين انتقل إلى صندوق الدعم.
        </Link>
      ) : null}

      <div className="rounded-card border border-line bg-surface-raised/40 p-4 sm:p-5">
        <SupportThread
          messages={conversation.messages}
          viewerIsAdmin={false}
          user={conversation.user}
        />
      </div>

      <div className="mt-4">
        <SupportComposer variant="user" />
      </div>
    </div>
  );
}
