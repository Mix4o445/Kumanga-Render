import { redirect } from "next/navigation";
import { Layers } from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin";
import { getAllManga } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChapterScraperForm } from "./ChapterScraperForm";

export const metadata = { title: "سكرابر الفصول | لوحة التحكم" };

export default async function ChapterScraperPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const allManga = await getAllManga();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={Layers}
        title="سكرابر الفصول"
        subtitle="اختر مانجا موجودة وأدخل رابط صفحة المانجا من موقع Madara لسكريب جميع فصولها."
        accent="blue"
      />
      <ChapterScraperForm mangaList={allManga.map((m) => ({ slug: m.slug, title: m.title }))} />
    </div>
  );
}
