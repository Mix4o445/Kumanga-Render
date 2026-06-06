"use client";

import { useFormState } from "react-dom";
import { AlertCircle, ImagePlus } from "lucide-react";
import { editMangaAction, type ActionState } from "@/lib/actions";
import { GENRE_NAV, STATUS_META } from "@/lib/config";
import type { Manga, MangaStatus } from "@/types";
import { SubmitButton } from "@/components/auth/SubmitButton";

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50";

const STATUSES = Object.keys(STATUS_META) as MangaStatus[];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-fg-muted">{label}</label>
      {children}
      {hint ? <p className="text-xs text-fg-faint">{hint}</p> : null}
    </div>
  );
}

export function EditMangaForm({ manga }: { manga: Manga }) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    editMangaAction,
    {},
  );
  const selectedGenres = new Set(manga.genres.map((g) => g.slug));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="mangaId" value={manga.id} />

      {state.error ? (
        <p className="flex items-center gap-2 rounded-card border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-400">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="العنوان">
          <input
            name="title"
            required
            defaultValue={manga.title}
            className={inputClass}
            placeholder="اسم العمل"
          />
        </Field>
        <Field label="المؤلف / الاستوديو (اختياري)">
          <input
            name="author"
            defaultValue={manga.author?.name ?? ""}
            className={inputClass}
            placeholder="اسم المؤلف"
          />
        </Field>
      </div>

      <Field label="النبذة">
        <textarea
          name="synopsis"
          required
          rows={4}
          defaultValue={manga.synopsis}
          className={`${inputClass} resize-none`}
          placeholder="اكتب ملخصًا قصيرًا للقصة…"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="الحالة">
          <select name="status" className={inputClass} defaultValue={manga.status}>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-surface text-fg">
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="سنة الإصدار (اختياري)">
          <input
            name="year"
            type="number"
            min={1950}
            max={2100}
            dir="ltr"
            defaultValue={manga.year ?? ""}
            className={`${inputClass} text-end`}
            placeholder="2024"
          />
        </Field>
      </div>

      <Field label="التصنيفات" hint="اختر تصنيفًا واحدًا على الأقل.">
        <div className="flex flex-wrap gap-2">
          {GENRE_NAV.map((genre) => (
            <label
              key={genre.id}
              className="cursor-pointer select-none rounded-pill border border-line bg-overlay px-3.5 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:border-line-strong has-[:checked]:border-orange-500/50 has-[:checked]:bg-orange-500/10 has-[:checked]:text-orange-400"
            >
              <input
                type="checkbox"
                name="genres"
                value={genre.slug}
                defaultChecked={selectedGenres.has(genre.slug)}
                className="sr-only"
              />
              {genre.name}
            </label>
          ))}
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="تغيير صورة الغلاف (اختياري)"
          hint="اتركه فارغًا للإبقاء على الغلاف الحالي."
        >
          <FileInput name="cover" />
        </Field>
        <Field
          label="تغيير صورة البانر (اختياري)"
          hint="اتركه فارغًا للإبقاء على البانر الحالي."
        >
          <FileInput name="banner" />
        </Field>
      </div>

      <SubmitButton className="sm:w-auto sm:px-8">حفظ التغييرات</SubmitButton>
    </form>
  );
}

function FileInput({ name }: { name: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-card border border-dashed border-line-strong bg-input px-4 py-3 text-sm text-fg-subtle transition-colors hover:border-orange-500/40 hover:text-fg">
      <ImagePlus className="size-5 shrink-0" aria-hidden />
      <span>اختر صورة…</span>
      <input
        type="file"
        name={name}
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const label = e.currentTarget.parentElement?.querySelector("span");
          if (label) label.textContent = e.currentTarget.files?.[0]?.name ?? "اختر صورة…";
        }}
      />
    </label>
  );
}
