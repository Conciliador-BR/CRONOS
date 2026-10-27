"use client";

import { Fragment, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
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
import { loadLeadHistory } from "../../actions";
import { EMPTY_FILTERS, findColumn, matchesFilters, type Columns, type PipelineFilters } from "../../lib/pipeline";
import type { StageColumn } from "../../lib/stages";
import type { DataResult, MemberOption, PipelineLead, StageHistoryEntry } from "../../types";
import { StagesProvider } from "../shared/stages-context";
import { CloseDealModal } from "./close-deal-modal";
import { DeleteStageModal } from "./delete-stage-modal";
import { LeadCardContent } from "./lead-card";
import { LeadDrawer } from "./lead-drawer";
import { LoseLeadModal } from "./lose-lead-modal";
import { NewLeadButton } from "./new-lead-modal";
import { createAnnouncements, screenReaderInstructions } from "./pipeline-announcements";
import { NewStageColumn } from "./new-stage-column";
import { PipelineColumn, type StageControls } from "./pipeline-column";
import { PipelineFiltersBar } from "./pipeline-filters";
import { usePipelineDnd } from "./use-pipeline-dnd";
import { useStageEditor } from "./use-stage-editor";

type Props = {
  leads: PipelineLead[];
  members: MemberOption[];
  currentUserId: string;
  canManage: boolean;
  /** Colunas do pipeline (`pipeline_stages`), em ordem. */
  stages: StageColumn[];
};

/**
 * Pipeline do CRM: filtros, colunas com arrastar e soltar, perguntas ao fechar/perder, gaveta do lead
 * (`?lead=<id>`) e, para gestores, criar, renomear, mover e excluir colunas.
 */
export function PipelineBoard({ leads, members, currentUserId, canManage, stages: serverStages }: Props) {
  const editor = useStageEditor(serverStages);
  const { stages } = editor;
  const board = usePipelineDnd(leads, stages);
  const [deleting, setDeleting] = useState<StageColumn | null>(null);
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
  const labelOf = useCallback(
    (stageId: string) => stages.find((stage) => stage.id === stageId)?.label ?? "etapa",
    [stages],
  );
  const announcements = useMemo(() => createAnnouncements(board.getColumns, labelOf), [board.getColumns, labelOf]);

  const controls = useMemo<StageControls | undefined>(
    () => (canManage ? { onRename: editor.rename, onMove: editor.move, onDelete: setDeleting } : undefined),
    [canManage, editor.rename, editor.move],
  );

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
    const result: Columns = {};
    for (const stage of stages) {
      result[stage.id] = (columns[stage.id] ?? []).filter(
        (lead) => lead.id === board.activeId || matchesFilters(lead, deferredFilters),
      );
    }
    return result;
  }, [stages, columns, deferredFilters, board.activeId]);

  const totalCount = leads.length;
  const visibleCount = stages.reduce((sum, stage) => sum + (visible[stage.id]?.length ?? 0), 0);

  const leadOf = (id: string | null) => {
    const stageId = id ? findColumn(columns, id) : null;
    return (stageId && columns[stageId]?.find((lead) => lead.id === id)) || null;
  };
  const selected = leadOf(selectedId);
  const activeLead = leadOf(board.activeId);
  // "+ Nova etapa" fica antes da primeira coluna de fechado/perdido.
  const firstTerminal = stages.findIndex((stage) => stage.kind !== "aberto");
  const addAt = firstTerminal === -1 ? stages.length : firstTerminal;

  const newLead = (
    <NewLeadButton
      members={members}
      currentUserId={currentUserId}
      onCreated={(name) => {
        const first = stages.find((stage) => stage.kind === "aberto");
        setNotice(first ? `Lead ${name} criado em ${first.label}.` : `Lead ${name} criado.`);
      }}
    />
  );
  const stageError = editor.error ? (
    <Alert tone="danger" title="A etapa voltou para como estava">
      <span className="flex flex-wrap items-center gap-2">
        {editor.error}
        <Button variant="ghost" size="sm" onClick={editor.dismissError}>
          Fechar aviso
        </Button>
      </span>
    </Alert>
  ) : null;

  return (
    <StagesProvider stages={stages}>
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
        {stageError}
        {notice ? <Alert tone="success">{notice}</Alert> : null}

        {totalCount === 0 && !canManage ? (
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
              aria-busy={board.isSaving || editor.isSaving || undefined}
              className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:snap-none sm:px-0"
            >
              {stages.map((stage, index) => (
                <Fragment key={stage.id}>
                  {canManage && index === addAt ? (
                    <NewStageColumn afterId={stages[index - 1]?.id} onCreate={editor.create} />
                  ) : null}
                  <PipelineColumn
                    stage={stage}
                    isFirst={index === 0}
                    isLast={index === stages.length - 1}
                    controls={controls}
                    leads={visible[stage.id] ?? []}
                    totalCount={columns[stage.id]?.length ?? 0}
                    membersById={membersById}
                    canEdit={canEdit}
                    onOpen={openLead}
                  />
                </Fragment>
              ))}
              {canManage && addAt === stages.length ? (
                <NewStageColumn afterId={stages.at(-1)?.id} onCreate={editor.create} />
              ) : null}
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
        {canManage ? (
          <DeleteStageModal
            stage={deleting}
            stages={stages}
            leadCount={deleting ? (columns[deleting.id]?.length ?? 0) : 0}
            onClose={() => setDeleting(null)}
            onDeleted={(message) => {
              setDeleting(null);
              setNotice(message);
            }}
          />
        ) : null}
      </div>
    </StagesProvider>
  );
}
