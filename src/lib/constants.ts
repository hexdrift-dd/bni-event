/**
 * Event & app configuration — edit this file for future events.
 */

export const EVENT_CONFIG = {
  name: "The Client Communication Formula",
  shortName: "BNI Kalari",
  subtitle: "Better Communication, Stronger Relationships, Bigger Results",
  date: "07 August 2026",
  dateISO: "2026-08-07",
  venue:
    "Crystal Suites, Vadakara, Kozhikode",
  region: "Kozhikode",
  regionLocked: false,
  eventType: "BNI event registration",
  tagline: "Register for unforgettable learning experience.",
  registrationPrefix: "BNI-Kalari",
  currency: "INR",
  currencySymbol: "₹",
} as const;

export const REGIONS = [
  "Kasargod",
  "Kannur",
  "Kozhikode",
  "Wayanad",
] as const;

export const PRICING_RULES = {
  perPerson: 1,
  currency: "INR" as const,
  summaryLines: [
    "₹1 per person",
    "Total = number of members × ₹1000",
  ],
} as const;

export const PAYMENT_CONFIG = {
  upiId: "8943304149@ybl",
  accountName: "SREELAJA",
  bankName: "Canara Bank",
  accountNumber: "XXXXXXXXXXXX",
  ifsc: "XXXXXXXX",
  qrImagePath: "/payment.jpeg",
  note: "Pay securely via the Razorpay UPI link below — works with GPay, PhonePe, Paytm, and any UPI app. Your registration is approved automatically once payment is confirmed.",
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ] as const,
  allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf"] as const,
  maxFileSizeMB: 5,
} as const;

export const CONTACTS = [
  {
    name: "Registration Desk",
    role: "Help & Support",
    phone: "+91 97475 47871",
    whatsapp: "919747547871",
  },
  {
    name: "Event Coordinator",
    role: "Event Coordinator",
    phone: "+91 9846337700",
    whatsapp: "919846337700",
  },
] as const;

export const ADMIN_BRANDING = {
  title: "BNI Kalari Admin",
  subtitle: "Registration & payment management",
} as const;

export const PAYMENT_STATUSES = [
  "draft",
  "registered",
  "payment_submitted",
  "approved",
  "rejected",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  draft: "Draft",
  registered: "Registered",
  payment_submitted: "Payment Submitted",
  approved: "Approved",
  rejected: "Rejected",
};
