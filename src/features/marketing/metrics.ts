/** Métricas puras dos leads de marketing. */

export type MarketingLead = {
  id: string;
  name: string;
  companyName: string | null;
  stage: string;
  temperature: "quente" | "frio";
  createdAt: string;
  dealValueCents: number | null;
};

const monthKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" });
const monthLabelFormat = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });

/** "AAAA-MM" no fuso de São Paulo. */
export function monthKey(date: Date) {
  return monthKeyFormat.format(date).slice(0, 7);
}

/** Últimos `count` meses (o atual por último) com a quantidade de leads criados em cada um. */
export function leadsPerMonth(leads: readonly Pick<MarketingLead, "createdAt">[], now: Date, count = 6) {
  const [year, month] = monthKey(now).split("-").map(Number);
  const months: { key: string; label: string; count: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: monthLabelFormat.format(d).replace(".", ""), count: 0 });
  }
  const index = new Map(months.map((m, i) => [m.key, i]));
  for (const lead of leads) {
    const i = index.get(monthKey(new Date(lead.createdAt)));
    if (i !== undefined) months[i].count++;
  }
  return months;
}

export function summarize(leads: readonly MarketingLead[]) {
  let won = 0;
  let lost = 0;
  let hot = 0;
  let revenueCents = 0;
  for (const l of leads) {
    if (l.stage === "cliente_fechado") {
      won++;
      revenueCents += l.dealValueCents ?? 0;
    } else if (l.stage === "cliente_perdido") lost++;
    if (l.temperature === "quente") hot++;
  }
  const total = leads.length;
  return {
    total,
    won,
    lost,
    open: total - won - lost,
    hot,
    cold: total - hot,
    revenueCents,
    /** Fechados sobre o total de leads (0 a 1), null sem leads. */
    conversionRate: total ? won / total : null,
  };
}

export function formatPercent(rate: number | null) {
  if (rate === null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(rate);
}
