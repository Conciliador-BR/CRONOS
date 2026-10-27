import { Medal, Target, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/format/money";
import { cn } from "@/lib/utils";
import type { SellerPerformance } from "../../lib/performance";
import { GoalBar } from "./goal-bar";

/** Ranking de vendas do mês (por faturamento). */
export function SellerRanking({ sellers, monthLabel }: { sellers: SellerPerformance[]; monthLabel: string }) {
  const withSales = sellers.filter((s) => s.revenueCents > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Ranking de vendas</CardTitle>
        <CardDescription>Faturamento por funcionário em {monthLabel}.</CardDescription>
      </CardHeader>
      <CardContent>
        {withSales.length === 0 ? (
          <EmptyState icon={Trophy} title="Nenhuma venda no mês" description="O ranking aparece quando houver clientes fechados." />
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {withSales.map((seller) => (
              <li key={seller.id} className="flex items-center gap-3 py-2.5">
                <span
                  className={cn(
                    "flex w-10 shrink-0 items-center justify-center gap-0.5 text-sm font-semibold tabular-nums",
                    seller.position <= 3 ? "text-warning" : "text-muted",
                  )}
                >
                  {seller.position <= 3 ? <Medal aria-hidden className="size-3.5" /> : null}
                  {seller.position}º
                </span>
                <Avatar name={seller.name} src={seller.avatarUrl} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{seller.name}</span>
                  <span className="block text-xs text-muted">
                    {seller.wonCount} {seller.wonCount === 1 ? "negócio" : "negócios"}
                    {seller.lostCount > 0 ? ` · ${seller.lostCount} ${seller.lostCount === 1 ? "perdido" : "perdidos"}` : ""}
                    {seller.teamName ? ` · ${seller.teamName}` : ""}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{formatCents(seller.revenueCents)}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/** Meta x realizado de cada funcionário ativo no mês. */
export function GoalsOverview({ sellers, monthLabel }: { sellers: SellerPerformance[]; monthLabel: string }) {
  const withGoal = sellers.filter((s) => s.goalCents);
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Meta x realizado</CardTitle>
        <CardDescription>
          {withGoal.length} de {sellers.length} funcionários com meta em {monthLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sellers.length === 0 ? (
          <EmptyState icon={Target} title="Nenhum funcionário ativo" description="Cadastre funcionários em Configurações." />
        ) : (
          <ul className="flex flex-col gap-4">
            {sellers.map((seller) => (
              <li key={seller.id}>
                <GoalBar label={seller.name} realizedCents={seller.revenueCents} goalCents={seller.goalCents} progress={seller.progress} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
