import { HeartHandshake } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/format/money";
import { formatPercent } from "../../lib/format";
import type { ReferrerStats } from "../../lib/lead-stats";

/** Ranking de indicadores: quantos leads cada um trouxe e quantos fecharam. */
export function ReferrerRanking({ referrers }: { referrers: ReferrerStats[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Ranking de indicadores</CardTitle>
        <CardDescription>Leads de origem Indicação, agrupados pelo nome do indicador.</CardDescription>
      </CardHeader>
      <CardContent>
        {referrers.length === 0 ? (
          <EmptyState icon={HeartHandshake} title="Nenhuma indicação no período" description="Leads com origem Indicação aparecem aqui." />
        ) : (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface text-xs text-muted">
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-3 font-medium">#</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Indicador</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Leads</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Fechados</th>
                  <th scope="col" className="py-2 text-right font-medium">Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border tabular-nums">
                {referrers.map((row) => (
                  <tr key={row.name}>
                    <td className="py-2 pr-3 text-muted">{row.position}º</td>
                    <th scope="row" className="max-w-48 truncate py-2 pr-3 font-medium text-fg">{row.name}</th>
                    <td className="py-2 pr-3 text-right">{row.leads}</td>
                    <td className="py-2 pr-3 text-right">
                      {row.won} <span className="text-xs text-muted">({formatPercent(row.conversionRate)})</span>
                    </td>
                    <td className="py-2 text-right">{formatCents(row.revenueCents)}</td>
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
