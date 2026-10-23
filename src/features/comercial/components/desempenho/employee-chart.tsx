"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCents } from "@/lib/format/money";
import { formatCentsCompact } from "../../lib/format";
import { formatMonthLabel } from "../../lib/months";
import type { MonthlyPoint } from "../../lib/performance";
import { CHART_COLORS } from "./chart-colors";

type Row = { label: string; longLabel: string; revenue: number; goal: number | null; won: number };

/** Faturamento (barras) x meta (linha) nos últimos 12 meses. Mesmo eixo: ambos em R$. */
export default function EmployeeChart({ monthly }: { monthly: MonthlyPoint[] }) {
  const rows: Row[] = monthly.map((point) => ({
    label: formatMonthLabel(point.month, "short"),
    longLabel: formatMonthLabel(point.month),
    revenue: point.revenueCents,
    goal: point.goalCents,
    won: point.wonCount,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value: number) => formatCentsCompact(value)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART_COLORS.axis, fontSize: 11 }}
            width={72}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.cursor }}
            content={({ active, payload }) => {
              const row = active ? (payload?.[0]?.payload as Row | undefined) : undefined;
              if (!row) return null;
              return (
                <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg shadow-black/50">
                  <p className="mb-1 font-medium text-fg capitalize">{row.longLabel}</p>
                  <p className="flex items-center gap-2 text-muted">
                    <span aria-hidden className="size-2 rounded-sm" style={{ background: CHART_COLORS.revenue }} />
                    Faturamento <span className="ml-auto text-fg tabular-nums">{formatCents(row.revenue)}</span>
                  </p>
                  <p className="flex items-center gap-2 text-muted">
                    <span aria-hidden className="h-0.5 w-2" style={{ background: CHART_COLORS.goal }} />
                    Meta <span className="ml-auto text-fg tabular-nums">{row.goal ? formatCents(row.goal) : "—"}</span>
                  </p>
                  <p className="text-muted">
                    {row.won} {row.won === 1 ? "negócio" : "negócios"}
                  </p>
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
          <Bar dataKey="revenue" name="Faturamento" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} maxBarSize={24} />
          <Line
            dataKey="goal"
            name="Meta"
            type="linear"
            stroke={CHART_COLORS.goal}
            strokeWidth={2}
            dot={{ r: 4, fill: CHART_COLORS.goal, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
            activeDot={{ r: 5, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
