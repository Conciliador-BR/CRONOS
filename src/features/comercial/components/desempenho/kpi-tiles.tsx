import type { ComponentType, SVGProps } from "react";
import { Banknote, Handshake, Percent, Receipt, UserX, Users } from "lucide-react";
import { formatCents } from "@/lib/format/money";
import type { PerformanceKpis } from "../../lib/performance";
import { formatInteger, formatPercent } from "../../lib/format";

type Tile = { label: string; value: string; hint: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

export function KpiTiles({ kpis, monthLabel }: { kpis: PerformanceKpis; monthLabel: string }) {
  const tiles: Tile[] = [
    { label: "Faturamento", value: formatCents(kpis.revenueCents), hint: `Negócios fechados em ${monthLabel}`, icon: Banknote },
    { label: "Pessoas trabalhando", value: formatInteger(kpis.activeMembers), hint: "Funcionários ativos", icon: Users },
    { label: "Negócios fechados", value: formatInteger(kpis.dealsClosed), hint: "Clientes convertidos no mês", icon: Handshake },
    { label: "Ticket médio", value: formatCents(kpis.averageTicketCents), hint: "Faturamento ÷ negócios", icon: Receipt },
    { label: "Clientes perdidos", value: formatInteger(kpis.lostCount), hint: `Leads perdidos em ${monthLabel}`, icon: UserX },
    {
      label: "Taxa de perda",
      value: kpis.lossRate === null ? "—" : formatPercent(kpis.lossRate, 1),
      hint: kpis.lossRate === null ? "Nenhum negócio fechado ou perdido no mês" : "Perdidos ÷ (fechados + perdidos)",
      icon: Percent,
    },
  ];
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map(({ label, value, hint, icon: Icon }) => (
        <div key={label} className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4">
          <dt className="flex items-center gap-2 text-sm text-muted">
            <Icon aria-hidden className="size-4 text-ring" />
            {label}
          </dt>
          <dd className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</dd>
          <dd className="text-xs text-muted">{hint}</dd>
        </div>
      ))}
    </dl>
  );
}
