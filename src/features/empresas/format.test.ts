import { describe, expect, it } from "vitest";
import { accountTypeLabel, formatAddress, formatBytes, formatCep, formatCpfCnpj } from "./format";

describe("formatos", () => {
  it("CEP", () => {
    expect(formatCep("01310100")).toBe("01310-100");
    expect(formatCep("0131")).toBe("0131");
    expect(formatCep(null)).toBe("");
  });
  it("CPF ou CNPJ conforme a quantidade de dígitos", () => {
    expect(formatCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(formatCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatCpfCnpj("")).toBe("");
  });
  it("tamanho de arquivo", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
  });
  it("tipo de conta", () => {
    expect(accountTypeLabel("poupanca")).toBe("Poupança");
    expect(accountTypeLabel(null)).toBe("Tipo não informado");
    expect(accountTypeLabel("x")).toBe("Tipo não informado");
  });
  it("endereço em uma linha", () => {
    expect(
      formatAddress({
        street: "Av. Paulista",
        number: "1000",
        complement: "Sala 2",
        district: "Bela Vista",
        city: "São Paulo",
        uf: "SP",
        cep: "01310100",
      }),
    ).toBe("Av. Paulista, 1000 - Sala 2 · Bela Vista · São Paulo/SP · CEP 01310-100");
    expect(
      formatAddress({ street: null, number: null, complement: null, district: null, city: null, uf: "RJ", cep: null }),
    ).toBe("RJ");
  });
});
