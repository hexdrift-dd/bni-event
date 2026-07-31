import type { DashboardMetrics, Registration } from "@/types";

export function computeDashboardMetrics(
  registrations: Pick<
    Registration,
    "member_count" | "amount" | "payment_status"
  >[]
): DashboardMetrics {
  return registrations.reduce<DashboardMetrics>(
    (acc, row) => {
      acc.totalRegistrations += 1;
      acc.totalMembers += row.member_count || 0;
      acc.totalExpectedCollection += row.amount || 0;

      switch (row.payment_status) {
        case "approved":
          acc.approvedPayments += 1;
          acc.totalApprovedCollection += row.amount || 0;
          break;
        case "rejected":
          acc.rejectedPayments += 1;
          break;
        case "payment_submitted":
          acc.paymentSubmitted += 1;
          acc.pendingPayments += 1;
          break;
        case "registered":
        case "draft":
        default:
          acc.pendingPayments += 1;
          break;
      }
      return acc;
    },
    {
      totalRegistrations: 0,
      totalMembers: 0,
      pendingPayments: 0,
      approvedPayments: 0,
      rejectedPayments: 0,
      paymentSubmitted: 0,
      totalExpectedCollection: 0,
      totalApprovedCollection: 0,
    }
  );
}
