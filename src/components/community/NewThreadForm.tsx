"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { AlertCircle } from "lucide-react";
import { createThreadAction, type ActionState } from "@/lib/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50";

const MAX_TITLE = 120;
const MAX_BODY = 5000;

interface CategoryOption {
  id: string;
  name: string;
}

export function NewThreadForm({
  categories,
  defaultCategory,
}: {
  categories: CategoryOption[];
  defaultCategory?: string;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    createThreadAction,
    {},
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const initialCategory =
    defaultCategory && categories.some((c) => c.id === defaultCategory)
      ? defaultCategory
      : categories[0]?.id;

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p className="flex items-center gap-2 rounded-card border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-400">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      {/* Category */}
      <div className="space-y-1.5">
        <label htmlFor="category" className="text-xs font-semibold text-fg-muted">
          التصنيف
        </label>
        <select
          id="category"
          name="category"
          defaultValue={initialCategory}
          className={inputClass}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-surface">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="title" className="text-xs font-semibold text-fg-muted">
            العنوان
          </label>
          <span className="text-xs tabular-nums text-fg-faint">
            {title.length.toLocaleString("ar")} / {MAX_TITLE.toLocaleString("ar")}
          </span>
        </div>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
          maxLength={MAX_TITLE}
          className={inputClass}
          placeholder="عمّ تريد أن تتحدّث؟"
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="body" className="text-xs font-semibold text-fg-muted">
            المحتوى
          </label>
          <span className="text-xs tabular-nums text-fg-faint">
            {body.length.toLocaleString("ar")} / {MAX_BODY.toLocaleString("ar")}
          </span>
        </div>
        <textarea
          id="body"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
          rows={8}
          maxLength={MAX_BODY}
          className={cn(inputClass, "resize-y")}
          placeholder="اكتب تفاصيل نقاشك هنا…"
        />
      </div>

      <SubmitButton className="sm:w-auto sm:px-8">نشر النقاش</SubmitButton>
    </form>
  );
}
