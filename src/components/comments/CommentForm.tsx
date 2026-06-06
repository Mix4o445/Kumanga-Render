"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { addCommentAction, type ActionState } from "@/lib/actions";
import type { CommentTarget } from "@/types";
import { SubmitButton } from "@/components/auth/SubmitButton";

const MAX_BODY = 2000;

export function CommentForm({
  targetType,
  targetId,
  path,
}: {
  targetType: CommentTarget;
  targetId: string;
  /** Current page path, so the action can revalidate it. */
  path: string;
}) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    addCommentAction,
    {},
  );
  const [body, setBody] = useState("");
  const lastSuccess = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.success !== lastSuccess.current) {
      lastSuccess.current = state.success;
      setBody("");
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="path" value={path} />

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

      <div className="flex items-end gap-2">
        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
          rows={2}
          maxLength={MAX_BODY}
          required
          aria-label="تعليقك"
          placeholder="شارك رأيك…"
          className="min-h-[2.75rem] flex-1 resize-y rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50"
        />
        <SubmitButton className="!w-auto shrink-0 px-4">
          <Send className="size-4" aria-hidden />
          نشر
        </SubmitButton>
      </div>
    </form>
  );
}
