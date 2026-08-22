import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, MessageCircle, ShoppingBag } from "lucide-react";
import { formatINR, buildWhatsAppMessage, whatsappUrl } from "@/lib/orderLogic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been placed. We'll confirm on WhatsApp.",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  const waMessage = buildWhatsAppMessage({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    items: order.items.map((i) => ({
      quantity: i.quantity,
      productNameSnapshot: i.productNameSnapshot,
      unitPriceSnapshot: Number(i.unitPriceSnapshot),
    })),
    total: Number(order.total),
  });
  const waLink = whatsappUrl(waMessage);

  return (
    <div className="container-laxy py-12 max-w-2xl">
      {/* Success header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl text-accent">Order placed!</h1>
        <p className="mt-3 text-muted-foreground">
          Thank you, {order.customerName}. Your order{" "}
          <strong className="text-foreground">{order.orderNumber}</strong> has been received.
        </p>
      </div>

      {/* WhatsApp CTA */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6 space-y-4">
        <h2 className="font-heading text-xl text-foreground">Next step — confirm on WhatsApp</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tap the button below to message us. We'll confirm your items, check availability, and
          arrange delivery. No payment is required until confirmed.
        </p>
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground btn-press"
        >
          <MessageCircle className="h-4 w-4" />
          Message us on WhatsApp
        </a>
      </div>

      {/* Order items */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-3">
        <h2 className="font-heading text-lg text-foreground">Order summary</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground/80">
                {item.quantity} × {item.productNameSnapshot}
              </span>
              <span className="font-medium">{formatINR(Number(item.lineTotalSnapshot))}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-heading text-2xl">{formatINR(Number(order.total))}</span>
        </div>
      </div>

      {/* Delivery */}
      <div className="rounded-xl border border-border bg-card p-5 mb-8 space-y-1 text-sm">
        <h2 className="font-heading text-lg text-foreground mb-2">Delivering to</h2>
        <p className="text-foreground/80">{order.customerName}</p>
        <p className="text-muted-foreground">
          {order.addressLine}, {order.area}
          {order.landmark ? `, ${order.landmark}` : ""}
        </p>
        <p className="text-muted-foreground">
          {order.city}, {order.state} {order.pincode}
        </p>
        <p className="text-muted-foreground">📞 {order.phone}</p>
      </div>

      <div className="text-center">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ShoppingBag className="h-4 w-4" />
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
