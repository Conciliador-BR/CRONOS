import { describe, expect, it } from "vitest";
import { buildPerformance, goalWindowStart } from "./performance";

const members = [
  { id: "ana", name: "Ana", teamName: "Vendas", commissionRate: 10, avatarUrl: null },
  { id: "bia", name: "Bia", teamName: null, commissionRate: 5, avatarUrl: null },
];

const deal = (id: string, ownerId: string | null, cents: number, closedAt: string) => ({
  id,
  name: `Lead ${id}`,
  companyName: null,
  ownerId,
  dealType: "somente_sistema" as const,
  dealValueCents: cents,
  closedAt,
});

describe("buildPerformance", () => {
  const summary = buildPerformance({
    month: "2026-10",
    members,
    deals: [
      deal("1", "ana", 100_000, "2026-10-05T12:00:00Z"),
      deal("2", "bia", 300_000, "2026-10-06T12:00:00Z"),
      deal("3", "ana", 50_000, "2026-09-20T12:00:00Z"),
      deal("4", null, 20_000, "2026-10-07T12:00:00Z"),
      deal("5", "ana", 70_000, "2025-01-10T12:00:00Z"),
    ],
    goals: [
      { profileId: "ana", month: "2026-10-01", goalCents: 200_000 },
      { profileId: "ana", month: "2026-09-01", goalCents: 40_000 },
    ],
  });

  it("calcula os KPIs do mês, inclusive negócios sem responsável", () => {
    expect(summary.kpis).toEqual({
      revenueCents: 420_000,
      activeMembers: 2,
      dealsClosed: 3,
      averageTicketCents: 140_000,
    });
  });

  it("ranqueia por receita do mês com comissão e meta", () => {
    const [first, second] = summary.sellers;
    expect(first).toMatchObject({ id: "bia", position: 1, revenueCents: 300_000, commissionCents: 15_000, goalCents: null });
    expect(first.progress.status).toBe("sem_meta");
    expect(second).toMatchObject({ id: "ana", position: 2, revenueCents: 100_000, commissionCents: 10_000, goalCents: 200_000 });
    expect(second.progress.percent).toBe(50);
  });

  it("monta 12 meses e a lista completa de conversões", () => {
    const ana = summary.sellers[1];
    expect(ana.monthly).toHaveLength(12);
    expect(ana.monthly[0].month).toBe("2025-11");
    expect(ana.monthly.at(-1)).toEqual({ month: "2026-10", revenueCents: 100_000, wonCount: 1, goalCents: 200_000 });
    expect(ana.monthly.at(-2)).toEqual({ month: "2026-09", revenueCents: 50_000, wonCount: 1, goalCents: 40_000 });
    expect(ana.conversions.map((c) => c.id)).toEqual(["1", "3", "5"]);
    expect(ana.totalRevenueCents).toBe(220_000);
    expect(ana.totalCommissionCents).toBe(22_000);
  });

  it("janela de metas começa 11 meses antes", () => {
    expect(goalWindowStart("2026-10")).toBe("2025-11-01");
  });
});
