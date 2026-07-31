"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshPaymentStatusAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function PaymentStatusRefresh({
  registrationId,
}: {
  registrationId: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    setMessage(null);
    startTransition(async () => {
      const result = await refreshPaymentStatusAction(registrationId);
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      if (result.data.paymentStatus === "approved") {
        setMessage("Payment confirmed!");
      } else {
        setMessage("No payment found yet. If you've already paid, please wait a moment and try again.");
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-col items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={isPending}>
        {isPending ? "Checking…" : "I've paid — refresh status"}
      </Button>
      {message && <p className="text-xs text-[#6B5344]">{message}</p>}
    </div>
  );
}
