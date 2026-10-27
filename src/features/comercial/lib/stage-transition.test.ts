import { describe, expect, it } from "vitest";
import { planStageMove, stageNeedsPrompt } from "./stage-transition";

const followUp = { id: "s-follow", kind: "aberto" as const };
const custom = { id: "s-custom", kind: "aberto" as const };
const won = { id: "s-won", kind: "fechado" as const };
const lost = { id: "s-lost", kind: "perdido" as const };

describe("planStageMove", () => {
  it("reordenar na mesma coluna só muda a posição", () => {
    expect(planStageMove(followUp.id, followUp, 5)).toEqual({ ok: true, patch: { stage_id: followUp.id, position: 5 } });
  });

  it("fechar exige tipo e valor e limpa o motivo de perda", () => {
    expect(planStageMove(followUp.id, won, 1).ok).toBe(false);
    expect(planStageMove(followUp.id, won, 1, { dealType: "somente_sistema", dealValueCents: 0 }).ok).toBe(false);
    expect(planStageMove(lost.id, won, 1, { dealType: "somente_sistema", dealValueCents: 5000 })).toEqual({
      ok: true,
      patch: {
        stage_id: won.id,
        position: 1,
        deal_type: "somente_sistema",
        deal_value_cents: 5000,
        lost_reason: null,
        closed_at: null,
      },
    });
  });

  it("perder exige motivo e limpa o negócio", () => {
    expect(planStageMove(custom.id, lost, 0, { lostReason: "   " }).ok).toBe(false);
    expect(planStageMove(won.id, lost, 0, { lostReason: " Preço " })).toEqual({
      ok: true,
      patch: {
        stage_id: lost.id,
        position: 0,
        lost_reason: "Preço",
        deal_type: null,
        deal_value_cents: null,
        closed_at: null,
      },
    });
  });

  it("voltar para coluna aberta (inclusive uma criada depois) limpa negócio e motivo", () => {
    expect(planStageMove(won.id, custom, 3)).toEqual({
      ok: true,
      patch: { stage_id: custom.id, position: 3, deal_type: null, deal_value_cents: null, lost_reason: null },
    });
  });

  it("rejeita posição inválida", () => {
    expect(planStageMove(followUp.id, followUp, Number.NaN).ok).toBe(false);
  });
});

describe("stageNeedsPrompt", () => {
  it("pergunta só ao entrar numa coluna do tipo fechado ou perdido", () => {
    expect(stageNeedsPrompt(followUp.id, won)).toBe("fechado");
    expect(stageNeedsPrompt(won.id, lost)).toBe("perdido");
    expect(stageNeedsPrompt(won.id, won)).toBeNull();
    expect(stageNeedsPrompt(followUp.id, custom)).toBeNull();
  });
});
