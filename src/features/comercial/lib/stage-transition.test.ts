import { describe, expect, it } from "vitest";
import { planStageMove, stageNeedsPrompt } from "./stage-transition";

describe("planStageMove", () => {
  it("reordenar na mesma coluna só muda a posição", () => {
    expect(planStageMove("follow_up", "follow_up", 5)).toEqual({ ok: true, patch: { stage: "follow_up", position: 5 } });
  });

  it("fechar exige tipo e valor e limpa o motivo de perda", () => {
    expect(planStageMove("follow_up", "cliente_fechado", 1).ok).toBe(false);
    expect(planStageMove("follow_up", "cliente_fechado", 1, { dealType: "somente_sistema", dealValueCents: 0 }).ok).toBe(false);
    expect(
      planStageMove("cliente_perdido", "cliente_fechado", 1, { dealType: "somente_sistema", dealValueCents: 5000 }),
    ).toEqual({
      ok: true,
      patch: {
        stage: "cliente_fechado",
        position: 1,
        deal_type: "somente_sistema",
        deal_value_cents: 5000,
        lost_reason: null,
        closed_at: null,
      },
    });
  });

  it("perder exige motivo e limpa o negócio", () => {
    expect(planStageMove("lead_recebido", "cliente_perdido", 0, { lostReason: "   " }).ok).toBe(false);
    expect(planStageMove("cliente_fechado", "cliente_perdido", 0, { lostReason: " Preço " })).toEqual({
      ok: true,
      patch: {
        stage: "cliente_perdido",
        position: 0,
        lost_reason: "Preço",
        deal_type: null,
        deal_value_cents: null,
        closed_at: null,
      },
    });
  });

  it("voltar para etapa aberta limpa negócio e motivo", () => {
    expect(planStageMove("cliente_fechado", "follow_up", 3)).toEqual({
      ok: true,
      patch: { stage: "follow_up", position: 3, deal_type: null, deal_value_cents: null, lost_reason: null },
    });
  });

  it("rejeita posição inválida", () => {
    expect(planStageMove("follow_up", "follow_up", Number.NaN).ok).toBe(false);
  });
});

describe("stageNeedsPrompt", () => {
  it("pergunta só ao entrar em fechado ou perdido", () => {
    expect(stageNeedsPrompt("follow_up", "cliente_fechado")).toBe("fechado");
    expect(stageNeedsPrompt("cliente_fechado", "cliente_perdido")).toBe("perdido");
    expect(stageNeedsPrompt("cliente_fechado", "cliente_fechado")).toBeNull();
    expect(stageNeedsPrompt("lead_recebido", "follow_up")).toBeNull();
  });
});
