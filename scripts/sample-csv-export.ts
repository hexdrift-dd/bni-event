/**
 * Sample CSV export utility — run with:
 *   npx tsx scripts/sample-csv-export.ts
 *
 * Uses in-memory sample rows (no MongoDB required).
 */

import { writeFileSync } from "node:fs";
import { registrationsToCsv } from "../src/lib/csv";
import type { Registration } from "../src/types";

const sample: Registration[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    registration_id: "BNI-AFL-0001",
    name: "Ananya Menon",
    phone: "9876543210",
    email: "ananya@example.com",
    region: "Kozhikode",
    chapter: "BNI Calicut Central",
    category: "",
    member_count: 1,
    amount: 1000,
    consent_accepted: true,
    payment_status: "registered",
    payment_reference: null,
    payment_screenshot_url: null,
    razorpay_payment_link_id: "plink_sample0001",
    razorpay_payment_link_url: "https://rzp.io/i/sample0001",
    razorpay_payment_link_status: "created",
    razorpay_payment_id: null,
    notes: null,
    created_at: "2026-07-01T10:00:00.000Z",
    updated_at: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    registration_id: "BNI-AFL-0002",
    name: "Rahul Krishnan",
    phone: "9876501234",
    email: "rahul@example.com",
    region: "Kannur",
    chapter: "BNI Calicut Elite",
    category: "",
    member_count: 4,
    amount: 4000,
    consent_accepted: true,
    payment_status: "payment_submitted",
    payment_reference: "UTR123456789",
    payment_screenshot_url: "https://example.com/proof-2.png",
    razorpay_payment_link_id: "plink_sample0002",
    razorpay_payment_link_url: "https://rzp.io/i/sample0002",
    razorpay_payment_link_status: "created",
    razorpay_payment_id: null,
    notes: "Paid via PhonePe",
    created_at: "2026-07-02T11:30:00.000Z",
    updated_at: "2026-07-02T12:00:00.000Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    registration_id: "BNI-AFL-0003",
    name: "Meera Nair",
    phone: "9988776655",
    email: "meera@example.com",
    region: "Wayanad",
    chapter: "BNI Malabar Connect",
    category: "",
    member_count: 6,
    amount: 6000,
    consent_accepted: true,
    payment_status: "approved",
    payment_reference: "pay_sample0003",
    payment_screenshot_url: "https://example.com/proof-3.pdf",
    razorpay_payment_link_id: "plink_sample0003",
    razorpay_payment_link_url: "https://rzp.io/i/sample0003",
    razorpay_payment_link_status: "paid",
    razorpay_payment_id: "pay_sample0003",
    notes: "Approved by admin",
    created_at: "2026-07-03T09:15:00.000Z",
    updated_at: "2026-07-04T08:00:00.000Z",
  },
];

const csv = registrationsToCsv(sample);
writeFileSync("sample-export.csv", csv, "utf8");
console.log("Wrote sample-export.csv");
console.log(csv);
