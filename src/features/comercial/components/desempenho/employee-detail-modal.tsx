"use client";

import dynamic from "next/dynamic";
import { Handshake } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { formatCents } from "@/lib/format/money";
import { DEAL_TYPE_LABELS } from "../../constants";
import { formatDate, formatPercent } from "../../lib/format";
import { formatMonthLabel, type MonthKey } from "../../lib/months";
import type { SellerPerformance } from "../../lib/performance";
import { GoalBar } from "./goal-bar";

// recharts é pesado: só carrega quando o card de um funcionário é aberto.
const EmployeeChart = dynamic(() => import("./employee-chart"), {
  ssr: false,
  loading: () => <div className="h-64 w-full rounded-lg bg-surface-2 motion-safe:animate-pulse" />,
});
const EmployeeOutcomeChart = dynamic(() => import("./employee-outcome-chart"), {
  ssr: false,
  loading: () => <div className="h-52 w-full rounded-lg bg-surface-2 motion-safe:animate-pulse" />,
});

type Props = {
  seller: SellerPerformance | null;
  month: MonthKey;
  totals: { wonCount: number; lostCount: number } | undefined;
  onClose: () => void;
};

export function EmployeeDetailModal({ seller, month, totals, onClose }: Props) {
  const monthLabel = formatMonthLabel(month);
  return (
    <Modal open={seller !== null} onClose={onClose} size="xl" title={seller?.name ?? "Funcionário"} description={seller?.teamName ?? "Sem time"}>
      {seller ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={seller.name} src={seller.avatarUrl} size="xl" />
            <div className="flex flex-col gap-1">
              <Badge variant={seller.position <= 3 && seller.revenueCents > 0 ? "warning" : "neutral"}>
                {seller.position}º lugar no ranking de {monthLabel}
              </Badge>
              <p className="text-sm text-muted">Comissão de {seller.commissionRate.toLocaleString("pt-BR")}% sobre o faturamento</p>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Faturamento no mês" value={formatCents(seller.revenueCents)} />
            <Stat label="Valor em comissão (mês)" value={formatCents(seller.commissionCents)} />
            <Stat label="Clientes convertidos" value={String(totals?.wonCount ?? seller.conversions.length)} hint={`Desde o início · ${seller.wonCount} no mês`} />
            <Stat label="Comissão acumulada" value={formatCents(seller.totalCommissionCents)} hint={`Sobre ${formatCents(seller.totalRevenueCents)}`} />
            <Stat label="Clientes perdidos no mês" value={String(seller.lostCount)} hint={`${totals?.lostCount ?? 0} desde o início`} />
            <Stat
              label="Taxa de perda no mês"
              value={seller.lossRate === null ? "—" : formatPercent(seller.lossRate, 1)}
              hint="Perdidos ÷ (fechados + perdidos)"
            />
          </dl>

          <GoalBar label={`Meta de ${monthLabel}`} realizedCents={seller.revenueCents} goalCents={seller.goalCents} progress={seller.progress} />

          <section aria-labelledby="desempenho-mensal" className="flex flex-col gap-3">
            <h3 id="desempenho-mensal" className="text-sm font-semibold">
              Desempenho por mês
            </h3>
            <EmployeeChart monthly={seller.monthly} />
            <EmployeeOutcomeChart monthly={seller.monthly} />
            <details className="text-sm">
              <summary className="cursor-pointer text-muted hover:text-fg">Ver dados em tabela</summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-muted">
                    <tr>
                      <th className="py-1 pr-3 font-medium">Mês</th>
                      <th className="py-1 pr-3 text-right font-medium">Faturamento</th>
                      <th className="py-1 pr-3 text-right font-medium">Meta</th>
                      <th className="py-1 pr-3 text-right font-medium">Fechados</th>
                      <th className="py-1 text-right font-medium">Perdidos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border tabular-nums">
                    {seller.monthly.map((point) => (
                      <tr key={point.month}>
                        <td className="py-1 pr-3 capitalize">{formatMonthLabel(point.month)}</td>
                        <td className="py-1 pr-3 text-right">{formatCents(point.revenueCents)}</td>
                        <td className="py-1 pr-3 text-right">{point.goalCents ? formatCents(point.goalCents) : "—"}</td>
                        <td className="py-1 pr-3 text-right">{point.wonCount}</td>
                        <td className="py-1 text-right">{point.lostCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <section aria-labelledby="clientes-convertidos" className="flex flex-col gap-3">
            <h3 id="clientes-convertidos" className="text-sm font-semibold">
              Clientes convertidos
            </h3>
            {seller.conversions.length === 0 ? (
              <EmptyState icon={Handshake} title="Nenhum cliente convertido ainda" className="py-8" />
            ) : (
              <ul className="flex max-h-72 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border">
                {seller.conversions.map((deal) => (
                  <li key={deal.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{deal.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {[deal.companyName, deal.dealType ? DEAL_TYPE_LABELS[deal.dealType] : null].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold text-success tabular-nums">{formatCents(deal.dealValueCents)}</span>
                      <span className="block text-xs text-muted">
                        Convertido em <time dateTime={deal.closedAt}>{formatDate(deal.closedAt)}</time>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/50 p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
      {hint ? <dd className="text-xs text-muted">{hint}</dd> : null}
    </div>
  );
}
