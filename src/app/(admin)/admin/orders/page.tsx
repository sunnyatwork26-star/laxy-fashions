import { prisma } from "@/lib/prisma";
import AdminOrdersClient from "./AdminOrdersClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders — Admin" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { items: { select: { id: true, productNameSnapshot: true, quantity: true } } },
  });

  return <AdminOrdersClient orders={orders as any} />;
}
