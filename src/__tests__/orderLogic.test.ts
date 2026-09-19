import { describe, it, expect } from "vitest";
import {
  canTransition,
  nextStatuses,
  normalizePhone,
  formatINR,
  effectivePrice,
  slugify,
  buildWhatsAppMessage,
  sanitizePhone,
  whatsappUrl,
  ORDER_TRANSITIONS,
  STATUS_LABELS,
} from "@/lib/orderLogic";

// ─── canTransition ───────────────────────────────────────────────────────────

describe("canTransition", () => {
  it("allows PENDING → CONFIRMED", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
  });

  it("allows PENDING → CANCELLED", () => {
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
  });

  it("disallows PENDING → DELIVERED", () => {
    expect(canTransition("PENDING", "DELIVERED")).toBe(false);
  });

  it("disallows DELIVERED → anything", () => {
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransition("DELIVERED", "PENDING")).toBe(false);
  });

  it("disallows CANCELLED → anything", () => {
    expect(canTransition("CANCELLED", "PENDING")).toBe(false);
  });

  it("handles unknown status gracefully", () => {
    expect(canTransition("UNKNOWN", "PENDING")).toBe(false);
  });

  it("follows the full happy path", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "READY")).toBe(true);
    expect(canTransition("READY", "DISPATCHED")).toBe(true);
    expect(canTransition("DISPATCHED", "DELIVERED")).toBe(true);
  });
});

// ─── nextStatuses ────────────────────────────────────────────────────────────

describe("nextStatuses", () => {
  it("returns correct options for PENDING", () => {
    expect(nextStatuses("PENDING")).toEqual(["CONFIRMED", "CANCELLED"]);
  });

  it("returns empty array for DELIVERED", () => {
    expect(nextStatuses("DELIVERED")).toEqual([]);
  });

  it("returns empty array for unknown status", () => {
    expect(nextStatuses("UNKNOWN")).toEqual([]);
  });
});

// ─── normalizePhone ──────────────────────────────────────────────────────────

describe("normalizePhone", () => {
  it("normalizes 10-digit number", () => {
    expect(normalizePhone("9876543210")).toBe("+919876543210");
  });

  it("normalizes +91 prefixed number", () => {
    expect(normalizePhone("+919876543210")).toBe("+919876543210");
  });

  it("normalizes 91 prefixed 12-digit number", () => {
    expect(normalizePhone("919876543210")).toBe("+919876543210");
  });

  it("normalizes 0-prefixed number", () => {
    expect(normalizePhone("09876543210")).toBe("+919876543210");
  });

  it("handles spaces and dashes", () => {
    expect(normalizePhone("98765 43210")).toBe("+919876543210");
    expect(normalizePhone("98765-43210")).toBe("+919876543210");
  });

  it("returns empty for invalid number", () => {
    expect(normalizePhone("12345")).toBe("");
  });

  it("returns empty for number starting with 0-5", () => {
    expect(normalizePhone("1234567890")).toBe("");
  });

  it("returns empty for empty string", () => {
    expect(normalizePhone("")).toBe("");
  });
});

// ─── formatINR ───────────────────────────────────────────────────────────────

describe("formatINR", () => {
  it("formats a number with INR symbol", () => {
    expect(formatINR(1500)).toBe("₹1,500");
  });

  it("formats large numbers with Indian grouping", () => {
    expect(formatINR(1250000)).toBe("₹12,50,000");
  });

  it("handles string input", () => {
    expect(formatINR("2500")).toBe("₹2,500");
  });

  it("handles null/undefined as 0", () => {
    expect(formatINR(null)).toBe("₹0");
    expect(formatINR(undefined)).toBe("₹0");
  });

  it("handles zero", () => {
    expect(formatINR(0)).toBe("₹0");
  });
});

// ─── effectivePrice ──────────────────────────────────────────────────────────

describe("effectivePrice", () => {
  it("returns sale price when valid and lower than base", () => {
    expect(effectivePrice(1000, 800)).toBe(800);
  });

  it("returns base price when no sale price", () => {
    expect(effectivePrice(1000)).toBe(1000);
    expect(effectivePrice(1000, null)).toBe(1000);
    expect(effectivePrice(1000, undefined)).toBe(1000);
  });

  it("returns base price when sale price >= base price", () => {
    expect(effectivePrice(1000, 1000)).toBe(1000);
    expect(effectivePrice(1000, 1200)).toBe(1000);
  });

  it("returns base price when sale price is 0 or negative", () => {
    expect(effectivePrice(1000, 0)).toBe(1000);
    expect(effectivePrice(1000, -100)).toBe(1000);
  });

  it("handles string inputs", () => {
    expect(effectivePrice("1000", "800")).toBe(800);
  });
});

// ─── slugify ─────────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("converts to lowercase kebab-case", () => {
    expect(slugify("Banarasi Silk Vermilion")).toBe("banarasi-silk-vermilion");
  });

  it("removes special characters", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });

  it("collapses multiple spaces/hyphens", () => {
    expect(slugify("hello   world---test")).toBe("hello-world-test");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("trims whitespace", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });
});

// ─── buildWhatsAppMessage & whatsappUrl ──────────────────────────────────────

describe("buildWhatsAppMessage", () => {
  it("builds a complete order message", () => {
    const msg = buildWhatsAppMessage({
      orderNumber: "LF-1001",
      customerName: "Test User",
      items: [
        { quantity: 2, productNameSnapshot: "Silk Saree", unitPriceSnapshot: 1500 },
        { quantity: 1, productNameSnapshot: "Cotton Saree", unitPriceSnapshot: 800 },
      ],
      total: 3800,
    });

    expect(msg).toContain("LF-1001");
    expect(msg).toContain("2 × Silk Saree");
    expect(msg).toContain("1 × Cotton Saree");
    expect(msg).toContain("₹3,800");
    expect(msg).toContain("Hello Laxy Fashions");
  });
});

describe("sanitizePhone & whatsappUrl", () => {
  it("sanitizes 10-digit number to include 91 country code", () => {
    expect(sanitizePhone("9876543210")).toBe("919876543210");
  });

  it("sanitizes number with spaces and symbols", () => {
    expect(sanitizePhone("+91 98765-43210")).toBe("919876543210");
  });

  it("generates wa.me URL with custom dynamic phone", () => {
    const url = whatsappUrl("Hello testing", "918888888888");
    expect(url).toBe("https://wa.me/918888888888?text=Hello%20testing");
  });

  it("generates wa.me URL with 10-digit phone formatted with country code", () => {
    const url = whatsappUrl("Inquiry", "9876543210");
    expect(url).toBe("https://wa.me/919876543210?text=Inquiry");
  });
});

// ─── ORDER_TRANSITIONS completeness ──────────────────────────────────────────

describe("ORDER_TRANSITIONS", () => {
  it("covers all statuses in STATUS_LABELS", () => {
    const transitionKeys = Object.keys(ORDER_TRANSITIONS);
    const labelKeys = Object.keys(STATUS_LABELS);
    expect(transitionKeys.sort()).toEqual(labelKeys.sort());
  });

  it("has no transition pointing to non-existent status", () => {
    const allStatuses = Object.keys(ORDER_TRANSITIONS);
    for (const [, targets] of Object.entries(ORDER_TRANSITIONS)) {
      for (const target of targets) {
        expect(allStatuses).toContain(target);
      }
    }
  });
});
