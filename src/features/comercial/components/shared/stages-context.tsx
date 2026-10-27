"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import type { PipelineStage } from "../../constants";
import { firstOpenStage, stageLabelOf, terminalLabels, type StageColumn, type TerminalLabels } from "../../lib/stages";

export type StagesValue = {
  /** Colunas em ordem de posição. */
  stages: StageColumn[];
  byId: ReadonlyMap<string, StageColumn>;
  /** Nome da coluna pelo id, com reserva pelo enum legado (coluna excluída ou desconhecida). */
  labelOf: (id: string | null | undefined, legacy?: PipelineStage | null) => string;
  /** Nomes atuais das colunas de fechado e perdido. */
  terminal: TerminalLabels;
  /** Onde entram os leads novos. */
  firstOpen: StageColumn | undefined;
};

export function buildStagesValue(stages: StageColumn[]): StagesValue {
  const byId = new Map(stages.map((stage) => [stage.id, stage]));
  return {
    stages,
    byId,
    labelOf: (id, legacy) => stageLabelOf(byId, id, legacy),
    terminal: terminalLabels(stages),
    firstOpen: firstOpenStage(stages),
  };
}

const StagesContext = createContext<StagesValue>(buildStagesValue([]));

/** Colunas do pipeline (nomes editáveis por gestores) para o CRM. Sem provedor, valem os nomes padrão. */
export function StagesProvider({ stages, children }: { stages: StageColumn[]; children: ReactNode }) {
  const value = useMemo(() => buildStagesValue(stages), [stages]);
  return <StagesContext value={value}>{children}</StagesContext>;
}

export function useStages() {
  return use(StagesContext);
}
