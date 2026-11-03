import { describe, expect, it } from "vitest";
import { formatRupiah } from "~/utils/currency";

// Intl puts a non-breaking space between "Rp" and the number
const normalizeSpaces = (value: string) => value.replace(/ /g, " ");

describe("formatRupiah", () => {
  it("formats the API's integer strings with Indonesian thousand separators", () => {
    expect(normalizeSpaces(formatRupiah("1500000"))).toBe("Rp 1.500.000");
    expect(normalizeSpaces(formatRupiah("0"))).toBe("Rp 0");
  });

  it("accepts bigint values", () => {
    expect(normalizeSpaces(formatRupiah(25_000n))).toBe("Rp 25.000");
  });

  it("keeps amounts beyond Number.MAX_SAFE_INTEGER exact", () => {
    expect(normalizeSpaces(formatRupiah("9223372036854775807"))).toBe("Rp 9.223.372.036.854.775.807");
  });
});
