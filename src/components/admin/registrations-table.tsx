"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Registration } from "@/types";
import { REGIONS, PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

function statusVariant(status: Registration["payment_status"]) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "payment_submitted") return "warning" as const;
  return "muted" as const;
}

export function RegistrationsTable({ rows }: { rows: Registration[] }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (region !== "all" && row.region !== region) return false;
      if (paymentStatus !== "all" && row.payment_status !== paymentStatus)
        return false;
      if (dateFrom && row.created_at < `${dateFrom}T00:00:00.000Z`) return false;
      if (dateTo && row.created_at > `${dateTo}T23:59:59.999Z`) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [
          row.registration_id,
          row.name,
          row.phone,
          row.email,
          row.chapter,
          row.region,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, region, paymentStatus, dateFrom, dateTo]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Input
          placeholder="Search ID, name, phone, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="all">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="From date"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="To date"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#6B5344]">
          Showing {filtered.length} of {rows.length} registrations
        </p>
        <a href="/api/admin/export">
          <Button type="button" variant="outline" size="sm">
            Export CSV
          </Button>
        </a>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D4C4A8] bg-[#FFFbf5] px-6 py-16 text-center">
          <p className="font-serif text-xl text-[#CF2030]">No registrations found</p>
          <p className="mt-2 text-sm text-[#6B5344]">
            Adjust filters or wait for new submissions.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E2D3B8] bg-[#FFF8EE]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F3E8D8] text-[#CF2030]">
              <tr>
                <th className="px-3 py-3 font-semibold">ID</th>
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Phone</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Chapter</th>
                <th className="px-3 py-3 font-semibold">Members</th>
                <th className="px-3 py-3 font-semibold">Amount</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Created</th>
                <th className="px-3 py-3 font-semibold">Payment Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-[#E2D3B8]/80">
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/registrations/${row.id}`}
                      className="font-medium text-[#C45A12] hover:underline"
                    >
                      {row.registration_id}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{row.name}</td>
                  <td className="px-3 py-3">{row.phone}</td>
                  <td className="px-3 py-3">{row.email}</td>
                  <td className="px-3 py-3">{row.chapter}</td>
                  <td className="px-3 py-3">{row.member_count}</td>
                  <td className="px-3 py-3">{formatCurrency(row.amount)}</td>
                  <td className="px-3 py-3">
                    <Badge variant={statusVariant(row.payment_status)}>
                      {PAYMENT_STATUS_LABELS[row.payment_status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-3 py-3">
                    {row.razorpay_payment_link_url ? (
                      <a
                        href={row.razorpay_payment_link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#C45A12] hover:underline"
                      >
                        Open
                      </a>
                    ) : row.payment_screenshot_url ? (
                      <a
                        href={row.payment_screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#C45A12] hover:underline"
                      >
                        View proof
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
