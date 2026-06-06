import Link from "next/link";
import {
  Users,
  MessageSquare,
  Star,
  Sparkles,
  Languages,
  Plus,
  Clock4,
  Inbox,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getCategoriesWithCounts, getThreads, getCategory } from "@/lib/forum";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { UserBadge } from "@/components/ui/UserBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerGroup, StaggerItem } from "@/components/ui/motion";
import { cn, formatRelativeTime } from "@/lib/utils";

export const metadata = { title: "المجتمع | قارئ مانجا" };

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  general: MessageSquare,
  reviews: Star,
  recommendations: Sparkles,
  translations: Languages,
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const activeCat = searchParams.cat;
  const activeCategory = activeCat ? getCategory(activeCat) : null;
  // An unknown ?cat falls back to showing everything.
  const filterId = activeCategory?.id;

  const [categories, threads, user] = await Promise.all([
    getCategoriesWithCounts(),
    getThreads({ categoryId: filterId }),
    getCurrentUser(),
  ]);

  const newThreadHref = filterId
    ? `/community/new?cat=${filterId}`
    : "/community/new";

  return (
    <div>
      <PageHeader
        icon={Users}
        title="المجتمع"
        subtitle="تواصل مع القرّاء، شارك المراجعات، واطرح نقاشاتك."
        action={
          <Link
            href={newThreadHref}
            className="inline-flex items-center gap-2 rounded-pill bg-accent px-4 py-2 text-sm font-bold text-white shadow-glow-orange transition-all hover:bg-accent-bright active:scale-95"
          >
            <Plus className="size-4" aria-hidden />
            نقاش جديد
          </Link>
        }
      />

      {/* Categories — act as filters */}
      <StaggerGroup className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.id] ?? MessageSquare;
          const isActive = filterId === category.id;
          return (
            <StaggerItem key={category.id}>
              <Link
                href={isActive ? "/community" : `/community?cat=${category.id}`}
                aria-pressed={isActive}
                className={cn(
                  "group flex h-full w-full items-start gap-4 rounded-card border bg-surface-raised/50 p-5 text-start transition-all duration-200 ease-out-soft hover:-translate-y-0.5 hover:bg-surface-raised hover:shadow-card-hover",
                  isActive
                    ? "border-accent/40 ring-1 ring-accent/30"
                    : "border-line hover:border-line-strong",
                )}
              >
                <span
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-card ring-1 transition-transform duration-200 group-hover:scale-105",
                    isActive
                      ? "bg-accent text-white ring-transparent"
                      : "bg-accent/10 text-accent ring-accent/20",
                  )}
                >
                  <Icon className="size-6" strokeWidth={2.1} aria-hidden />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="font-bold text-fg">{category.name}</p>
                  <p className="text-sm leading-relaxed text-fg-subtle">
                    {category.description}
                  </p>
                  <p className="pt-1 text-xs font-semibold text-fg-faint">
                    {category.threadCount.toLocaleString("ar")} نقاش
                  </p>
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerGroup>

      {/* Threads */}
      <section className="rounded-card border border-line bg-surface-raised/40 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-1 rounded-full bg-accent" aria-hidden />
            <h2 className="text-base font-bold tracking-tight text-fg">
              {activeCategory ? activeCategory.name : "أحدث النقاشات"}
            </h2>
          </div>
          {activeCategory ? (
            <Link
              href="/community"
              className="inline-flex items-center gap-1 rounded-pill px-2 py-1 text-xs font-semibold text-fg-subtle transition-colors hover:text-accent"
            >
              <X className="size-3.5" aria-hidden />
              كل النقاشات
            </Link>
          ) : null}
        </div>

        {threads.length > 0 ? (
          <ul className="divide-y divide-line">
            {threads.map((thread) => {
              const authorName =
                thread.author?.displayName ||
                thread.author?.username ||
                "مستخدم محذوف";
              return (
                <li key={thread.id}>
                  <Link
                    href={`/community/${thread.id}`}
                    className="group flex items-center gap-4 py-3.5 transition-colors"
                  >
                    <Avatar
                      name={authorName}
                      color={thread.author?.avatarColor}
                      image={thread.author?.avatarImage}
                      className="size-10 text-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg transition-colors group-hover:text-accent">
                        {thread.title}
                      </p>
                      <p className="truncate text-xs text-fg-faint">
                        <span className="inline-flex items-center gap-1 align-middle">
                          بواسطة {authorName}
                          <UserBadge badge={thread.author?.badge} className="size-3.5" />
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-fg-faint">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3.5" aria-hidden />
                        {thread.replyCount.toLocaleString("ar")}
                      </span>
                      <span
                        className="inline-flex items-center gap-1"
                        suppressHydrationWarning
                      >
                        <Clock4 className="size-3.5" aria-hidden />
                        {formatRelativeTime(thread.updatedAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Inbox}
            title="لا توجد نقاشات بعد"
            description={
              user
                ? "كن أول من يبدأ نقاشًا في هذا القسم."
                : "سجّل الدخول وكن أول من يبدأ نقاشًا هنا."
            }
          />
        )}
      </section>
    </div>
  );
}
