import { Bookmark } from "lucide-react";
import { getAllManga } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { FavoritesView } from "@/components/sections/FavoritesView";

export const metadata = { title: "قائمة المفضلة | قارئ مانجا" };

export default async function FavoritesPage() {
  const all = await getAllManga();

  return (
    <div>
      <PageHeader
        icon={Bookmark}
        title="قائمة المفضلة"
        subtitle="الأعمال التي حفظتها للقراءة لاحقًا."
      />
      <FavoritesView all={all} />
    </div>
  );
}
