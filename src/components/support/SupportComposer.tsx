"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { AlertCircle, Send } from "lucide-react";
import {
  adminReplySupportAction,
  sendSupportMessageAction,
  type ActionState,
} from "@/lib/actions";
import { SubmitButton } from "@/components/auth/SubmitButton";

const MAX_BODY = 2000;

export function SupportComposer({
  variant = "user",
  userId,
}: {
  variant?: "user" | "admin";
  userId?: string;
}) {
  const action =
    variant === "admin" ? adminReplySupportAction : sendSupportMessageAction;
  const [state, formAction] = useFormState<ActionState, FormData>(action, {});
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
      {variant === "admin" && userId ? (
        <input type="hidden" name="userId" value={userId} />
      ) : null}

      {state.error ? (
        <p className="flex items-center gap-2 rounded-card border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-400">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.error}
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
          aria-label="رسالتك"
          placeholder={
            variant === "admin" ? "اكتب ردّك على المستخدم…" : "اكتب رسالتك للإدارة…"
          }
          className="min-h-[2.75rem] flex-1 resize-y rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50"
        />
        <SubmitButton className="!w-auto shrink-0 px-4">
          <Send className="size-4" aria-hidden />
          إرسال
        </SubmitButton>
      </div>
    </form>
  );
}
