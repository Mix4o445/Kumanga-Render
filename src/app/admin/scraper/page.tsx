import { redirect } from "next/navigation";
import { Globe } from "lucide-react";
import { getCurrentAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScraperForm } from "./ScraperForm";

export const metadata = { title: "سكرابر المانجا | لوحة التحكم" };

export default async function ScraperPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={Globe}
        title="سكرابر المانجا"
        subtitle="استورد مانجا من أي موقع يستخدم ووردبريس (Madara) عبر الرابط."
        accent="blue"
      />
      <ScraperForm />
    </div>
  );
}
