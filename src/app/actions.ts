"use server";

import { registrationFormSchema } from "@/lib/validators";
import {
  createRegistration,
  updateRegistrationStatus,
  refreshPaymentLinkStatus,
} from "@/lib/registrations";
import { requireAdmin } from "@/lib/auth-guard";
import { formatRazorpayError } from "@/lib/razorpay";
import { PAYMENT_STATUSES } from "@/lib/constants";
import type { PaymentStatus } from "@/types";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function submitRegistrationAction(
  raw: unknown
): Promise<ActionResult<{ registrationId: string }>> {
  try {
    const parsed = registrationFormSchema.safeParse(raw);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message || "Invalid registration data";
      return { success: false, error: message };
    }

    const row = await createRegistration(parsed.data);
    return {
      success: true,
      data: { registrationId: row.registration_id },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Registration failed. Try again.";
    return { success: false, error: message };
  }
}

export async function refreshPaymentStatusAction(
  registrationId: string
): Promise<ActionResult<{ registrationId: string; paymentStatus: PaymentStatus }>> {
  try {
    if (!registrationId) {
      return { success: false, error: "Registration ID is required" };
    }

    const row = await refreshPaymentLinkStatus(registrationId);
    return {
      success: true,
      data: {
        registrationId: row.registration_id,
        paymentStatus: row.payment_status,
      },
    };
  } catch (err) {
    const message = formatRazorpayError(err);
    console.error(`[razorpay] refresh status failed for ${registrationId}:`, message);
    return { success: false, error: message };
  }
}

export async function updatePaymentStatusAction(input: {
  id: string;
  paymentStatus: PaymentStatus;
  notes?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    if (!PAYMENT_STATUSES.includes(input.paymentStatus)) {
      return { success: false, error: "Invalid payment status" };
    }

    const row = await updateRegistrationStatus({
      id: input.id,
      paymentStatus: input.paymentStatus,
      notes: input.notes,
      actor: "admin",
    });

    return { success: true, data: { id: row.id } };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update status";
    return { success: false, error: message };
  }
}
