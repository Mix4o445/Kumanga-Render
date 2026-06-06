import { BarChart3 } from "lucide-react";
import type { MangaStatus } from "@/types";
import { getByStatus } from "@/lib/db";
import { STATUS_META } from "@/lib/config";
import { PageHeader } from "@/components/ui/PageHeader";
import { MangaGrid } from "@/components/ui/MangaGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "المانجا حسب الحالة | قارئ مانجا" };

const ORDER: MangaStatus[] = ["ongoing", "completed", "hiatus", "cancelled"];

export default async function StatusPage() {
  const groups = await Promise.all(
    ORDER.map(async (status) => ({
      status,
      items: await getByStatus(status),
    })),
  );

  const visible = groups.filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        title="المانجا حسب الحالة"
        subtitle="تصفّح الأعمال وفقًا لحالة إصدارها."
      />

      <div className="space-y-12">
        {visible.map((group) => (
          <section key={group.status}>
            <div className="mb-5 flex items-center gap-3">
              <StatusBadge status={group.status} />
              <span className="text-sm text-fg-faint">
                {group.items.length.toLocaleString("ar")} عنوان
              </span>
              <span className="h-px flex-1 bg-overlay" aria-hidden />
            </div>
            <MangaGrid items={group.items} />
          </section>
        ))}
      </div>
    </div>
  );
}
