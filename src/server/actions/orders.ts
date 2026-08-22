"use server";

import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations";
import { canTransition } from "@/lib/orderLogic";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// createOrder  — public, no auth required. All pricing is server-side.
// ─────────────────────────────────────────────────────────────────────────────
export async function createOrder(rawInput: unknown): Promise<
  | { ok: true; orderNumber: string; orderId: string; total: number }
  | { ok: false; error: string; fields?: Record<string, string> }
> {
  const parsed = checkoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join(".");
      fields[key] = issue.message;
    });
    return { ok: false, error: "Validation failed", fields };
  }

  const {
    customerName, phone, addressLine, area, landmark,
    city, state, pincode, note, items,
  } = parsed.data;

  // Load products server-side
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const snapshots: {
    productId: string;
    productNameSnapshot: string;
    skuSnapshot: string;
    quantity: number;
    unitPriceSnapshot: Prisma.Decimal;
    lineTotalSnapshot: Prisma.Decimal;
  }[] = [];
  const stockErrors: string[] = [];

  for (const item of items) {
    const p = productMap.get(item.productId);
    if (!p) { stockErrors.push("A product in your cart is no longer available."); continue; }
    if (p.status !== "ACTIVE") { stockErrors.push(`${p.name} is no longer available.`); continue; }
    if (p.stock < item.quantity) {
      stockErrors.push(`Only ${p.stock} left of ${p.name}. Please reduce the quantity.`);
      continue;
    }

    const basePrice = Number(p.basePrice);
    const salePrice = p.salePrice ? Number(p.salePrice) : null;
    const unitPrice = salePrice && salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    snapshots.push({
      productId: p.id,
      productNameSnapshot: p.name,
      skuSnapshot: p.sku ?? "",
      quantity: item.quantity,
      unitPriceSnapshot: unitPrice as unknown as Prisma.Decimal,
      lineTotalSnapshot: lineTotal as unknown as Prisma.Decimal,
    });
  }

  if (stockErrors.length > 0) return { ok: false, error: stockErrors.join(" ") };
  if (snapshots.length === 0) return { ok: false, error: "Your cart is empty." };

  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const counter = await tx.orderCounter.upsert({
      where: { id: 1 },
      update: { nextValue: { increment: 1 } },
      create: { id: 1, nextValue: 1002 },
    });
    const orderNumber = `LF-${counter.nextValue - 1}`;

    return tx.order.create({
      data: {
        orderNumber,
        customerName,
        phone,
        addressLine,
        area,
        landmark: landmark ?? null,
        city,
        state,
        pincode,
        note: note ?? null,
        status: "PENDING",
        subtotal: subtotal as unknown as Prisma.Decimal,
        total: subtotal as unknown as Prisma.Decimal,
        inventoryCommitted: false,
        items: { create: snapshots },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "PENDING",
            note: "Order placed by customer",
          },
        },
      },
    });
  });

  return { ok: true, orderNumber: order.orderNumber, orderId: order.id, total: subtotal };
}

// ─────────────────────────────────────────────────────────────────────────────
// transitionOrder — admin only, atomic inventory management
// ─────────────────────────────────────────────────────────────────────────────
export async function transitionOrder(
  orderId: string,
  toStatus: string,
  note?: string
): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Unauthorized" };
  const adminId = session.user.id;

  try {
    const status = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) throw new Error("Order not found.");
      if (!canTransition(order.status, toStatus)) {
        throw new Error(`Cannot move from ${order.status} to ${toStatus}.`);
      }

      if (toStatus === "CONFIRMED") {
        for (const item of order.items) {
          if (!item.productId) throw new Error(`${item.productNameSnapshot} no longer exists.`);
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product || product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.productNameSnapshot}.`);
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: "SALE_CONFIRMATION",
              quantity: -item.quantity,
              referenceType: "ORDER",
              referenceId: orderId,
              createdByAdminId: adminId,
              note: `Order ${order.orderNumber} confirmed`,
            },
          });
        }
        await tx.order.update({ where: { id: orderId }, data: { status: "CONFIRMED", inventoryCommitted: true } });
        await tx.orderStatusHistory.create({
          data: { orderId, fromStatus: order.status, toStatus: "CONFIRMED", changedByAdminId: adminId, note: note ?? "Confirmed" },
        });
        return "CONFIRMED";
      }

      if (toStatus === "CANCELLED") {
        if (order.inventoryCommitted) {
          for (const item of order.items) {
            if (!item.productId) continue;
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                type: "CANCELLATION_RELEASE",
                quantity: item.quantity,
                referenceType: "ORDER",
                referenceId: orderId,
                createdByAdminId: adminId,
                note: `Order ${order.orderNumber} cancelled — stock restored`,
              },
            });
          }
        }
        await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED", inventoryCommitted: false } });
        await tx.orderStatusHistory.create({
          data: { orderId, fromStatus: order.status, toStatus: "CANCELLED", changedByAdminId: adminId, note: note ?? "Cancelled" },
        });
        return "CANCELLED";
      }

      // Other transitions
      await tx.order.update({ where: { id: orderId }, data: { status: toStatus as any } });
      await tx.orderStatusHistory.create({
        data: { orderId, fromStatus: order.status, toStatus: toStatus as any, changedByAdminId: adminId, note: note ?? toStatus },
      });
      return toStatus;
    });

    return { ok: true, status };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Transition failed." };
  }
}
