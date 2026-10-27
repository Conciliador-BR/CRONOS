import type { DealType } from "../constants";
import type { StageColumn } from "./stages";

export type MoveExtras = {
  dealType?: DealType | null;
  dealValueCents?: number | null;
  lostReason?: string | null;
};

/** Campos de `leads` que uma mudança de coluna grava (o enum `stage` é derivado pelo banco). */
export type MovePatch = {
  stage_id: string;
  position: number;
  deal_type?: DealType | null;
  deal_value_cents?: number | null;
  lost_reason?: string | null;
  closed_at?: null;
};

export type MovePlan = { ok: true; patch: MovePatch } | { ok: false; error: string };

type Target = Pick<StageColumn, "id" | "kind">;

/**
 * Monta a atualização de uma mudança de coluna respeitando os `check` do banco:
 * fechar exige tipo e valor; perder exige motivo; ir para coluna aberta limpa esses campos
 * para o negócio deixar de contar no faturamento e nos motivos de perda.
 * `closed_at: null` ao entrar em fechado/perdido faz o trigger gravar a data de agora.
 */
export function planStageMove(fromId: string, to: Target, position: number, extras: MoveExtras = {}): MovePlan {
  if (!Number.isFinite(position)) return { ok: false, error: "Posição inválida." };
  if (fromId === to.id) return { ok: true, patch: { stage_id: to.id, position } };

  if (to.kind === "fechado") {
    if (!extras.dealType) return { ok: false, error: "Informe se fechou em Consultoria avançada ou Somente o sistema." };
    if (!extras.dealValueCents || extras.dealValueCents <= 0) {
      return { ok: false, error: "Informe o valor do negócio." };
    }
    return {
      ok: true,
      patch: {
        stage_id: to.id,
        position,
        deal_type: extras.dealType,
        deal_value_cents: extras.dealValueCents,
        lost_reason: null,
        closed_at: null,
      },
    };
  }

  if (to.kind === "perdido") {
    const reason = extras.lostReason?.trim();
    if (!reason) return { ok: false, error: "Informe por que o cliente não fechou." };
    return {
      ok: true,
      patch: { stage_id: to.id, position, lost_reason: reason, deal_type: null, deal_value_cents: null, closed_at: null },
    };
  }

  return {
    ok: true,
    patch: { stage_id: to.id, position, deal_type: null, deal_value_cents: null, lost_reason: null },
  };
}

/** Colunas que pedem dados extras ao receber um card (pelo tipo da coluna, não pelo nome). */
export function stageNeedsPrompt(fromId: string, to: Target): "fechado" | "perdido" | null {
  if (fromId === to.id || to.kind === "aberto") return null;
  return to.kind;
}
