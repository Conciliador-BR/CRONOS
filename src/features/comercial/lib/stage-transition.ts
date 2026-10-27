import type { DealType, PipelineStage } from "../constants";

export type MoveExtras = {
  dealType?: DealType | null;
  dealValueCents?: number | null;
  lostReason?: string | null;
};

/** Campos de `leads` que uma mudança de etapa grava. */
export type MovePatch = {
  stage: PipelineStage;
  position: number;
  deal_type?: DealType | null;
  deal_value_cents?: number | null;
  lost_reason?: string | null;
  closed_at?: null;
};

export type MovePlan = { ok: true; patch: MovePatch } | { ok: false; error: string };

/**
 * Monta a atualização de uma mudança de etapa respeitando os `check` do banco:
 * fechar exige tipo e valor; perder exige motivo; sair de fechado/perdido limpa esses campos
 * para o negócio deixar de contar no faturamento e nos motivos de perda.
 * `closed_at: null` ao entrar em fechado/perdido faz o trigger gravar a data de agora.
 */
export function planStageMove(from: PipelineStage, to: PipelineStage, position: number, extras: MoveExtras = {}): MovePlan {
  if (!Number.isFinite(position)) return { ok: false, error: "Posição inválida." };
  if (from === to) return { ok: true, patch: { stage: to, position } };

  if (to === "cliente_fechado") {
    if (!extras.dealType) return { ok: false, error: "Informe se fechou em Consultoria avançada ou Somente o sistema." };
    if (!extras.dealValueCents || extras.dealValueCents <= 0) {
      return { ok: false, error: "Informe o valor do negócio." };
    }
    return {
      ok: true,
      patch: {
        stage: to,
        position,
        deal_type: extras.dealType,
        deal_value_cents: extras.dealValueCents,
        lost_reason: null,
        closed_at: null,
      },
    };
  }

  if (to === "cliente_perdido") {
    const reason = extras.lostReason?.trim();
    if (!reason) return { ok: false, error: "Informe por que o cliente não fechou." };
    return {
      ok: true,
      patch: { stage: to, position, lost_reason: reason, deal_type: null, deal_value_cents: null, closed_at: null },
    };
  }

  return {
    ok: true,
    patch: { stage: to, position, deal_type: null, deal_value_cents: null, lost_reason: null },
  };
}

/** Etapas que pedem dados extras ao receber um card. */
export function stageNeedsPrompt(from: PipelineStage, to: PipelineStage): "fechado" | "perdido" | null {
  if (from === to) return null;
  if (to === "cliente_fechado") return "fechado";
  if (to === "cliente_perdido") return "perdido";
  return null;
}
