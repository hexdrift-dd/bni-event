import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-serif text-4xl text-[#CF2030]">Page not found</h1>
        <p className="mt-3 text-[#6B5344]">
          The registration or page you requested does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-gradient-to-r from-[#E87722] to-[#C45A12] px-5 py-3 text-sm font-semibold text-white"
        >
          Back to event
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
