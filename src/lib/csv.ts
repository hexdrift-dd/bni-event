import type { Registration } from "@/types";

const CSV_COLUMNS = [
  "registration_id",
  "name",
  "phone",
  "email",
  "membership_type",
  "region",
  "chapter",
  "district",
  "referred_by",
  "category",
  "member_count",
  "amount",
  "payment_status",
  "payment_reference",
  "payment_screenshot_url",
  "razorpay_payment_link_id",
  "razorpay_payment_link_status",
  "razorpay_payment_id",
  "notes",
  "created_at",
  "updated_at",
] as const;

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function registrationsToCsv(rows: Registration[]): string {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((row) =>
    CSV_COLUMNS.map((col) => escapeCsvValue(row[col])).join(",")
  );
  return [header, ...lines].join("\n");
}

export { CSV_COLUMNS };
