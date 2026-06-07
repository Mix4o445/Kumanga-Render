import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const RULES = [
  "أملك حقوق نشر هذا المحتوى أو لديّ إذن صريح بنشره.",
  "المحتوى لا يخالف القوانين ولا ينتهك حقوق الآخرين.",
  "الصور بجودة واضحة ومرتّبة بالترتيب الصحيح للقراءة.",
  "لا يحتوي على مواد إباحية أو مسيئة أو تستهدف القاصرين.",
  "لم يسبق رفع هذا العمل/الفصل من قبل (لا تكرار).",
];

/**
 * Upload conditions shown before publishing a manga or chapter, plus a required
 * agreement checkbox (name="agree"). The server actions also re-validate this.
 */
export function UploadConditions() {
  return (
    <div className="space-y-3 rounded-card border border-line bg-surface-raised/40 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-fg">
        <ShieldCheck className="size-4 shrink-0 text-orange-400" aria-hidden />
        شروط الرفع
      </p>
      <ul className="space-y-1.5 ps-1 text-sm text-fg-muted">
        {RULES.map((rule) => (
          <li key={rule} className="flex items-start gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400" aria-hidden />
            {rule}
          </li>
        ))}
      </ul>
      <label className="flex cursor-pointer items-start gap-2.5 rounded-card border border-line bg-input px-3 py-2.5 text-sm text-fg-muted transition-colors hover:border-line-strong has-[:checked]:border-orange-500/50 has-[:checked]:bg-orange-500/10 has-[:checked]:text-fg">
        <input
          type="checkbox"
          name="agree"
          value="yes"
          required
          className="mt-0.5 size-4 shrink-0 accent-orange-500"
        />
        <span>
          أوافق على شروط الرفع و{" "}
          <Link
            href="/content-policy"
            target="_blank"
            className="font-semibold text-orange-400 hover:text-orange-300"
          >
            سياسة المحتوى
          </Link>
          .
        </span>
      </label>
    </div>
  );
}
