import Link from "next/link";
import { Home, Compass } from "lucide-react";
import { FoxMark } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <FoxMark className="size-20" />

      <div className="space-y-2">
        <p className="text-7xl font-extrabold leading-none tracking-tight text-accent">
          ٤٠٤
        </p>
        <h1 className="text-2xl font-bold text-fg">الصفحة غير موجودة</h1>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-fg-subtle">
          يبدو أن الصفحة التي تبحث عنها قد نُقلت أو لم تَعُد متاحة.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-glow-orange transition-all hover:bg-accent-bright active:scale-95"
        >
          <Home className="size-4" aria-hidden />
          الصفحة الرئيسية
        </Link>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-5 py-2.5 text-sm font-bold text-fg transition-colors hover:bg-overlay active:scale-95"
        >
          <Compass className="size-4" aria-hidden />
          استكشف المكتبة
        </Link>
      </div>
    </div>
  );
}
