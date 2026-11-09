import { randomId } from "@/lib/random-id";
import { COMPUTED_TYPES, type PropertyOption, type PropertyType, type StatusGroup } from "./types";

/** Opções iniciais de uma propriedade Status (ids estáveis para o painel e os testes). */
export const DEFAULT_STATUS_OPTIONS: PropertyOption[] = [
  { id: "nao-iniciado", name: "Não iniciado", color: "#64748b", group: "todo" },
  { id: "em-andamento", name: "Em andamento", color: "#2563eb", group: "doing" },
  { id: "concluido", name: "Concluído", color: "#22c55e", group: "done" },
];

export function newOptionId(): string {
  return randomId();
}

export const STATUS_GROUP_LABELS: Record<StatusGroup, string> = {
  todo: "A fazer",
  doing: "Em andamento",
  done: "Concluído",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  company: "Empresa",
  text: "Texto",
  number: "Número",
  select: "Selecionar",
  multi_select: "Seleção múltipla",
  status: "Status",
  date: "Data",
  person: "Pessoa",
  checkbox: "Caixa de seleção",
  url: "URL",
  phone: "Telefone",
  email: "E-mail",
  id: "ID",
  created_time: "Criado em",
  last_edited_time: "Última edição",
  created_by: "Criado por",
  last_edited_by: "Última edição por",
};

/** Calculadas a partir da linha: sem célula e não editáveis. */
export function isComputedType(type: PropertyType): boolean {
  return (COMPUTED_TYPES as readonly PropertyType[]).includes(type);
}
