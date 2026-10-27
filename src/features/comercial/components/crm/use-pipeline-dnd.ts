"use client";

import { useCallback, useLayoutEffect, useRef, useState, useTransition } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import type { DealType, PipelineStage } from "../../constants";
import { finalizeDrop, groupByStage, moveAcross, patchLead, type Columns } from "../../lib/pipeline";
import { stageNeedsPrompt } from "../../lib/stage-transition";
import { moveLead } from "../../actions";
import type { PipelineLead } from "../../types";

/** Soltura que aguarda dados extras (fechado: tipo e valor; perdido: motivo). */
export type PendingPrompt = {
  kind: "fechado" | "perdido";
  lead: PipelineLead;
  toStage: PipelineStage;
  position: number;
};

export type PromptAnswer =
  | { kind: "fechado"; dealType: DealType; dealValue: string; dealValueCents: number }
  | { kind: "perdido"; lostReason: string };

/**
 * Estado do quadro com UI otimista: o card muda de lugar na hora e volta ao lugar de origem se o
 * servidor recusar. Quando o servidor revalida, as colunas são recriadas a partir dos novos dados.
 */
export function usePipelineDnd(leads: PipelineLead[]) {
  const [sourceLeads, setSourceLeads] = useState(leads);
  const [columns, setColumns] = useState(() => groupByStage(leads));
  if (leads !== sourceLeads) {
    setSourceLeads(leads);
    setColumns(groupByStage(leads));
  }

  // Handlers do dnd-kit leem sempre a versão mais recente das colunas.
  const columnsRef = useRef(columns);
  useLayoutEffect(() => {
    columnsRef.current = columns;
  }, [columns]);
  const snapshot = useRef<Columns | null>(null);
  const originStage = useRef<PipelineStage | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<PendingPrompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  /** Atualiza estado e ref juntos, para o próximo evento do arraste já ver o novo valor. */
  const apply = useCallback((next: Columns) => {
    columnsRef.current = next;
    setColumns(next);
  }, []);

  const restore = useCallback(() => {
    if (snapshot.current) apply(snapshot.current);
    snapshot.current = null;
    originStage.current = null;
  }, [apply]);

  const commit = useCallback(
    (lead: PipelineLead, toStage: PipelineStage, position: number, answer?: PromptAnswer) => {
      const rollback = snapshot.current;
      snapshot.current = null;
      originStage.current = null;
      const patch: Partial<PipelineLead> = { stage: toStage, position };
      if (answer?.kind === "fechado") {
        Object.assign(patch, { dealType: answer.dealType, dealValueCents: answer.dealValueCents, lostReason: null });
      } else if (answer?.kind === "perdido") {
        Object.assign(patch, { lostReason: answer.lostReason, dealType: null, dealValueCents: null });
      } else if (toStage !== lead.stage) {
        Object.assign(patch, { dealType: null, dealValueCents: null, lostReason: null });
      }
      apply(patchLead(columnsRef.current, lead.id, patch));
      setError(null);
      startTransition(async () => {
        const result = await moveLead({
          leadId: lead.id,
          toStage,
          position,
          dealType: answer?.kind === "fechado" ? answer.dealType : undefined,
          dealValue: answer?.kind === "fechado" ? answer.dealValue : undefined,
          lostReason: answer?.kind === "perdido" ? answer.lostReason : undefined,
        });
        if (!result.ok) {
          if (rollback) apply(rollback);
          setError(result.error);
        }
      });
    },
    [apply],
  );

  const onDragStart = useCallback(({ active }: DragStartEvent) => {
    const current = columnsRef.current;
    snapshot.current = current;
    const id = String(active.id);
    originStage.current =
      (Object.keys(current) as PipelineStage[]).find((stage) => current[stage].some((lead) => lead.id === id)) ?? null;
    setActiveId(id);
    setError(null);
  }, []);

  const onDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over) return;
    const next = moveAcross(columnsRef.current, String(active.id), String(over.id));
    if (next !== columnsRef.current) apply(next);
  }, [apply]);

  const onDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      setActiveId(null);
      const origin = originStage.current;
      if (!over || !origin) {
        restore();
        return;
      }
      const drop = finalizeDrop(columnsRef.current, String(active.id), String(over.id));
      if (!drop) {
        restore();
        return;
      }
      const original = snapshot.current?.[origin].find((lead) => lead.id === drop.lead.id);
      const originalIndex = snapshot.current?.[origin].findIndex((lead) => lead.id === drop.lead.id) ?? -1;
      if (!original || (drop.stage === origin && drop.index === originalIndex)) {
        restore();
        return;
      }
      apply(drop.columns);
      const kind = stageNeedsPrompt(origin, drop.stage);
      if (kind) {
        setPrompt({ kind, lead: original, toStage: drop.stage, position: drop.position });
        return;
      }
      commit(original, drop.stage, drop.position);
    },
    [apply, commit, restore],
  );

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    restore();
  }, [restore]);

  const confirmPrompt = useCallback(
    (answer: PromptAnswer) => {
      if (!prompt) return;
      setPrompt(null);
      commit(prompt.lead, prompt.toStage, prompt.position, answer);
    },
    [commit, prompt],
  );

  /** Cancelar o modal devolve o card para a coluna de origem. */
  const cancelPrompt = useCallback(() => {
    setPrompt(null);
    restore();
  }, [restore]);

  const getColumns = useCallback(() => columnsRef.current, []);

  return {
    columns,
    getColumns,
    activeId,
    prompt,
    error,
    dismissError: () => setError(null),
    isSaving,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel },
    confirmPrompt,
    cancelPrompt,
  };
}
