import { redirect } from "next/navigation";
import { Upload } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreateMangaForm } from "@/components/upload/CreateMangaForm";

export const metadata = { title: "رفع مانجا | قارئ مانجا" };

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/upload");
  const canPublish = (await isAdmin(user)) || Boolean(user.verified);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={Upload}
        title="رفع مانجا جديدة"
        subtitle="أضف عملًا جديدًا إلى المنصة. يمكنك إضافة الفصول بعد النشر."
      />
      <CreateMangaForm requiresReview={!canPublish} />
    </div>
  );
}
