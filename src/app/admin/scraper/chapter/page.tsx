import { redirect } from "next/navigation";
import { Image } from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin";
import { getAllManga } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { SingleChapterForm } from "./SingleChapterForm";

export const metadata = { title: "سكرابر فصل واحد | لوحة التحكم" };

export default async function SingleChapterPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const allManga = await getAllManga();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={Image}
        title="سكرابر فصل واحد"
        subtitle="الصق رابط فصل من موقع Madara ليسحب صور الصفحات."
        accent="blue"
      />
      <SingleChapterForm mangaList={allManga.map((m) => ({ slug: m.slug, title: m.title }))} />
    </div>
  );
}
