import { BadgeCheck } from "lucide-react";
import { getCompleted } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { MangaGrid } from "@/components/ui/MangaGrid";

export const metadata = { title: "المانجات المكتملة | قارئ مانجا" };

export default async function CompletedPage() {
  const items = await getCompleted();

  return (
    <div>
      <PageHeader
        icon={BadgeCheck}
        title="المانجات المكتملة"
        subtitle="أعمال انتهت فصولها بالكامل وجاهزة للقراءة دفعة واحدة."
        count={items.length}
        accent="blue"
      />
      <MangaGrid
        items={items}
        emptyTitle="لا توجد أعمال مكتملة بعد"
        emptyDescription="ستظهر هنا الأعمال بمجرد اكتمالها."
      />
    </div>
  );
}
