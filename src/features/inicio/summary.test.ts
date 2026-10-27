import { describe, expect, it } from "vitest";
import { countDistinct, firstName, greeting, mergeEvents, sortCards } from "./summary";

describe("resumo do início", () => {
  it("mergeEvents remove repetidos e ordena", () => {
    const a = { id: "1", title: "A", startsAt: "2026-10-24T10:00:00Z", allDay: false };
    const b = { id: "2", title: "B", startsAt: "2026-10-23T10:00:00Z", allDay: false };
    expect(mergeEvents([a, b], [a]).map((e) => e.id)).toEqual(["2", "1"]);
  });
  it("sortCards põe prazos primeiro", () => {
    const cards = [
      { id: "x", title: "Sem prazo", dueAt: null },
      { id: "y", title: "Depois", dueAt: "2026-11-02T00:00:00Z" },
      { id: "z", title: "Antes", dueAt: "2026-10-30T00:00:00Z" },
    ];
    expect(sortCards(cards).map((c) => c.id)).toEqual(["z", "y", "x"]);
  });
  it("countDistinct ignora caixa", () => {
    expect(countDistinct(["SP", "sp", "RJ"])).toBe(2);
  });
  it("greeting usa o horário de São Paulo", () => {
    expect(greeting(new Date("2026-10-23T12:00:00Z"))).toBe("Bom dia"); // 09h
    expect(greeting(new Date("2026-10-23T18:00:00Z"))).toBe("Boa tarde"); // 15h
    expect(greeting(new Date("2026-10-24T01:00:00Z"))).toBe("Boa noite"); // 22h
  });
  it("firstName", () => {
    expect(firstName("  Maria  da Silva ")).toBe("Maria");
    expect(firstName("")).toBe("");
  });
});
