"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/config";
import type { NavItem } from "@/types";
import { cn } from "@/lib/utils";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
        active
          ? "bg-orange-500/[0.07] font-semibold text-orange-400"
          : "font-medium text-fg-subtle hover:bg-overlay hover:text-fg",
      )}
    >
      {active ? (
        <span className="absolute inset-y-2 start-0 w-[3px] rounded-e-full bg-orange-500" />
      ) : null}
      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors",
          active ? "text-orange-400" : "text-fg-faint group-hover:text-fg-muted",
        )}
        strokeWidth={2.1}
        aria-hidden
      />
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  );
}

export function RightSidebar() {
  const isActive = useIsActive();

  return (
    <aside className="sticky top-[var(--nav-height)] hidden h-[calc(100vh-var(--nav-height))] shrink-0 lg:block lg:w-[250px]">
      <div className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-6 scrollbar-hide">
        <nav className="flex-1 space-y-1">
          {NAV_SECTIONS.map((section, index) => (
            <div
              key={section.id}
              className={cn(
                "space-y-1 py-2",
                index < NAV_SECTIONS.length - 1 &&
                  "border-b border-line pb-3",
              )}
            >
              {section.items.map((item) => (
                <NavLink key={item.id} item={item} active={isActive(item.href)} />
              ))}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
