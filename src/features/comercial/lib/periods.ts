/** Períodos do filtro de Insights. */
export const PERIODS = ["30d", "90d", "12m", "tudo"] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABELS: Record<Period, string> = {
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  "12m": "Últimos 12 meses",
  tudo: "Todo o período",
};

export function parsePeriodParam(value: unknown): Period {
  const raw = Array.isArray(value) ? value[0] : value;
  return (PERIODS as readonly unknown[]).includes(raw) ? (raw as Period) : "90d";
}

const DAY = 24 * 60 * 60 * 1000;

/** Início do período (ISO) ou undefined para "todo o período". */
export function periodStart(period: Period, now: Date = new Date()): string | undefined {
  if (period === "30d") return new Date(now.getTime() - 30 * DAY).toISOString();
  if (period === "90d") return new Date(now.getTime() - 90 * DAY).toISOString();
  if (period === "12m") {
    const start = new Date(now);
    start.setUTCFullYear(start.getUTCFullYear() - 1);
    return start.toISOString();
  }
  return undefined;
}
