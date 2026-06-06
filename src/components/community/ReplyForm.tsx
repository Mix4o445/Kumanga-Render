"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { addReplyAction, type ActionState } from "@/lib/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { cn } from "@/lib/utils";

const MAX_BODY = 2000;

export function ReplyForm({ threadId }: { threadId: string }) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    addReplyAction,
    {},
  );
  const [body, setBody] = useState("");
  const lastSuccess = useRef<string | undefined>(undefined);

  // Clear the field once a reply posts successfully.
  useEffect(() => {
    if (state.success && state.success !== lastSuccess.current) {
      lastSuccess.current = state.success;
      setBody("");
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="threadId" value={threadId} />

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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="reply-body" className="text-xs font-semibold text-fg-muted">
            أضف ردًّا
          </label>
          <span className="text-xs tabular-nums text-fg-faint">
            {body.length.toLocaleString("ar")} / {MAX_BODY.toLocaleString("ar")}
          </span>
        </div>
        <textarea
          id="reply-body"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
          rows={4}
          maxLength={MAX_BODY}
          className={cn(
            "w-full resize-y rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50",
          )}
          placeholder="شارك رأيك في هذا النقاش…"
        />
      </div>

      <SubmitButton className="sm:w-auto sm:px-8">إرسال الرد</SubmitButton>
    </form>
  );
}
