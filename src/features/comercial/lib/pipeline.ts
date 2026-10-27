import type { LeadSource, LeadTemperature } from "../constants";
import type { PipelineLead } from "../types";
import { positionBetween } from "./positions";
import { normalizeText } from "./text";

/** Leads por coluna, indexados pelo id da coluna (`pipeline_stages.id`). */
export type Columns = Record<string, PipelineLead[]>;

export const COLUMN_PREFIX = "column:";
export const columnId = (stageId: string) => `${COLUMN_PREFIX}${stageId}`;

/**
 * Agrupa os leads pelas colunas informadas, em ordem de posição. Lead de coluna desconhecida
 * (ex.: excluída por outra pessoa) vai para a primeira coluna até a página atualizar.
 */
export function groupByColumn(leads: readonly PipelineLead[], stageIds: readonly string[]): Columns {
  const columns: Columns = Object.fromEntries(stageIds.map((id) => [id, [] as PipelineLead[]]));
  const fallback = stageIds[0];
  for (const lead of leads) {
    const bucket = columns[lead.stageId] ?? (fallback ? columns[fallback] : undefined);
    bucket?.push(lead);
  }
  for (const id of stageIds) {
    columns[id].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
  }
  return columns;
}

/** Coluna onde está o card (ou a própria coluna, se o id for de coluna). */
export function findColumn(columns: Columns, id: string): string | null {
  if (id.startsWith(COLUMN_PREFIX)) return id.slice(COLUMN_PREFIX.length);
  return Object.keys(columns).find((stageId) => columns[stageId].some((lead) => lead.id === id)) ?? null;
}

/** Durante o arraste: passa o card para a coluna de destino, na altura do card sob o cursor. */
export function moveAcross(columns: Columns, activeId: string, overId: string): Columns {
  const from = findColumn(columns, activeId);
  const to = findColumn(columns, overId);
  if (!from || !to || from === to) return columns;
  const lead = columns[from]?.find((l) => l.id === activeId);
  if (!lead) return columns;
  const target = columns[to] ?? [];
  const overIndex = target.findIndex((l) => l.id === overId);
  const index = overIndex === -1 ? target.length : overIndex;
  return {
    ...columns,
    [from]: columns[from].filter((l) => l.id !== activeId),
    [to]: [...target.slice(0, index), lead, ...target.slice(index)],
  };
}

export type Drop = { columns: Columns; stageId: string; index: number; position: number; lead: PipelineLead };

/** Ao soltar: reordena dentro da coluna final e calcula a nova posição fracionária. */
export function finalizeDrop(columns: Columns, activeId: string, overId: string): Drop | null {
  const stageId = findColumn(columns, activeId);
  const list = stageId ? columns[stageId] : undefined;
  if (!stageId || !list) return null;
  const oldIndex = list.findIndex((l) => l.id === activeId);
  if (oldIndex === -1) return null;
  const overIndex = list.findIndex((l) => l.id === overId);
  const newIndex = overIndex === -1 ? oldIndex : overIndex;
  const reordered = list.slice();
  const [lead] = reordered.splice(oldIndex, 1);
  reordered.splice(newIndex, 0, lead);
  const position = positionBetween(reordered[newIndex - 1]?.position, reordered[newIndex + 1]?.position);
  const moved = { ...lead, position };
  reordered[newIndex] = moved;
  return { columns: { ...columns, [stageId]: reordered }, stageId, index: newIndex, position, lead: moved };
}

/** Aplica campos a um lead onde quer que ele esteja. */
export function patchLead(columns: Columns, id: string, patch: Partial<PipelineLead>): Columns {
  const stageId = findColumn(columns, id);
  const list = stageId ? columns[stageId] : undefined;
  if (!stageId || !list) return columns;
  return { ...columns, [stageId]: list.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)) };
}

export type PipelineFilters = {
  query: string;
  /** "" = todos; "none" = sem responsável. */
  ownerId: string;
  temperature: LeadTemperature | "";
  source: LeadSource | "";
};

export const EMPTY_FILTERS: PipelineFilters = { query: "", ownerId: "", temperature: "", source: "" };

export function hasActiveFilters(filters: PipelineFilters) {
  return Boolean(filters.query.trim() || filters.ownerId || filters.temperature || filters.source);
}

/** Filtro de busca: nome, empresa, e-mail, telefone e indicador, sem acento nem caixa. */
export function matchesFilters(lead: PipelineLead, filters: PipelineFilters): boolean {
  if (filters.ownerId === "none" ? lead.ownerId !== null : filters.ownerId && lead.ownerId !== filters.ownerId) {
    return false;
  }
  if (filters.temperature && lead.temperature !== filters.temperature) return false;
  if (filters.source && lead.source !== filters.source) return false;
  const query = normalizeText(filters.query);
  if (!query) return true;
  const haystack = normalizeText(
    [lead.name, lead.companyName, lead.email, lead.phone, lead.referrerName].filter(Boolean).join(" "),
  );
  return haystack.includes(query);
}
