// Variant A: 5% from Rp500,000, 10% from Rp1,000,000, capped at Rp150,000.
// BigInt division truncates, so a fractional Rupiah discount is always rounded down.
const MAX_DISCOUNT = 150_000n;
const FIVE_PERCENT_THRESHOLD = 500_000n;
const TEN_PERCENT_THRESHOLD = 1_000_000n;

export function calculateDiscount(subtotal: bigint) {
  let discountRate = 0n;

  if (subtotal >= TEN_PERCENT_THRESHOLD) {
    discountRate = 10n;
  } else if (subtotal >= FIVE_PERCENT_THRESHOLD) {
    discountRate = 5n;
  }

  const calculatedDiscount = (subtotal * discountRate) / 100n;
  const discountAmount = calculatedDiscount > MAX_DISCOUNT ? MAX_DISCOUNT : calculatedDiscount;

  return {
    discountAmount,
    grandTotal: subtotal - discountAmount,
  };
}
