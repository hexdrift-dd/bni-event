import Razorpay from "razorpay";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { EVENT_CONFIG } from "./constants";

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (client) return client;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error(
      "Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET environment variables"
    );
  }

  client = new Razorpay({ key_id, key_secret });
  return client;
}

export interface CreatedPaymentLink {
  id: string;
  shortUrl: string;
  status: string;
}

export async function createUpiPaymentLink(params: {
  registrationId: string;
  amount: number;
  name: string;
  phone: string;
  email: string;
  chapter: string;
  region: string;
  memberCount: number;
}): Promise<CreatedPaymentLink> {
  //const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bni-event-lime.vercel.app";

  const link = await getClient().paymentLink.create({
    upi_link: true,
    amount: Math.round(params.amount * 100),
    currency: "INR",
    reference_id: params.registrationId,
    description: `${EVENT_CONFIG.name} - ${params.registrationId}`,
    customer: {
      name: params.name,
      email: params.email,
      contact: `+91${params.phone}`,
    },
    // sms: false — Razorpay applies stricter validation to `customer.contact`
    // when it has to actually deliver an SMS (it rejects otherwise-valid
    // numbers with repeating-digit patterns as "Recurring digits in customer
    // contact are disallowed"). We already show the pay link directly on the
    // success page, so we don't need Razorpay's own SMS notification.
    notify: { sms: false, email: true },
    notes: {
      registration_id: params.registrationId,
      chapter: params.chapter,
      region: params.region,
      member_count: params.memberCount,
    },
    callback_url: `${appUrl}/register/success/${params.registrationId}`,
    callback_method: "get",
  });

  return { id: link.id, shortUrl: link.short_url, status: link.status };
}

export async function fetchPaymentLink(paymentLinkId: string) {
  return getClient().paymentLink.fetch(paymentLinkId);
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return Razorpay.validateWebhookSignature(rawBody, signature, secret);
}

export function verifyPaymentLinkCallbackSignature(params: {
  paymentId: string;
  paymentLinkId: string;
  paymentLinkReferenceId: string;
  paymentLinkStatus: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !params.signature) return false;

  try {
    return validatePaymentVerification(
      {
        payment_id: params.paymentId,
        payment_link_id: params.paymentLinkId,
        payment_link_reference_id: params.paymentLinkReferenceId,
        payment_link_status: params.paymentLinkStatus,
      },
      params.signature,
      secret
    );
  } catch {
    return false;
  }
}

/**
 * Razorpay returns payment link payments as an array at runtime, even though
 * the SDK types describe a single object.
 */
export function extractPaymentIdFromPaymentLink(link: {
  payments?: unknown;
}): string | null {
  const payments = link.payments;
  if (!payments) return null;

  if (Array.isArray(payments)) {
    const captured = payments.find(
      (entry): entry is { payment_id: string; status?: string } =>
        typeof entry === "object" &&
        entry !== null &&
        "payment_id" in entry &&
        typeof (entry as { payment_id: unknown }).payment_id === "string" &&
        (entry as { status?: string }).status === "captured"
    );
    const chosen = captured ?? payments[0];
    if (
      typeof chosen === "object" &&
      chosen !== null &&
      "payment_id" in chosen &&
      typeof (chosen as { payment_id: unknown }).payment_id === "string"
    ) {
      return (chosen as { payment_id: string }).payment_id;
    }
    return null;
  }

  if (
    typeof payments === "object" &&
    payments !== null &&
    "payment_id" in payments &&
    typeof (payments as { payment_id: unknown }).payment_id === "string"
  ) {
    return (payments as { payment_id: string }).payment_id;
  }

  return null;
}

interface RazorpayApiError {
  statusCode?: string | number;
  error?: {
    code?: string;
    description?: string;
    field?: unknown;
    source?: string;
    step?: string;
    reason?: string;
  };
}

function isRazorpayApiError(err: unknown): err is RazorpayApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    "error" in err &&
    typeof (err as RazorpayApiError).error === "object"
  );
}

/**
 * The Razorpay SDK rejects with a plain { statusCode, error: {...} } object,
 * not an Error instance, so String(err) / err.message both produce useless
 * output ("[object Object]"). Pull out the fields the API actually sends.
 */
export function formatRazorpayError(err: unknown): string {
  if (isRazorpayApiError(err)) {
    const { statusCode, error } = err;
    const parts = [
      error?.code,
      error?.description,
      error?.field ? `field=${error.field}` : null,
      error?.reason ? `reason=${error.reason}` : null,
    ].filter(Boolean);
    return `Razorpay ${statusCode ?? ""} ${parts.join(" — ")}`.trim();
  }
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
