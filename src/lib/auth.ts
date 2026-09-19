import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";
import type { AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-secret-change-in-production-32chars-ok",
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name ?? "";
        token.email = user.email ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as AdminRole;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Rate limit: 5 attempts per 15 minutes per email
        const limit = checkRateLimit(`login:${email.toLowerCase()}`);
        if (!limit.allowed) {
          throw new Error(
            `Too many login attempts. Try again in ${limit.resetInSeconds} seconds.`
          );
        }

        const admin = await prisma.adminUser.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!admin || admin.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) return null;

        // Success — reset rate limit counter
        resetRateLimit(`login:${email.toLowerCase()}`);

        // Update last login
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        };
      },
    }),
  ],
});
