import Link from "next/link";
import { CONTACTS, EVENT_CONFIG } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E2D3B8]/70 bg-[#FFF8EE]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt={EVENT_CONFIG.shortName}
            className="h-10 w-auto object-contain sm:h-12"
          />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <a
            href="#pricing"
            className="hidden text-sm text-[#6B5344] hover:text-[#CF2030] sm:inline"
          >
            Pricing
          </a>
          <a
            href="#help"
            className="hidden text-sm text-[#6B5344] hover:text-[#CF2030] sm:inline"
          >
            Help
          </a>
          <a
            href="#register"
            className="rounded-lg bg-[#CF2030] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#A81926] sm:px-4"
          >
            Register
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const primary = CONTACTS[0];
  return (
    <footer className="border-t border-[#E2D3B8] bg-[#CF2030] text-[#F8F1E7]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-serif text-lg">{EVENT_CONFIG.name}</p>
          <p className="text-sm text-[#E2D3B8]">
            {EVENT_CONFIG.date} · {EVENT_CONFIG.venue}
          </p>
        </div>
        <a
          href={`https://wa.me/${primary.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[#F3C98B] hover:underline"
        >
          WhatsApp help: {primary.phone}
        </a>
      </div>
    </footer>
  );
}
