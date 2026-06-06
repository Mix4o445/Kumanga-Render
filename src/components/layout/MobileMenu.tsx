"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_SECTIONS, GENRE_NAV } from "@/lib/config";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
        className="grid size-10 place-items-center rounded-pill text-fg-muted ring-1 ring-line transition-colors hover:bg-overlay hover:text-fg active:scale-95 lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 end-0 z-[70] flex w-[82%] max-w-sm flex-col bg-surface shadow-card lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-4">
                <Logo />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="إغلاق القائمة"
                  className="grid size-9 place-items-center rounded-pill text-fg-muted ring-1 ring-line transition-colors hover:bg-overlay hover:text-fg active:scale-95"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hide">
                {NAV_SECTIONS.map((section, index) => (
                  <div
                    key={section.id}
                    className={cn(
                      "space-y-1 py-1.5",
                      index < NAV_SECTIONS.length - 1 &&
                        "border-b border-line pb-3",
                    )}
                  >
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                            active
                              ? "bg-orange-500/[0.07] font-semibold text-orange-400"
                              : "font-medium text-fg-muted hover:bg-overlay",
                          )}
                        >
                          <Icon className="size-[18px]" strokeWidth={2.1} aria-hidden />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ))}

                <div className="pt-3">
                  <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-fg-faint">
                    التصنيفات
                  </p>
                  <div className="flex flex-wrap gap-2 px-2">
                    {GENRE_NAV.map((genre) => (
                      <Link
                        key={genre.id}
                        href={`/genre/${genre.slug}`}
                        className="rounded-pill border border-line bg-overlay px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-orange-500/40 hover:text-orange-400"
                      >
                        {genre.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
