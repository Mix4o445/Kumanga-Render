import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line">
      <div className="mx-auto flex max-w-[1600px] flex-col-reverse items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-xs text-fg-faint">
          جميع الحقوق محفوظة © 2026 كومانجا
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-fg-subtle transition-colors hover:text-orange-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
