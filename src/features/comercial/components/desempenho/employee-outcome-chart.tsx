"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPercent } from "../../lib/format";
import { lossRate } from "../../lib/lost";
import { formatMonthLabel } from "../../lib/months";
import type { MonthlyPoint } from "../../lib/performance";
import { CHART_COLORS } from "./chart-colors";

type Row = { label: string; longLabel: string; won: number; lost: number };

/** Clientes fechados x perdidos por mês (contagens, um só eixo), nos mesmos 12 meses do gráfico de faturamento. */
export default function EmployeeOutcomeChart({ monthly }: { monthly: MonthlyPoint[] }) {
  const rows: Row[] = monthly.map((point) => ({
    label: formatMonthLabel(point.month, "short"),
    longLabel: formatMonthLabel(point.month),
    won: point.wonCount,
    lost: point.lostCount,
  }));

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={2}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            width={32}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.cursor }}
            content={({ active, payload }) => {
              const row = active ? (payload?.[0]?.payload as Row | undefined) : undefined;
              if (!row) return null;
              const rate = lossRate(row.won, row.lost);
              return (
                <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg shadow-black/50">
                  <p className="mb-1 font-medium text-fg capitalize">{row.longLabel}</p>
                  <p className="flex items-center gap-2 text-muted">
                    <span aria-hidden className="size-2 rounded-sm" style={{ background: CHART_COLORS.revenue }} />
                    Fechados <span className="ml-auto text-fg tabular-nums">{row.won}</span>
                  </p>
                  <p className="flex items-center gap-2 text-muted">
                    <span aria-hidden className="size-2 rounded-sm" style={{ background: CHART_COLORS.lost }} />
                    Perdidos <span className="ml-auto text-fg tabular-nums">{row.lost}</span>
                  </p>
                  <p className="text-muted">Taxa de perda: {rate === null ? "—" : formatPercent(rate, 1)}</p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="top"
            height={28}
            iconSize={10}
            formatter={(value) => <span className="text-xs text-muted">{value}</span>}
          />
          <Bar dataKey="won" name="Fechados" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} maxBarSize={14} />
          <Bar dataKey="lost" name="Perdidos" fill={CHART_COLORS.lost} radius={[4, 4, 0, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
