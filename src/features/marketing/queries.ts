import "server-only";
import { requireMember } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { MarketingLead } from "./metrics";

/** Leads de origem marketing, mais recentes primeiro (consulta própria do módulo). */
export async function getMarketingLeads(): Promise<MarketingLead[]> {
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, company_name, stage, stage_id, temperature, created_at, deal_value_cents")
    .eq("source", "marketing")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) {
    logger.error({ code: error.code }, "marketing: falha ao listar leads");
    throw new Error("Não foi possível carregar os leads de marketing.");
  }
  return data.map((l) => ({
    id: l.id,
    name: l.name,
    companyName: l.company_name,
    stage: l.stage,
    stageId: l.stage_id,
    temperature: l.temperature,
    createdAt: l.created_at,
    dealValueCents: l.deal_value_cents,
  }));
}
