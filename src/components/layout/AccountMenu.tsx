"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Upload,
  Bookmark,
  LogOut,
  User,
  Settings,
  ShieldCheck,
  MessagesSquare,
} from "lucide-react";
import type { AuthUser } from "@/types";
import { logoutAction } from "@/lib/actions";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function AccountMenu({ user, isAdmin = false }: { user: AuthUser; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const displayName = user.displayName || user.username;
  const profileHref = `/u/${encodeURIComponent(user.username)}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-pill border border-line bg-overlay py-1 ps-1 pe-2.5 transition-colors hover:bg-overlay-strong active:scale-95"
      >
        <Avatar
          name={displayName}
          color={user.avatarColor}
          image={user.avatarImage}
          className="size-8 text-sm"
        />
        <span className="hidden max-w-[120px] truncate text-sm font-semibold text-fg sm:block">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-fg-subtle transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute end-0 mt-2 w-56 overflow-hidden rounded-card border border-line bg-surface-raised p-1.5 shadow-card animate-fade-up">
          <Link
            href={profileHref}
            className="flex items-center gap-3 border-b border-line px-3 py-2.5 transition-colors hover:bg-overlay"
          >
            <Avatar
              name={displayName}
              color={user.avatarColor}
              image={user.avatarImage}
              className="size-9 text-sm"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-fg">
                {displayName}
              </span>
              <span className="block truncate text-xs text-fg-subtle">
                <span dir="ltr">@{user.username}</span>
              </span>
            </span>
          </Link>

          <nav className="py-1">
            <MenuLink href={profileHref} icon={User} label="صفحتي" />
            {isAdmin ? (
              <>
                <MenuLink href="/admin" icon={ShieldCheck} label="لوحة المراجعة" />
                <MenuLink href="/admin/messages" icon={MessagesSquare} label="صندوق الدعم" />
              </>
            ) : (
              <MenuLink href="/support" icon={MessagesSquare} label="مراسلة الإدارة" />
            )}
            <MenuLink href="/upload" icon={Upload} label="رفع مانجا" />
            <MenuLink href="/favorites" icon={Bookmark} label="قائمة المفضلة" />
            <MenuLink href="/settings" icon={Settings} label="الإعدادات" />
          </nav>

          <form action={logoutAction} className="border-t border-line pt-1">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
            >
              <LogOut className="size-[18px]" aria-hidden />
              تسجيل الخروج
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof User;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-overlay hover:text-fg"
    >
      <Icon className="size-[18px]" aria-hidden />
      {label}
    </Link>
  );
}
