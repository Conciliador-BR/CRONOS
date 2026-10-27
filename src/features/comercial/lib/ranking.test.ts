import { describe, expect, it } from "vitest";
import { averageTicketCents, commissionCents, goalProgress, rankSellers } from "./ranking";

describe("commissionCents", () => {
  it("aplica a taxa e arredonda ao centavo", () => {
    expect(commissionCents(100_000, 10)).toBe(10_000);
    expect(commissionCents(12_345, 7.5)).toBe(926);
    expect(commissionCents(0, 10)).toBe(0);
    expect(commissionCents(1000, 0)).toBe(0);
  });
});

describe("averageTicketCents", () => {
  it("divide sem quebrar com zero negócios", () => {
    expect(averageTicketCents(30_000, 3)).toBe(10_000);
    expect(averageTicketCents(10_000, 3)).toBe(3333);
    expect(averageTicketCents(0, 0)).toBe(0);
  });
});

describe("rankSellers", () => {
  it("ordena por receita, negócios e nome, com empates dividindo a posição", () => {
    const ranked = rankSellers([
      { id: "a", name: "Ana", revenueCents: 500, wonCount: 1 },
      { id: "b", name: "Bruno", revenueCents: 900, wonCount: 2 },
      { id: "c", name: "Carla", revenueCents: 500, wonCount: 1 },
      { id: "d", name: "Davi", revenueCents: 500, wonCount: 3 },
      { id: "e", name: "Eva", revenueCents: 0, wonCount: 0 },
    ]);
    expect(ranked.map((r) => [r.id, r.position])).toEqual([
      ["b", 1],
      ["d", 2],
      ["a", 3],
      ["c", 3],
      ["e", 5],
    ]);
  });
});

describe("goalProgress", () => {
  it("sem meta", () => {
    expect(goalProgress(1000, null)).toEqual({ ratio: null, percent: null, barPercent: 0, status: "sem_meta" });
    expect(goalProgress(1000, 0).status).toBe("sem_meta");
  });
  it("abaixo e acima da meta", () => {
    expect(goalProgress(2500, 10_000)).toMatchObject({ percent: 25, barPercent: 25, status: "abaixo" });
    expect(goalProgress(15_000, 10_000)).toMatchObject({ percent: 150, barPercent: 100, status: "atingida" });
    expect(goalProgress(9_999, 10_000)).toMatchObject({ percent: 99, status: "abaixo" });
  });
});
