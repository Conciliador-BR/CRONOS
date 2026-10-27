import { describe, expect, it } from "vitest";
import { computeLeadSourceStats, conversionRate, groupLostReasons, rankReferrers, type StatsLead } from "./lead-stats";

describe("conversionRate", () => {
  it("evita divisão por zero", () => {
    expect(conversionRate(0, 0)).toBe(0);
    expect(conversionRate(1, 4)).toBe(0.25);
  });
});

describe("computeLeadSourceStats", () => {
  const leads: StatsLead[] = [
    { source: "marketing", temperature: "quente", stage: "cliente_fechado", createdAt: "2026-09-10T12:00:00Z" },
    { source: "marketing", temperature: "frio", stage: "lead_recebido", createdAt: "2026-10-01T12:00:00Z" },
    { source: "indicacao", temperature: "quente", stage: "cliente_perdido", createdAt: "2026-10-02T12:00:00Z" },
    { source: "venda", temperature: "frio", stage: "cliente_fechado", createdAt: "2026-10-05T12:00:00Z" },
  ];
  const stats = computeLeadSourceStats(leads);

  it("soma totais e temperatura", () => {
    expect(stats).toMatchObject({ total: 4, won: 2, lost: 1, open: 1, quente: 2, frio: 2, conversionRate: 0.5 });
  });

  it("sempre traz as quatro origens com fatia e conversão", () => {
    expect(stats.bySource.map((s) => s.source)).toEqual(["marketing", "venda", "indicacao", "outro"]);
    expect(stats.bySource[0]).toMatchObject({ total: 2, won: 1, share: 0.5, conversionRate: 0.5, quente: 1, frio: 1 });
    expect(stats.bySource[3]).toMatchObject({ total: 0, share: 0, conversionRate: 0 });
  });

  it("agrupa por mês com detalhe por origem", () => {
    expect(stats.byMonth.map((m) => [m.month, m.total, m.won])).toEqual([
      ["2026-09", 1, 1],
      ["2026-10", 3, 1],
    ]);
    expect(stats.byMonth[1].sources.marketing).toMatchObject({ total: 1, open: 1, frio: 1 });
  });

  it("lida com lista vazia", () => {
    const empty = computeLeadSourceStats([]);
    expect(empty.total).toBe(0);
    expect(empty.byMonth).toEqual([]);
    expect(empty.bySource).toHaveLength(4);
  });
});

describe("rankReferrers", () => {
  it("junta grafias do mesmo indicador e ordena por fechados", () => {
    const ranking = rankReferrers([
      { referrerName: "João Silva", stage: "cliente_fechado", dealValueCents: 1000 },
      { referrerName: "joao  silva", stage: "follow_up", dealValueCents: null },
      { referrerName: "João Silva", stage: "cliente_perdido", dealValueCents: null },
      { referrerName: "Maria", stage: "lead_recebido", dealValueCents: null },
      { referrerName: "Pedro", stage: "lead_recebido", dealValueCents: null },
      { referrerName: null, stage: "cliente_fechado", dealValueCents: 50 },
      { referrerName: "  ", stage: "cliente_fechado", dealValueCents: 50 },
    ]);
    expect(ranking).toEqual([
      { name: "João Silva", leads: 3, won: 1, revenueCents: 1000, conversionRate: 1 / 3, position: 1 },
      { name: "Maria", leads: 1, won: 0, revenueCents: 0, conversionRate: 0, position: 2 },
      { name: "Pedro", leads: 1, won: 0, revenueCents: 0, conversionRate: 0, position: 2 },
    ]);
  });
});

describe("groupLostReasons", () => {
  it("agrupa textos iguais e palavras recorrentes", () => {
    const { phrases, keywords } = groupLostReasons([
      "Preço alto",
      "preço alto.",
      "Achou o preço caro",
      "Sem orçamento",
      "",
    ]);
    expect(phrases[0]).toEqual({ text: "Preço alto", count: 2 });
    expect(phrases).toHaveLength(3);
    expect(keywords[0]).toEqual({ word: "preco", count: 3 });
    expect(keywords.find((k) => k.word === "alto")).toEqual({ word: "alto", count: 2 });
    expect(keywords.find((k) => k.word === "orcamento")).toBeUndefined();
  });
});
