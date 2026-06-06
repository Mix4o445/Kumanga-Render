import { userStore } from "@/lib/db/store";

/**
 * Lightweight content moderation for user-generated text (community posts).
 *
 * Two responsibilities:
 *  1. Detect profanity (Arabic + English) with tolerance for common
 *     obfuscation: leetspeak, repeated characters, spacing/punctuation,
 *     and Arabic diacritics / attached prefixes.
 *  2. Track offenses on the user record — the first offense is a warning,
 *     the second issues a temporary posting ban.
 *
 * Server-only: it reads/writes the file-backed user store.
 */

const BAN_MS = 60 * 60 * 1000; // 1 hour
const STRIKE_LIMIT = 2; // the 2nd offense triggers the ban

/* ------------------------------ word lists ----------------------------- */
// Curated profanity roots used purely for filtering. Matching is done against
// a normalized, separator-stripped form so obfuscated variants are caught.

const EN_WORDS = [
  "fuck",
  "fuk",
  "fck",
  "shit",
  "bitch",
  "bastard",
  "asshole",
  "dick",
  "cunt",
  "pussy",
  "slut",
  "whore",
  "nigger",
  "faggot",
  "retard",
  "motherfucker",
  "cock",
  "wanker",
  "prick",
  "dickhead",
];

const AR_WORDS = [
  "كس",
  "طيز",
  "زب",
  "عرص",
  "شرموط",
  "قحبه",
  "منيك",
  "منيوك",
  "متناك",
  "خول",
  "لوطي",
  "نيك",
  "زاني",
  "زانيه",
  "داعر",
  "خرا",
  "خره",
  "علق",
  "كسمك",
  "يلعن",
];

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  $: "s",
  "|": "i",
  "!": "i",
};

/** Latin-only normalization: lowercase, de-leet, collapse repeats. */
function normalizeLatin(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0-9@$|!]/g, (c) => LEET[c] ?? c)
    .replace(/(.)\1{2,}/g, "$1");
}

/** Arabic normalization: strip tashkeel/tatweel, unify letter variants. */
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // diacritics + superscript alef + tatweel
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // أ إ آ ٱ -> ا
    .replace(/\u0649/g, "\u064A") // ى -> ي
    .replace(/\u0624/g, "\u0648") // ؤ -> و
    .replace(/\u0626/g, "\u064A") // ئ -> ي
    .replace(/\u0629/g, "\u0647") // ة -> ه
    .replace(/(.)\1{2,}/g, "$1");
}

/** True when the text contains profanity (after de-obfuscation). */
export function containsProfanity(input: string): boolean {
  if (!input) return false;

  // --- English / Latin ---
  const latin = normalizeLatin(input);
  const latinTokens = latin.split(/[^a-z]+/).filter(Boolean);
  if (latinTokens.some((tok) => EN_WORDS.includes(tok))) return true;
  // Catch spaced / punctuated obfuscation by joining all letters.
  const latinJoined = latin.replace(/[^a-z]/g, "");
  if (EN_WORDS.some((w) => latinJoined.includes(w))) return true;
  // Catch digit-omission (e.g. "f4ck") by stripping non-letters from the raw input.
  const lettersOnly = input
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1{2,}/g, "$1");
  if (EN_WORDS.some((w) => lettersOnly.includes(w))) return true;

  // --- Arabic ---
  const arabicJoined = normalizeArabic(input).replace(/[^\u0600-\u06FF]/g, "");
  if (AR_WORDS.some((w) => arabicJoined.includes(w))) return true;

  return false;
}

/* ------------------------------ ban state ------------------------------ */

export interface BanStatus {
  banned: boolean;
  remainingMs: number;
}

function statusFrom(bannedUntil?: string): BanStatus {
  if (!bannedUntil) return { banned: false, remainingMs: 0 };
  const remaining = new Date(bannedUntil).getTime() - Date.now();
  return remaining > 0
    ? { banned: true, remainingMs: remaining }
    : { banned: false, remainingMs: 0 };
}

/** Current posting-ban status for a user. */
export async function getBanStatus(userId: string): Promise<BanStatus> {
  const users = await userStore.all();
  const user = users.find((u) => u.id === userId);
  return statusFrom(user?.bannedUntil);
}

export type OffenseResult =
  | { kind: "warning" }
  | { kind: "banned"; remainingMs: number };

/**
 * Record a profanity offense. Increments the user's strike count; once it
 * reaches the limit a 1-hour ban is issued and the counter resets.
 */
export async function recordProfanityOffense(
  userId: string,
): Promise<OffenseResult> {
  const users = await userStore.all();
  const user = users.find((u) => u.id === userId);
  if (!user) return { kind: "warning" };

  const strikes = (user.strikes ?? 0) + 1;

  if (strikes >= STRIKE_LIMIT) {
    user.bannedUntil = new Date(Date.now() + BAN_MS).toISOString();
    user.strikes = 0; // fresh cycle after the ban is served
    await userStore.save(users);
    return { kind: "banned", remainingMs: BAN_MS };
  }

  user.strikes = strikes;
  await userStore.save(users);
  return { kind: "warning" };
}

/* ------------------------------- messages ------------------------------ */

function minutes(ms: number): string {
  return Math.max(1, Math.ceil(ms / 60000)).toLocaleString("ar");
}

export const PROFANITY_WARNING =
  "يحتوي المحتوى على ألفاظ غير لائقة فلم يُنشر. ⚠️ هذا تحذير — إذا تكرّر الأمر فسيتم منعك من النشر لمدة ساعة.";

export function profanityBanMessage(): string {
  return "تم منعك من النشر لمدة ساعة بسبب تكرار استخدام ألفاظ غير لائقة.";
}

export function bannedMessage(remainingMs: number): string {
  return `أنت ممنوع من النشر مؤقتًا. يُرجى المحاولة بعد ${minutes(remainingMs)} دقيقة.`;
}
