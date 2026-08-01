import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getRegistrationByCode,
  ensurePaymentLink,
  confirmPaymentFromCallback,
} from "@/lib/registrations";
import {
  CONTACTS,
  EVENT_CONFIG,
  PAYMENT_CONFIG,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";
import { formatCurrency, getPricingRuleLabel, calculateContribution } from "@/lib/pricing";
import { PaymentStatusRefresh } from "@/components/payment-status-refresh";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function RegistrationSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{
    razorpay_payment_id?: string;
    razorpay_payment_link_id?: string;
    razorpay_payment_link_reference_id?: string;
    razorpay_payment_link_status?: string;
    razorpay_signature?: string;
  }>;
}) {
  const { registrationId } = await params;
  const callback = await searchParams;
  const returningFromPayment = Boolean(callback.razorpay_payment_id);
  let registration = await getRegistrationByCode(registrationId);

  if (!registration) {
    notFound();
  }

  if (returningFromPayment && registration.payment_status !== "approved") {
    try {
      registration = await confirmPaymentFromCallback({
        registrationId,
        razorpayPaymentId: callback.razorpay_payment_id!,
        razorpayPaymentLinkId: callback.razorpay_payment_link_id,
        razorpayPaymentLinkReferenceId:
          callback.razorpay_payment_link_reference_id,
        razorpayPaymentLinkStatus: callback.razorpay_payment_link_status,
        razorpaySignature: callback.razorpay_signature,
      });
    } catch {
      // Manual refresh and webhook remain available as fallback
    }
  }

  if (registration.payment_status !== "approved" && !returningFromPayment) {
    registration = await ensurePaymentLink(registration);
  }

  const payableAmount = calculateContribution(registration.member_count);
  const isApproved = registration.payment_status === "approved";

  const statusVariant =
    registration.payment_status === "approved"
      ? "success"
      : registration.payment_status === "rejected"
        ? "danger"
        : registration.payment_status === "payment_submitted"
          ? "warning"
          : "muted";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 rounded-2xl border border-[#E2D3B8] bg-gradient-to-br from-[#FFF3E0] to-[#F8EBD7] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A67C52]">
            {isApproved ? "Payment complete" : "Registration confirmed"}
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#CF2030] sm:text-4xl">
            Thank you, {registration.name}
          </h1>
          <p className="mt-2 text-[#6B5344]">
            {isApproved
              ? `Your payment for ${EVENT_CONFIG.name} is confirmed. See you at the event!`
              : `Your seat request for ${EVENT_CONFIG.name} is recorded. Complete payment below to confirm your seat.`}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-[#CF2030] px-3 py-2 font-mono text-sm text-[#F8F1E7]">
              {registration.registration_id}
            </span>
            <Badge variant={statusVariant}>
              {PAYMENT_STATUS_LABELS[registration.payment_status]}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Registration details</CardTitle>
              <CardDescription>Please keep this for your records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Name" value={registration.name} />
              <Row label="Phone" value={registration.phone} />
              <Row label="Email" value={registration.email} />
              <Row label="Region" value={registration.region} />
              <Row label="Chapter" value={registration.chapter} />
              <Row label="Members" value={String(registration.member_count)} />
              <Row
                label="Pricing"
                value={getPricingRuleLabel(registration.member_count)}
              />
              <Row
                label="Amount"
                value={formatCurrency(payableAmount)}
                emphasize
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>{PAYMENT_CONFIG.note}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center rounded-xl border border-[#E2D3B8] bg-[#FFFbf5] p-6">
                <p className="text-sm text-[#6B5344]">Amount payable</p>
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-[#C45A12]">
                  {formatCurrency(payableAmount)}
                </p>

                {isApproved ? (
                  <div className="mt-4 w-full max-w-xs space-y-3">
                    <p className="rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
                      Payment confirmed. Your registration is approved.
                    </p>
                    {registration.payment_reference && (
                      <div className="rounded-lg border border-emerald-200 bg-white px-4 py-3 text-left text-sm">
                        <p className="text-[#8B7355]">Payment reference</p>
                        <p className="mt-1 break-all font-mono text-xs text-[#CF2030]">
                          {registration.payment_reference}
                        </p>
                      </div>
                    )}
                    {registration.razorpay_payment_link_id && (
                      <div className="rounded-lg border border-[#E2D3B8] bg-white px-4 py-3 text-left text-sm">
                        <p className="text-[#8B7355]">Payment link ID</p>
                        <p className="mt-1 break-all font-mono text-xs text-[#CF2030]">
                          {registration.razorpay_payment_link_id}
                        </p>
                      </div>
                    )}
                  </div>
                ) : registration.razorpay_payment_link_url ? (
                  <>
                    <a
                      href={registration.razorpay_payment_link_url}
                      className="mt-4 inline-flex w-full max-w-xs items-center justify-center rounded-xl bg-[#CF2030] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#A81926]"
                    >
                      Pay now via UPI
                    </a>
                    <p className="mt-2 max-w-xs text-center text-xs text-[#8B7355]">
                      You&apos;ll be taken to a secure Razorpay page to pay with
                      GPay, PhonePe, Paytm, or any UPI app. After payment,
                      you&apos;ll return here automatically.
                    </p>
                    <PaymentStatusRefresh
                      registrationId={registration.registration_id}
                    />
                  </>
                ) : (
                  <div className="mt-4 max-w-xs text-center text-sm text-[#8B7355]">
                    <p>
                      We couldn&apos;t generate a payment link right now.
                      Please contact us and we&apos;ll help you complete your
                      payment.
                    </p>
                    <ul className="mt-3 space-y-1">
                      {CONTACTS.map((contact) => (
                        <li key={contact.phone}>
                          <a
                            href={`https://wa.me/${contact.whatsapp}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[#C45A12] hover:underline"
                          >
                            {contact.name} — {contact.phone}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-[#C45A12] hover:underline"
          >
            ← Back to event page
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#F0E4D0] pb-2 last:border-0">
      <span className="text-[#8B7355]">{label}</span>
      <span
        className={
          emphasize
            ? "text-right font-semibold text-[#C45A12]"
            : "text-right font-medium text-[#CF2030]"
        }
      >
        {value}
      </span>
    </div>
  );
}
