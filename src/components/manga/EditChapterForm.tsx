"use client";

import { useFormState } from "react-dom";
import { AlertCircle } from "lucide-react";
import { editChapterAction, type ActionState } from "@/lib/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50";

export function EditChapterForm({
  mangaId,
  chapterId,
  defaultNumber,
  defaultTitle,
}: {
  mangaId: string;
  chapterId: string;
  defaultNumber: number;
  defaultTitle?: string;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    editChapterAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="mangaId" value={mangaId} />
      <input type="hidden" name="chapterId" value={chapterId} />

      {state.error ? (
        <p className="flex items-center gap-2 rounded-card border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-400">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-fg-muted">رقم الفصل</label>
        <input
          name="number"
          type="number"
          step="0.1"
          min={0.1}
          required
          dir="ltr"
          defaultValue={defaultNumber}
          className={`${inputClass} text-end`}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-fg-muted">
          عنوان الفصل (اختياري)
        </label>
        <input
          name="title"
          defaultValue={defaultTitle ?? ""}
          className={inputClass}
          placeholder="عنوان الفصل"
        />
      </div>

      <SubmitButton className="sm:w-auto sm:px-8">حفظ التغييرات</SubmitButton>
    </form>
  );
}
