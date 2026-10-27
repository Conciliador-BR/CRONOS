import { STAGE_LABELS, type PipelineStage } from "../constants";
import { positionBetween } from "./positions";

/** Tipo da coluna: abertas são livres; há uma só de "fechado" e uma só de "perdido". */
export const STAGE_KINDS = ["aberto", "fechado", "perdido"] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

/** Tamanho máximo do nome de uma etapa (igual ao `check` de `pipeline_stages.label`). */
export const STAGE_LABEL_MAX = 40;

/** Prefixo do id provisório de uma coluna que ainda está sendo criada no servidor. */
export const PENDING_STAGE_PREFIX = "nova-";
export const isPendingStage = (id: string) => id.startsWith(PENDING_STAGE_PREFIX);

/** Coluna do pipeline (linha de `pipeline_stages`). */
export type StageColumn = {
  id: string;
  label: string;
  kind: StageKind;
  position: number;
  /** Etapa original do enum (as seis iniciais); colunas criadas depois ficam null. */
  legacyStage: PipelineStage | null;
};

export function toStageKind(value: string): StageKind {
  return (STAGE_KINDS as readonly string[]).includes(value) ? (value as StageKind) : "aberto";
}

export function isTerminalKind(kind: StageKind): kind is "fechado" | "perdido" {
  return kind !== "aberto";
}

export function sortStages<T extends Pick<StageColumn, "id" | "position">>(stages: readonly T[]): T[] {
  return [...stages].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

/** Enum legado que o banco deriva da coluna (mesma regra do trigger `leads_sync_stage`). */
export function legacyStageOf(column: Pick<StageColumn, "kind" | "legacyStage">): PipelineStage {
  if (column.kind === "fechado") return "cliente_fechado";
  if (column.kind === "perdido") return "cliente_perdido";
  return column.legacyStage ?? "lead_recebido";
}

/** Tipo correspondente a um valor do enum legado. */
export function kindOfLegacyStage(stage: PipelineStage): StageKind {
  if (stage === "cliente_fechado") return "fechado";
  if (stage === "cliente_perdido") return "perdido";
  return "aberto";
}

export type TerminalLabels = { fechado: string; perdido: string };

/** Nomes atuais das colunas de fechado e perdido (com os padrões como reserva). */
export function terminalLabels(stages: readonly StageColumn[]): TerminalLabels {
  return {
    fechado: stages.find((s) => s.kind === "fechado")?.label ?? STAGE_LABELS.cliente_fechado,
    perdido: stages.find((s) => s.kind === "perdido")?.label ?? STAGE_LABELS.cliente_perdido,
  };
}

/**
 * Nome da coluna pelo id. Sem coluna (excluída ou desconhecida): fechado/perdido usam o nome atual
 * dessas colunas; as abertas usam o nome padrão do enum, ou "Etapa excluída" quando o id é nulo.
 */
export function stageLabelOf(
  byId: ReadonlyMap<string, StageColumn>,
  id: string | null | undefined,
  legacy: PipelineStage | null | undefined,
): string {
  const column = id ? byId.get(id) : undefined;
  if (column) return column.label;
  if (!legacy) return "Etapa excluída";
  const kind = kindOfLegacyStage(legacy);
  if (isTerminalKind(kind)) {
    for (const stage of byId.values()) if (stage.kind === kind) return stage.label;
    return STAGE_LABELS[legacy];
  }
  return id ? STAGE_LABELS[legacy] : "Etapa excluída";
}

/** Coluna onde entram os leads novos: a primeira aberta. */
export function firstOpenStage<T extends Pick<StageColumn, "id" | "kind" | "position">>(stages: readonly T[]): T | undefined {
  return sortStages(stages).find((s) => s.kind === "aberto");
}

/**
 * Posição de uma coluna nova: logo depois de `afterId` ou, sem ele, antes da primeira coluna
 * terminal (normalmente "Cliente fechado"). Sem terminais, vai para o fim.
 */
export function positionForNewStage(stages: readonly Pick<StageColumn, "id" | "kind" | "position">[], afterId?: string): number {
  const sorted = sortStages(stages);
  const after = afterId ? sorted.findIndex((s) => s.id === afterId) : -1;
  if (after !== -1) return positionBetween(sorted[after].position, sorted[after + 1]?.position);
  const firstTerminal = sorted.findIndex((s) => s.kind !== "aberto");
  if (firstTerminal === -1) return positionBetween(sorted.at(-1)?.position, undefined);
  return positionBetween(sorted[firstTerminal - 1]?.position, sorted[firstTerminal].position);
}

/** Nova posição para trocar a coluna de lugar com a vizinha (-1 esquerda, 1 direita); null se já está na ponta. */
export function positionForStageMove(
  stages: readonly Pick<StageColumn, "id" | "position">[],
  id: string,
  direction: -1 | 1,
): number | null {
  const sorted = sortStages(stages);
  const index = sorted.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const neighbor = index + direction;
  if (neighbor < 0 || neighbor >= sorted.length) return null;
  return direction === -1
    ? positionBetween(sorted[neighbor - 1]?.position, sorted[neighbor].position)
    : positionBetween(sorted[neighbor].position, sorted[neighbor + 1]?.position);
}

/** Colunas que podem receber os leads de uma coluna excluída: as abertas, exceto ela mesma. */
export function deletionTargets<T extends Pick<StageColumn, "id" | "kind">>(stages: readonly T[], id: string): T[] {
  return stages.filter((s) => s.kind === "aberto" && s.id !== id);
}

export type StageDeletionPlan =
  | { ok: true; moveLeadsTo: string | null }
  | { ok: false; error: string; field?: "moveLeadsTo" };

/**
 * Valida a exclusão de uma coluna: só abertas saem, sempre sobra uma aberta e, se a coluna
 * tiver leads, eles precisam de uma coluna aberta de destino.
 */
export function planStageDeletion(
  stages: readonly Pick<StageColumn, "id" | "kind">[],
  id: string,
  moveLeadsTo: string | null | undefined,
  leadCount: number,
): StageDeletionPlan {
  const stage = stages.find((s) => s.id === id);
  if (!stage) return { ok: false, error: "Etapa não encontrada. Atualize a página." };
  if (stage.kind !== "aberto") return { ok: false, error: "As etapas de fechado e perdido não podem ser excluídas." };
  const targets = deletionTargets(stages, id);
  if (targets.length === 0) return { ok: false, error: "O pipeline precisa de pelo menos uma etapa aberta." };
  if (leadCount === 0) return { ok: true, moveLeadsTo: null };
  if (!moveLeadsTo) return { ok: false, field: "moveLeadsTo", error: "Escolha para qual etapa os leads vão." };
  if (!targets.some((s) => s.id === moveLeadsTo)) {
    return { ok: false, field: "moveLeadsTo", error: "Escolha outra etapa aberta para os leads." };
  }
  return { ok: true, moveLeadsTo };
}
