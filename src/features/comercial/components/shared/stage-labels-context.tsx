"use client";

import { createContext, use, type ReactNode } from "react";
import { STAGE_LABELS } from "../../constants";
import type { StageLabels } from "../../lib/stage-labels";

const StageLabelsContext = createContext<StageLabels>(STAGE_LABELS);

/** Nomes das etapas (editáveis por gestores) para o CRM. Sem provedor, valem os nomes padrão. */
export function StageLabelsProvider({ labels, children }: { labels: StageLabels; children: ReactNode }) {
  return <StageLabelsContext value={labels}>{children}</StageLabelsContext>;
}

export function useStageLabels() {
  return use(StageLabelsContext);
}
