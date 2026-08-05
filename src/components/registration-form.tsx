"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EVENT_CONFIG, MEMBERSHIP_TYPE_LABELS, MEMBERSHIP_TYPES, PRICING_RULES, REGIONS } from "@/lib/constants";
import {
  registrationFormSchema,
  type RegistrationFormValues,
} from "@/lib/validators";
import {
  calculateContribution,
  formatCurrency,
  getPricingRuleLabel,
} from "@/lib/pricing";
import { submitRegistrationAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RegistrationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      phone: "",
      name: "",
      email: "",
      membershipType: "bni_member",
      region: EVENT_CONFIG.region,
      chapter: "",
      district: "",
      referredBy: "",
      memberCount: 1,
      consentAccepted: false,
      notes: "",
    },
  });

  const membershipType = form.watch("membershipType");
  const memberCount = form.watch("memberCount") || 1;

  function handleMembershipTypeChange(
    nextType: RegistrationFormValues["membershipType"]
  ) {
    if (nextType === "bni_member") {
      form.setValue("district", "");
      form.setValue("referredBy", "");
      if (!form.getValues("region")) {
        form.setValue("region", EVENT_CONFIG.region);
      }
    } else {
      form.setValue("region", "");
      form.setValue("chapter", "");
    }
  }

  const summary = useMemo(() => {
    try {
      const amount = calculateContribution(Number(memberCount) || 1);
      return {
        amount,
        rule: getPricingRuleLabel(Number(memberCount) || 1),
      };
    } catch {
      return { amount: 0, rule: "Enter a valid member count" };
    }
  }, [memberCount]);

  function onSubmit(values: RegistrationFormValues) {
    if (submitted || isPending) return;
    setServerError(null);
    setSubmitted(true);

    startTransition(async () => {
      const result = await submitRegistrationAction(values);
      if (!result.success) {
        setSubmitted(false);
        setServerError(result.error);
        return;
      }
      router.push(`/register/success/${result.data.registrationId}`);
    });
  }

  return (
    <Card id="register" className="scroll-mt-24">
      <CardHeader>
        <CardTitle>Event Registration</CardTitle>
        <CardDescription>
          Complete the form below. Your contribution updates automatically based
          on member count.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Phone number *"
              error={form.formState.errors.phone?.message}
            >
              <Input
                inputMode="numeric"
                placeholder="9876543210"
                {...form.register("phone")}
              />
            </Field>
            <Field label="Full name *" error={form.formState.errors.name?.message}>
              <Input placeholder="Your full name" {...form.register("name")} />
            </Field>
          </div>

          <Field label="Email *" error={form.formState.errors.email?.message}>
            <Input
              type="email"
              placeholder="you@example.com"
              {...form.register("email")}
            />
          </Field>

          <Field
            label="Membership type *"
            error={form.formState.errors.membershipType?.message}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {MEMBERSHIP_TYPES.map((type) => {
                const selected = membershipType === type;
                return (
                  <label
                    key={type}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
                      selected
                        ? "border-[#CF2030] bg-[#FFF3E0] ring-2 ring-[#CF2030]/20"
                        : "border-[#E2D3B8] bg-[#FFFbf5] hover:border-[#C45A12]/50"
                    )}
                  >
                    <input
                      type="radio"
                      value={type}
                      className="h-4 w-4 shrink-0 accent-[#CF2030]"
                      {...form.register("membershipType", {
                        onChange: (e) =>
                          handleMembershipTypeChange(
                            e.target
                              .value as RegistrationFormValues["membershipType"]
                          ),
                      })}
                    />
                    <span className="text-sm font-medium text-[#CF2030]">
                      {MEMBERSHIP_TYPE_LABELS[type]}
                    </span>
                  </label>
                );
              })}
            </div>
          </Field>

          {membershipType === "bni_member" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Region *"
                  error={form.formState.errors.region?.message}
                >
                  <Select {...form.register("region")}>
                    <option value="" disabled>
                      Select region
                    </option>
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Chapter *"
                  error={form.formState.errors.chapter?.message}
                >
                  <Input
                    placeholder="Enter your chapter name"
                    {...form.register("chapter")}
                  />
                </Field>
              </div>
            </>
          ) : (
            <>
              <Field
                label="District *"
                error={form.formState.errors.district?.message}
              >
                <Input
                  placeholder="Enter your district"
                  {...form.register("district")}
                />
              </Field>
              <Field
                label="Who referred you (optional)"
                error={form.formState.errors.referredBy?.message}
              >
                <Input
                  placeholder="Name of the person who referred you"
                  {...form.register("referredBy")}
                />
              </Field>
            </>
          )}

          <Field
            label="Number of members *"
            error={form.formState.errors.memberCount?.message}
          >
            <Input
              type="number"
              min={1}
              max={50}
              {...form.register("memberCount", { valueAsNumber: true })}
            />
          </Field>

          <div className="rounded-xl border border-[#E2D3B8] bg-gradient-to-br from-[#FFF3E0] to-[#F8EBD7] p-4">
            <p className="font-serif text-lg text-[#CF2030]">Contribution summary</p>
            <div className="mt-3 space-y-2 text-sm text-[#5C4033]">
              <div className="flex justify-between gap-4">
                <span>Members</span>
                <strong>{Number(memberCount) || 1}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span>Pricing rule</span>
                <strong className="text-right">{summary.rule}</strong>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#E2D3B8] pt-2 text-base">
                <span>Total amount</span>
                <strong className="text-[#C45A12]">
                  {formatCurrency(summary.amount)}
                </strong>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-[#7A5C45]">
              {PRICING_RULES.summaryLines.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-[#7A5C45]">
              You&apos;ll get a Razorpay UPI payment link on the confirmation
              page right after registering.
            </p>
          </div>

          <Field label="Notes (optional)" error={form.formState.errors.notes?.message}>
            <Textarea
              placeholder="Any special requests or notes for the organisers"
              {...form.register("notes")}
            />
          </Field>

          <label className="flex items-start gap-3 rounded-lg border border-[#E2D3B8] bg-[#FFFbf5] p-3 text-sm text-[#CF2030]">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#C45A12]"
              {...form.register("consentAccepted")}
            />
            <span>
              I confirm the details above are correct and I agree to pay the
              calculated contribution for this BNI event registration.
            </span>
          </label>
          {form.formState.errors.consentAccepted && (
            <p className="text-sm text-red-700">
              {form.formState.errors.consentAccepted.message}
            </p>
          )}

          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isPending || submitted}
          >
            {isPending || submitted ? "Submitting…" : "Complete Registration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
