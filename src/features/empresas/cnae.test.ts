import { describe, expect, it } from "vitest";
import { formatCnae, normalizeCnae } from "./cnae";

describe("formatCnae", () => {
  it("aplica a máscara 0000-0/00 enquanto digita", () => {
    expect(formatCnae("4711302")).toBe("4711-3/02");
    expect(formatCnae("4711")).toBe("4711");
    expect(formatCnae("47113")).toBe("4711-3");
    expect(formatCnae("471130")).toBe("4711-3/0");
    expect(formatCnae("4711-3/02 extra 9")).toBe("4711-3/02");
    expect(formatCnae(null)).toBe("");
  });
});

describe("normalizeCnae", () => {
  it("aceita número ou texto e completa o zero à esquerda", () => {
    expect(normalizeCnae(4711302)).toBe("4711302");
    expect(normalizeCnae("4711-3/02")).toBe("4711302");
    expect(normalizeCnae(111301)).toBe("0111301");
  });
  it("recusa tamanhos errados e vazio", () => {
    expect(normalizeCnae("123")).toBeNull();
    expect(normalizeCnae("12345678")).toBeNull();
    expect(normalizeCnae(null)).toBeNull();
    expect(normalizeCnae(undefined)).toBeNull();
  });
});
