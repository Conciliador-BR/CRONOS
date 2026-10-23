import "server-only";
import { createClient } from "@/lib/supabase/server";
import { groupLostReasons, rankReferrers, type KeywordGroup, type ReasonGroup, type ReferrerStats } from "./lib/lead-stats";
import { periodStart, type Period } from "./lib/periods";
import { fetchAllRows, getLeadSourceStats, type LeadSourceStats } from "./queries";

export type LostLead = {
  id: string;
  name: string;
  companyName: string | null;
  reason: string;
  ownerName: string | null;
  lostAt: string | null;
};

export type InsightsData = {
  period: Period;
  sources: LeadSourceStats;
  referrers: ReferrerStats[];
  lost: LostLead[];
  reasonGroups: { phrases: ReasonGroup[]; keywords: KeywordGroup[] };
};

/**
 * Insights do período: origens e conversão (por data de criação do lead), ranking de indicadores
 * e motivos de perda (por data em que o lead foi perdido).
 */
export async function getInsightsData(period: Period): Promise<InsightsData> {
  const from = periodStart(period);
  const supabase = await createClient();

  const [sources, referred, lostRows] = await Promise.all([
    getLeadSourceStats(from ? { from } : undefined),
    fetchAllRows("insights-referrers", (start, end) => {
      let query = supabase
        .from("leads")
        .select("referrer_name, stage, deal_value_cents")
        .eq("source", "indicacao");
      if (from) query = query.gte("created_at", from);
      return query.order("created_at").order("id").range(start, end);
    }),
    fetchAllRows("insights-lost", (start, end) => {
      let query = supabase
        .from("leads")
        .select("id, name, company_name, lost_reason, closed_at, owner:profiles!leads_owner_id_fkey(full_name)")
        .eq("stage", "cliente_perdido");
      if (from) query = query.gte("closed_at", from);
      return query.order("closed_at", { ascending: false }).order("id").range(start, end);
    }),
  ]);

  const lost: LostLead[] = lostRows.map((row) => ({
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    reason: row.lost_reason ?? "",
    ownerName: row.owner?.full_name || null,
    lostAt: row.closed_at,
  }));

  return {
    period,
    sources,
    referrers: rankReferrers(
      referred.map((r) => ({ referrerName: r.referrer_name, stage: r.stage, dealValueCents: r.deal_value_cents })),
    ),
    lost,
    reasonGroups: groupLostReasons(lost.map((l) => l.reason)),
  };
}
