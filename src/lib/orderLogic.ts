// Order state machine and shared business logic for Laxy Fashions.
// Single source of truth — imported by server actions and middleware.

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["DISPATCHED"],
  DISPATCHED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: string, to: string): boolean {
  return (ORDER_TRANSITIONS[from] || []).includes(to);
}

export function nextStatuses(from: string): string[] {
  return ORDER_TRANSITIONS[from] || [];
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const STATUS_TONES: Record<string, string> = {
  PENDING: "amber",
  CONFIRMED: "emerald",
  PREPARING: "sky",
  READY: "violet",
  DISPATCHED: "indigo",
  DELIVERED: "emerald",
  CANCELLED: "rose",
};

/**
 * Normalize an Indian mobile number to +91XXXXXXXXXX format.
 * Returns empty string if the number is invalid.
 */
export function normalizePhone(raw: string): string {
  if (!raw) return "";
  let digits = String(raw).replace(/[^\d+]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.replace(/^\+/, "");
  if (digits.length !== 10) return "";
  if (!/^[6-9]\d{9}$/.test(digits)) return "";
  return "+91" + digits;
}

/**
 * Format a number as Indian Rupees (₹12,345).
 */
export function formatINR(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/**
 * Returns the effective selling price for a product.
 * Uses sale_price if it is set, positive, and below base_price.
 */
export function effectivePrice(
  basePrice: number | string,
  salePrice?: number | string | null
): number {
  const base = Number(basePrice);
  if (salePrice !== null && salePrice !== undefined) {
    const sale = Number(salePrice);
    if (!isNaN(sale) && sale > 0 && sale < base) return sale;
  }
  return base;
}

/**
 * Build the pre-filled WhatsApp message for an order.
 */
export function buildWhatsAppMessage(params: {
  orderNumber: string;
  customerName: string;
  items: Array<{ quantity: number; productNameSnapshot: string; unitPriceSnapshot: number | string }>;
  total: number | string;
}): string {
  const lines = params.items
    .map((i) => `${i.quantity} × ${i.productNameSnapshot} — ${formatINR(i.unitPriceSnapshot)}`)
    .join("\n");
  return (
    `Hello Laxy Fashions,\n\n` +
    `I placed order ${params.orderNumber} on the website.\n\n` +
    `Items:\n${lines}\n\n` +
    `Total: ${formatINR(params.total)}\n\n` +
    `Please verify availability and confirm my order.\n\n` +
    `Thank you.`
  );
}

/**
 * Build a wa.me URL with a pre-filled message.
 * Phone number comes from NEXT_PUBLIC_WHATSAPP_NUMBER env var.
 */
export function whatsappUrl(message: string): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919876543210";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Slugify a string for use in product URLs.
 */
export function slugify(text: string): string {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Shape of fields that serializeProduct needs to convert. */
interface SerializableProduct {
  basePrice?: unknown;
  salePrice?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  [key: string]: unknown;
}

/**
 * Convert Prisma Decimal objects in product records to plain numbers for Next.js Client Component props.
 */
export function serializeProduct<T extends SerializableProduct>(p: T): T {
  if (!p) return p;
  return {
    ...p,
    basePrice: p.basePrice ? Number(p.basePrice) : 0,
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    createdAt: p.createdAt ? new Date(p.createdAt as string).toISOString() : undefined,
    updatedAt: p.updatedAt ? new Date(p.updatedAt as string).toISOString() : undefined,
  };
}

export function serializeProducts<T extends SerializableProduct>(list: T[]): T[] {
  return list.map(serializeProduct);
}
