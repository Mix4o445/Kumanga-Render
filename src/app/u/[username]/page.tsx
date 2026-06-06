import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Eye,
  Globe,
  Layers,
  Library,
  Pencil,
  BadgeCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getProfileByUsername } from "@/lib/profile";
import { getMangaByUploader } from "@/lib/db";
import { verifyUserAction, unverifyUserAction } from "@/lib/actions";
import { Avatar } from "@/components/ui/Avatar";
import { UserBadge } from "@/components/ui/UserBadge";
import { MangaGrid } from "@/components/ui/MangaGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { bannerGradient } from "@/lib/avatar";
import { cn, formatCompact, formatMonthYear } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}) {
  const profile = await getProfileByUsername(decodeURIComponent(params.username));
  return {
    title: profile
      ? `${profile.displayName ?? profile.username} | قارئ مانجا`
      : "المستخدم غير موجود",
  };
}

/** Display host (no protocol / "www.") for a stored website link. */
function hostLabel(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-surface-raised/50 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-overlay text-fg-muted ring-1 ring-line">
        <Icon className="size-[18px]" strokeWidth={2.1} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-extrabold leading-none text-fg">{value}</p>
        <p className="mt-1 text-xs text-fg-faint">{label}</p>
      </div>
    </div>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const username = decodeURIComponent(params.username);
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const viewer = await getCurrentUser();
  const admin = await isAdmin(viewer);
  const canSeePending = admin || viewer?.id === profile.id;
  const uploads = await getMangaByUploader(profile.id, {
    includeUnapproved: canSeePending,
  });

  const isOwner = viewer?.id === profile.id;
  const displayName = profile.displayName || profile.username;
  const website = hostLabel(profile.website);
  const chapters = uploads.reduce((sum, m) => sum + m.totalChapters, 0);
  const views = uploads.reduce((sum, m) => sum + (m.views ?? 0), 0);

  return (
    <div className="space-y-10">
      {/* Profile header: banner + overlapping avatar */}
      <section className="overflow-hidden rounded-hero border border-line bg-surface">
        <div className="relative h-36 w-full sm:h-52">
          {profile.bannerImage ? (
            <Image
              src={profile.bannerImage}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1100px"
              className="object-cover"
            />
          ) : (
            <div className={cn("absolute inset-0", bannerGradient(profile.avatarColor))} />
          )}
          <div className="hero-scrim-bottom pointer-events-none absolute inset-0" />
        </div>

        <div className="px-6 pb-6 sm:px-8">
          {/* Avatar overlaps the banner (start / right in RTL). `relative z-10`
              lifts it above the banner's absolutely-positioned <Image fill>. */}
          <div className="relative z-10 -mt-12 w-fit sm:-mt-16">
            <Avatar
              name={displayName}
              color={profile.avatarColor}
              image={profile.avatarImage}
              className="size-24 text-4xl shadow-card ring-4 ring-surface sm:size-28 sm:text-5xl"
            />
          </div>

          {/* Identity + edit action share a row so the space stays balanced. */}
          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-2xl font-extrabold leading-tight tracking-tight text-fg sm:text-3xl">
                {displayName}
                <UserBadge badge={profile.badge} className="size-5" />
              </h1>
              <p className="mt-1 text-sm font-medium text-fg-subtle">
                <span dir="ltr">@{profile.username}</span>
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs text-fg-faint">
                  <CalendarDays className="size-3.5" aria-hidden />
                  <span suppressHydrationWarning>
                    انضمّ في {formatMonthYear(profile.createdAt)}
                  </span>
                </span>
                {website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-accent-bright"
                  >
                    <Globe className="size-3.5" aria-hidden />
                    <span dir="ltr">{website}</span>
                  </a>
                ) : null}
              </div>
            </div>

            {isOwner ? (
              <Link
                href="/settings/profile"
                className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-line bg-overlay px-4 py-2 text-xs font-bold text-fg-muted transition-colors hover:bg-overlay-strong hover:text-fg active:scale-95"
              >
                <Pencil className="size-3.5" aria-hidden />
                تعديل الملف
              </Link>
            ) : admin ? (
              <form action={profile.verified ? unverifyUserAction : verifyUserAction}>
                <input type="hidden" name="userId" value={profile.id} />
                <input type="hidden" name="username" value={profile.username} />
                <button
                  type="submit"
                  className={
                    profile.verified
                      ? "mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-line bg-overlay px-4 py-2 text-xs font-bold text-fg-muted transition-colors hover:border-rose-500/40 hover:text-rose-400 active:scale-95"
                      : "mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-sky-500/15 px-4 py-2 text-xs font-bold text-sky-300 ring-1 ring-sky-500/30 transition-colors hover:bg-sky-500/25 active:scale-95"
                  }
                >
                  <BadgeCheck className="size-4" aria-hidden />
                  {profile.verified ? "إلغاء التوثيق" : "توثيق المستخدم"}
                </button>
              </form>
            ) : null}
          </div>

          {profile.bio ? (
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-fg-muted">
              {profile.bio}
            </p>
          ) : null}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatChip
              icon={Library}
              label="الأعمال المرفوعة"
              value={uploads.length.toLocaleString("ar")}
            />
            <StatChip
              icon={Layers}
              label="إجمالي الفصول"
              value={chapters.toLocaleString("ar")}
            />
            <StatChip icon={Eye} label="إجمالي المشاهدات" value={formatCompact(views)} />
          </div>
        </div>
      </section>

      {/* Uploads */}
      <section>
        <SectionHeading icon={Library} title="الأعمال المرفوعة" accent="orange" />
        <div className="mt-5">
          <MangaGrid
            items={uploads}
            emptyIcon={Library}
            emptyTitle={isOwner ? "لم ترفع أي عمل بعد" : "لا توجد أعمال منشورة"}
            emptyDescription={
              isOwner
                ? "ابدأ بمشاركة عمل جديد وسيظهر هنا على ملفك."
                : "لم يقم هذا المستخدم بنشر أي عمل حتى الآن."
            }
          />
        </div>
      </section>
    </div>
  );
}
