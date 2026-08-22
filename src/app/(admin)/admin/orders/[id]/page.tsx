import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AdminOrderDetailClient from "./AdminOrderDetailClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true } });
  return { title: order ? `Order ${order.orderNumber}` : "Order Not Found" };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedByAdmin: { select: { name: true, email: true } } },
      },
    },
  });

  if (!order) notFound();

  return <AdminOrderDetailClient order={order as any} />;
}
