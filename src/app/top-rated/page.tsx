import { Star } from "lucide-react";
import { getTopRated } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { MangaGrid } from "@/components/ui/MangaGrid";

export const metadata = { title: "الأعلى تقييمًا | قارئ مانجا" };

export default async function TopRatedPage() {
  const items = await getTopRated(100);

  return (
    <div>
      <PageHeader
        icon={Star}
        title="الأعلى تقييمًا"
        subtitle="أفضل الأعمال وفقًا لتقييمات القرّاء."
        count={items.length}
        accent="blue"
      />
      <MangaGrid items={items} />
    </div>
  );
}
