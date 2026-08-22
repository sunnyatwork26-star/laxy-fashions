import { prisma } from "@/lib/prisma";
import AdminProductEditClient from "./AdminProductEditClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (id === "new") return { title: "New Product — Admin" };
  const p = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: p ? `Edit: ${p.name}` : "Edit Product" };
}

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params;
  const isNew = id === "new";

  const [product, categories] = await Promise.all([
    isNew ? null : prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <AdminProductEditClient
      product={product as any}
      categories={categories}
      isNew={isNew}
    />
  );
}
