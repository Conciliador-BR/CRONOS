import { PIPELINE_STAGES, STAGE_LABELS, type PipelineStage } from "../constants";

export type StageLabels = Record<PipelineStage, string>;

/** Tamanho máximo do nome de uma etapa (igual ao `check` de `pipeline_stage_labels.label`). */
export const STAGE_LABEL_MAX = 40;

/**
 * Junta os nomes salvos no banco com os padrões de `STAGE_LABELS`: etapa sem linha,
 * com nome vazio ou desconhecida usa o padrão. Nunca devolve etapa faltando.
 */
export function mergeStageLabels(rows: readonly { stage: string; label: string | null }[] | null | undefined): StageLabels {
  const labels: StageLabels = { ...STAGE_LABELS };
  const known = new Set<string>(PIPELINE_STAGES);
  for (const row of rows ?? []) {
    const label = row.label?.trim();
    if (known.has(row.stage) && label) labels[row.stage as PipelineStage] = label;
  }
  return labels;
}
