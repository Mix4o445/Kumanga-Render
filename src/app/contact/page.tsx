"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, LifeBuoy, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Method {
  icon: LucideIcon;
  label: string;
  value: string;
}

const METHODS: Method[] = [
  { icon: Mail, label: "البريد الإلكتروني", value: "support@qari-manga.com" },
  { icon: MessageSquare, label: "خادم ديسكورد", value: "discord.gg/qari-manga" },
  { icon: LifeBuoy, label: "مركز المساعدة", value: "متاح على مدار الساعة" },
];

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/40 focus:bg-input";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div>
      <header className="mb-8 flex items-center gap-4 border-b border-line pb-6">
        <span className="grid size-12 place-items-center rounded-card bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
          <Mail className="size-6" strokeWidth={2.25} aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight-display text-fg">
            اتصل بنا
          </h1>
          <p className="mt-1 text-sm text-fg-subtle">
            هل لديك سؤال أو اقتراح؟ يسعدنا أن نسمع منك.
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-2">
          {METHODS.map((method) => {
            const Icon = method.icon;
            return (
              <div
                key={method.label}
                className="flex items-center gap-4 rounded-card border border-line bg-surface-raised/50 p-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-card bg-overlay text-fg-muted ring-1 ring-line">
                  <Icon className="size-5" strokeWidth={2.1} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-fg-faint">{method.label}</p>
                  <p className="truncate text-sm font-semibold text-fg" dir="ltr">
                    {method.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          {sent ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-emerald-500/20 bg-emerald-500/[0.06] px-6 py-14 text-center">
              <CheckCircle2 className="size-12 text-emerald-400" aria-hidden />
              <p className="text-base font-bold text-fg">تم إرسال رسالتك</p>
              <p className="max-w-sm text-sm text-fg-subtle">
                شكرًا لتواصلك معنا، سنردّ عليك في أقرب وقت ممكن.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="space-y-4 rounded-card border border-line bg-surface-raised/40 p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg-muted">الاسم</label>
                  <input required className={inputClass} placeholder="اسمك" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-fg-muted">
                    البريد الإلكتروني
                  </label>
                  <input
                    required
                    type="email"
                    dir="ltr"
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg-muted">الرسالة</label>
                <textarea
                  required
                  rows={5}
                  className={`${inputClass} resize-none`}
                  placeholder="اكتب رسالتك هنا…"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-pill bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-glow-orange transition-all hover:bg-orange-500 active:scale-95"
              >
                <Send className="size-4" aria-hidden />
                إرسال الرسالة
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
