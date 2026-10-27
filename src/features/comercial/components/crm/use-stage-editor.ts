"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import { createStage, moveStage, renameStage } from "../../stage-actions";
import {
  PENDING_STAGE_PREFIX,
  positionForNewStage,
  positionForStageMove,
  sortStages,
  type StageColumn,
} from "../../lib/stages";
import type { ActionResult } from "../../types";

type Change =
  | { type: "add"; stage: StageColumn }
  | { type: "rename"; id: string; label: string }
  | { type: "move"; id: string; position: number };

function reduce(current: StageColumn[], change: Change): StageColumn[] {
  if (change.type === "add") return sortStages([...current, change.stage]);
  if (change.type === "rename") {
    return current.map((stage) => (stage.id === change.id ? { ...stage, label: change.label } : stage));
  }
  return sortStages(current.map((stage) => (stage.id === change.id ? { ...stage, position: change.position } : stage)));
}

/**
 * Colunas do pipeline com UI otimista para criar, renomear e mover (só gestores usam).
 * A mudança aparece na hora; quando a ação termina, vale o que o servidor devolveu
 * (se ele recusar, a coluna volta ao estado anterior e o erro aparece).
 */
export function useStageEditor(stages: StageColumn[]) {
  const [optimistic, applyChange] = useOptimistic(stages, reduce);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  /** Chamada dentro da transição do campo de nome (que mostra o erro ao lado dele). */
  const create = useCallback(
    async (label: string, afterId?: string): Promise<ActionResult> => {
      applyChange({
        type: "add",
        stage: {
          id: `${PENDING_STAGE_PREFIX}${Date.now()}`,
          label,
          kind: "aberto",
          position: positionForNewStage(optimistic, afterId),
          legacyStage: null,
        },
      });
      const result = await createStage({ label, afterId });
      return result.ok ? { ok: true } : result;
    },
    [applyChange, optimistic],
  );

  const rename = useCallback(
    (id: string, label: string) => {
      applyChange({ type: "rename", id, label });
      return renameStage({ id, label });
    },
    [applyChange],
  );

  const move = useCallback(
    (id: string, direction: -1 | 1) => {
      const position = positionForStageMove(optimistic, id, direction);
      if (position === null) return;
      setError(null);
      startTransition(async () => {
        applyChange({ type: "move", id, position });
        const result = await moveStage({ id, position });
        if (!result.ok) setError(result.error);
      });
    },
    [applyChange, optimistic],
  );

  return { stages: optimistic, create, rename, move, error, dismissError: () => setError(null), isSaving };
}
