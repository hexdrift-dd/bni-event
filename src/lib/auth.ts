import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { adminLoginSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Admin Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = adminLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const adminUser = process.env.ADMIN_USERNAME?.trim();
        const adminHash = process.env.ADMIN_PASSWORD_HASH?.trim();
        const adminPlain = process.env.ADMIN_PASSWORD?.replace(/\r$/, "").trim();

        if (!adminUser) return null;
        if (parsed.data.username.trim() !== adminUser) return null;

        let valid = false;
        const hashLooksValid =
          typeof adminHash === "string" &&
          /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(adminHash);

        if (hashLooksValid) {
          valid = await bcrypt.compare(parsed.data.password, adminHash);
        }

        // Local/dev plain-password fallback (also used if hash is missing/invalid)
        if (!valid && adminPlain) {
          valid = parsed.data.password === adminPlain;
        }

        if (!valid) {
          console.error("[auth] Admin login failed", {
            hasUser: Boolean(adminUser),
            hasHash: Boolean(adminHash),
            hashLooksValid,
            hasPlain: Boolean(adminPlain),
            plainLength: adminPlain?.length ?? 0,
            inputPasswordLength: parsed.data.password.length,
          });
          return null;
        }

        return {
          id: "admin",
          name: adminUser,
          email: `${adminUser}@admin.local`,
          role: "admin",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name || session.user.name;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
