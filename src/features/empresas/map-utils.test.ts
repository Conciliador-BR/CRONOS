import { describe, expect, it } from "vitest";
import {
  MAP_EMPTY_FILL,
  MAP_FILL_STEPS,
  bucketIndex,
  companiesLabel,
  fillFor,
  groupByUf,
  legendFor,
  marketLabel,
  searchCompanies,
  type CompanySummary,
} from "./map-utils";

const base: CompanySummary = {
  id: "1",
  uf: "SP",
  city: "São Paulo",
  cnpj: "11222333000181",
  legalName: "Mercado Exemplo Ltda",
  tradeName: null,
  marketName: null,
  clientName: null,
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

describe("escala de cores", () => {
  it("sem empresas usa cinza", () => {
    expect(bucketIndex(0, 5)).toBe(-1);
    expect(fillFor(0, 5)).toBe(MAP_EMPTY_FILL);
    expect(fillFor(3, 0)).toBe(MAP_EMPTY_FILL);
  });
  it("o máximo usa o tom mais forte e valores menores, tons mais fracos", () => {
    expect(fillFor(10, 10)).toBe(MAP_FILL_STEPS[4]);
    expect(fillFor(1, 10)).toBe(MAP_FILL_STEPS[0]);
    expect(bucketIndex(5, 10)).toBe(2);
    expect(fillFor(1, 1)).toBe(MAP_FILL_STEPS[4]);
  });
  it("legenda só mostra faixas possíveis", () => {
    expect(legendFor(1)).toEqual([{ color: MAP_FILL_STEPS[4], label: "1" }]);
    expect(legendFor(10).map((i) => i.label)).toEqual(["1–2", "3–4", "5–6", "7–8", "9–10"]);
    expect(legendFor(3).map((i) => i.label)).toEqual(["1", "2", "3"]);
    expect(legendFor(0)).toEqual([]);
  });
  it("a legenda bate com a cor de cada contagem", () => {
    for (const max of [1, 3, 7, 12]) {
      const legend = legendFor(max);
      for (let n = 1; n <= max; n++) {
        const item = legend.find((l) => {
          const [low, high = low] = l.label.split("–").map(Number);
          return n >= low && n <= high;
        });
        expect(item?.color).toBe(fillFor(n, max));
      }
    }
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
