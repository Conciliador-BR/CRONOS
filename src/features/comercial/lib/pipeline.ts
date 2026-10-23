import { PIPELINE_STAGES, type LeadSource, type LeadTemperature, type PipelineStage } from "../constants";
import type { PipelineLead } from "../types";
import { positionBetween } from "./positions";
import { normalizeText } from "./text";

export type Columns = Record<PipelineStage, PipelineLead[]>;

export const COLUMN_PREFIX = "column:";
export const columnId = (stage: PipelineStage) => `${COLUMN_PREFIX}${stage}`;

export function groupByStage(leads: readonly PipelineLead[]): Columns {
  const columns = Object.fromEntries(PIPELINE_STAGES.map((stage) => [stage, [] as PipelineLead[]])) as Columns;
  for (const lead of leads) columns[lead.stage].push(lead);
  for (const stage of PIPELINE_STAGES) {
    columns[stage].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt));
  }
  return columns;
}

/** Etapa onde está o card (ou a própria coluna, se o id for de coluna). */
export function findStage(columns: Columns, id: string): PipelineStage | null {
  if (id.startsWith(COLUMN_PREFIX)) {
    const stage = id.slice(COLUMN_PREFIX.length) as PipelineStage;
    return stage in columns ? stage : null;
  }
  return PIPELINE_STAGES.find((stage) => columns[stage].some((lead) => lead.id === id)) ?? null;
}

/** Durante o arraste: passa o card para a coluna de destino, na altura do card sob o cursor. */
export function moveAcross(columns: Columns, activeId: string, overId: string): Columns {
  const from = findStage(columns, activeId);
  const to = findStage(columns, overId);
  if (!from || !to || from === to) return columns;
  const lead = columns[from].find((l) => l.id === activeId);
  if (!lead) return columns;
  const target = columns[to];
  const overIndex = target.findIndex((l) => l.id === overId);
  const index = overIndex === -1 ? target.length : overIndex;
  return {
    ...columns,
    [from]: columns[from].filter((l) => l.id !== activeId),
    [to]: [...target.slice(0, index), lead, ...target.slice(index)],
  };
}

export type Drop = { columns: Columns; stage: PipelineStage; index: number; position: number; lead: PipelineLead };

/** Ao soltar: reordena dentro da coluna final e calcula a nova posição fracionária. */
export function finalizeDrop(columns: Columns, activeId: string, overId: string): Drop | null {
  const stage = findStage(columns, activeId);
  if (!stage) return null;
  const list = columns[stage];
  const oldIndex = list.findIndex((l) => l.id === activeId);
  const overIndex = list.findIndex((l) => l.id === overId);
  const newIndex = overIndex === -1 ? oldIndex : overIndex;
  const reordered = list.slice();
  const [lead] = reordered.splice(oldIndex, 1);
  reordered.splice(newIndex, 0, lead);
  const position = positionBetween(reordered[newIndex - 1]?.position, reordered[newIndex + 1]?.position);
  const moved = { ...lead, position };
  reordered[newIndex] = moved;
  return { columns: { ...columns, [stage]: reordered }, stage, index: newIndex, position, lead: moved };
}

/** Aplica campos a um lead onde quer que ele esteja. */
export function patchLead(columns: Columns, id: string, patch: Partial<PipelineLead>): Columns {
  const stage = findStage(columns, id);
  if (!stage) return columns;
  return { ...columns, [stage]: columns[stage].map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)) };
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
