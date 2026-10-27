import { describe, expect, it } from "vitest";
import { POSITION_STEP } from "./positions";
import {
  deletionTargets,
  firstOpenStage,
  kindOfLegacyStage,
  legacyStageOf,
  planStageDeletion,
  positionForNewStage,
  positionForStageMove,
  stageLabelOf,
  terminalLabels,
  toStageKind,
  type StageColumn,
} from "./stages";

const col = (id: string, position: number, kind: StageColumn["kind"] = "aberto", extra: Partial<StageColumn> = {}): StageColumn => ({
  id,
  label: id.toUpperCase(),
  kind,
  position,
  legacyStage: null,
  ...extra,
});

const stages = [col("b", 2), col("a", 1), col("won", 5, "fechado"), col("lost", 6, "perdido"), col("c", 3)];

describe("tipo da coluna", () => {
  it("lê o tipo com reserva para aberto", () => {
    expect(toStageKind("fechado")).toBe("fechado");
    expect(toStageKind("qualquer")).toBe("aberto");
  });

  it("deriva o enum legado como o trigger do banco", () => {
    expect(legacyStageOf({ kind: "fechado", legacyStage: null })).toBe("cliente_fechado");
    expect(legacyStageOf({ kind: "perdido", legacyStage: "cliente_perdido" })).toBe("cliente_perdido");
    expect(legacyStageOf({ kind: "aberto", legacyStage: "follow_up" })).toBe("follow_up");
    expect(legacyStageOf({ kind: "aberto", legacyStage: null })).toBe("lead_recebido");
    expect(kindOfLegacyStage("cliente_perdido")).toBe("perdido");
    expect(kindOfLegacyStage("reuniao_marcada")).toBe("aberto");
  });
});

describe("nomes", () => {
  const byId = new Map(stages.map((s) => [s.id, s]));

  it("usa o nome da coluna e, sem ela, o do tipo ou o padrão", () => {
    expect(stageLabelOf(byId, "b", "lead_recebido")).toBe("B");
    expect(stageLabelOf(byId, null, "cliente_fechado")).toBe("WON");
    expect(stageLabelOf(byId, "sumiu", "follow_up")).toBe("Follow up");
    expect(stageLabelOf(byId, null, "lead_recebido")).toBe("Etapa excluída");
    expect(terminalLabels(stages)).toEqual({ fechado: "WON", perdido: "LOST" });
    expect(terminalLabels([])).toEqual({ fechado: "Cliente fechado", perdido: "Cliente perdido" });
  });

  it("acha a primeira coluna aberta pela posição", () => {
    expect(firstOpenStage(stages)?.id).toBe("a");
    expect(firstOpenStage([col("won", 0, "fechado")])).toBeUndefined();
  });
});

describe("posições", () => {
  it("coluna nova entra antes da primeira terminal, ou depois de afterId", () => {
    expect(positionForNewStage(stages)).toBe(4);
    expect(positionForNewStage(stages, "a")).toBe(1.5);
    expect(positionForNewStage(stages, "lost")).toBe(6 + POSITION_STEP);
    expect(positionForNewStage([col("won", 0, "fechado")])).toBe(-POSITION_STEP);
    expect(positionForNewStage([col("a", 1)])).toBe(1 + POSITION_STEP);
    expect(positionForNewStage([])).toBe(0);
  });

  it("troca de lugar com a vizinha e para nas pontas", () => {
    expect(positionForStageMove(stages, "c", -1)).toBe(1.5); // entre a (1) e b (2)
    expect(positionForStageMove(stages, "a", -1)).toBeNull();
    expect(positionForStageMove(stages, "a", 1)).toBe(2.5); // entre b (2) e c (3)
    expect(positionForStageMove(stages, "won", 1)).toBe(6 + POSITION_STEP);
    expect(positionForStageMove(stages, "lost", 1)).toBeNull();
    expect(positionForStageMove(stages, "b", -1)).toBe(1 - POSITION_STEP);
    expect(positionForStageMove(stages, "x", 1)).toBeNull();
  });
});

describe("exclusão", () => {
  it("lista só colunas abertas como destino", () => {
    expect(deletionTargets(stages, "a").map((s) => s.id)).toEqual(["b", "c"]);
  });

  it("valida tipo, última aberta e destino dos leads", () => {
    expect(planStageDeletion(stages, "won", null, 0)).toMatchObject({ ok: false });
    expect(planStageDeletion(stages, "zzz", null, 0)).toMatchObject({ ok: false });
    expect(planStageDeletion([col("a", 1), col("won", 2, "fechado")], "a", null, 0)).toMatchObject({ ok: false });
    expect(planStageDeletion(stages, "a", null, 0)).toEqual({ ok: true, moveLeadsTo: null });
    expect(planStageDeletion(stages, "a", null, 3)).toMatchObject({ ok: false, field: "moveLeadsTo" });
    expect(planStageDeletion(stages, "a", "a", 3)).toMatchObject({ ok: false, field: "moveLeadsTo" });
    expect(planStageDeletion(stages, "a", "won", 3)).toMatchObject({ ok: false, field: "moveLeadsTo" });
    expect(planStageDeletion(stages, "a", "c", 3)).toEqual({ ok: true, moveLeadsTo: "c" });
  });
});
