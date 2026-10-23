import { Inbox } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SOURCE_LABELS } from "../../constants";
import { formatInteger, formatPercent } from "../../lib/format";
import type { LeadSourceStats } from "../../lib/lead-stats";
import { ShareBar } from "./share-bar";

export function InsightsKpis({ stats }: { stats: LeadSourceStats }) {
  const tiles = [
    { label: "Leads recebidos", value: formatInteger(stats.total) },
    { label: "Clientes fechados", value: formatInteger(stats.won) },
    { label: "Conversão geral", value: formatPercent(stats.conversionRate, 1) },
    { label: "Em aberto", value: formatInteger(stats.open) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-sm text-muted">{tile.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{tile.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** De onde chegam os leads: volume, fatia, fechados e conversão por origem. */
export function SourceBreakdown({ stats }: { stats: LeadSourceStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">De onde chegam os leads</CardTitle>
        <CardDescription>Conversão = clientes fechados ÷ leads recebidos da origem.</CardDescription>
      </CardHeader>
      <CardContent>
        {stats.total === 0 ? (
          <EmptyState icon={Inbox} title="Nenhum lead no período" description="Cadastre leads no CRM para ver as origens." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-3 font-medium">Origem</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Leads</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Fechados</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Conversão</th>
                  <th scope="col" className="py-2 text-right font-medium">Quentes / frios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {stats.bySource.map((row) => (
                  <tr key={row.source}>
                    <th scope="row" className="py-2.5 pr-3 font-medium text-fg">{SOURCE_LABELS[row.source]}</th>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <ShareBar ratio={row.share} className="w-24" />
                        <span>
                          {row.total} <span className="text-xs text-muted">({formatPercent(row.share)})</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-right">{row.won}</td>
                    <td className="py-2.5 pr-3 text-right font-medium">{formatPercent(row.conversionRate, 1)}</td>
                    <td className="py-2.5 text-right text-muted">
                      {row.quente} / {row.frio}
                    </td>
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

/** Quentes x frios no período. */
export function TemperatureSplit({ stats }: { stats: LeadSourceStats }) {
  const hot = stats.total > 0 ? stats.quente / stats.total : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Quentes x frios</CardTitle>
        <CardDescription>Temperatura informada no cadastro do lead.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div aria-hidden className="flex h-3 overflow-hidden rounded-full bg-surface-3">
          {stats.total > 0 ? (
            <>
              <div className="h-full bg-danger" style={{ width: `${Math.round(hot * 100)}%` }} />
              <div className="h-full flex-1 border-l-2 border-surface bg-primary" />
            </>
          ) : null}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="flex items-center gap-2 text-muted">
              <span aria-hidden className="size-2 rounded-full bg-danger" /> Quentes
            </dt>
            <dd className="text-xl font-semibold tabular-nums">
              {stats.quente} <span className="text-sm font-normal text-muted">({formatPercent(hot)})</span>
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-muted">
              <span aria-hidden className="size-2 rounded-full bg-primary" /> Frios
            </dt>
            <dd className="text-xl font-semibold tabular-nums">
              {stats.frio}{" "}
              <span className="text-sm font-normal text-muted">({formatPercent(stats.total > 0 ? 1 - hot : 0)})</span>
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
