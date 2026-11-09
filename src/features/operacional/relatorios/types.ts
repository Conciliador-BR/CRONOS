import type { Member } from "../shared/types";

/** Tipos de propriedade (coluna). A ordem é a do menu "Selecionar tipo". */
export const PROPERTY_TYPES = [
  "company",
  "text",
  "number",
  "select",
  "multi_select",
  "status",
  "date",
  "person",
  "checkbox",
  "url",
  "phone",
  "email",
  "id",
  "created_time",
  "last_edited_time",
  "created_by",
  "last_edited_by",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

/** Calculadas a partir da linha: não têm célula e não são editáveis. */
export const COMPUTED_TYPES = ["id", "created_time", "last_edited_time", "created_by", "last_edited_by"] as const;

/** Grupos do Status, como no Notion: o painel conta "Concluído" sobre o total. */
export const STATUS_GROUPS = ["todo", "doing", "done"] as const;
export type StatusGroup = (typeof STATUS_GROUPS)[number];

/** Opção de select, multi_select e status (group só no status). */
export type PropertyOption = { id: string; name: string; color: string; group?: StatusGroup };

export type ReportProperty = {
  id: string;
  name: string;
  type: PropertyType;
  options: PropertyOption[];
  position: number;
  width: number | null;
};

/**
 * Valor de uma célula, por tipo:
 * text/url/phone/email: string · number: number · checkbox: boolean · date: "aaaa-mm-dd"
 * select/status: id da opção · multi_select: ids das opções · person: ids de perfis.
 * company não tem célula (fica em ReportRow.companyId); as calculadas também não.
 */
export type CellValue = string | number | boolean | string[];

export type ReportRow = {
  id: string;
  seq: number;
  position: number;
  companyId: string | null;
  /** Por id da propriedade; ausente = vazio. */
  values: Record<string, CellValue>;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ReportSheetSummary = {
  id: string;
  name: string;
  description: string;
  rowCount: number;
  canDelete: boolean;
};

export type ReportSheet = {
  id: string;
  name: string;
  description: string;
  autoAddCompanies: boolean;
  canDelete: boolean;
  /** Só admin: "Resetar semana" (todos os Status voltam para "Não iniciado"). */
  canReset: boolean;
};

/** Empresa para a coluna Empresa: nome do mercado, senão fantasia, senão razão social. */
/** `kind`: "Matriz", "Filial 02"… (`company-label.ts`); `order` ordena matriz antes das filiais. */
export type CompanyOption = { id: string; name: string; uf: string; city: string | null; kind: string; order: number | null };

export type ReportSheetData = {
  sheet: ReportSheet;
  properties: ReportProperty[];
  rows: ReportRow[];
  members: Member[];
  companies: CompanyOption[];
};

/** Progresso de uma propriedade Status (painel do topo). Linhas sem valor contam como "todo". */
export type StatusProgress = {
  propertyId: string;
  name: string;
  total: number;
  todo: number;
  doing: number;
  done: number;
  /** done / total, 0–100 arredondado; 0 quando não há linhas. */
  percent: number;
};
