import { redirect } from "next/navigation";
import { UserCog } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getProfileById } from "@/lib/profile";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata = { title: "تعديل الملف الشخصي | قارئ مانجا" };

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings/profile");

  const profile = await getProfileById(user.id);
  if (!profile) redirect("/login");

  return (
    <div>
      <PageHeader
        icon={UserCog}
        title="الملف الشخصي"
        subtitle="خصّص صورتك الرمزية وغلافك، واسمك المعروض، ورابطك، ونبذتك."
      />
      <div className="max-w-2xl">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
