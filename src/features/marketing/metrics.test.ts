import { describe, expect, it } from "vitest";
import { formatPercent, leadsPerMonth, monthKey, summarize, type MarketingLead } from "./metrics";

const lead = (over: Partial<MarketingLead>): MarketingLead => ({
  id: "1",
  name: "L",
  companyName: null,
  stage: "lead_recebido",
  temperature: "frio",
  createdAt: "2026-10-10T12:00:00Z",
  dealValueCents: null,
  ...over,
});

describe("leadsPerMonth", () => {
  it("cria os 6 últimos meses e conta no fuso de São Paulo", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    const months = leadsPerMonth(
      [
        lead({ createdAt: "2026-10-01T02:00:00Z" }), // 30/09 23h em SP
        lead({ createdAt: "2026-10-05T12:00:00Z" }),
        lead({ createdAt: "2026-05-05T12:00:00Z" }),
        lead({ createdAt: "2026-04-30T12:00:00Z" }), // fora da janela
      ],
      now,
    );
    expect(months.map((m) => m.key)).toEqual(["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    expect(months.map((m) => m.count)).toEqual([1, 0, 0, 0, 1, 1]);
  });
  it("atravessa a virada do ano", () => {
    const months = leadsPerMonth([], new Date("2027-02-10T12:00:00Z"), 3);
    expect(months.map((m) => m.key)).toEqual(["2026-12", "2027-01", "2027-02"]);
  });
  it("monthKey", () => {
    expect(monthKey(new Date("2026-11-01T01:00:00Z"))).toBe("2026-10");
  });
});

describe("summarize", () => {
  it("calcula conversão, quentes e frios", () => {
    const s = summarize([
      lead({ stage: "cliente_fechado", temperature: "quente", dealValueCents: 100_00 }),
      lead({ stage: "cliente_perdido" }),
      lead({ temperature: "quente" }),
      lead({}),
    ]);
    expect(s).toMatchObject({ total: 4, won: 1, lost: 1, open: 2, hot: 2, cold: 2, revenueCents: 10000, conversionRate: 0.25 });
  });
  it("sem leads a conversão é null", () => {
    expect(summarize([]).conversionRate).toBeNull();
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(0.25)).toMatch(/25\s?%/);
  });
});
