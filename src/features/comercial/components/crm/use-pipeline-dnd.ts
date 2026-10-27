"use client";

import { useCallback, useLayoutEffect, useRef, useState, useTransition } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import type { DealType } from "../../constants";
import { finalizeDrop, findColumn, groupByColumn, moveAcross, patchLead, type Columns } from "../../lib/pipeline";
import { stageNeedsPrompt } from "../../lib/stage-transition";
import { isPendingStage, legacyStageOf, type StageColumn } from "../../lib/stages";
import { moveLead } from "../../actions";
import type { PipelineLead } from "../../types";

/** Soltura que aguarda dados extras (fechado: tipo e valor; perdido: motivo). */
export type PendingPrompt = {
  kind: "fechado" | "perdido";
  lead: PipelineLead;
  toStage: StageColumn;
  position: number;
};

export type PromptAnswer =
  | { kind: "fechado"; dealType: DealType; dealValue: string; dealValueCents: number }
  | { kind: "perdido"; lostReason: string };

/**
 * Estado do quadro com UI otimista: o card muda de lugar na hora e volta ao lugar de origem se o
 * servidor recusar. Quando o servidor revalida, as colunas são recriadas a partir dos novos dados.
 */
export function usePipelineDnd(leads: PipelineLead[], stages: StageColumn[]) {
  const [sourceLeads, setSourceLeads] = useState(leads);
  const [columns, setColumns] = useState(() => groupByColumn(leads, stages.map((stage) => stage.id)));
  if (leads !== sourceLeads) {
    setSourceLeads(leads);
    setColumns(groupByColumn(leads, stages.map((stage) => stage.id)));
  }

  // Handlers do dnd-kit leem sempre a versão mais recente das colunas e das etapas.
  const columnsRef = useRef(columns);
  const stagesRef = useRef(stages);
  useLayoutEffect(() => {
    columnsRef.current = columns;
    stagesRef.current = stages;
  }, [columns, stages]);
  const snapshot = useRef<Columns | null>(null);
  const originStage = useRef<string | null>(null);

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
    (lead: PipelineLead, toStage: StageColumn, position: number, answer?: PromptAnswer) => {
      const rollback = snapshot.current;
      snapshot.current = null;
      originStage.current = null;
      const patch: Partial<PipelineLead> = { stageId: toStage.id, stage: legacyStageOf(toStage), position };
      if (answer?.kind === "fechado") {
        Object.assign(patch, { dealType: answer.dealType, dealValueCents: answer.dealValueCents, lostReason: null });
      } else if (answer?.kind === "perdido") {
        Object.assign(patch, { lostReason: answer.lostReason, dealType: null, dealValueCents: null });
      } else if (toStage.id !== lead.stageId) {
        Object.assign(patch, { dealType: null, dealValueCents: null, lostReason: null });
      }
      apply(patchLead(columnsRef.current, lead.id, patch));
      setError(null);
      startTransition(async () => {
        const result = await moveLead({
          leadId: lead.id,
          toStageId: toStage.id,
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
    originStage.current = findColumn(current, id);
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
      const original = snapshot.current?.[origin]?.find((lead) => lead.id === drop.lead.id);
      const originalIndex = snapshot.current?.[origin]?.findIndex((lead) => lead.id === drop.lead.id) ?? -1;
      if (!original || (drop.stageId === origin && drop.index === originalIndex)) {
        restore();
        return;
      }
      const target = stagesRef.current.find((stage) => stage.id === drop.stageId);
      if (!target || isPendingStage(target.id)) {
        restore();
        setError("Esta etapa ainda está sendo salva. Tente de novo em instantes.");
        return;
      }
      apply(drop.columns);
      const kind = stageNeedsPrompt(origin, target);
      if (kind) {
        setPrompt({ kind, lead: original, toStage: target, position: drop.position });
        return;
      }
      commit(original, target, drop.position);
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
