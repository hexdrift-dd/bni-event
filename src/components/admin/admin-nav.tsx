import Link from "next/link";
import { ADMIN_BRANDING } from "@/lib/constants";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AdminNav({ active }: { active?: "dashboard" | "registrations" }) {
  return (
    <header className="border-b border-[#E2D3B8] bg-[#FFF8EE]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div>
          <p className="font-serif text-xl text-[#CF2030]">{ADMIN_BRANDING.title}</p>
          <p className="text-xs text-[#A67C52]">{ADMIN_BRANDING.subtitle}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin"
            className={`rounded-lg px-3 py-2 text-sm ${
              active === "dashboard"
                ? "bg-[#CF2030] text-[#F8F1E7]"
                : "text-[#6B5344] hover:bg-[#F3E8D8]"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/registrations"
            className={`rounded-lg px-3 py-2 text-sm ${
              active === "registrations"
                ? "bg-[#CF2030] text-[#F8F1E7]"
                : "text-[#6B5344] hover:bg-[#F3E8D8]"
            }`}
          >
            Registrations
          </Link>
          <a
            href="/api/admin/export"
            className="rounded-lg border border-[#C9A86A]/60 px-3 py-2 text-sm text-[#CF2030] hover:bg-[#F3E8D8]"
          >
            Export CSV
          </a>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm">
              Logout
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
