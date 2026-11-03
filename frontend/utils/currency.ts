const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

// Money values arrive as integer strings; BigInt keeps large amounts exact while formatting
export function formatRupiah(value: string | bigint) {
  return rupiahFormatter.format(typeof value === "bigint" ? value : BigInt(value));
}
