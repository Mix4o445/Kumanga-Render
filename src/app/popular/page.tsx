import { Flame } from "lucide-react";
import { getMostPopular } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { MangaGrid } from "@/components/ui/MangaGrid";

export const metadata = { title: "الأكثر شعبية | قارئ مانجا" };

export default async function PopularPage() {
  const items = await getMostPopular(100);

  return (
    <div>
      <PageHeader
        icon={Flame}
        title="الأكثر شعبية"
        subtitle="العناوين الأكثر قراءةً ومتابعةً على المنصة."
        count={items.length}
      />
      <MangaGrid items={items} />
    </div>
  );
}
