"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { AlertCircle, ImagePlus, Clock3 } from "lucide-react";
import { addChapterAction, type ActionState } from "@/lib/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50";

export function AddChapterForm({
  slug,
  suggestedNumber,
  requiresReview = false,
}: {
  slug: string;
  suggestedNumber: number;
  requiresReview?: boolean;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    addChapterAction,
    {},
  );
  const [count, setCount] = useState(0);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />

      {requiresReview ? (
        <p className="flex items-start gap-2 rounded-card border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-300">
          <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden />
          يخضع الفصل لمراجعة المشرف قبل أن يصبح متاحًا للقرّاء.
        </p>
      ) : null}

      {state.error ? (
        <p className="flex items-center gap-2 rounded-card border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-400">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-fg-muted">رقم الفصل</label>
          <input
            name="number"
            type="number"
            step="0.1"
            min="0"
            required
            dir="ltr"
            defaultValue={suggestedNumber}
            className={`${inputClass} text-end`}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-fg-muted">
            عنوان الفصل (اختياري)
          </label>
          <input name="title" className={inputClass} placeholder="عنوان الفصل" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-fg-muted">صفحات الفصل</label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong bg-input px-4 py-10 text-center text-sm text-fg-subtle transition-colors hover:border-orange-500/40 hover:text-fg">
          <ImagePlus className="size-7" aria-hidden />
          <span className="font-semibold">
            {count > 0 ? `تم اختيار ${count.toLocaleString("ar")} صفحة` : "اختر صور الصفحات"}
          </span>
          <span className="text-xs text-fg-faint">
            يمكنك اختيار عدة صور دفعة واحدة. حد أقصى ٨ ميغابايت لكل صورة.
          </span>
          <input
            type="file"
            name="pages"
            accept="image/*"
            multiple
            required
            className="sr-only"
            onChange={(e) => setCount(e.currentTarget.files?.length ?? 0)}
          />
        </label>
      </div>

      <SubmitButton className="sm:w-auto sm:px-8">نشر الفصل</SubmitButton>
    </form>
  );
}
