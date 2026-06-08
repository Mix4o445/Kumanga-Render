"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createSession,
  createUser,
  destroySession,
  getCurrentUser,
  verifyCredentials,
  findUserByUsername,
} from "@/lib/auth";
import {
  addChapter,
  createManga,
  getMangaBySlug,
  getMangaById,
  updateManga,
  updateChapter,
  deleteManga,
  deleteChapter,
  setChapterReview,
  setMangaReview,
  reassignAllUploads,
} from "@/lib/db";
import { getCurrentAdmin, isAdmin } from "@/lib/admin";
import { mangaStore } from "@/lib/db/store";
import { requestPasswordReset, resetPasswordWithToken } from "@/lib/password-reset";
import { submitToIndexNow } from "@/lib/indexnow";
import { absoluteUrl } from "@/lib/seo";
import { getProfileById, updateProfile, setUserVerified } from "@/lib/profile";
import { addReply, createThread, isValidCategory, deleteThread, deleteReply, setThreadPinned } from "@/lib/forum";
import {
  sendMessage as sendSupportMessage,
  markUserRead,
  markAdminRead,
} from "@/lib/support";
import { addComment, deleteComment } from "@/lib/comments";
import { rateManga } from "@/lib/ratings";
import { saveImage, deleteImage } from "@/lib/storage";
import {
  bannedMessage,
  containsProfanity,
  getBanStatus,
  profanityBanMessage,
  recordProfanityOffense,
  PROFANITY_WARNING,
} from "@/lib/moderation";
import { isAvatarColor } from "@/lib/avatar";
import type { MangaStatus, CommentTarget } from "@/types";

export interface ActionState {
  error?: string;
  success?: string;
}

const VALID_STATUS: MangaStatus[] = ["ongoing", "completed", "hiatus", "cancelled"];

function slugify(input: string): string {
  // ASCII-only slug keeps URLs robust regardless of the title's language.
  // (The displayed title is always the original; only the URL slug is ASCII.)
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function fileList(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .filter((v): v is File => v instanceof File && v.size > 0);
}

/**
 * Normalize a user-supplied website into an absolute http(s) URL.
 * Returns null when the value can't be made into a valid link.
 */
function normalizeWebsite(input: string): string | null {
  let s = input.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const url = new URL(s);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/* -------------------------------- auth -------------------------------- */

export async function signupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (username.length < 3) return { error: "اسم المستخدم يجب أن يكون ٣ أحرف على الأقل." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: "يرجى إدخال بريد إلكتروني صحيح." };
  if (password.length < 8)
    return { error: "كلمة المرور يجب أن تكون ٨ أحرف على الأقل." };
  if (password !== confirm) return { error: "كلمتا المرور غير متطابقتين." };

  try {
    const user = await createUser(username, email, password);
    createSession(user.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر إنشاء الحساب." };
  }
  redirect("/");
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  if (!identifier || !password)
    return { error: "يرجى إدخال البريد/اسم المستخدم وكلمة المرور." };

  const user = await verifyCredentials(identifier, password);
  if (!user) return { error: "بيانات الدخول غير صحيحة." };

  createSession(user.id);
  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction(): Promise<void> {
  destroySession();
  redirect("/");
}

/* --------------------------- password reset --------------------------- */

export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: "يرجى إدخال بريد إلكتروني صحيح." };

  try {
    await requestPasswordReset(email);
  } catch {
    // Don't surface provider errors to the client; log server-side only.
    return { error: "تعذّر إرسال رسالة إعادة التعيين، حاول لاحقًا." };
  }

  // Always the same confirmation, whether or not the email is registered.
  return {
    success:
      "إذا كان هناك حساب مرتبط بهذا البريد، فستصلك رسالة بها رابط إعادة التعيين.",
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: "رابط إعادة التعيين غير صالح." };
  if (password.length < 8)
    return { error: "كلمة المرور يجب أن تكون ٨ أحرف على الأقل." };
  if (password !== confirm) return { error: "كلمتا المرور غير متطابقتين." };

  const result = await resetPasswordWithToken(token, password);
  if (result === "expired")
    return { error: "انتهت صلاحية رابط إعادة التعيين، اطلب رابطًا جديدًا." };
  if (result === "invalid")
    return { error: "رابط إعادة التعيين غير صالح أو سبق استخدامه." };

  redirect("/login?reset=1");
}

/* ------------------------------- uploads ------------------------------ */

export async function createMangaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/upload");

  const title = String(formData.get("title") ?? "").trim();
  const synopsis = String(formData.get("synopsis") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "ongoing") as MangaStatus;
  const status = VALID_STATUS.includes(statusRaw) ? statusRaw : "ongoing";
  const yearRaw = parseInt(String(formData.get("year") ?? ""), 10);
  const year = Number.isFinite(yearRaw) ? yearRaw : undefined;
  const genreSlugs = formData.getAll("genres").map(String).filter(Boolean);
  const cover = formData.get("cover");
  const banner = formData.get("banner");

  if (title.length < 2) return { error: "العنوان مطلوب." };
  if (synopsis.length < 10) return { error: "أضف نبذة قصيرة عن العمل." };
  if (genreSlugs.length === 0) return { error: "اختر تصنيفًا واحدًا على الأقل." };
  if (!(cover instanceof File) || cover.size === 0)
    return { error: "يرجى رفع صورة الغلاف." };
  if (formData.get("agree") !== "yes")
    return { error: "يجب الموافقة على شروط الرفع قبل النشر." };

  const mangaApproved = (await isAdmin(user)) || Boolean(user!.verified);
  let slug: string;
  try {
    const fileBase = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const base = slugify(title);
    const coverImage = await saveImage(cover, "covers", `cover-${fileBase}`);
    const bannerImage =
      banner instanceof File && banner.size > 0
        ? await saveImage(banner, "banners", `banner-${fileBase}`)
        : undefined;

    const record = await createManga({
      title,
      authorName: author || undefined,
      coverImage,
      bannerImage,
      synopsis,
      genreSlugs,
      status,
      year,
      uploaderId: user!.id,
      slugBase: base,
      reviewStatus: mangaApproved ? "approved" : "pending",
    });
    slug = record.slug;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر إنشاء العمل." };
  }

  revalidatePath("/");
  // Notify search engines (Bing/Yandex) the moment a public title appears.
  if (mangaApproved) {
    await submitToIndexNow([absoluteUrl("/"), absoluteUrl(`/manga/${slug}`)]);
  }
  redirect(`/manga/${encodeURIComponent(slug)}`);
}

