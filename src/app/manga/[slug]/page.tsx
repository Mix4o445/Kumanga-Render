import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  Eye,
  Layers,
  Activity,
  BookOpen,
  Sparkles,
  Plus,
  Clock3,
  Ban,
  Pencil,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getChapters, getMangaBySlug, getRelated } from "@/lib/db";
import { getRatingSummary } from "@/lib/ratings";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getProfileById } from "@/lib/profile";
import { deleteMangaAction } from "@/lib/actions";
import { DeleteButton } from "@/components/manga/DeleteButton";
import { Avatar } from "@/components/ui/Avatar";
import { UserBadge } from "@/components/ui/UserBadge";
import { STATUS_META } from "@/lib/config";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { ChapterList } from "@/components/manga/ChapterList";
import { StarRating } from "@/components/manga/StarRating";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { MangaGrid } from "@/components/ui/MangaGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatCompact } from "@/lib/utils";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const manga = await getMangaBySlug(params.slug, { includeUnapproved: true });
  if (!manga) {
    return { title: "العمل غير موجود", robots: { index: false, follow: false } };
  }

  const description =
    manga.synopsis.length > 160
      ? `${manga.synopsis.slice(0, 157)}…`
      : manga.synopsis;
  const path = `/manga/${encodeURIComponent(manga.slug)}`;
  const isPublic = !manga.reviewStatus || manga.reviewStatus === "approved";

  return {
    title: manga.title,
    description,
    keywords: [manga.title, ...manga.genres.map((g) => g.name), "مانجا", "مانهوا"],
    alternates: { canonical: path },
    // Keep unapproved/pending titles out of search results.
    robots: isPublic ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title: manga.title,
      description,
      url: absoluteUrl(path),
      images: manga.coverImage
        ? [{ url: manga.coverImage, alt: manga.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: manga.title,
      description,
      images: manga.coverImage ? [manga.coverImage] : undefined,
    },
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-surface-raised/50 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-overlay text-fg-muted ring-1 ring-line">
        <Icon className="size-[18px]" strokeWidth={2.1} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-fg-faint">{label}</p>
        <p className="truncate text-sm font-bold text-fg">{value}</p>
      </div>
    </div>
  );
}

