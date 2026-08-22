import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

function formatConnectionString(url: string) {
  if (url.includes("sslmode=require")) {
    return url.replace("sslmode=require", "sslmode=verify-full");
  }
  return url;
}

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"|"$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const rawUrl = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString: formatConnectionString(rawUrl) });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Laxy Fashions database with modern luxury saree catalog…");

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@laxyfashions.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  // Admin user
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({
      data: {
        name: "Laxy Admin",
        email: adminEmail,
        passwordHash: hash,
        role: "OWNER",
        status: "ACTIVE",
      },
    });
    console.log(`✅ Admin created: ${adminEmail}`);
  }

  // Order Counter
  await prisma.orderCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nextValue: 1001 },
  });

  // Categories
  const categories = [
    { name: "Silk Sarees", slug: "silk-sarees", sortOrder: 1, description: "Pure Banarasi & Kanjivaram silk sarees" },
    { name: "Cotton Sarees", slug: "cotton-sarees", sortOrder: 2, description: "Breathable Chanderi & handloom cotton sarees" },
    { name: "Designer Sarees", slug: "designer-sarees", sortOrder: 3, description: "Modern georgette & embroidered chiffon sarees" },
    { name: "Festive Collection", slug: "festive", sortOrder: 4, description: "Grand sarees for weddings & festivals" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: { ...cat, status: "ACTIVE" },
    });
  }

  const silkCat = await prisma.category.findUnique({ where: { slug: "silk-sarees" } });
  const cottonCat = await prisma.category.findUnique({ where: { slug: "cotton-sarees" } });
  const designerCat = await prisma.category.findUnique({ where: { slug: "designer-sarees" } });
  const festiveCat = await prisma.category.findUnique({ where: { slug: "festive" } });

  const products = [
    {
      name: "Banarasi Silk Saree — Vermilion Red",
      slug: "banarasi-silk-vermilion",
      description: "Handwoven rich vermilion Banarasi silk saree with intricate gold zari brocade. Timeless bridal elegance.",
      fabric: "Silk",
      occasion: ["Wedding", "Festive"],
      basePrice: 14500,
      salePrice: 12500,
      sku: "BSS-VRM-001",
      stock: 5,
      featured: true,
      categoryId: silkCat?.id ?? null,
      images: ["/products/banarasi-red.png"],
    },
    {
      name: "Kanjivaram Silk — Deep Peacock Teal",
      slug: "kanjivaram-deep-teal",
      description: "Classic Kanjivaram pure silk saree featuring deep peacock teal body paired with solid gold zari korvai border.",
      fabric: "Silk",
      occasion: ["Wedding", "Festive"],
      basePrice: 19800,
      salePrice: 17500,
      sku: "KJS-TEL-002",
      stock: 3,
      featured: true,
      categoryId: silkCat?.id ?? null,
      images: ["/products/kanjivaram-teal.png"],
    },
    {
      name: "Chiffon Georgette — Blush Pink Sequined",
      slug: "chiffon-georgette-blush",
      description: "Flowing pure chiffon georgette saree in blush pink featuring delicate sequin border. Light and ethereal.",
      fabric: "Chiffon",
      occasion: ["Festive", "Casual"],
      basePrice: 5200,
      salePrice: 4500,
      sku: "CGS-BLR-003",
      stock: 6,
      featured: true,
      categoryId: designerCat?.id ?? null,
      images: ["/products/chiffon-pink.png"],
    },
    {
      name: "Tussar Silk — Marigold Gold Zari",
      slug: "tussar-silk-marigold",
      description: "Rich textured Tussar silk saree in festive marigold gold with maroon zari border and antique detailing.",
      fabric: "Silk",
      occasion: ["Festive", "Puja"],
      basePrice: 11500,
      salePrice: 9800,
      sku: "TSS-MGD-004",
      stock: 4,
      featured: true,
      categoryId: festiveCat?.id ?? null,
      images: ["/products/tussar-gold.png"],
    },
    {
      name: "Chanderi Cotton Saree — Ivory Gold",
      slug: "chanderi-cotton-ivory",
      description: "Lightweight Chanderi cotton saree in ivory with delicate gold zari booti motifs and tissue border.",
      fabric: "Cotton",
      occasion: ["Casual", "Puja"],
      basePrice: 3800,
      salePrice: 3200,
      sku: "CCS-IVY-005",
      stock: 8,
      featured: false,
      categoryId: cottonCat?.id ?? null,
      images: ["/products/chanderi-ivory.png"],
    },
    {
      name: "Handloom Linen Saree — Midnight Blue",
      slug: "linen-midnight-blue",
      description: "Authentic handloom linen saree in rich midnight blue with silver zari border and tasselled pallu.",
      fabric: "Linen",
      occasion: ["Work", "Casual"],
      basePrice: 6200,
      salePrice: 5500,
      sku: "LNS-MBL-006",
      stock: 4,
      featured: false,
      categoryId: cottonCat?.id ?? null,
      images: ["/products/linen-blue.png"],
    },
  ];

  let created = 0;
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...p, status: "ACTIVE" },
      create: { ...p, status: "ACTIVE" },
    });
    created++;
  }

  console.log(`✅ ${created} sarees seeded with dedicated product photos`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
