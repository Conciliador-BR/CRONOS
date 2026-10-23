import { describe, expect, it } from "vitest";
import { formatCnpj, isValidCnpj } from "./document";

describe("isValidCnpj", () => {
  it("aceita CNPJ válido com ou sem máscara", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11222333000181")).toBe(true);
  });
  it("rejeita inválidos", () => {
    expect(isValidCnpj("11222333000182")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
    expect(isValidCnpj("123")).toBe(false);
  });
});

it("formatCnpj aplica máscara", () => {
  expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
});
