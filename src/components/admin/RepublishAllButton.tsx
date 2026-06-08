"use client";

import { UserCheck } from "lucide-react";
import { republishAllAsKumangaAction } from "@/lib/actions";

/**
 * Admin action: reassign every manga/chapter to the @Kumanga account.
 * Behind a confirmation prompt since it rewrites all uploader attribution.
 */
export function RepublishAllButton() {
  return (
    <form
      action={republishAllAsKumangaAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "نسب جميع الأعمال والفصول إلى حساب @Kumanga؟ سيتغيّر اسم الرافع لكل المحتوى.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-pill bg-accent/15 px-4 py-2 text-xs font-bold text-accent ring-1 ring-accent/30 transition-colors hover:bg-accent/25 active:scale-95"
      >
        <UserCheck className="size-4" aria-hidden />
        نشر كل الأعمال باسم @Kumanga
      </button>
    </form>
  );
}
