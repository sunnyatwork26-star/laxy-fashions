import { AdminRole } from "@prisma/client";

/**
 * Extend NextAuth's built-in types to include our custom fields.
 * This eliminates all `as any` casts across auth callbacks and session usage.
 */

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: AdminRole;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: AdminRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AdminRole;
    name: string;
    email: string;
  }
}
