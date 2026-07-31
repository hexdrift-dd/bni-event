import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { confirmPaymentFromWebhook } from "@/lib/registrations";

export const runtime = "nodejs";

interface RazorpayPaymentLinkPaidPayload {
  event: string;
  payload: {
    payment_link: {
      entity: {
        id: string;
        reference_id: string | null;
        amount_paid: number;
        status: string;
      };
    };
    payment: {
      entity: {
        id: string;
      };
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let data: RazorpayPaymentLinkPaidPayload;
  try {
    data = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (data.event !== "payment_link.paid") {
    return NextResponse.json({ received: true, ignored: data.event });
  }

  const paymentLink = data.payload?.payment_link?.entity;
  const payment = data.payload?.payment?.entity;
  const registrationId = paymentLink?.reference_id;

  if (!paymentLink || !payment || !registrationId) {
    return NextResponse.json(
      { error: "Malformed payment_link.paid payload" },
      { status: 400 }
    );
  }

  try {
    const registration = await confirmPaymentFromWebhook({
      registrationId,
      razorpayPaymentLinkId: paymentLink.id,
      razorpayPaymentId: payment.id,
      amountPaidPaise: paymentLink.amount_paid,
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
