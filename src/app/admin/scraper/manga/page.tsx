import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { SingleMangaForm } from "./SingleMangaForm";

export const metadata = { title: "سكرابر مانجا واحد | لوحة التحكم" };

export default async function SingleMangaPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={BookOpen}
        title="سكرابر مانجا واحد"
        subtitle="الصق رابط مانجا من موقع Madara واسحبها كلها (بيانات + فصول)."
        accent="blue"
      />
      <SingleMangaForm />
    </div>
  );
}
