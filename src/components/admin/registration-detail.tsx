"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePaymentStatusAction } from "@/app/actions";
import type { PaymentStatus, Registration } from "@/types";
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

function statusVariant(status: PaymentStatus) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "payment_submitted") return "warning" as const;
  return "muted" as const;
}

export function RegistrationDetailPanel({
  registration,
}: {
  registration: Registration;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>(registration.payment_status);
  const [notes, setNotes] = useState(registration.notes || "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await updatePaymentStatusAction({
        id: registration.id,
        paymentStatus: status,
        notes,
      });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setMessage("Saved successfully");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl text-[#CF2030]">
          {registration.registration_id}
        </h1>
        <Badge variant={statusVariant(registration.payment_status)}>
          {PAYMENT_STATUS_LABELS[registration.payment_status]}
        </Badge>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <Item label="Name" value={registration.name} />
        <Item label="Phone" value={registration.phone} />
        <Item label="Email" value={registration.email} />
        <Item label="Chapter" value={registration.chapter} />
        <Item label="Region" value={registration.region} />
        <Item label="Members" value={String(registration.member_count)} />
        <Item label="Amount" value={formatCurrency(registration.amount)} />
        <Item
          label="UTR / Reference"
          value={registration.payment_reference || "—"}
        />
        <Item
          label="Razorpay link status"
          value={registration.razorpay_payment_link_status || "—"}
        />
        <Item
          label="Razorpay payment ID"
          value={registration.razorpay_payment_id || "—"}
        />
        <Item
          label="Created"
          value={new Date(registration.created_at).toLocaleString("en-IN")}
        />
      </dl>

      {registration.razorpay_payment_link_url && (
        <div>
          <p className="mb-2 text-sm font-medium text-[#CF2030]">
            Payment link
          </p>
          <a
            href={registration.razorpay_payment_link_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[#C45A12] hover:underline"
          >
            Open Razorpay payment link
          </a>
        </div>
      )}

      {registration.payment_screenshot_url && (
        <div>
          <p className="mb-2 text-sm font-medium text-[#CF2030]">Payment proof</p>
          <a
            href={registration.payment_screenshot_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[#C45A12] hover:underline"
          >
            Open proof file
          </a>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Payment status</Label>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as PaymentStatus)}
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Admin notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Update status"}
        </Button>
        <Button
          type="button"
          variant="success"
          disabled={isPending}
          onClick={() => {
            setStatus("approved");
            startTransition(async () => {
              await updatePaymentStatusAction({
                id: registration.id,
                paymentStatus: "approved",
                notes,
              });
              router.refresh();
            });
          }}
        >
          Approve
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isPending}
          onClick={() => {
            setStatus("rejected");
            startTransition(async () => {
              await updatePaymentStatusAction({
                id: registration.id,
                paymentStatus: "rejected",
                notes,
              });
              router.refresh();
            });
          }}
        >
          Reject
        </Button>
      </div>

      {message && (
        <p className="text-sm text-[#5C4033]">{message}</p>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E2D3B8] bg-[#FFFbf5] px-3 py-2">
      <dt className="text-xs text-[#8B7355]">{label}</dt>
      <dd className="font-medium text-[#CF2030]">{value}</dd>
    </div>
  );
}
