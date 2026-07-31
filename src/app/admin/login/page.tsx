import { AdminLoginForm } from "@/components/admin/login-form";
import { ADMIN_BRANDING } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <p className="font-serif text-3xl text-[#CF2030]">
            {ADMIN_BRANDING.title}
          </p>
          <p className="mt-1 text-sm text-[#6B5344]">{ADMIN_BRANDING.subtitle}</p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
