"use client";

import { memo, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { formatCents } from "@/lib/format/money";
import { cn } from "@/lib/utils";
import { columnId } from "../../lib/pipeline";
import { isPendingStage, type StageColumn } from "../../lib/stages";
import type { MemberOption, PipelineLead } from "../../types";
import { SortableLeadCard } from "./sortable-lead-card";
import { StageMenu } from "./stage-menu";
import { StageTitle, type RenameStage, type StageTitleHandle } from "./stage-title";

const accent: Record<StageColumn["kind"], string> = {
  aberto: "bg-primary",
  fechado: "bg-success",
  perdido: "bg-danger",
};

/** Ações de gestor sobre a coluna; ausentes para funcionários. */
export type StageControls = {
  onRename: RenameStage;
  onMove: (stageId: string, direction: -1 | 1) => void;
  onDelete: (stage: StageColumn) => void;
};

type Props = {
  stage: StageColumn;
  /** Primeira/última coluna: esconde "Mover para a esquerda/direita". */
  isFirst: boolean;
  isLast: boolean;
  controls?: StageControls;
  leads: PipelineLead[];
  /** Total da coluna sem filtros (mostrado quando há filtro ativo). */
  totalCount: number;
  membersById: Map<string, MemberOption>;
  canEdit: (lead: PipelineLead) => boolean;
  onOpen: (leadId: string) => void;
};

export const PipelineColumn = memo(function PipelineColumn({
  stage,
  isFirst,
  isLast,
  controls,
  leads,
  totalCount,
  membersById,
  canEdit,
  onOpen,
}: Props) {
  const pending = isPendingStage(stage.id);
  const { setNodeRef, isOver } = useDroppable({ id: columnId(stage.id), disabled: pending });
  const titleRef = useRef<StageTitleHandle>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headingId = `coluna-${stage.id}`;
  const sum = stage.kind === "fechado" ? leads.reduce((total, lead) => total + (lead.dealValueCents ?? 0), 0) : null;

  return (
    <section
      aria-labelledby={headingId}
      aria-busy={pending || undefined}
      className="flex w-[17rem] shrink-0 snap-start flex-col rounded-xl border border-border bg-surface-2/60 aria-busy:opacity-70 sm:w-72"
    >
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border px-3 py-2.5">
        <span aria-hidden className={cn("size-2 rounded-full", accent[stage.kind])} />
        <StageTitle
          ref={titleRef}
          stageId={stage.id}
          label={stage.label}
          headingId={headingId}
          onRename={controls && !pending ? controls.onRename : undefined}
          onReturnFocus={() => menuButtonRef.current?.focus()}
        />
        <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-muted tabular-nums">
          {leads.length === totalCount ? leads.length : `${leads.length}/${totalCount}`}
          <span className="sr-only"> leads</span>
        </span>
        {controls && !pending ? (
          <StageMenu
            label={stage.label}
            buttonRef={menuButtonRef}
            onRename={() => titleRef.current?.startEditing()}
            onMoveLeft={isFirst ? undefined : () => controls.onMove(stage.id, -1)}
            onMoveRight={isLast ? undefined : () => controls.onMove(stage.id, 1)}
            onDelete={stage.kind === "aberto" ? () => controls.onDelete(stage) : undefined}
          />
        ) : null}
      </header>
      {sum !== null && sum > 0 ? (
        <p className="border-b border-border px-3 py-1.5 text-xs text-muted">
          Total <span className="font-medium text-success tabular-nums">{formatCents(sum)}</span>
        </p>
      ) : null}
      <SortableContext id={columnId(stage.id)} items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn(
            "flex min-h-32 flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors",
            isOver && "bg-primary/5 ring-1 ring-primary/40 ring-inset",
          )}
        >
          {leads.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              owner={lead.ownerId ? membersById.get(lead.ownerId) : undefined}
              canEdit={canEdit(lead)}
              onOpen={onOpen}
            />
          ))}
          {leads.length === 0 ? (
            <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
              {pending ? "Salvando etapa…" : totalCount > 0 ? "Nenhum lead com estes filtros" : "Arraste um lead para cá"}
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </section>
  );
});
