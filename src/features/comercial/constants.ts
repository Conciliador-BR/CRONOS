import type { Database } from "@/lib/supabase/database.types";

export type PipelineStage = Database["public"]["Enums"]["pipeline_stage"];
export type LeadSource = Database["public"]["Enums"]["lead_source"];
export type LeadTemperature = Database["public"]["Enums"]["lead_temperature"];
export type DealType = Database["public"]["Enums"]["deal_type"];

/** Colunas do pipeline, na ordem em que aparecem. */
export const PIPELINE_STAGES = [
  "lead_recebido",
  "diagnostico_feito",
  "reuniao_marcada",
  "follow_up",
  "cliente_fechado",
  "cliente_perdido",
] as const satisfies readonly PipelineStage[];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  lead_recebido: "Lead recebido",
  diagnostico_feito: "Diagnóstico feito",
  reuniao_marcada: "Reunião marcada",
  follow_up: "Follow up",
  cliente_fechado: "Cliente fechado",
  cliente_perdido: "Cliente perdido",
};

export const LEAD_SOURCES = ["marketing", "venda", "indicacao", "outro"] as const satisfies readonly LeadSource[];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  marketing: "Marketing",
  venda: "Venda",
  indicacao: "Indicação",
  outro: "Outro",
};

export const LEAD_TEMPERATURES = ["quente", "frio"] as const satisfies readonly LeadTemperature[];

export const TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  quente: "Quente",
  frio: "Frio",
};

export const DEAL_TYPES = ["consultoria_avancada", "somente_sistema"] as const satisfies readonly DealType[];

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  consultoria_avancada: "Consultoria avançada",
  somente_sistema: "Somente o sistema",
};

export function isClosedStage(stage: PipelineStage) {
  return stage === "cliente_fechado" || stage === "cliente_perdido";
}

/** Paths revalidados depois de qualquer mutação do Comercial (Marketing e Início leem as mesmas consultas). */
export const COMERCIAL_PATHS = [
  "/comercial/crm",
  "/comercial/desempenho",
  "/comercial/insights",
  "/marketing",
  "/inicio",
] as const;
