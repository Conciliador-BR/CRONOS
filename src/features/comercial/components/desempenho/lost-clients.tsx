import Link from "next/link";
import { UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SOURCE_LABELS, STAGE_LABELS } from "../../constants";
import { formatDate } from "../../lib/format";
import type { LostDeal } from "../../lib/lost";

/** Clientes perdidos no mês, do mais recente ao mais antigo, com link para o lead no CRM. */
export function LostClients({
  lost,
  monthLabel,
  lostStageLabel = STAGE_LABELS.cliente_perdido,
}: {
  lost: LostDeal[];
  monthLabel: string;
  /** Nome atual da etapa "Cliente perdido" (pode ter sido renomeada). */
  lostStageLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Clientes perdidos</CardTitle>
        <CardDescription>
          Leads movidos para “{lostStageLabel}” em {monthLabel}, com o motivo informado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lost.length === 0 ? (
          <EmptyState icon={UserX} title="Nenhum cliente perdido no mês" description={`Leads movidos para “${lostStageLabel}” no CRM aparecem aqui.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Clientes perdidos em {monthLabel}</caption>
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-3 font-medium">Cliente</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Responsável</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Perdido em</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Motivo</th>
                  <th scope="col" className="py-2 font-medium">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border align-top">
                {lost.map((lead) => (
                  <tr key={lead.id}>
                    <td className="max-w-56 py-2 pr-3">
                      <Link
                        href={`/comercial/crm?lead=${lead.id}`}
                        className="block truncate font-medium text-fg underline-offset-2 hover:underline focus-visible:underline"
                      >
                        {lead.name}
                        <span className="sr-only"> (abrir no CRM)</span>
                      </Link>
                      {lead.companyName ? <span className="block truncate text-xs text-muted">{lead.companyName}</span> : null}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{lead.ownerName ?? <span className="text-muted">Sem responsável</span>}</td>
                    <td className="py-2 pr-3 whitespace-nowrap tabular-nums">
                      <time dateTime={lead.lostAt}>{formatDate(lead.lostAt)}</time>
                    </td>
                    <td className="max-w-80 py-2 pr-3">
                      <span className="line-clamp-2 text-pretty" title={lead.reason}>
                        {lead.reason || "—"}
                      </span>
                    </td>
                    <td className="py-2 whitespace-nowrap">{SOURCE_LABELS[lead.source]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
