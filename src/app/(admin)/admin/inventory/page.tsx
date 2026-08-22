import { prisma } from "@/lib/prisma";
import AdminInventoryClient from "./AdminInventoryClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inventory — Admin" };

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { stock: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      status: true,
      fabric: true,
    },
  });

  const movements = await prisma.inventoryMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      product: { select: { name: true } },
      createdByAdmin: { select: { name: true } },
    },
  });

  return <AdminInventoryClient products={products as any} movements={movements as any} />;
}
