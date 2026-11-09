import { describe, expect, it } from "vitest";
import { formatPtBrNumber, parsePtBrNumber } from "./number";

describe("parsePtBrNumber", () => {
  it("lê ponto como milhar e vírgula como decimal", () => {
    expect(parsePtBrNumber("1.234")).toBe(1234);
    expect(parsePtBrNumber("1.234,5")).toBe(1234.5);
    expect(parsePtBrNumber("-12,75")).toBe(-12.75);
    expect(parsePtBrNumber("42")).toBe(42);
  });

  it("recusa texto que não é número", () => {
    expect(parsePtBrNumber("abc")).toBeNull();
    expect(parsePtBrNumber("1,2,3")).toBeNull();
    expect(parsePtBrNumber(",")).toBeNull();
  });

  it("volta ao mesmo número depois de formatar", () => {
    for (const value of [0, 1234, 1234.5, -0.25, 1000000]) {
      expect(parsePtBrNumber(formatPtBrNumber(value))).toBe(value);
    }
  });
});
