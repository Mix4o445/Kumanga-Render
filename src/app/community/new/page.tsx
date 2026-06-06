import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, PenLine } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { FORUM_CATEGORIES } from "@/lib/forum";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewThreadForm } from "@/components/community/NewThreadForm";

export const metadata = { title: "نقاش جديد | المجتمع" };

export default async function NewThreadPage({
  searchParams,
}: {
  searchParams: { cat?: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    const next = searchParams.cat
      ? `/community/new?cat=${searchParams.cat}`
      : "/community/new";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const categories = FORUM_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <Link
        href="/community"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-fg-subtle transition-colors hover:text-accent"
      >
        <ArrowRight className="size-4" aria-hidden />
        العودة إلى المجتمع
      </Link>

      <PageHeader
        icon={PenLine}
        title="نقاش جديد"
        subtitle="اختر التصنيف المناسب واكتب عنوانًا واضحًا لنقاشك."
      />

      <div className="max-w-2xl">
        <NewThreadForm categories={categories} defaultCategory={searchParams.cat} />
      </div>
    </div>
  );
}
