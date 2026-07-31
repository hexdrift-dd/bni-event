import { requireAdmin } from "@/lib/auth-guard";
import { listRegistrations } from "@/lib/registrations";
import { AdminNav } from "@/components/admin/admin-nav";
import { RegistrationsTable } from "@/components/admin/registrations-table";

export default async function AdminRegistrationsPage() {
  await requireAdmin();
  const rows = await listRegistrations();

  return (
    <div className="min-h-screen">
      <AdminNav active="registrations" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-serif text-3xl text-[#CF2030]">Registrations</h1>
          <p className="text-sm text-[#6B5344]">
            Search, filter, review proofs, and export CSV.
          </p>
        </div>
        <RegistrationsTable rows={rows} />
      </main>
    </div>
  );
}
