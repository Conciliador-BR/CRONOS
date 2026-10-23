import { describe, expect, it } from "vitest";
import type { PipelineLead } from "../types";
import {
  EMPTY_FILTERS,
  columnId,
  finalizeDrop,
  findStage,
  groupByStage,
  hasActiveFilters,
  matchesFilters,
  moveAcross,
  patchLead,
} from "./pipeline";

function lead(id: string, stage: PipelineLead["stage"], position: number, extra: Partial<PipelineLead> = {}): PipelineLead {
  return {
    id,
    name: `Lead ${id}`,
    companyName: null,
    email: null,
    phone: null,
    source: "venda",
    referrerName: null,
    temperature: "frio",
    description: null,
    ownerId: null,
    createdBy: null,
    stage,
    position,
    dealType: null,
    dealValueCents: null,
    lostReason: null,
    closedAt: null,
    createdAt: "2026-10-01T00:00:00Z",
    ...extra,
  };
}

const base = groupByStage([
  lead("a", "lead_recebido", 2),
  lead("b", "lead_recebido", 1),
  lead("c", "follow_up", 0),
  lead("d", "follow_up", 10),
]);

describe("groupByStage / findStage", () => {
  it("agrupa e ordena por posição", () => {
    expect(base.lead_recebido.map((l) => l.id)).toEqual(["b", "a"]);
    expect(base.cliente_fechado).toEqual([]);
    expect(findStage(base, "d")).toBe("follow_up");
    expect(findStage(base, columnId("cliente_perdido"))).toBe("cliente_perdido");
    expect(findStage(base, "zzz")).toBeNull();
  });
});

describe("moveAcross + finalizeDrop", () => {
  it("move para outra coluna antes do card de destino e calcula posição entre vizinhos", () => {
    const over = moveAcross(base, "a", "d");
    expect(over.follow_up.map((l) => l.id)).toEqual(["c", "a", "d"]);
    expect(over.lead_recebido.map((l) => l.id)).toEqual(["b"]);
    // Depois do dragOver, o dnd-kit costuma reportar o próprio card como "over".
    const drop = finalizeDrop(over, "a", "a");
    expect(drop).toMatchObject({ stage: "follow_up", index: 1, position: 5 });
    // Se ainda estiver sobre "d", segue a semântica de arrayMove (vai para o índice de "d").
    expect(finalizeDrop(over, "a", "d")).toMatchObject({ index: 2, position: 10 + 1024 });
  });

  it("solta em coluna vazia", () => {
    const over = moveAcross(base, "b", columnId("cliente_fechado"));
    const drop = finalizeDrop(over, "b", columnId("cliente_fechado"));
    expect(drop).toMatchObject({ stage: "cliente_fechado", index: 0, position: 0 });
  });

  it("reordena dentro da mesma coluna", () => {
    expect(moveAcross(base, "c", "d")).toBe(base);
    const drop = finalizeDrop(base, "c", "d");
    expect(drop?.columns.follow_up.map((l) => l.id)).toEqual(["d", "c"]);
    expect(drop?.position).toBe(10 + 1024);
  });
});

describe("patchLead", () => {
  it("altera só o lead indicado", () => {
    const next = patchLead(base, "c", { dealValueCents: 500 });
    expect(next.follow_up[0].dealValueCents).toBe(500);
    expect(next.follow_up[1]).toBe(base.follow_up[1]);
  });
});

describe("matchesFilters", () => {
  const sample = lead("x", "follow_up", 0, {
    name: "José Antônio",
    companyName: "Padaria Pão Quente",
    ownerId: "u1",
    temperature: "quente",
    source: "indicacao",
    referrerName: "Carla",
  });

  it("busca sem acento em vários campos", () => {
    expect(matchesFilters(sample, { ...EMPTY_FILTERS, query: "jose" })).toBe(true);
    expect(matchesFilters(sample, { ...EMPTY_FILTERS, query: "pao quente" })).toBe(true);
    expect(matchesFilters(sample, { ...EMPTY_FILTERS, query: "carla" })).toBe(true);
    expect(matchesFilters(sample, { ...EMPTY_FILTERS, query: "maria" })).toBe(false);
  });

  it("filtra por responsável, temperatura e origem", () => {
    expect(matchesFilters(sample, { ...EMPTY_FILTERS, ownerId: "u1" })).toBe(true);
    expect(matchesFilters(sample, { ...EMPTY_FILTERS, ownerId: "u2" })).toBe(false);
    expect(matchesFilters(sample, { ...EMPTY_FILTERS, ownerId: "none" })).toBe(false);
    expect(matchesFilters({ ...sample, ownerId: null }, { ...EMPTY_FILTERS, ownerId: "none" })).toBe(true);
    expect(matchesFilters(sample, { ...EMPTY_FILTERS, temperature: "frio" })).toBe(false);
    expect(matchesFilters(sample, { ...EMPTY_FILTERS, source: "indicacao" })).toBe(true);
  });

  it("detecta filtros ativos", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: "  " })).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, source: "venda" })).toBe(true);
  });
});
