import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrisma() {
  let url = process.env.DATABASE_URL;
  if (url && url.includes("sslmode=require")) {
    url = url.replace("sslmode=require", "sslmode=verify-full");
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const prisma = createPrisma();

async function testSettings() {
  console.log("Testing Store Settings in Neon Database...");

  // 1. Check or create default setting
  const setting = await prisma.storeSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      storeName: "Laxy Fashions",
      storeTagline: "Handcrafted Luxury Sarees",
      supportEmail: "admin@laxyfashions.com",
      supportPhone: "919876543210",
      whatsappNumber: "919876543210",
      announcementText: "Complimentary Express Shipping Across India",
      announcementEnabled: true,
      freeShippingThreshold: 0,
      orderPrefix: "LF",
      lowStockThreshold: 3,
      codEnabled: true,
    },
    update: {
      storeName: "Laxy Fashions",
    }
  });

  console.log("✓ StoreSetting fetched/upserted successfully:", {
    id: setting.id,
    storeName: setting.storeName,
    whatsappNumber: setting.whatsappNumber,
    announcementText: setting.announcementText,
    orderPrefix: setting.orderPrefix,
    freeShippingThreshold: Number(setting.freeShippingThreshold),
    codEnabled: setting.codEnabled,
  });

  // 2. Query admin users
  const admins = await prisma.adminUser.findMany({
    select: { id: true, email: true, role: true, status: true }
  });
  console.log("✓ Admin users count in DB:", admins.length, admins);

  console.log("ALL SETTINGS DB CHECKS PASSED!");
  await prisma.$disconnect();
}

testSettings().catch((err) => {
  console.error("Settings DB Test Error:", err);
  process.exit(1);
});
