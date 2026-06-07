"use client";

import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { requestPasswordResetAction, type ActionState } from "@/lib/actions";
import { SubmitButton } from "./SubmitButton";

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50";

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState<ActionState, FormData>(
    requestPasswordResetAction,
    {},
  );

  if (state.success) {
    return (
      <p className="flex items-center gap-2 rounded-card border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-400">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        {state.success}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p className="flex items-center gap-2 rounded-card border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-400">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-fg-muted">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          dir="ltr"
          autoComplete="email"
          className={`${inputClass} text-end`}
          placeholder="you@example.com"
        />
      </div>

      <SubmitButton>إرسال رابط إعادة التعيين</SubmitButton>
    </form>
  );
}
