import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import AdminProductsClient from "./AdminProductsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Products — Admin" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
    take: 300,
  });

  return <AdminProductsClient products={products as any} />;
}
