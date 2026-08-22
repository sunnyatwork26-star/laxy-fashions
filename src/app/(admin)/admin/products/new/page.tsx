import AdminProductEditClient from "../[id]/edit/AdminProductEditClient";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Product — Admin" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });
  return <AdminProductEditClient product={null} categories={categories} isNew={true} />;
}
