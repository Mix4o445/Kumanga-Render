"use client";

import { useEffect, useState } from "react";

/**
 * Client-side deterrent against casual inspection (F12 / DevTools / right-click /
 * view-source). NOT a security control — it's trivially bypassable (disable JS,
 * browser menus, curl, etc.). Admins are exempt via the `disabled` prop.
 *
 * Behavior when enabled:
 *  - Blocks common DevTools/view-source keyboard shortcuts.
 *  - Blocks the right-click context menu.
 *  - Heuristically detects docked DevTools (large viewport gap) and shows a
 *    full-screen blocking overlay until it's closed again.
 */
export function AntiInspect({ disabled = false }: { disabled?: boolean }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (disabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const blockCombo =
        e.key === "F12" ||
        // Ctrl/Cmd+Shift+I/J/C (devtools), Ctrl/Cmd+U (view-source),
        // Ctrl/Cmd+S (save page).
        ((e.ctrlKey || e.metaKey) &&
          ((e.shiftKey && ["i", "j", "c"].includes(k)) ||
            (!e.shiftKey && ["u", "s"].includes(k))));
      if (blockCombo) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    // Heuristic: when DevTools docks, the gap between outer and inner size
    // jumps well past normal browser chrome.
    const THRESHOLD = 170;
    const check = () => {
      const widthGap = window.outerWidth - window.innerWidth;
      const heightGap = window.outerHeight - window.innerHeight;
      setBlocked(widthGap > THRESHOLD || heightGap > THRESHOLD);
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("contextmenu", onContextMenu, true);
    window.addEventListener("resize", check);
    const id = window.setInterval(check, 1000);
    check();

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("resize", check);
      window.clearInterval(id);
    };
  }, [disabled]);

  if (disabled || !blocked) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-black/95 p-6 text-center"
      role="alertdialog"
      aria-label="أدوات المطوّر مغلقة"
    >
      <p className="text-2xl font-extrabold text-white">🔒 الوصول مقيّد</p>
      <p className="max-w-sm text-sm leading-relaxed text-white/70">
        أدوات المطوّر غير مسموح بها على هذا الموقع. يرجى إغلاقها لمتابعة التصفّح.
      </p>
    </div>
  );
}
