"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanSquare } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PIPELINE_STAGES } from "../../constants";
import { loadLeadHistory } from "../../actions";
import { EMPTY_FILTERS, findStage, matchesFilters, type PipelineFilters } from "../../lib/pipeline";
import type { DataResult, MemberOption, PipelineLead, StageHistoryEntry } from "../../types";
import { CloseDealModal } from "./close-deal-modal";
import { LeadCardContent } from "./lead-card";
import { LeadDrawer } from "./lead-drawer";
import { LoseLeadModal } from "./lose-lead-modal";
import { NewLeadButton } from "./new-lead-modal";
import { createAnnouncements, screenReaderInstructions } from "./pipeline-announcements";
import { PipelineColumn } from "./pipeline-column";
import { PipelineFiltersBar } from "./pipeline-filters";
import { usePipelineDnd } from "./use-pipeline-dnd";

type Props = {
  leads: PipelineLead[];
  members: MemberOption[];
  currentUserId: string;
  canManage: boolean;
};

/** Pipeline do CRM: filtros, colunas com arrastar e soltar, perguntas ao fechar/perder e gaveta do lead (`?lead=<id>`). */
export function PipelineBoard({ leads, members, currentUserId, canManage }: Props) {
  const board = usePipelineDnd(leads);
  const [filters, setFilters] = useState<PipelineFilters>(EMPTY_FILTERS);
  const deferredFilters = useDeferredValue(filters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [historyPromise, setHistoryPromise] = useState<Promise<DataResult<StageHistoryEntry[]>> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const announcements = useMemo(() => createAnnouncements(board.getColumns), [board.getColumns]);

  const canEdit = useCallback(
    (lead: PipelineLead) => canManage || lead.ownerId === currentUserId || lead.createdBy === currentUserId,
    [canManage, currentUserId],
  );

  const openLead = useCallback((leadId: string) => {
    setSelectedId(leadId);
    setHistoryPromise(loadLeadHistory(leadId));
  }, []);

  // `?lead=<id>` (link de Desempenho/Insights) abre a gaveta do lead uma vez e sai da URL.
  const searchParams = useSearchParams();
  const linkedLeadId = searchParams.get("lead");
  useEffect(() => {
    if (!linkedLeadId) return;
    window.history.replaceState(null, "", window.location.pathname);
    // A URL é o sistema externo: abre a gaveta depois de sincronizá-la, fora do corpo do efeito.
    if (leads.some((lead) => lead.id === linkedLeadId)) queueMicrotask(() => openLead(linkedLeadId));
  }, [linkedLeadId, leads, openLead]);

  const { columns } = board;
  const visible = useMemo(() => {
    const result = {} as typeof columns;
    for (const stage of PIPELINE_STAGES) {
      result[stage] = columns[stage].filter((lead) => lead.id === board.activeId || matchesFilters(lead, deferredFilters));
    }
    return result;
  }, [columns, deferredFilters, board.activeId]);

  const totalCount = PIPELINE_STAGES.reduce((sum, stage) => sum + columns[stage].length, 0);
  const visibleCount = PIPELINE_STAGES.reduce((sum, stage) => sum + visible[stage].length, 0);

  const selectedStage = selectedId ? findStage(columns, selectedId) : null;
  const selected = selectedStage ? (columns[selectedStage].find((lead) => lead.id === selectedId) ?? null) : null;
  const activeStage = board.activeId ? findStage(columns, board.activeId) : null;
  const activeLead = activeStage ? columns[activeStage].find((lead) => lead.id === board.activeId) : undefined;

  const newLead = (
    <NewLeadButton
      members={members}
      currentUserId={currentUserId}
      onCreated={(name) => setNotice(`Lead ${name} criado em Lead recebido.`)}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <PipelineFiltersBar
            filters={filters}
            onChange={setFilters}
            members={members}
            visibleCount={visibleCount}
            totalCount={totalCount}
          />
        </div>
        {totalCount > 0 ? <div className="shrink-0">{newLead}</div> : null}
      </div>

      {board.error ? (
        <Alert tone="danger" title="O card voltou para onde estava">
          <span className="flex flex-wrap items-center gap-2">
            {board.error}
            <Button variant="ghost" size="sm" onClick={board.dismissError}>
              Fechar aviso
            </Button>
          </span>
        </Alert>
      ) : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {totalCount === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="Nenhum lead no pipeline"
          description="Cadastre o primeiro lead para começar a acompanhar as etapas até o fechamento."
          action={newLead}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          accessibility={{ announcements, screenReaderInstructions }}
          {...board.handlers}
        >
          <div
            aria-busy={board.isSaving || undefined}
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:snap-none sm:px-0"
          >
            {PIPELINE_STAGES.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                leads={visible[stage]}
                totalCount={columns[stage].length}
                membersById={membersById}
                canEdit={canEdit}
                onOpen={openLead}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead ? (
              <div className="w-[17rem] cursor-grabbing rounded-lg border border-primary/60 bg-surface p-3 shadow-xl shadow-black/60 sm:w-72">
                <LeadCardContent lead={activeLead} owner={activeLead.ownerId ? membersById.get(activeLead.ownerId) : undefined} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <CloseDealModal
        open={board.prompt?.kind === "fechado"}
        leadName={board.prompt?.lead.name ?? ""}
        onCancel={board.cancelPrompt}
        onConfirm={board.confirmPrompt}
      />
      <LoseLeadModal
        open={board.prompt?.kind === "perdido"}
        leadName={board.prompt?.lead.name ?? ""}
        onCancel={board.cancelPrompt}
        onConfirm={board.confirmPrompt}
      />
      <LeadDrawer
        lead={selected}
        members={members}
        membersById={membersById}
        canEdit={selected ? canEdit(selected) : false}
        canDelete={canManage}
        historyPromise={historyPromise}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
