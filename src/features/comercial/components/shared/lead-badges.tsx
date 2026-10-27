import { Flame, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SOURCE_LABELS, STAGE_LABELS, TEMPERATURE_LABELS, type LeadSource, type LeadTemperature, type PipelineStage } from "../../constants";

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

const stageVariant: Record<PipelineStage, "neutral" | "primary" | "success" | "danger"> = {
  lead_recebido: "neutral",
  diagnostico_feito: "primary",
  reuniao_marcada: "primary",
  follow_up: "primary",
  cliente_fechado: "success",
  cliente_perdido: "danger",
};

export function StageBadge({ stage }: { stage: PipelineStage }) {
  return <Badge variant={stageVariant[stage]}>{STAGE_LABELS[stage]}</Badge>;
}
