import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/layout/Logo";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "إعادة تعيين كلمة المرور | قارئ مانجا" };

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10">
      <Logo className="mb-6 h-16" />
      <div className="w-full rounded-hero border border-line bg-surface-raised/50 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight-display text-fg">
            نسيت كلمة المرور؟
          </h1>
          <p className="mt-1 text-sm text-fg-subtle">
            أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة التعيين.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-fg-subtle">
          تذكّرت كلمة المرور؟{" "}
          <Link
            href="/login"
            className="font-bold text-orange-400 transition-colors hover:text-orange-300"
          >
            العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
