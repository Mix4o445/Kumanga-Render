import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/layout/Logo";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "تسجيل الدخول | قارئ مانجا" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const next = searchParams.next?.startsWith("/") ? searchParams.next : "/";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10">
      <Logo withWordmark={false} className="mb-6" />
      <div className="w-full rounded-hero border border-line bg-surface-raised/50 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight-display text-fg">
            مرحبًا بعودتك
          </h1>
          <p className="mt-1 text-sm text-fg-subtle">
            سجّل دخولك لمتابعة القراءة ورفع أعمالك.
          </p>
        </div>

        <LoginForm next={next} />

        <p className="mt-6 text-center text-sm text-fg-subtle">
          ليس لديك حساب؟{" "}
          <Link
            href="/signup"
            className="font-bold text-orange-400 transition-colors hover:text-orange-300"
          >
            أنشئ حسابًا
          </Link>
        </p>
      </div>
    </div>
  );
}
