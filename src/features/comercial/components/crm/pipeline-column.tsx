"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { formatCents } from "@/lib/format/money";
import { cn } from "@/lib/utils";
import { STAGE_LABELS, type PipelineStage } from "../../constants";
import { columnId } from "../../lib/pipeline";
import type { MemberOption, PipelineLead } from "../../types";
import { SortableLeadCard } from "./sortable-lead-card";

const accent: Partial<Record<PipelineStage, string>> = {
  cliente_fechado: "bg-success",
  cliente_perdido: "bg-danger",
};

type Props = {
  stage: PipelineStage;
  leads: PipelineLead[];
  /** Total da coluna sem filtros (mostrado quando há filtro ativo). */
  totalCount: number;
  membersById: Map<string, MemberOption>;
  canEdit: (lead: PipelineLead) => boolean;
  onOpen: (leadId: string) => void;
};

export const PipelineColumn = memo(function PipelineColumn({ stage, leads, totalCount, membersById, canEdit, onOpen }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId(stage) });
  const headingId = `coluna-${stage}`;
  const sum =
    stage === "cliente_fechado" ? leads.reduce((total, lead) => total + (lead.dealValueCents ?? 0), 0) : null;

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-[17rem] shrink-0 snap-start flex-col rounded-xl border border-border bg-surface-2/60 sm:w-72"
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span aria-hidden className={cn("size-2 rounded-full", accent[stage] ?? "bg-primary")} />
        <h2 id={headingId} className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
          {STAGE_LABELS[stage]}
        </h2>
        <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-muted tabular-nums">
          {leads.length === totalCount ? leads.length : `${leads.length}/${totalCount}`}
          <span className="sr-only"> leads</span>
        </span>
      </header>
      {sum !== null && sum > 0 ? (
        <p className="border-b border-border px-3 py-1.5 text-xs text-muted">
          Total <span className="font-medium text-success tabular-nums">{formatCents(sum)}</span>
        </p>
      ) : null}
      <SortableContext id={columnId(stage)} items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
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
              {totalCount > 0 ? "Nenhum lead com estes filtros" : "Arraste um lead para cá"}
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </section>
  );
});
