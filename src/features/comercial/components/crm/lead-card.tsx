import { Avatar } from "@/components/ui/avatar";
import { formatCents } from "@/lib/format/money";
import { DEAL_TYPE_LABELS } from "../../constants";
import type { MemberOption, PipelineLead } from "../../types";
import { SourceBadge, TemperatureBadge } from "../shared/lead-badges";

/** Conteúdo visual do card (usado na coluna e na prévia do arraste). */
export function LeadCardContent({ lead, owner }: { lead: PipelineLead; owner: MemberOption | undefined }) {
  return (
    <span className="flex min-w-0 flex-col gap-2">
      <span className="flex min-w-0 items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-fg">{lead.name}</span>
          {lead.companyName ? <span className="block truncate text-xs text-muted">{lead.companyName}</span> : null}
        </span>
        {owner ? (
          <span title={`Responsável: ${owner.name}`}>
            <Avatar name={owner.name} src={owner.avatarUrl} size="xs" />
          </span>
        ) : null}
      </span>
      <span className="flex flex-wrap gap-1.5">
        <TemperatureBadge temperature={lead.temperature} />
        <SourceBadge source={lead.source} />
      </span>
      {lead.stage === "cliente_fechado" && lead.dealValueCents ? (
        <span className="flex items-baseline justify-between gap-2 text-xs">
          <span className="text-muted">{lead.dealType ? DEAL_TYPE_LABELS[lead.dealType] : "Negócio"}</span>
          <span className="font-semibold text-success tabular-nums">{formatCents(lead.dealValueCents)}</span>
        </span>
      ) : null}
    </span>
  );
}
