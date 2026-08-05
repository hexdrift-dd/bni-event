import { z } from "zod";
import {
  MEMBERSHIP_TYPES,
  PAYMENT_CONFIG,
  PAYMENT_STATUSES,
  REGIONS,
} from "./constants";

const phoneRegex = /^[6-9]\d{9}$/;

export const registrationFormSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/\s+/g, ""))
      .pipe(
        z
          .string()
          .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number")
      ),
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name is too long"),
    email: z.string().trim().email("Enter a valid email address").toLowerCase(),
    membershipType: z.enum(MEMBERSHIP_TYPES, {
      error: "Please select a membership type",
    }),
    region: z.string().trim().optional().or(z.literal("")),
    chapter: z.string().trim().optional().or(z.literal("")),
    district: z.string().trim().optional().or(z.literal("")),
    referredBy: z.string().trim().optional().or(z.literal("")),
    memberCount: z
      .number({ error: "Member count is required" })
      .int("Member count must be a whole number")
      .min(1, "At least 1 member is required")
      .max(50, "Maximum 50 members allowed"),
    consentAccepted: z.boolean().refine((val) => val === true, {
      message: "You must confirm the registration details",
    }),
    notes: z
      .string()
      .trim()
      .max(1000, "Notes must be under 1000 characters")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.membershipType === "bni_member") {
      if (
        !data.region ||
        !(REGIONS as readonly string[]).includes(data.region)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Please select a valid region",
          path: ["region"],
        });
      }
      if (!data.chapter || data.chapter.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Chapter is required",
          path: ["chapter"],
        });
      } else if (data.chapter.length > 120) {
        ctx.addIssue({
          code: "custom",
          message: "Chapter name is too long",
          path: ["chapter"],
        });
      }
      return;
    }

    if (!data.district || data.district.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "District is required",
        path: ["district"],
      });
    } else if (data.district.length > 120) {
      ctx.addIssue({
        code: "custom",
        message: "District name is too long",
        path: ["district"],
      });
    }

    if (data.referredBy && data.referredBy.length > 120) {
      ctx.addIssue({
        code: "custom",
        message: "Referrer name is too long",
        path: ["referredBy"],
      });
    }
  });

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export const paymentProofSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required"),
  paymentReference: z
    .string()
    .trim()
    .max(100, "Reference is too long")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal("")),
});

export type PaymentProofValues = z.infer<typeof paymentProofSchema>;

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const adminStatusUpdateSchema = z.object({
  id: z.string().uuid(),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export function validatePaymentFile(file: File): string | null {
  if (!file) return "Payment screenshot is required";
  if (file.size > PAYMENT_CONFIG.maxFileSizeMB * 1024 * 1024) {
    return `File must be under ${PAYMENT_CONFIG.maxFileSizeMB}MB`;
  }
  const allowed = PAYMENT_CONFIG.allowedMimeTypes as readonly string[];
  if (!allowed.includes(file.type)) {
    return "Only JPG, PNG, or PDF files are allowed";
  }
  return null;
}
