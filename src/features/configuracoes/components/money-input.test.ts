import { describe, expect, it } from "vitest";
import { parseBrlToCents } from "@/lib/format/money";
import { centsToInput } from "./money-input";

describe("centsToInput", () => {
  it("formata em reais e volta para os mesmos centavos", () => {
    expect(centsToInput(null)).toBe("");
    for (const cents of [0, 5, 150000, 123456789]) expect(parseBrlToCents(centsToInput(cents))).toBe(cents);
  });
});
