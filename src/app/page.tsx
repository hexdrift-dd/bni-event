import {
  CONTACTS,
  EVENT_CONFIG,
  PRICING_RULES,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/pricing";
import { RegistrationForm } from "@/components/registration-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(232,119,34,0.18),_transparent_55%),linear-gradient(160deg,#CF2030_0%,#A81926_42%,#7A121C_100%)]" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,rgba(201,168,106,0.35),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(232,119,34,0.2),transparent_20%),radial-gradient(circle_at_50%_80%,rgba(201,168,106,0.2),transparent_30%)]" />

          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#F3C98B]">
                {EVENT_CONFIG.eventType} · {EVENT_CONFIG.region}
              </p>
              <h1 className="font-serif text-4xl leading-tight text-[#FFF8EE] sm:text-5xl md:text-6xl">
                {EVENT_CONFIG.name}
              </h1>
              <p className="mt-4 max-w-2xl text-base text-[#F0D9B8] sm:text-lg">
                {EVENT_CONFIG.tagline}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <InfoChip label="Date" value={EVENT_CONFIG.date} />
                <InfoChip label="Region" value={EVENT_CONFIG.region} />
                <div className="sm:col-span-2">
                  <InfoChip label="Venue" value={EVENT_CONFIG.venue} />
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#register"
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#CF2030] shadow-lg hover:bg-[#FFF8EE]"
                >
                  Register now
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-serif text-3xl text-[#CF2030]">Contribution</h2>
          </div>
          <div className="max-w-md">
            <PriceCard
              title="Per person"
              amount={formatCurrency(PRICING_RULES.perPerson)}
              detail="Each member"
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <RegistrationForm />
            <aside className="space-y-6">
              <Card id="help">
                <CardHeader>
                  <CardTitle>Need help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {CONTACTS.map((contact) => (
                    <div
                      key={contact.whatsapp}
                      className="rounded-xl border border-[#E2D3B8] bg-[#FFFbf5] p-4"
                    >
                      <p className="font-medium text-[#CF2030]">{contact.name}</p>
                      <p className="text-xs uppercase tracking-wide text-[#A67C52]">
                        {contact.role}
                      </p>
                      <a
                        href={`https://wa.me/${contact.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-sm font-semibold text-[#C45A12] hover:underline"
                      >
                        WhatsApp {contact.phone}
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How it works</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm text-[#5C4033]">
                    <li>1. Fill in your registration details</li>
                    <li>2. Review the live contribution amount</li>
                    <li>3. Submit and receive your registration ID</li>
                    <li>4. Pay instantly via the Razorpay UPI link</li>
                    <li>5. Your registration is approved automatically</li>
                  </ol>
                </CardContent>
              </Card>
            </aside>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E2D3B8] bg-[#FFF8EE]/95 p-3 backdrop-blur sm:hidden">
        <a
          href="#register"
          className="block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-[#CF2030] shadow-sm ring-1 ring-[#CF2030]/30"
        >
          Register now
        </a>
      </div>

      <div className="h-16 sm:hidden" />
      <SiteFooter />
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#C9A86A]/35 bg-black/20 px-4 py-3 backdrop-blur">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#F3C98B]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[#FFF8EE] sm:text-base">{value}</p>
    </div>
  );
}

function PriceCard({
  title,
  amount,
  detail,
}: {
  title: string;
  amount: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-[#C45A12]">
          {amount}
        </p>
        <p className="mt-1 text-sm text-[#6B5344]">{detail}</p>
      </CardContent>
    </Card>
  );
}
