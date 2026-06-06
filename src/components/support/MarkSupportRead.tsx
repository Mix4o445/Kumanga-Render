"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markSupportReadAction } from "@/lib/actions";

/**
 * Clears the support unread indicator when a conversation is opened.
 *
 * Marking-as-read must be a real mutation (so it can revalidate the shared
 * layout that renders the nav badge) — doing it during server render won't
 * refresh the already-rendered layout. We fire it on mount, then refresh the
 * router so the badge disappears immediately.
 *
 * `userId` is set when an admin opens a specific user's conversation; omitted
 * when a user opens their own thread.
 */
export function MarkSupportRead({ userId }: { userId?: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    markSupportReadAction(userId).then(() => {
      if (!cancelled) router.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [userId, router]);

  return null;
}
