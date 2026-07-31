import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { listRegistrations } from "@/lib/registrations";
import { computeDashboardMetrics } from "@/lib/metrics";
import { formatCurrency } from "@/lib/pricing";
import { AdminNav } from "@/components/admin/admin-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const rows = await listRegistrations();
  const metrics = computeDashboardMetrics(rows);

  return (
    <div className="min-h-screen">
      <AdminNav active="dashboard" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-[#CF2030]">Dashboard</h1>
            <p className="text-sm text-[#6B5344]">
              Overview of registrations and payment collection.
            </p>
          </div>
          <Link href="/admin/registrations">
            <Button>View registrations</Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total registrations" value={String(metrics.totalRegistrations)} />
          <StatCard label="Total members" value={String(metrics.totalMembers)} />
          <StatCard label="Pending payments" value={String(metrics.pendingPayments)} />
          <StatCard label="Approved payments" value={String(metrics.approvedPayments)} />
          <StatCard
            label="Expected collection"
            value={formatCurrency(metrics.totalExpectedCollection)}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard
            label="Payment submitted"
            value={String(metrics.paymentSubmitted)}
          />
          <StatCard
            label="Rejected"
            value={String(metrics.rejectedPayments)}
          />
          <StatCard
            label="Approved collection"
            value={formatCurrency(metrics.totalApprovedCollection)}
          />
        </div>

        {rows.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-[#D4C4A8] bg-[#FFFbf5] px-6 py-16 text-center">
            <p className="font-serif text-2xl text-[#CF2030]">No registrations yet</p>
            <p className="mt-2 text-sm text-[#6B5344]">
              Public submissions will appear here as soon as they arrive.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[#8B7355]">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-serif text-3xl text-[#CF2030]">{value}</p>
      </CardContent>
    </Card>
  );
}
