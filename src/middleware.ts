import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Must stay outside the auth gate or /admin/login ↔ /admin loops on Vercel
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const isHttps = request.nextUrl.protocol === "https:";
    const token = await getToken({
      req: request,
      // Prefer AUTH_SECRET (Auth.js v5); fall back to NEXTAUTH_SECRET
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      // On Vercel HTTPS, cookies are __Secure-*; wrong flag ⇒ null token ⇒ redirect loop
      secureCookie: isHttps,
    });

    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
