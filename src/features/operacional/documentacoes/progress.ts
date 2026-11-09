/** Etapas da integração de uma empresa numa adquirente, em ordem. Sem registro = "Não iniciado". */
export const PROGRESS_STATUSES = ["enviado_documentacao", "assinado", "enviado_liberar", "automatico"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const PROGRESS_LABELS: Record<ProgressStatus | "nao_iniciado", string> = {
  nao_iniciado: "Não iniciado",
  enviado_documentacao: "Enviado para documentação",
  assinado: "Assinado",
  enviado_liberar: "Enviado para liberar",
  automatico: "Automático",
};

/** Cores das etapas (barra e selo): da mais fria à concluída. */
export const PROGRESS_COLORS: Record<ProgressStatus, string> = {
  enviado_documentacao: "#64748b",
  assinado: "#a855f7",
  enviado_liberar: "#2563eb",
  automatico: "#22c55e",
};

export type ProgressCounts = Record<ProgressStatus | "nao_iniciado", number> & { total: number; percent: number };

/** "Automático" é concluído: percent = automáticos ÷ empresas. */
export function countProgress(statuses: readonly (ProgressStatus | undefined)[]): ProgressCounts {
  const counts: ProgressCounts = {
    nao_iniciado: 0,
    enviado_documentacao: 0,
    assinado: 0,
    enviado_liberar: 0,
    automatico: 0,
    total: statuses.length,
    percent: 0,
  };
  for (const status of statuses) counts[status ?? "nao_iniciado"] += 1;
  counts.percent = counts.total === 0 ? 0 : Math.round((counts.automatico / counts.total) * 100);
  return counts;
}
