import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/layout/Logo";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "إنشاء حساب | قارئ مانجا" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10">
      <Logo withWordmark={false} className="mb-6" />
      <div className="w-full rounded-hero border border-line bg-surface-raised/50 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight-display text-fg">
            انضم إلى قارئ مانجا
          </h1>
          <p className="mt-1 text-sm text-fg-subtle">
            أنشئ حسابًا مجانيًا لرفع المانجا والفصول وحفظ مفضلتك.
          </p>
        </div>

        <SignupForm />

        <p className="mt-6 text-center text-sm text-fg-subtle">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="font-bold text-orange-400 transition-colors hover:text-orange-300"
          >
            سجّل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
