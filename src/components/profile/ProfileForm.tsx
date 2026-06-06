"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ExternalLink,
  Link2,
  Trash2,
} from "lucide-react";
import { updateProfileAction, type ActionState } from "@/lib/actions";
import { AVATAR_SWATCHES, avatarGradient, bannerGradient } from "@/lib/avatar";
import type { AvatarColor, UserProfile } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50";

const MAX_BIO = 240;

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    updateProfileAction,
    {},
  );

  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [website, setWebsite] = useState(profile.website ?? "");
  const [color, setColor] = useState<AvatarColor>(profile.avatarColor);

  // Image state: a freshly-picked File wins; `remove*` clears an existing one.
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [removeBanner, setRemoveBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Object-URL previews for picked files (revoked on change/unmount).
  const [avatarObjUrl, setAvatarObjUrl] = useState<string | null>(null);
  const [bannerObjUrl, setBannerObjUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarFile) return setAvatarObjUrl(null);
    const url = URL.createObjectURL(avatarFile);
    setAvatarObjUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    if (!bannerFile) return setBannerObjUrl(null);
    const url = URL.createObjectURL(bannerFile);
    setBannerObjUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  const previewName = displayName.trim() || profile.username;
  const avatarSrc = avatarObjUrl ?? (removeAvatar ? null : profile.avatarImage ?? null);
  const bannerSrc = bannerObjUrl ?? (removeBanner ? null : profile.bannerImage ?? null);

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setAvatarFile(file);
      setRemoveAvatar(false);
    }
  }
  function clearAvatar() {
    setAvatarFile(null);
    setRemoveAvatar(true);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }
  function pickBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setBannerFile(file);
      setRemoveBanner(false);
    }
  }
  function clearBanner() {
    setBannerFile(null);
    setRemoveBanner(true);
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden values submitted alongside the files. */}
      <input type="hidden" name="avatarColor" value={color} />
      <input type="hidden" name="removeAvatar" value={removeAvatar ? "1" : ""} />
      <input type="hidden" name="removeBanner" value={removeBanner ? "1" : ""} />
      <input
        ref={avatarInputRef}
        type="file"
        name="avatarImage"
        accept="image/*"
        onChange={pickAvatar}
        className="sr-only"
        tabIndex={-1}
      />
      <input
        ref={bannerInputRef}
        type="file"
        name="bannerImage"
        accept="image/*"
        onChange={pickBanner}
        className="sr-only"
        tabIndex={-1}
      />

      {state.error ? (
        <p className="flex items-center gap-2 rounded-card border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-400">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="flex items-center gap-2 rounded-card border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {state.success}
        </p>
      ) : null}

      {/* Live banner + avatar editor (mirrors the public profile header). */}
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="relative h-36 w-full sm:h-44">
          {bannerSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerSrc} alt="" className="size-full object-cover" />
          ) : (
            <div className={cn("size-full", bannerGradient(color))} />
          )}
          <div className="absolute inset-0 bg-black/15" />

          {/* Banner controls — top end (left in RTL) */}
          <div className="absolute end-3 top-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-pill bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <Camera className="size-3.5" aria-hidden />
              تغيير الغلاف
            </button>
            {bannerSrc ? (
              <button
                type="button"
                onClick={clearBanner}
                aria-label="إزالة الغلاف"
                className="grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-rose-500/80"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        <div className="px-5 pb-5">
          {/* Avatar overlaps the banner. */}
          <div className="-mt-12 flex items-end gap-4">
            <div className="relative shrink-0">
              <Avatar
                name={previewName}
                color={color}
                image={avatarSrc}
                className="size-24 text-4xl shadow-card ring-4 ring-surface"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="تغيير الصورة الرمزية"
                className="absolute -bottom-1 -end-1 grid size-8 place-items-center rounded-full bg-accent text-white ring-2 ring-surface transition-colors hover:bg-accent-bright active:scale-95"
              >
                <Camera className="size-4" aria-hidden />
              </button>
            </div>

            {avatarSrc ? (
              <button
                type="button"
                onClick={clearAvatar}
                className="mb-1 inline-flex items-center gap-1.5 rounded-pill border border-line bg-overlay px-3 py-1.5 text-xs font-semibold text-fg-muted transition-colors hover:border-rose-500/40 hover:text-rose-400 active:scale-95"
              >
                <Trash2 className="size-3.5" aria-hidden />
                إزالة الصورة
              </button>
            ) : null}
          </div>

          {/* Name preview */}
          <div className="mt-3">
            <p className="truncate text-lg font-bold text-fg">{previewName}</p>
            <p className="truncate text-sm text-fg-subtle">
              <span dir="ltr">@{profile.username}</span>
            </p>
            <Link
              href={`/u/${encodeURIComponent(profile.username)}`}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-accent transition-colors hover:text-accent-bright"
            >
              عرض الملف العام
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <p className="text-xs text-fg-faint">
        يُفضّل غلاف عريض (مثل ١٥٠٠×٥٠٠) وصورة رمزية مربّعة. الحد الأقصى ٨
        ميغابايت لكل صورة.
      </p>

      {/* Display name */}
      <div className="space-y-1.5">
        <label htmlFor="displayName" className="text-xs font-semibold text-fg-muted">
          الاسم المعروض
        </label>
        <input
          id="displayName"
          name="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          className={inputClass}
          placeholder={profile.username}
        />
        <p className="text-xs text-fg-faint">
          اتركه فارغًا لاستخدام اسم المستخدم.
        </p>
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <label htmlFor="website" className="text-xs font-semibold text-fg-muted">
          الموقع أو الرابط
        </label>
        <div className="relative">
          <Link2
            className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-4 text-fg-faint"
            aria-hidden
          />
          <input
            id="website"
            name="website"
            type="text"
            inputMode="url"
            dir="ltr"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            maxLength={120}
            className={cn(inputClass, "ps-10 text-start")}
            placeholder="example.com"
          />
        </div>
        <p className="text-xs text-fg-faint">
          رابط لموقعك أو حسابك على منصة أخرى. اتركه فارغًا للإخفاء.
        </p>
      </div>

      {/* Accent color (used for the avatar fallback + banner tint) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-fg-muted">
          اللون المميّز
        </span>
        <p className="text-xs text-fg-faint">
          يُستخدم للصورة الرمزية عند عدم رفع صورة، ولخلفية الغلاف الافتراضية.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {AVATAR_SWATCHES.map((swatch) => {
            const selected = swatch.value === color;
            return (
              <button
                key={swatch.value}
                type="button"
                onClick={() => setColor(swatch.value)}
                aria-pressed={selected}
                title={swatch.label}
                className={cn(
                  "size-9 rounded-pill bg-gradient-to-br ring-2 ring-offset-2 ring-offset-canvas transition-all active:scale-95",
                  avatarGradient(swatch.value),
                  selected ? "ring-fg" : "ring-transparent hover:ring-line-strong",
                )}
              >
                <span className="sr-only">{swatch.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="bio" className="text-xs font-semibold text-fg-muted">
            نبذة عنك
          </label>
          <span className="text-xs tabular-nums text-fg-faint">
            {bio.length.toLocaleString("ar")} / {MAX_BIO.toLocaleString("ar")}
          </span>
        </div>
        <textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
          rows={4}
          maxLength={MAX_BIO}
          className={cn(inputClass, "resize-none")}
          placeholder="عرّف القرّاء بنفسك واهتماماتك…"
        />
      </div>

      <SubmitButton className="sm:w-auto sm:px-8">حفظ التغييرات</SubmitButton>
    </form>
  );
}
