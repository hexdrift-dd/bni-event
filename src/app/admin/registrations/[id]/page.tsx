import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { getRegistrationById } from "@/lib/registrations";
import { AdminNav } from "@/components/admin/admin-nav";
import { RegistrationDetailPanel } from "@/components/admin/registration-detail";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminRegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const registration = await getRegistrationById(id);

  if (!registration) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <AdminNav active="registrations" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link
          href="/admin/registrations"
          className="text-sm font-semibold text-[#C45A12] hover:underline"
        >
          ← Back to registrations
        </Link>
        <Card className="mt-4">
          <CardContent className="p-6">
            <RegistrationDetailPanel registration={registration} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
