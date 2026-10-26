import "server-only";
import { isManager, requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LostDeal } from "./lib/lost";
import { lastMonths, monthBounds, monthStartDate, type MonthKey } from "./lib/months";
import { buildPerformance, goalWindowStart, type ClosedDeal, type PerformanceSummary } from "./lib/performance";
import { failQuery, fetchAllRows, getActiveMembers } from "./queries";

export type AllTimeTotals = { wonCount: number; lostCount: number };

export type PerformanceData = PerformanceSummary & {
  canManage: boolean;
  /** Totais de sempre por funcionário (view `seller_performance`). */
  allTime: Record<string, AllTimeTotals>;
};

/**
 * Desempenho do mês: KPIs, ranking, metas, equipe, clientes perdidos e histórico de 12 meses por funcionário.
 * Perdas são lidas só na janela de 12 meses (por `closed_at`, a data em que o lead entrou em "Cliente perdido").
 */
export async function getPerformanceData(month: MonthKey): Promise<PerformanceData> {
  const profile = await requireMember();
  const supabase = await createClient();
  const lostFrom = monthBounds(lastMonths(month, 12)[0]).start;
  const lostTo = monthBounds(month).end;

  const [members, deals, goals, totals, lostRows] = await Promise.all([
    getActiveMembers(),
    fetchAllRows("performance-deals", (from, to) =>
      supabase
        .from("leads")
        .select("id, name, company_name, owner_id, deal_type, deal_value_cents, closed_at")
        .eq("stage", "cliente_fechado")
        .not("closed_at", "is", null)
        .order("closed_at")
        .order("id")
        .range(from, to),
    ),
    fetchAllRows("performance-goals", (from, to) =>
      supabase
        .from("sales_goals")
        .select("profile_id, month, goal_cents")
        .gte("month", goalWindowStart(month))
        .lte("month", monthStartDate(month))
        .order("month")
        .order("profile_id")
        .range(from, to),
    ),
    supabase.from("seller_performance").select("profile_id, won_count, lost_count"),
    fetchAllRows("performance-lost", (from, to) =>
      supabase
        .from("leads")
        .select("id, name, company_name, owner_id, source, lost_reason, closed_at, owner:profiles!leads_owner_id_fkey(full_name)")
        .eq("stage", "cliente_perdido")
        .gte("closed_at", lostFrom)
        .lt("closed_at", lostTo)
        .order("closed_at", { ascending: false })
        .order("id")
        .range(from, to),
    ),
  ]);
  if (totals.error) failQuery("seller-performance", totals.error);

  const closedDeals: ClosedDeal[] = deals.map((row) => ({
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    ownerId: row.owner_id,
    dealType: row.deal_type,
    dealValueCents: row.deal_value_cents ?? 0,
    closedAt: row.closed_at as string,
  }));

  const lost: LostDeal[] = lostRows.map((row) => ({
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    ownerId: row.owner_id,
    ownerName: row.owner?.full_name || null,
    source: row.source,
    reason: row.lost_reason ?? "",
    lostAt: row.closed_at as string,
  }));

  const allTime: Record<string, AllTimeTotals> = {};
  for (const row of totals.data ?? []) {
    if (row.profile_id) allTime[row.profile_id] = { wonCount: row.won_count ?? 0, lostCount: row.lost_count ?? 0 };
  }

  return {
    ...buildPerformance({
      month,
      members,
      deals: closedDeals,
      lost,
      goals: goals.map((g) => ({ profileId: g.profile_id, month: g.month, goalCents: g.goal_cents })),
    }),
    canManage: isManager(profile),
    allTime,
  };
}
