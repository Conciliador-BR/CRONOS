import { CircleSlash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { STAGE_LABELS } from "../../constants";
import type { LostLead } from "../../insights-queries";
import { formatDate } from "../../lib/format";
import type { KeywordGroup, ReasonGroup } from "../../lib/lead-stats";

type Props = {
  lost: LostLead[];
  groups: { phrases: ReasonGroup[]; keywords: KeywordGroup[] };
  /** Nome atual da etapa "Cliente perdido" (pode ter sido renomeada). */
  lostStageLabel?: string;
};

/** Por que os leads não fecham: agrupamento por texto e palavra-chave + lista completa. */
export function LostReasons({ lost, groups, lostStageLabel = STAGE_LABELS.cliente_perdido }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Por que os leads não fecham</CardTitle>
        <CardDescription>
          Motivos informados ao mover para {lostStageLabel} ({lost.length} no período, pela data da perda).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lost.length === 0 ? (
          <EmptyState icon={CircleSlash} title="Nenhum lead perdido no período" description="Bom sinal. Os motivos aparecem aqui quando houver." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <div className="flex flex-col gap-5">
              <section aria-labelledby="motivos-frequentes">
                <h3 id="motivos-frequentes" className="mb-2 text-sm font-semibold">Motivos mais frequentes</h3>
                <ol className="flex flex-col gap-1.5 text-sm">
                  {groups.phrases.map((group) => (
                    <li key={group.text} className="flex items-start justify-between gap-3">
                      <span className="min-w-0 break-words">{group.text}</span>
                      <span className="shrink-0 rounded-full bg-surface-3 px-2 text-xs text-muted tabular-nums">{group.count}×</span>
                    </li>
                  ))}
                </ol>
              </section>
              {groups.keywords.length > 0 ? (
                <section aria-labelledby="palavras-chave">
                  <h3 id="palavras-chave" className="mb-2 text-sm font-semibold">Palavras que se repetem</h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {groups.keywords.map((keyword) => (
                      <li key={keyword.word} className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs">
                        {keyword.word} <span className="text-muted tabular-nums">· {keyword.count}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
            <section aria-labelledby="leads-perdidos">
              <h3 id="leads-perdidos" className="mb-2 text-sm font-semibold">Leads perdidos</h3>
              <ul className="flex max-h-[28rem] flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border">
                {lost.map((lead) => (
                  <li key={lead.id} className="flex flex-col gap-1 px-3 py-2.5 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="font-medium">
                        {lead.name}
                        {lead.companyName ? <span className="font-normal text-muted"> · {lead.companyName}</span> : null}
                      </span>
                      <span className="text-xs text-muted">
                        {lead.ownerName ?? "Sem responsável"} · <time dateTime={lead.lostAt ?? undefined}>{formatDate(lead.lostAt)}</time>
                      </span>
                    </div>
                    <p className="break-words whitespace-pre-line text-muted">{lead.reason}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
