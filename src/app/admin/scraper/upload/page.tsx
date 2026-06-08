import { redirect } from "next/navigation";
import { Upload } from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin";
import { getAllManga } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { JsonUploadForm } from "./JsonUploadForm";

export const metadata = { title: "رفع JSON | لوحة التحكم" };

export default async function JsonUploadPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  const allManga = await getAllManga();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={Upload}
        title="رفع JSON الفصول"
        subtitle="ارفّع ملف JSON من سكرابر بايثون لاستيراد الفصول إلى مانجا موجودة."
        accent="blue"
      />
      <JsonUploadForm mangaList={allManga.map((m) => ({ slug: m.slug, title: m.title }))} />
    </div>
  );
}
