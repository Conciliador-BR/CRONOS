import { describe, expect, it } from "vitest";
import { companiesLabel, groupByUf, marketLabel, searchCompanies, type CompanySummary } from "./map-utils";

const base: CompanySummary = {
  id: "1",
  uf: "SP",
  city: "São Paulo",
  cnpj: "11222333000181",
  legalName: "Mercado Exemplo Ltda",
  tradeName: null,
  marketName: null,
  clientName: null,
  latitude: null,
  longitude: null,
  parentId: null,
};

describe("marketLabel", () => {
  it("prefere nome do mercado, depois fantasia, depois razão social", () => {
    expect(marketLabel({ ...base, marketName: "Super A", tradeName: "Fantasia" })).toBe("Super A");
    expect(marketLabel({ ...base, marketName: "  ", tradeName: "Fantasia" })).toBe("Fantasia");
    expect(marketLabel(base)).toBe("Mercado Exemplo Ltda");
  });
});

describe("groupByUf", () => {
  it("agrupa, normaliza a UF, ignora inválidas e ordena pelo nome", () => {
    const groups = groupByUf([
      { ...base, id: "a", marketName: "Zeta" },
      { ...base, id: "b", uf: "sp", marketName: "Álamo" },
      { ...base, id: "c", uf: "RJ" },
      { ...base, id: "d", uf: "XX" },
    ]);
    expect([...groups.keys()].sort()).toEqual(["RJ", "SP"]);
    expect(groups.get("SP")?.map((c) => c.id)).toEqual(["b", "a"]);
  });
});

describe("searchCompanies", () => {
  const list = [
    { ...base, id: "a", marketName: "Supermercado Pão Doce", city: "Campinas" },
    { ...base, id: "b", cnpj: "99888777000100", legalName: "Outra", city: "Niterói", uf: "RJ" },
  ];
  it("ignora acentos e caixa", () => {
    expect(searchCompanies(list, "pao doce").map((c) => c.id)).toEqual(["a"]);
    expect(searchCompanies(list, "NITEROI").map((c) => c.id)).toEqual(["b"]);
  });
  it("busca por CNPJ com máscara", () => {
    expect(searchCompanies(list, "99.888.777").map((c) => c.id)).toEqual(["b"]);
  });
  it("busca vazia não retorna nada", () => {
    expect(searchCompanies(list, "  ")).toEqual([]);
  });
});

describe("companiesLabel", () => {
  it("singular e plural", () => {
    expect(companiesLabel(1)).toBe("1 empresa");
    expect(companiesLabel(3)).toBe("3 empresas");
  });
});
