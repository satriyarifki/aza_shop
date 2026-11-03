import { describe, expect, it } from "vitest";
import { calculateDiscountPreview } from "~/utils/discount";

describe("calculateDiscountPreview (Variant A)", () => {
  it.each([
    { subtotal: 0n, rate: 0n, discount: 0n },
    { subtotal: 499_999n, rate: 0n, discount: 0n },
    { subtotal: 500_000n, rate: 5n, discount: 25_000n },
    { subtotal: 999_999n, rate: 5n, discount: 49_999n }, // 49,999.95 rounded down
    { subtotal: 1_000_000n, rate: 10n, discount: 100_000n },
    { subtotal: 1_500_000n, rate: 10n, discount: 150_000n },
    { subtotal: 9_000_000n, rate: 10n, discount: 150_000n }, // capped at Rp150,000
  ])("subtotal $subtotal → $rate% → discount $discount", ({ subtotal, rate, discount }) => {
    expect(calculateDiscountPreview(subtotal)).toEqual({
      discountRate: rate,
      discountAmount: discount,
      grandTotal: subtotal - discount,
    });
  });
});