export async function addChapterAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  const slug = String(formData.get("slug") ?? "");
  if (!user) redirect(`/login?next=${encodeURIComponent(`/manga/${slug}/upload`)}`);

  const manga = await getMangaBySlug(slug, { includeUnapproved: true });
  if (!manga) return { error: "العمل غير موجود." };

  const number = parseFloat(String(formData.get("number") ?? ""));
  const title = String(formData.get("title") ?? "").trim() || undefined;
  const pages = fileList(formData, "pages");

  if (!Number.isFinite(number) || number <= 0)
    return { error: "أدخل رقم فصل صحيحًا." };
  if (formData.get("agree") !== "yes")
    return { error: "يجب الموافقة على شروط الرفع قبل النشر." };
  if (pages.length === 0) return { error: "أضف صفحة واحدة على الأقل." };

  const reviewStatus =
    (await isAdmin(user)) || user!.verified ? "approved" : "pending";

  try {
    const chapterDir = `chapters/${manga.id}/${number}`;
    const urls: string[] = [];
    for (let i = 0; i < pages.length; i++) {
      urls.push(await saveImage(pages[i], chapterDir, String(i + 1).padStart(3, "0")));
    }
    await addChapter({
      slug,
      number,
      title,
      pages: urls,
      uploaderId: user!.id,
      reviewStatus,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر رفع الفصل." };
  }

  revalidatePath(`/manga/${slug}`);
  // Approved chapters go straight to the reader; pending ones return to the
  // title page where the owner sees them marked "under review".
  if (reviewStatus === "approved") {
    await submitToIndexNow([
      absoluteUrl(`/manga/${slug}`),
      absoluteUrl(`/manga/${slug}/${number}`),
    ]);
    redirect(`/manga/${encodeURIComponent(slug)}/${number}`);
  }
  redirect(`/manga/${encodeURIComponent(slug)}`);
}

/* ------------------------------- profile ------------------------------ */

const MAX_DISPLAY_NAME = 40;
const MAX_BIO = 240;
const MAX_WEBSITE = 120;

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings/profile");

  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatarColor = String(formData.get("avatarColor") ?? "");
  const websiteRaw = String(formData.get("website") ?? "").trim();
  const removeAvatar = formData.get("removeAvatar") === "1";
  const removeBanner = formData.get("removeBanner") === "1";
  const avatarFile = formData.get("avatarImage");
  const bannerFile = formData.get("bannerImage");

  if (displayName.length > MAX_DISPLAY_NAME)
    return { error: "الاسم المعروض يجب ألا يتجاوز ٤٠ حرفًا." };
  if (bio.length > MAX_BIO)
    return { error: "النبذة يجب ألا تتجاوز ٢٤٠ حرفًا." };
  if (websiteRaw.length > MAX_WEBSITE)
    return { error: "الرابط طويل جدًا." };

  // Resolve website ("" clears it; a bad value is rejected).
  let website = "";
  if (websiteRaw) {
    const normalized = normalizeWebsite(websiteRaw);
    if (!normalized)
      return { error: "أدخل رابطًا صحيحًا (مثل: example.com)." };
    website = normalized;
  }

  const existing = await getProfileById(user!.id);

  try {
    const base = `${user!.id}-${Date.now().toString(36)}`;

    // Avatar: a new upload wins; otherwise honor an explicit remove.
    let avatarImage: string | null | undefined;
    if (avatarFile instanceof File && avatarFile.size > 0) {
      avatarImage = await saveImage(avatarFile, "avatars", `avatar-${base}`);
      await deleteImage(existing?.avatarImage);
    } else if (removeAvatar) {
      avatarImage = null;
      await deleteImage(existing?.avatarImage);
    }

    // Banner: same precedence as the avatar.
    let bannerImage: string | null | undefined;
    if (bannerFile instanceof File && bannerFile.size > 0) {
      bannerImage = await saveImage(bannerFile, "profile-banners", `banner-${base}`);
      await deleteImage(existing?.bannerImage);
    } else if (removeBanner) {
      bannerImage = null;
      await deleteImage(existing?.bannerImage);
    }

    await updateProfile(user!.id, {
      displayName,
      bio,
      website,
      avatarColor: isAvatarColor(avatarColor) ? avatarColor : undefined,
      avatarImage,
      bannerImage,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر حفظ التغييرات." };
  }

  revalidatePath("/settings/profile");
  revalidatePath(`/u/${user!.username}`);
  revalidatePath("/", "layout");
  return { success: "تم حفظ التغييرات بنجاح." };
}

/* ------------------------------ community ----------------------------- */

const MAX_THREAD_TITLE = 120;
const MAX_THREAD_BODY = 5000;
const MAX_REPLY_BODY = 2000;

export async function createThreadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/community/new");

  // Block posting while serving a ban.
  const ban = await getBanStatus(user!.id);
  if (ban.banned) return { error: bannedMessage(ban.remainingMs) };

  const categoryId = String(formData.get("category") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!isValidCategory(categoryId)) return { error: "اختر تصنيفًا صحيحًا." };
  if (title.length < 3) return { error: "العنوان يجب أن يكون ٣ أحرف على الأقل." };
  if (title.length > MAX_THREAD_TITLE)
    return { error: "العنوان طويل جدًا." };
  if (body.length < 1) return { error: "اكتب محتوى النقاش." };
  if (body.length > MAX_THREAD_BODY)
    return { error: "المحتوى طويل جدًا." };

  // Profanity gate: 1st offense warns, 2nd issues a 1-hour ban.
  if (containsProfanity(`${title}\n${body}`)) {
    const result = await recordProfanityOffense(user!.id);
    return {
      error:
        result.kind === "banned" ? profanityBanMessage() : PROFANITY_WARNING,
    };
  }

  let threadId: string;
  try {
    const thread = await createThread({
      categoryId,
      authorId: user!.id,
      title,
      body,
    });
    threadId = thread.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر نشر النقاش." };
  }

  revalidatePath("/community");
  redirect(`/community/${threadId}`);
}

export async function addReplyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const threadId = String(formData.get("threadId") ?? "").trim();
  const user = await getCurrentUser();
  if (!user)
    redirect(`/login?next=${encodeURIComponent(`/community/${threadId}`)}`);

  // Block posting while serving a ban.
  const ban = await getBanStatus(user!.id);
  if (ban.banned) return { error: bannedMessage(ban.remainingMs) };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "اكتب ردًّا." };
  if (body.length > MAX_REPLY_BODY) return { error: "الرد طويل جدًا." };

  // Profanity gate: 1st offense warns, 2nd issues a 1-hour ban.
  if (containsProfanity(body)) {
    const result = await recordProfanityOffense(user!.id);
    return {
      error:
        result.kind === "banned" ? profanityBanMessage() : PROFANITY_WARNING,
    };
  }

  try {
    const reply = await addReply({ threadId, authorId: user!.id, body });
    if (!reply) return { error: "النقاش غير موجود." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر إرسال الرد." };
  }

  revalidatePath(`/community/${threadId}`);
  revalidatePath("/community");
  return { success: "تم نشر ردّك." };
}

