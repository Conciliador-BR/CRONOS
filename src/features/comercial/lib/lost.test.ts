import { describe, expect, it } from "vitest";
import { countLostByOwner, lossRate, lostInMonth, type LostDeal } from "./lost";

const lost = (id: string, ownerId: string | null, lostAt: string, name = `Lead ${id}`): LostDeal => ({
  id,
  name,
  companyName: null,
  ownerId,
  ownerName: null,
  source: "indicacao",
  reason: "Sem orçamento",
  lostAt,
});

describe("lossRate", () => {
  it("divide perdidos por ganhos + perdidos", () => {
    expect(lossRate(3, 1)).toBe(0.25);
    expect(lossRate(0, 2)).toBe(1);
    expect(lossRate(5, 0)).toBe(0);
  });

  it("devolve null sem negócios decididos", () => {
    expect(lossRate(0, 0)).toBeNull();
  });
});

describe("countLostByOwner", () => {
  it("agrupa por responsável e mês de São Paulo, ignorando leads sem responsável", () => {
    const result = countLostByOwner([
      lost("1", "ana", "2026-10-01T02:00:00Z"), // 30/09 às 23h em São Paulo
      lost("2", "ana", "2026-10-15T12:00:00Z"),
      lost("3", "ana", "2026-10-16T12:00:00Z"),
      lost("4", null, "2026-10-16T12:00:00Z"),
    ]);
    expect([...result.keys()]).toEqual(["ana"]);
    expect(Object.fromEntries(result.get("ana") ?? [])).toEqual({ "2026-09": 1, "2026-10": 2 });
  });
});

describe("lostInMonth", () => {
  it("filtra o mês e ordena do mais recente, desempatando pelo nome", () => {
    const result = lostInMonth(
      [
        lost("1", "ana", "2026-10-05T12:00:00Z"),
        lost("2", "ana", "2026-10-20T12:00:00Z", "Zeta"),
        lost("3", "bia", "2026-10-20T12:00:00Z", "Alfa"),
        lost("4", "bia", "2026-09-20T12:00:00Z"),
      ],
      "2026-10",
    );
    expect(result.map((l) => l.id)).toEqual(["3", "2", "1"]);
  });

  it("devolve lista vazia sem perdas no mês", () => {
    expect(lostInMonth([lost("1", "ana", "2026-08-01T12:00:00Z")], "2026-10")).toEqual([]);
  });
});
