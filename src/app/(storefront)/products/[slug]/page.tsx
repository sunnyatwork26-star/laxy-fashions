import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import { serializeProduct } from "@/lib/orderLogic";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description || `Buy ${product.name} at Laxy Fashions.`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const rawProduct = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!rawProduct) notFound();

  const product = serializeProduct(rawProduct);

  return <ProductDetailClient product={product as any} />;
}
