"use client";

import { Flame, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStages } from "./stages-context";
import { SOURCE_LABELS, TEMPERATURE_LABELS, type LeadSource, type LeadTemperature, type PipelineStage } from "../../constants";

export function TemperatureBadge({ temperature }: { temperature: LeadTemperature }) {
  const Icon = temperature === "quente" ? Flame : Snowflake;
  return (
    <Badge variant={temperature === "quente" ? "danger" : "primary"}>
      <Icon aria-hidden className="mr-1 inline size-3 align-[-2px]" />
      {TEMPERATURE_LABELS[temperature]}
    </Badge>
  );
}

export function SourceBadge({ source }: { source: LeadSource }) {
  return <Badge variant="neutral">{SOURCE_LABELS[source]}</Badge>;
}

const kindVariant = { aberto: "primary", fechado: "success", perdido: "danger" } as const;

/** Nome da coluna como o gestor definiu (componente cliente: lê o contexto do CRM). */
export function StageBadge({ stageId, stage }: { stageId: string; stage: PipelineStage }) {
  const { byId, labelOf } = useStages();
  const column = byId.get(stageId);
  const variant = column ? kindVariant[column.kind] : stage === "cliente_fechado" ? "success" : stage === "cliente_perdido" ? "danger" : "neutral";
  return <Badge variant={variant}>{labelOf(stageId, stage)}</Badge>;
}
