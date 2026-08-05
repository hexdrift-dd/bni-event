import { ObjectId, type WithId } from "mongodb";
import { Readable } from "node:stream";
import {
  ensureIndexes,
  getAuditLogsCollection,
  getCountersCollection,
  getPaymentProofsBucket,
  getRegistrationsCollection,
  type RegistrationDoc,
} from "@/lib/mongodb";
import { formatRegistrationId } from "@/lib/registration-id";
import { calculateContribution } from "@/lib/pricing";
import type { RegistrationFormValues } from "@/lib/validators";
import type { Registration, RegistrationFilters } from "@/types";
import { PAYMENT_CONFIG, EVENT_CONFIG } from "@/lib/constants";
import {
  createUpiPaymentLink,
  fetchPaymentLink,
  formatRazorpayError,
  extractPaymentIdFromPaymentLink,
  verifyPaymentLinkCallbackSignature,
} from "@/lib/razorpay";

let indexesReady: Promise<void> | null = null;

async function ready() {
  if (!indexesReady) {
    indexesReady = ensureIndexes().catch((err) => {
      indexesReady = null;
      throw err;
    });
  }
  await indexesReady;
}

function toRegistration(doc: WithId<RegistrationDoc>): Registration {
  const membershipType =
    doc.membership_type === "non_bni_member" ? "non_bni_member" : "bni_member";

  return {
    id: doc._id.toString(),
    registration_id: doc.registration_id,
    name: doc.name,
    phone: doc.phone,
    email: doc.email,
    membership_type: membershipType,
    region: doc.region,
    chapter: doc.chapter,
    district: doc.district ?? null,
    referred_by: doc.referred_by ?? null,
    category: doc.category,
    member_count: doc.member_count,
    amount: doc.amount,
    consent_accepted: doc.consent_accepted,
    payment_status: doc.payment_status as Registration["payment_status"],
    payment_reference: doc.payment_reference,
    payment_screenshot_url: doc.payment_screenshot_url,
    razorpay_payment_link_id: doc.razorpay_payment_link_id,
    razorpay_payment_link_url: doc.razorpay_payment_link_url,
    razorpay_payment_link_status: doc.razorpay_payment_link_status,
    razorpay_payment_id: doc.razorpay_payment_id,
    notes: doc.notes,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

async function nextRegistrationSequence(): Promise<number> {
  const counters = await getCountersCollection();
  const result = await counters.findOneAndUpdate(
    { _id: "default" },
    { $inc: { last_value: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  if (!result || typeof result.last_value !== "number") {
    throw new Error("Failed to generate registration sequence");
  }

  return result.last_value;
}

async function writeAudit(params: {
  registrationId: string;
  action: string;
  actor: string;
  details?: Record<string, unknown> | null;
}) {
  const logs = await getAuditLogsCollection();
  await logs.insertOne({
    registration_id: params.registrationId,
    action: params.action,
    actor: params.actor,
    details: params.details || null,
    created_at: new Date(),
  });
}

export async function createRegistration(
  data: RegistrationFormValues
): Promise<Registration> {
  await ready();
  const amount = calculateContribution(data.memberCount);
  const sequence = await nextRegistrationSequence();
  const registrationId = formatRegistrationId(sequence);
  const now = new Date();

  const isBniMember = data.membershipType === "bni_member";

  const doc: RegistrationDoc = {
    registration_id: registrationId,
    name: data.name,
    phone: data.phone,
    email: data.email,
    membership_type: data.membershipType,
    region: isBniMember ? data.region || EVENT_CONFIG.region : "",
    chapter: isBniMember ? data.chapter || "" : "",
    district: isBniMember ? null : data.district || null,
    referred_by: isBniMember ? null : data.referredBy?.trim() || null,
    category: isBniMember ? "BNI Member" : "Non BNI Member",
    member_count: data.memberCount,
    amount,
    consent_accepted: true,
    payment_status: "registered",
    payment_reference: null,
    payment_screenshot_url: null,
    payment_screenshot_file_id: null,
    razorpay_payment_link_id: null,
    razorpay_payment_link_url: null,
    razorpay_payment_link_status: null,
    razorpay_payment_id: null,
    notes: data.notes || null,
    created_at: now,
    updated_at: now,
  };

  const registrations = await getRegistrationsCollection();
  const result = await registrations.insertOne(doc);

  await writeAudit({
    registrationId,
    action: "registered",
    actor: "public",
    details: {
      amount,
      member_count: data.memberCount,
      membership_type: data.membershipType,
    },
  });

  const registration = await ensurePaymentLink(
    toRegistration({ ...doc, _id: result.insertedId })
  );

  return registration;
}

/**
 * Creates a Razorpay UPI payment link for a registration if it doesn't
 * already have a usable one. Never throws for a missing/failed link —
 * callers should inspect the returned registration's
 * razorpay_payment_link_url and render a fallback if it's still null.
 */
export async function ensurePaymentLink(
  registration: Registration
): Promise<Registration> {
  const usableStatuses = ["created", "partially_paid", "paid"];
  if (
    registration.razorpay_payment_link_url &&
    registration.razorpay_payment_link_status &&
    usableStatuses.includes(registration.razorpay_payment_link_status)
  ) {
    return registration;
  }

  try {
    const link = await createUpiPaymentLink({
      registrationId: registration.registration_id,
      amount: registration.amount,
      name: registration.name,
      phone: registration.phone,
      email: registration.email,
      chapter: registration.chapter,
      region: registration.region,
      memberCount: registration.member_count,
    });

    const registrations = await getRegistrationsCollection();
    const updated = await registrations.findOneAndUpdate(
      { registration_id: registration.registration_id },
      {
        $set: {
          razorpay_payment_link_id: link.id,
          razorpay_payment_link_url: link.shortUrl,
          razorpay_payment_link_status: link.status,
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      throw new Error("Failed to persist Razorpay payment link");
    }

    await writeAudit({
      registrationId: registration.registration_id,
      action: "razorpay_link_created",
      actor: "system",
      details: { payment_link_id: link.id },
    });

    return toRegistration(updated);
  } catch (err) {
    const message = formatRazorpayError(err);
    console.error(
      `[razorpay] failed to create payment link for ${registration.registration_id}:`,
      message
    );
    await writeAudit({
      registrationId: registration.registration_id,
      action: "razorpay_link_failed",
      actor: "system",
      details: { error: message },
    });
    return registration;
  }
}

/**
 * Applies a confirmed Razorpay payment to a registration. Idempotent:
 * a registration that is already approved is left untouched.
 */
async function applyPaymentConfirmed(params: {
  registrationId: string;
  razorpayPaymentId: string;
  razorpayPaymentLinkId?: string;
}): Promise<Registration | null> {
  const registrations = await getRegistrationsCollection();
  const existing = await registrations.findOne({
    registration_id: params.registrationId,
  });
  if (!existing) return null;
  if (existing.payment_status === "approved") {
    return toRegistration(existing);
  }

  const updated = await registrations.findOneAndUpdate(
    { registration_id: params.registrationId },
    {
      $set: {
        payment_status: "approved",
        razorpay_payment_link_status: "paid",
        razorpay_payment_id: params.razorpayPaymentId,
        payment_reference: params.razorpayPaymentId,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!updated) return null;

  await writeAudit({
    registrationId: params.registrationId,
    action: "razorpay_payment_confirmed",
    actor: "system",
    details: {
      payment_id: params.razorpayPaymentId,
      payment_link_id: params.razorpayPaymentLinkId || null,
    },
  });

  return toRegistration(updated);
}

export async function confirmPaymentFromWebhook(params: {
  registrationId: string;
  razorpayPaymentLinkId: string;
  razorpayPaymentId: string;
  amountPaidPaise: number;
}): Promise<Registration | null> {
  await ready();
  const registrations = await getRegistrationsCollection();
  const existing = await registrations.findOne({
    registration_id: params.registrationId,
  });
  if (!existing) return null;

  if (existing.razorpay_payment_link_id !== params.razorpayPaymentLinkId) {
    throw new Error("Payment link id mismatch for registration");
  }
  if (params.amountPaidPaise !== Math.round(existing.amount * 100)) {
    throw new Error("Paid amount does not match expected registration amount");
  }

  return applyPaymentConfirmed({
    registrationId: params.registrationId,
    razorpayPaymentId: params.razorpayPaymentId,
    razorpayPaymentLinkId: params.razorpayPaymentLinkId,
  });
}

export async function refreshPaymentLinkStatus(
  registrationId: string
): Promise<Registration> {
  await ready();
  const existing = await getRegistrationByCode(registrationId);
  if (!existing) {
    throw new Error("Registration not found");
  }
  if (existing.payment_status === "approved") {
    return existing;
  }
  if (!existing.razorpay_payment_link_id) {
    throw new Error("No payment link found for this registration yet");
  }

  const link = await fetchPaymentLink(existing.razorpay_payment_link_id);

  if (
    link.status === "paid" &&
    link.amount_paid === Math.round(existing.amount * 100)
  ) {
    const paymentId = extractPaymentIdFromPaymentLink(link);
    if (!paymentId) {
      throw new Error("Payment link is paid but no payment id was returned");
    }
    const updated = await applyPaymentConfirmed({
      registrationId,
      razorpayPaymentId: paymentId,
      razorpayPaymentLinkId: existing.razorpay_payment_link_id,
    });
    if (updated) return updated;
  }

  if (link.status !== existing.razorpay_payment_link_status) {
    const registrations = await getRegistrationsCollection();
    const updated = await registrations.findOneAndUpdate(
      { registration_id: registrationId },
      {
        $set: {
          razorpay_payment_link_status: link.status,
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );
    if (updated) return toRegistration(updated);
  }

  return existing;
}

export async function confirmPaymentFromCallback(params: {
  registrationId: string;
  razorpayPaymentId: string;
  razorpayPaymentLinkId?: string;
  razorpayPaymentLinkReferenceId?: string;
  razorpayPaymentLinkStatus?: string;
  razorpaySignature?: string;
}): Promise<Registration> {
  await ready();
  let registration = await getRegistrationByCode(params.registrationId);
  if (!registration) {
    throw new Error("Registration not found");
  }
  if (registration.payment_status === "approved") {
    return registration;
  }

  const paymentLinkId =
    params.razorpayPaymentLinkId ?? registration.razorpay_payment_link_id;

  if (params.razorpaySignature && paymentLinkId) {
    const valid = verifyPaymentLinkCallbackSignature({
      paymentId: params.razorpayPaymentId,
      paymentLinkId,
      paymentLinkReferenceId:
        params.razorpayPaymentLinkReferenceId ?? params.registrationId,
      paymentLinkStatus: params.razorpayPaymentLinkStatus ?? "paid",
      signature: params.razorpaySignature,
    });
    if (!valid) {
      throw new Error("Invalid Razorpay callback signature");
    }

    if (
      registration.razorpay_payment_link_id &&
      paymentLinkId !== registration.razorpay_payment_link_id
    ) {
      throw new Error("Payment link id mismatch for registration");
    }

    const updated = await applyPaymentConfirmed({
      registrationId: params.registrationId,
      razorpayPaymentId: params.razorpayPaymentId,
      razorpayPaymentLinkId: paymentLinkId,
    });
    if (!updated) {
      throw new Error("Registration not found");
    }
    return updated;
  }

  registration = await refreshPaymentLinkStatus(params.registrationId);
  if (registration.payment_status === "approved") {
    return registration;
  }

  if (registration.razorpay_payment_link_id) {
    const link = await fetchPaymentLink(registration.razorpay_payment_link_id);
    const verifiedPaymentId = extractPaymentIdFromPaymentLink(link);
    if (
      link.status === "paid" &&
      verifiedPaymentId === params.razorpayPaymentId
    ) {
      const updated = await applyPaymentConfirmed({
        registrationId: params.registrationId,
        razorpayPaymentId: params.razorpayPaymentId,
        razorpayPaymentLinkId: registration.razorpay_payment_link_id,
      });
      if (updated) return updated;
    }
  }

  return registration;
}

export async function getRegistrationByCode(
  registrationId: string
): Promise<Registration | null> {
  await ready();
  const registrations = await getRegistrationsCollection();
  const doc = await registrations.findOne({ registration_id: registrationId });
  return doc ? toRegistration(doc) : null;
}

export async function getRegistrationById(
  id: string
): Promise<Registration | null> {
  await ready();
  if (!ObjectId.isValid(id)) return null;
  const registrations = await getRegistrationsCollection();
  const doc = await registrations.findOne({ _id: new ObjectId(id) });
  return doc ? toRegistration(doc) : null;
}

export async function listRegistrations(
  filters: RegistrationFilters = {}
): Promise<Registration[]> {
  await ready();
  const registrations = await getRegistrationsCollection();

  const query: Record<string, unknown> = {};

  if (filters.chapter && filters.chapter !== "all") {
    query.chapter = filters.chapter;
  }
  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    query.payment_status = filters.paymentStatus;
  }
  if (filters.dateFrom || filters.dateTo) {
    query.created_at = {};
    if (filters.dateFrom) {
      (query.created_at as Record<string, Date>).$gte = new Date(
        `${filters.dateFrom}T00:00:00.000Z`
      );
    }
    if (filters.dateTo) {
      (query.created_at as Record<string, Date>).$lte = new Date(
        `${filters.dateTo}T23:59:59.999Z`
      );
    }
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    query.$or = [
      { registration_id: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { chapter: { $regex: q, $options: "i" } },
      { district: { $regex: q, $options: "i" } },
      { referred_by: { $regex: q, $options: "i" } },
    ];
  }

  const docs = await registrations
    .find(query)
    .sort({ created_at: -1 })
    .toArray();

  return docs.map(toRegistration);
}

export async function uploadPaymentProof(params: {
  registrationId: string;
  file: File;
  paymentReference?: string;
  notes?: string;
}): Promise<Registration> {
  await ready();
  const existing = await getRegistrationByCode(params.registrationId);
  if (!existing) {
    throw new Error("Registration not found");
  }

  if (existing.payment_status === "approved") {
    throw new Error("This registration is already approved");
  }

  const ext =
    params.file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "bin";
  const filename = `${params.registrationId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await params.file.arrayBuffer());

  const bucket = await getPaymentProofsBucket();
  const uploadStream = bucket.openUploadStream(filename, {
    metadata: {
      registration_id: params.registrationId,
      original_name: params.file.name,
      contentType: params.file.type,
    },
  });

  await new Promise<void>((resolve, reject) => {
    Readable.from(buffer)
      .pipe(uploadStream)
      .on("error", reject)
      .on("finish", () => resolve());
  });

  const fileId = uploadStream.id.toString();
  const fileUrl = `/api/files/payment-proof/${fileId}`;

  const notes = params.notes?.trim()
    ? [existing.notes, params.notes.trim()].filter(Boolean).join("\n")
    : existing.notes;

  const registrations = await getRegistrationsCollection();
  const updated = await registrations.findOneAndUpdate(
    { registration_id: params.registrationId },
    {
      $set: {
        payment_screenshot_url: fileUrl,
        payment_screenshot_file_id: fileId,
        payment_status: "payment_submitted",
        payment_reference: params.paymentReference?.trim() || null,
        notes,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  if (!updated) {
    throw new Error("Failed to update payment status");
  }

  await writeAudit({
    registrationId: params.registrationId,
    action: "payment_submitted",
    actor: "public",
    details: {
      file_id: fileId,
      payment_reference: params.paymentReference || null,
      max_size_mb: PAYMENT_CONFIG.maxFileSizeMB,
    },
  });

  return toRegistration(updated);
}

export async function updateRegistrationStatus(params: {
  id: string;
  paymentStatus: Registration["payment_status"];
  notes?: string;
  actor?: string;
}): Promise<Registration> {
  await ready();
  if (!ObjectId.isValid(params.id)) {
    throw new Error("Invalid registration id");
  }

  const setPayload: Record<string, unknown> = {
    payment_status: params.paymentStatus,
    updated_at: new Date(),
  };
  if (params.notes !== undefined) {
    setPayload.notes = params.notes || null;
  }

  const registrations = await getRegistrationsCollection();
  const updated = await registrations.findOneAndUpdate(
    { _id: new ObjectId(params.id) },
    { $set: setPayload },
    { returnDocument: "after" }
  );

  if (!updated) {
    throw new Error("Failed to update registration");
  }

  await writeAudit({
    registrationId: updated.registration_id,
    action: `status_${params.paymentStatus}`,
    actor: params.actor || "admin",
    details: { notes: params.notes || null },
  });

  return toRegistration(updated);
}

export async function getPaymentProofFile(fileId: string): Promise<{
  stream: NodeJS.ReadableStream;
  contentType: string;
  filename: string;
} | null> {
  await ready();
  if (!ObjectId.isValid(fileId)) return null;

  const bucket = await getPaymentProofsBucket();
  const id = new ObjectId(fileId);
  const files = await bucket.find({ _id: id }).toArray();
  if (!files.length) return null;

  const file = files[0];
  const contentType =
    (file.metadata?.contentType as string | undefined) ||
    "application/octet-stream";

  return {
    stream: bucket.openDownloadStream(id),
    contentType,
    filename: file.filename || `payment-proof-${fileId}`,
  };
}
