import { describe, expect, it } from "vitest";
import { formatCents, parseBrlToCents } from "./money";

describe("parseBrlToCents", () => {
  it.each([
    ["1.234,56", 123456],
    ["R$ 10", 1000],
    ["10,5", 1050],
    ["10.50", 1050],
    ["0,01", 1],
  ])("%s -> %i", (input, cents) => expect(parseBrlToCents(input)).toBe(cents));

  it.each(["", "abc", "1,234", "-5", "1.2.3"])("rejeita %s", (input) => {
    expect(parseBrlToCents(input)).toBeNull();
  });
});

describe("formatCents", () => {
  it("formata em reais", () => {
    expect(formatCents(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
    expect(formatCents(null).replace(/\s/g, " ")).toBe("R$ 0,00");
  });
});
