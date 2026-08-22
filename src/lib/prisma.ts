import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function formatConnectionString(url: string) {
  // Fix Node pg SSL warning by using verify-full instead of require
  if (url.includes("sslmode=require")) {
    return url.replace("sslmode=require", "sslmode=verify-full");
  }
  return url;
}

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    throw new Error("DATABASE_URL is not set. Check your .env.local file.");
  }
  const connectionString = formatConnectionString(rawUrl);
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
