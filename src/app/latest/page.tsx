import { Clock4, Inbox } from "lucide-react";
import { getLatestUpdates } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LatestUpdateCard } from "@/components/cards/LatestUpdateCard";
import { StaggerGroup, StaggerItem } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "آخر التحديثات | قارئ مانجا" };

export default async function LatestPage() {
  const updates = await getLatestUpdates(50);

  return (
    <div>
      <PageHeader
        icon={Clock4}
        title="آخر التحديثات"
        subtitle="أحدث الفصول الصادرة، مرتبة من الأحدث إلى الأقدم."
        count={updates.length}
      />

      {updates.length > 0 ? (
        <StaggerGroup className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {updates.map((update) => (
            <StaggerItem key={update.id}>
              <LatestUpdateCard update={update} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        <EmptyState
          icon={Inbox}
          title="لا توجد تحديثات حالياً"
          description="ستظهر الفصول الجديدة هنا فور نشرها."
        />
      )}
    </div>
  );
}
