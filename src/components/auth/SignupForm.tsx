"use client";

import { useFormState } from "react-dom";
import { AlertCircle } from "lucide-react";
import { signupAction, type ActionState } from "@/lib/actions";
import { SubmitButton } from "./SubmitButton";

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50";

export function SignupForm() {
  const [state, formAction] = useFormState<ActionState, FormData>(signupAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p className="flex items-center gap-2 rounded-card border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-400">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="username" className="text-xs font-semibold text-fg-muted">
          اسم المستخدم
        </label>
        <input
          id="username"
          name="username"
          required
          autoComplete="username"
          className={inputClass}
          placeholder="اسمك على المنصة"
        />
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-semibold text-fg-muted">
            كلمة المرور
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
            placeholder="٨ أحرف على الأقل"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm" className="text-xs font-semibold text-fg-muted">
            تأكيد كلمة المرور
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
            placeholder="••••••••"
          />
        </div>
      </div>

      <SubmitButton>إنشاء حساب</SubmitButton>
    </form>
  );
}
