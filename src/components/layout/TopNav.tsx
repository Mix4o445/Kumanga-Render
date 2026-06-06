"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Upload } from "lucide-react";
import type { AuthUser } from "@/types";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";
import { AccountMenu } from "./AccountMenu";

export function TopNav({ user, isAdmin = false }: { user: AuthUser | null; isAdmin?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-50 h-[var(--nav-height)] border-b border-line bg-surface/80 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <MobileMenu />

        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <form onSubmit={onSubmit} className="flex flex-1 justify-center">
          <div className="relative w-full max-w-xl">
            <Search
              className="pointer-events-none absolute inset-y-0 start-4 my-auto size-4 text-fg-subtle"
              aria-hidden
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              dir="rtl"
              placeholder="ابحث عن مانجا، مؤلف، أو تصنيف…"
              aria-label="بحث"
              className="h-11 w-full rounded-pill border border-line bg-input ps-11 pe-14 text-sm text-fg shadow-search-inner outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/40"
            />
            <kbd className="pointer-events-none absolute inset-y-0 end-3 my-auto hidden h-6 select-none items-center rounded-md border border-line bg-overlay px-2 font-sans text-xs font-medium text-fg-subtle sm:flex">
              /
            </kbd>
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              <Link
                href="/upload"
                className="hidden items-center gap-2 rounded-pill bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-glow-orange transition-all hover:bg-orange-500 active:scale-95 sm:inline-flex"
              >
                <Upload className="size-4" aria-hidden />
                رفع مانجا
              </Link>
              <ThemeToggle />
              <AccountMenu user={user} isAdmin={isAdmin} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-pill px-4 py-2 text-sm font-semibold text-fg-muted transition-colors hover:bg-overlay hover:text-fg active:scale-95 md:inline-flex"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-pill bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-glow-orange transition-all hover:bg-orange-500 active:scale-95 sm:inline-flex"
              >
                إنشاء حساب
              </Link>
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
