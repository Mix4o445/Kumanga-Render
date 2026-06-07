import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isResetTokenValid } from "@/lib/password-reset";
import { Logo } from "@/components/layout/Logo";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "تعيين كلمة مرور جديدة | قارئ مانجا" };

// The token is per-request and must never be cached/prerendered.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const token = searchParams.token?.trim() ?? "";
  const valid = token ? await isResetTokenValid(token) : false;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10">
      <Logo className="mb-6 h-16" />
      <div className="w-full rounded-hero border border-line bg-surface-raised/50 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight-display text-fg">
            كلمة مرور جديدة
          </h1>
          <p className="mt-1 text-sm text-fg-subtle">
            اختر كلمة مرور جديدة لحسابك.
          </p>
        </div>

        {valid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="space-y-4 text-center">
            <p className="rounded-card border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-400">
              رابط إعادة التعيين غير صالح أو منتهي الصلاحية.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block font-bold text-orange-400 transition-colors hover:text-orange-300"
            >
              اطلب رابطًا جديدًا
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