/* -------------------------------- admin ------------------------------- */

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");
}

/**
 * Permission gate for editing/deleting content: admins only. Normal users
 * (including the original uploader) cannot edit or delete content. Returns the
 * manga record when allowed, otherwise redirects home.
 */
async function requireManage(mangaId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const admin = await isAdmin(user);
  if (!admin) redirect("/");
  const manga = await getMangaById(mangaId);
  if (!manga) redirect("/");
  return { user: user!, manga, admin };
}

/** Notify an uploader in their support inbox about a review decision. */
async function notifyReview(
  uploaderId: string | undefined,
  body: string,
): Promise<void> {
  if (!uploaderId) return;
  const admin = await getCurrentAdmin();
  await sendSupportMessage({
    userId: uploaderId,
    senderId: admin?.id ?? uploaderId,
    fromAdmin: true,
    body,
  });
  revalidatePath("/support");
  revalidatePath(`/admin/messages/${uploaderId}`);
}

export async function approveMangaAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const mangaId = String(formData.get("mangaId") ?? "");
  const manga = await getMangaById(mangaId);
  await setMangaReview(mangaId, "approved");
  if (manga) {
    await submitToIndexNow([absoluteUrl("/"), absoluteUrl(`/manga/${manga.slug}`)]);
    await notifyReview(
      manga.uploaderId,
      `✅ تمت الموافقة على عملك «${manga.title}» وأصبح ظاهرًا للقرّاء الآن. شكرًا لمساهمتك!`,
    );
  }
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export async function rejectMangaAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const mangaId = String(formData.get("mangaId") ?? "");
  const manga = await getMangaById(mangaId);
  await setMangaReview(mangaId, "rejected");
  if (manga) {
    await notifyReview(
      manga.uploaderId,
      `❌ نأسف، لم تتم الموافقة على عملك «${manga.title}». يرجى مراجعة سياسة المحتوى. يمكنك الرد هنا للاستفسار.`,
    );
  }
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export async function approveChapterAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const mangaId = String(formData.get("mangaId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const manga = await getMangaById(mangaId);
  const chapter = manga?.chapters.find((c) => c.id === chapterId);
  await setChapterReview(mangaId, chapterId, "approved");
  if (manga && chapter) {
    await submitToIndexNow([
      absoluteUrl(`/manga/${manga.slug}`),
      absoluteUrl(`/manga/${manga.slug}/${chapter.number}`),
    ]);
    await notifyReview(
      chapter.uploaderId,
      `✅ تمت الموافقة على الفصل ${chapter.number} من «${manga.title}» وأصبح متاحًا للقرّاء.`,
    );
  }
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export async function rejectChapterAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const mangaId = String(formData.get("mangaId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const manga = await getMangaById(mangaId);
  const chapter = manga?.chapters.find((c) => c.id === chapterId);
  await setChapterReview(mangaId, chapterId, "rejected");
  if (manga && chapter) {
    await notifyReview(
      chapter.uploaderId,
      `❌ لم تتم الموافقة على الفصل ${chapter.number} من «${manga.title}». يمكنك الرد هنا للاستفسار.`,
    );
  }
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

/* --------------------------- edit / delete ---------------------------- */

export async function editMangaAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const mangaId = String(formData.get("mangaId") ?? "");
  const { manga } = await requireManage(mangaId);

  const title = String(formData.get("title") ?? "").trim();
  const synopsis = String(formData.get("synopsis") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? manga.status) as MangaStatus;
  const status = VALID_STATUS.includes(statusRaw) ? statusRaw : manga.status;
  const yearRaw = parseInt(String(formData.get("year") ?? ""), 10);
  const year = Number.isFinite(yearRaw) ? yearRaw : undefined;
  const genreSlugs = formData.getAll("genres").map(String).filter(Boolean);
  const cover = formData.get("cover");
  const banner = formData.get("banner");

  if (title.length < 2) return { error: "العنوان مطلوب." };
  if (synopsis.length < 10) return { error: "أضف نبذة قصيرة عن العمل." };
  if (genreSlugs.length === 0) return { error: "اختر تصنيفًا واحدًا على الأقل." };

  try {
    const base = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let coverImage: string | undefined;
    if (cover instanceof File && cover.size > 0) {
      coverImage = await saveImage(cover, "covers", `cover-${base}`);
      await deleteImage(manga.coverImage);
    }
    let bannerImage: string | undefined;
    if (banner instanceof File && banner.size > 0) {
      bannerImage = await saveImage(banner, "banners", `banner-${base}`);
      await deleteImage(manga.bannerImage);
    }

    await updateManga(mangaId, {
      title,
      authorName: author || undefined,
      synopsis,
      status,
      year,
      genreSlugs,
      coverImage,
      bannerImage,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "تعذّر حفظ التغييرات." };
  }

  revalidatePath(`/manga/${manga.slug}`);
  revalidatePath("/", "layout");
  redirect(`/manga/${encodeURIComponent(manga.slug)}`);
}

export async function editChapterAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const mangaId = String(formData.get("mangaId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const { manga } = await requireManage(mangaId);

  const number = parseFloat(String(formData.get("number") ?? ""));
  const title = String(formData.get("title") ?? "").trim();
  if (!Number.isFinite(number) || number <= 0)
    return { error: "أدخل رقم فصل صحيحًا." };

  const result = await updateChapter(mangaId, chapterId, { number, title });
  if (result === "not-found") return { error: "الفصل غير موجود." };
  if (result === "duplicate") return { error: "رقم الفصل مستخدم بالفعل." };

  revalidatePath(`/manga/${manga.slug}`);
  redirect(`/manga/${encodeURIComponent(manga.slug)}`);
}

export async function deleteMangaAction(formData: FormData): Promise<void> {
  const mangaId = String(formData.get("mangaId") ?? "");
  await requireManage(mangaId);
  const removed = await deleteManga(mangaId);
  if (removed) {
    // Clean up all associated images from storage.
    await deleteImage(removed.coverImage);
    await deleteImage(removed.bannerImage);
    for (const chapter of removed.chapters) {
      for (const page of chapter.pages) await deleteImage(page);
    }
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function deleteChapterAction(formData: FormData): Promise<void> {
  const mangaId = String(formData.get("mangaId") ?? "");
  const chapterId = String(formData.get("chapterId") ?? "");
  const { manga } = await requireManage(mangaId);
  const removed = await deleteChapter(mangaId, chapterId);
  if (removed) {
    for (const page of removed.pages) await deleteImage(page);
  }
  revalidatePath(`/manga/${manga.slug}`);
  revalidatePath("/", "layout");
  redirect(`/manga/${encodeURIComponent(manga.slug)}`);
}

/* --------------------------- verification ----------------------------- */

export async function verifyUserAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const username = String(formData.get("username") ?? "");
  await setUserVerified(userId, true);
  revalidatePath("/", "layout");
  if (username) revalidatePath(`/u/${username}`);
}

export async function unverifyUserAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const username = String(formData.get("username") ?? "");
  await setUserVerified(userId, false);
  revalidatePath("/", "layout");
  if (username) revalidatePath(`/u/${username}`);
}

/* --------------------------- support chat ----------------------------- */

const MAX_SUPPORT_BODY = 2000;

/**
 * Clear the unread indicator for the current viewer. Called on mount when a
 * conversation is opened; revalidates the layout so the nav badge updates.
 */
export async function markSupportReadAction(userId?: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  if (userId) {
    // Admin viewing a specific user's conversation.
    if (!(await isAdmin(user))) return;
    await markAdminRead(userId);
  } else {
    // A user viewing their own conversation.
    await markUserRead(user.id);
  }

  revalidatePath("/", "layout");
}

export async function sendSupportMessageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/support");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "اكتب رسالتك." };
  if (body.length > MAX_SUPPORT_BODY) return { error: "الرسالة طويلة جدًا." };
  // Keep support civil, but never ban here — a banned user must still be able
  // to reach the admins (e.g. to appeal).
  if (containsProfanity(body))
    return { error: "يرجى استخدام لغة لائقة عند مراسلة الإدارة." };

  await sendSupportMessage({
    userId: user!.id,
    senderId: user!.id,
    fromAdmin: false,
    body,
  });

  revalidatePath("/support");
  revalidatePath("/admin/messages");
  return { success: "تم إرسال رسالتك." };
}

export async function adminReplySupportAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const userId = String(formData.get("userId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!userId) return { error: "محادثة غير صالحة." };
  if (!body) return { error: "اكتب ردًّا." };
  if (body.length > MAX_SUPPORT_BODY) return { error: "الرسالة طويلة جدًا." };

  await sendSupportMessage({
    userId,
    senderId: admin!.id,
    fromAdmin: true,
    body,
  });

  revalidatePath(`/admin/messages/${userId}`);
  revalidatePath("/admin/messages");
  revalidatePath("/support");
  return { success: "تم إرسال الرد." };
}

/* ------------------------------ comments ------------------------------ */

const MAX_COMMENT_BODY = 2000;

export async function addCommentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const path = String(formData.get("path") ?? "/") || "/";
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);

  const targetType = String(formData.get("targetType") ?? "") as CommentTarget;
  const targetId = String(formData.get("targetId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (targetType !== "manga" && targetType !== "chapter")
    return { error: "هدف غير صالح." };
  if (!targetId) return { error: "هدف غير صالح." };

  // Same posting rules as the community: ban check, then profanity strikes.
  const ban = await getBanStatus(user!.id);
  if (ban.banned) return { error: bannedMessage(ban.remainingMs) };

  if (!body) return { error: "اكتب تعليقًا." };
  if (body.length > MAX_COMMENT_BODY) return { error: "التعليق طويل جدًا." };

  if (containsProfanity(body)) {
    const result = await recordProfanityOffense(user!.id);
    return {
      error:
        result.kind === "banned" ? profanityBanMessage() : PROFANITY_WARNING,
    };
  }

  await addComment({ targetType, targetId, authorId: user!.id, body });
  revalidatePath(path);
  return { success: "تم نشر تعليقك." };
}

/** Delete a comment (author or admin). Revalidates the page it lives on. */
export async function deleteCommentAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const commentId = String(formData.get("commentId") ?? "").trim();
  const path = String(formData.get("path") ?? "/") || "/";
  if (!commentId) return;
  await deleteComment(commentId, user.id, await isAdmin(user));
  revalidatePath(path);
}

/** Delete a forum thread (author or admin), then return to the forum. */
export async function deleteThreadAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/community");
  const threadId = String(formData.get("threadId") ?? "").trim();
  if (threadId) {
    await deleteThread(threadId, user!.id, await isAdmin(user));
  }
  revalidatePath("/community");
  redirect("/community");
}

/** Delete a single reply within a thread (author or admin). */
export async function deleteReplyAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const threadId = String(formData.get("threadId") ?? "").trim();
  const replyId = String(formData.get("replyId") ?? "").trim();
  if (!threadId || !replyId) return;
  await deleteReply(threadId, replyId, user.id, await isAdmin(user));
  revalidatePath(`/community/${threadId}`);
  revalidatePath("/community");
}

/** Pin or unpin a thread (admin only). */
export async function setThreadPinnedAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const threadId = String(formData.get("threadId") ?? "").trim();
  const pinned = String(formData.get("pinned") ?? "") === "yes";
  if (!threadId) return;
  await setThreadPinned(threadId, pinned);
  revalidatePath(`/community/${threadId}`);
  revalidatePath("/community");
}

/** Remove "@Kumanga" author from all manga (admin only). */
export async function clearAllMangaAuthorAction(_formData: FormData): Promise<void> {
  await requireAdmin();
  const all = await mangaStore.all();
  let changed = 0;
  for (const m of all) {
    if (m.authorName === "@Kumanga") {
      m.authorName = undefined;
      m.updatedAt = new Date().toISOString();
      changed++;
    }
  }
  if (changed > 0) await mangaStore.save(all);
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

/* ------------------------------- ratings ------------------------------ */

/** Direct-call action: set the current user's 1–5 rating for a manga. */
export async function rateMangaAction(
  mangaId: string,
  value: number,
  slug: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  if (!Number.isFinite(value) || value < 1 || value > 5) return;
  await rateManga(mangaId, user.id, value);
  revalidatePath(`/manga/${slug}`);
}
