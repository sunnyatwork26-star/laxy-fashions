import { z } from "zod";
import { normalizePhone } from "@/lib/orderLogic";

// ─── Product ────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens only").optional(),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  fabric: z.string().optional(),
  occasion: z.array(z.string()).optional().default([]),
  basePrice: z.coerce.number().positive("Price must be greater than 0"),
  salePrice: z.coerce.number().positive().optional().nullable(),
  sku: z.string().min(1, "SKU is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  images: z.array(z.string().url()).optional().default([]),
  featured: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export type ProductInput = z.infer<typeof productSchema>;

// ─── Checkout / Order ────────────────────────────────────────────────────────

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Please enter your full name"),
  phone: z
    .string()
    .min(10)
    .transform((val) => normalizePhone(val))
    .refine((val) => val.length > 0, { message: "Enter a valid 10-digit Indian mobile number" }),
  addressLine: z.string().min(5, "Enter your full address"),
  area: z.string().min(2, "Area / locality is required"),
  landmark: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  note: z.string().max(500).optional(),
  items: z
    .array(checkoutItemSchema)
    .min(1, "Your cart is empty")
    .max(20, "Too many items in cart"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ─── Admin: Order Transition ─────────────────────────────────────────────────

export const transitionOrderSchema = z.object({
  orderId: z.string().min(1),
  toStatus: z.enum(["CONFIRMED", "PREPARING", "READY", "DISPATCHED", "DELIVERED", "CANCELLED"]),
  note: z.string().max(500).optional(),
});

// ─── Admin: Stock Update ─────────────────────────────────────────────────────

export const stockUpdateSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int(),
  note: z.string().max(500).optional(),
});

// ─── Admin: Category ─────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  sortOrder: z.coerce.number().int().optional().default(0),
});
