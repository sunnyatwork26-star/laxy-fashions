import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset between tests
    resetRateLimit("test-key");
  });

  it("allows first request", () => {
    const result = checkRateLimit("test-key");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows up to maxAttempts requests", () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit("test-key");
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks after maxAttempts exceeded", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-key");
    }
    const result = checkRateLimit("test-key");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different keys independently", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("key-a");
    }
    // key-a is exhausted
    expect(checkRateLimit("key-a").allowed).toBe(false);
    // key-b is fresh
    expect(checkRateLimit("key-b").allowed).toBe(true);
    resetRateLimit("key-a");
    resetRateLimit("key-b");
  });

  it("respects custom maxAttempts", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("test-key", 3);
    }
    expect(checkRateLimit("test-key", 3).allowed).toBe(false);
  });

  it("returns resetInSeconds", () => {
    const result = checkRateLimit("test-key", 5, 60_000);
    expect(result.resetInSeconds).toBeGreaterThan(0);
    expect(result.resetInSeconds).toBeLessThanOrEqual(60);
  });
});

describe("resetRateLimit", () => {
  it("clears the rate limit for a key", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("reset-test");
    }
    expect(checkRateLimit("reset-test").allowed).toBe(false);

    resetRateLimit("reset-test");
    expect(checkRateLimit("reset-test").allowed).toBe(true);
  });
});
