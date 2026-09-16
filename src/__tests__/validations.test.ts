import { describe, it, expect } from "vitest";
import {
  checkoutSchema,
  productSchema,
  transitionOrderSchema,
  stockUpdateSchema,
} from "@/lib/validations";

// ─── checkoutSchema ──────────────────────────────────────────────────────────

describe("checkoutSchema", () => {
  const validCheckout = {
    customerName: "Ravi Kumar",
    phone: "9876543210",
    addressLine: "123 Main Street, Sector 5",
    area: "Koramangala",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560095",
    items: [{ productId: "clx123", quantity: 2 }],
  };

  it("accepts valid checkout data", () => {
    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it("normalizes phone number", () => {
    const result = checkoutSchema.safeParse(validCheckout);
    if (result.success) {
      expect(result.data.phone).toBe("+919876543210");
    }
  });

  it("rejects short name", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, customerName: "R" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, phone: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid pincode", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, pincode: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects 7-digit pincode", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, pincode: "1234567" });
    expect(result.success).toBe(false);
  });

  it("accepts valid 6-digit pincode", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, pincode: "110001" });
    expect(result.success).toBe(true);
  });

  it("rejects empty items", () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects quantity > 10", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      items: [{ productId: "clx123", quantity: 11 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity 0", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      items: [{ productId: "clx123", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("allows optional fields", () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      landmark: "Near Big Bazaar",
      note: "Please call before delivery",
    });
    expect(result.success).toBe(true);
  });
});

// ─── productSchema ───────────────────────────────────────────────────────────

describe("productSchema", () => {
  const validProduct = {
    name: "Banarasi Silk Saree",
    sku: "LF-SILK-001",
    basePrice: 4500,
    stock: 10,
  };

  it("accepts valid product data", () => {
    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = productSchema.safeParse({ ...validProduct, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = productSchema.safeParse({ ...validProduct, basePrice: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects zero price", () => {
    const result = productSchema.safeParse({ ...validProduct, basePrice: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative stock", () => {
    const result = productSchema.safeParse({ ...validProduct, stock: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts zero stock", () => {
    const result = productSchema.safeParse({ ...validProduct, stock: 0 });
    expect(result.success).toBe(true);
  });

  it("validates slug format", () => {
    const result = productSchema.safeParse({ ...validProduct, slug: "INVALID SLUG!" });
    expect(result.success).toBe(false);
  });

  it("accepts valid slug", () => {
    const result = productSchema.safeParse({ ...validProduct, slug: "banarasi-silk-001" });
    expect(result.success).toBe(true);
  });

  it("defaults status to ACTIVE", () => {
    const result = productSchema.safeParse(validProduct);
    if (result.success) {
      expect(result.data.status).toBe("ACTIVE");
    }
  });

  it("rejects invalid status", () => {
    const result = productSchema.safeParse({ ...validProduct, status: "DELETED" });
    expect(result.success).toBe(false);
  });
});

// ─── transitionOrderSchema ───────────────────────────────────────────────────

describe("transitionOrderSchema", () => {
  it("accepts valid transition", () => {
    const result = transitionOrderSchema.safeParse({
      orderId: "clx123",
      toStatus: "CONFIRMED",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = transitionOrderSchema.safeParse({
      orderId: "clx123",
      toStatus: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty orderId", () => {
    const result = transitionOrderSchema.safeParse({
      orderId: "",
      toStatus: "CONFIRMED",
    });
    expect(result.success).toBe(false);
  });
});

// ─── stockUpdateSchema ──────────────────────────────────────────────────────

describe("stockUpdateSchema", () => {
  it("accepts valid stock update", () => {
    const result = stockUpdateSchema.safeParse({
      productId: "clx123",
      quantity: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts negative quantity (for adjustments)", () => {
    const result = stockUpdateSchema.safeParse({
      productId: "clx123",
      quantity: -5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty productId", () => {
    const result = stockUpdateSchema.safeParse({
      productId: "",
      quantity: 10,
    });
    expect(result.success).toBe(false);
  });
});