export default async function MangaPage({
  params,
}: {
  params: { slug: string };
}) {
  const user = await getCurrentUser();
  const admin = await isAdmin(user);
  const manga = await getMangaBySlug(params.slug, { includeUnapproved: true });
  if (!manga) notFound();

  const isOwner = Boolean(user && user.id === manga.uploaderId);
  // Owners can still *see* their pending content, but only admins may edit/delete.
  const canManage = admin || isOwner;
  const canEdit = admin;
  const isApproved =
    manga.reviewStatus === undefined || manga.reviewStatus === "approved";
  // Hide unapproved titles from everyone but the owner and admins.
  if (!isApproved && !canManage) notFound();

  const [chapters, related] = await Promise.all([
    getChapters(params.slug, { includeUnapproved: canManage }),
    getRelated(params.slug, 10),
  ]);
  const rating = await getRatingSummary(manga.id, user?.id);

  const banner = manga.bannerImage ?? manga.coverImage;
  const firstChapter = chapters[chapters.length - 1];
  const uploader = manga.uploaderId
    ? await getProfileById(manga.uploaderId)
    : null;

  // Resolve display info for every chapter uploader (one lookup per id).
  const chapterUploaderIds = Array.from(
    new Set(chapters.map((c) => c.uploaderId).filter((x): x is string => Boolean(x))),
  );
  const chapterUploaderProfiles = await Promise.all(
    chapterUploaderIds.map((id) => getProfileById(id)),
  );
  const uploaders: Record<string, { username: string; displayName?: string }> = {};
  chapterUploaderIds.forEach((id, i) => {
    const p = chapterUploaderProfiles[i];
    if (p) uploaders[id] = { username: p.username, displayName: p.displayName };
  });

  // Structured data (schema.org) — helps search engines render rich results.
  const canonicalUrl = absoluteUrl(`/manga/${encodeURIComponent(manga.slug)}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: manga.title,
    url: canonicalUrl,
    description: manga.synopsis,
    image: manga.coverImage || undefined,
    inLanguage: "ar",
    bookFormat: "https://schema.org/EBook",
    genre: manga.genres.map((g) => g.name),
    author: manga.author?.name
      ? { "@type": "Person", name: manga.author.name }
      : undefined,
    datePublished: manga.year ? String(manga.year) : undefined,
    dateModified: manga.updatedAt || undefined,
    numberOfPages: undefined,
    publisher: { "@type": "Organization", name: SITE_NAME },
    aggregateRating:
      rating.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: rating.average,
            ratingCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "المانجا", item: absoluteUrl("/manga") },
      { "@type": "ListItem", position: 3, name: manga.title, item: canonicalUrl },
    ],
  };

  return (
    <div className="space-y-12">
      {isApproved ? (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
          />
        </>
      ) : null}
      {!isApproved && canManage ? (
        <div
          className={
            manga.reviewStatus === "rejected"
              ? "flex items-start gap-3 rounded-card border border-rose-500/30 bg-rose-500/10 p-4"
              : "flex items-start gap-3 rounded-card border border-amber-500/30 bg-amber-500/10 p-4"
          }
        >
          {manga.reviewStatus === "rejected" ? (
            <Ban className="mt-0.5 size-5 shrink-0 text-rose-400" aria-hidden />
          ) : (
            <Clock3 className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden />
          )}
          <div className="text-sm leading-6">
            {manga.reviewStatus === "rejected" ? (
              <>
                <p className="font-bold text-rose-300">تم رفض هذا العمل</p>
                <p className="text-fg-muted">
                  لم يجتَز هذا العمل المراجعة، وهو غير ظاهر للقرّاء. يمكنك مراجعة
                  سياسة المحتوى أو التواصل معنا.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-amber-300">قيد المراجعة</p>
                <p className="text-fg-muted">
                  هذا العمل بانتظار موافقة المشرف ولن يظهر للقرّاء حتى تتم
                  الموافقة عليه. هذه المعاينة مرئية لك وحدك (وللمشرفين).
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
      <section>
        {/* Banner */}
        <div className="relative h-44 overflow-hidden rounded-hero border border-line sm:h-64">
          <Image
            src={banner}
            alt={manga.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1100px"
            className="object-cover"
          />
          <div className="hero-scrim-bottom pointer-events-none absolute inset-0" />
        </div>

        {/* Cover + meta (title sits below the banner, on the canvas) */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:px-6">
          <div className="relative -mt-16 aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-card bg-surface-raised shadow-card ring-1 ring-line sm:-mt-24 sm:w-44">
            <Image
              src={manga.coverImage}
              alt={manga.title}
              fill
              sizes="176px"
              className="object-cover"
            />
          </div>

          <div className="flex-1 space-y-3 sm:pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={manga.status} />
              {manga.year ? (
                <span className="rounded-pill bg-overlay px-2.5 py-1 text-xs font-semibold text-fg-muted ring-1 ring-line">
                  {manga.year.toLocaleString("ar")}
                </span>
              ) : null}
              {rating.count > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-pill bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400 ring-1 ring-amber-500/20">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                  {rating.average.toLocaleString("ar", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                  <span className="text-amber-400/70">/5</span>
                </span>
              ) : (
                <span className="rounded-pill bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                  جديد
                </span>
              )}
            </div>

            <h1 className="text-2xl font-extrabold leading-tight tracking-tight-display text-fg sm:text-4xl">
              {manga.title}
            </h1>

            {manga.author ? (
              <p className="text-sm font-medium text-fg-muted">{manga.author.name}</p>
            ) : null}

            {uploader ? (
              <Link
                href={`/u/${encodeURIComponent(uploader.username)}`}
                className="inline-flex w-fit items-center gap-2 rounded-pill border border-line bg-overlay px-2.5 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-overlay-strong hover:text-fg"
              >
                <Avatar
                  name={uploader.displayName || uploader.username}
                  color={uploader.avatarColor}
                  image={uploader.avatarImage}
                  className="size-5 text-[10px]"
                />
                <span>نشرها {uploader.displayName || uploader.username}</span>
                <UserBadge badge={uploader.badge} className="size-3.5" />
              </Link>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              {manga.genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={`/genre/${genre.slug}`}
                  className="rounded-pill border border-line bg-overlay px-3 py-1 text-xs font-medium text-fg-muted transition-colors hover:border-orange-500/40 hover:text-orange-400"
                >
                  {genre.name}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {firstChapter ? (
                <Link
                  href={`/manga/${manga.slug}/${firstChapter.number}`}
                  className="inline-flex items-center gap-2 rounded-pill bg-royal px-6 py-3 text-sm font-bold text-white shadow-glow-blue transition-all hover:bg-blue-500 active:scale-95"
                >
                  <BookOpen className="size-4" aria-hidden />
                  ابدأ القراءة
                </Link>
              ) : null}
              <FavoriteButton slug={manga.slug} className="size-12" />
              <Link
                href={`/manga/${manga.slug}/upload`}
                className="inline-flex items-center gap-2 rounded-pill border border-line bg-overlay px-5 py-3 text-sm font-bold text-fg transition-colors hover:bg-overlay-strong active:scale-95"
              >
                <Plus className="size-4" aria-hidden />
                رفع فصل
              </Link>
            </div>

            {canEdit ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link
                  href={`/manga/${manga.slug}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-pill bg-overlay px-4 py-2 text-xs font-bold text-fg-muted ring-1 ring-line transition-colors hover:text-fg active:scale-95"
                >
                  <Pencil className="size-4" aria-hidden />
                  تعديل العمل
                </Link>
                <DeleteButton
                  action={deleteMangaAction}
                  fields={{ mangaId: manga.id }}
                  label="حذف العمل"
                  confirmMessage={`هل أنت متأكد من حذف «${manga.title}» وجميع فصوله؟ لا يمكن التراجع.`}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <StarRating
        mangaId={manga.id}
        slug={manga.slug}
        average={rating.average}
        count={rating.count}
        mine={rating.mine}
        canRate={Boolean(user)}
      />

      {/* Synopsis + stats */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-bold tracking-tight text-fg">القصة</h2>
          <p className="max-w-3xl leading-relaxed text-fg-muted">{manga.synopsis}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Star}
            label="التقييم"
            value={
              rating.count > 0
                ? `${rating.average.toLocaleString("ar", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })} / ٥`
                : "—"
            }
          />
          <StatCard
            icon={Layers}
            label="الفصول"
            value={manga.totalChapters.toLocaleString("ar")}
          />
          <StatCard icon={Eye} label="المشاهدات" value={formatCompact(manga.views ?? 0)} />
          <StatCard icon={Activity} label="الحالة" value={STATUS_META[manga.status].label} />
        </div>
      </section>

      <ChapterList
        slug={manga.slug}
        chapters={chapters}
        canManage={canEdit}
        mangaId={manga.id}
        uploaders={uploaders}
      />

      <CommentsSection
        targetType="manga"
        targetId={manga.id}
        path={`/manga/${manga.slug}`}
      />

      {related.length > 0 ? (
        <section>
          <SectionHeading icon={Sparkles} title="أعمال مشابهة" accent="orange" />
          <div className="mt-5">
            <MangaGrid items={related} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
