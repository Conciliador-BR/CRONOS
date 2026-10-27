import "server-only";
import { cache } from "react";
import { isManager, requireMember } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { computeLeadSourceStats, type LeadSourceStats } from "./lib/lead-stats";
import { sortStages, terminalLabels, toStageKind, type StageColumn, type TerminalLabels } from "./lib/stages";
import type { PerformanceMember } from "./lib/performance";
import type { MemberOption, PipelineLead, StageHistoryEntry } from "./types";

export type { LeadSourceStats } from "./lib/lead-stats";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type QueryError = { message: string; code?: string } | null;

const PAGE_SIZE = 1000;
const AVATAR_URL_TTL = 60 * 60;

/** Falha de leitura: registra sem dados pessoais e mostra o erro genérico da rota. */
export function failQuery(scope: string, error: QueryError): never {
  logger.error({ scope, code: error?.code, message: error?.message }, "comercial: falha na consulta");
  throw new Error("Não foi possível carregar os dados do Comercial.");
}

/** Lê todas as páginas (o PostgREST do Supabase devolve no máximo 1.000 linhas por chamada). */
export async function fetchAllRows<T>(
  scope: string,
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: QueryError }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) failQuery(scope, error);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/** Funcionários ativos com time, comissão e foto (URL assinada de 1 h). Uma vez por requisição. */
export const getActiveMembers = cache(async (): Promise<PerformanceMember[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_path, commission_rate, teams(name)")
    .eq("active", true)
    .order("full_name");
  if (error) failQuery("members", error);

  const paths = (data ?? []).map((p) => p.avatar_path).filter((p): p is string => Boolean(p));
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed, error: signError } = await supabase.storage.from("avatars").createSignedUrls(paths, AVATAR_URL_TTL);
    if (signError) logger.warn({ scope: "avatars", message: signError.message }, "comercial: avatares sem URL assinada");
    for (const item of signed ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.full_name || p.email || "Sem nome",
    teamName: p.teams?.name ?? null,
    commissionRate: Number(p.commission_rate) || 0,
    avatarUrl: p.avatar_path ? (urls.get(p.avatar_path) ?? null) : null,
  }));
});

function toPipelineLead(row: LeadRow): PipelineLead {
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name,
    email: row.email,
    phone: row.phone,
    source: row.source,
    referrerName: row.referrer_name,
    temperature: row.temperature,
    description: row.description,
    ownerId: row.owner_id,
    createdBy: row.created_by,
    stageId: row.stage_id,
    stage: row.stage,
    position: row.position,
    dealType: row.deal_type,
    dealValueCents: row.deal_value_cents,
    lostReason: row.lost_reason,
    closedAt: row.closed_at,
    createdAt: row.created_at,
  };
}

/**
 * Colunas do pipeline em ordem (nomes, tipo e posição). Uma vez por requisição.
 * Sem try/catch: cookies() lança um sinal interno do Next que precisa subir (rota dinâmica).
 */
export const getPipelineStages = cache(async (): Promise<StageColumn[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("id, label, kind, position, legacy_stage")
    .order("position")
    .order("id");
  if (error) failQuery("pipeline-stages", error);
  return sortStages(
    (data ?? []).map((row) => ({
      id: row.id,
      label: row.label,
      kind: toStageKind(row.kind),
      position: row.position,
      legacyStage: row.legacy_stage,
    })),
  );
});

/** Nomes atuais das colunas de fechado e perdido (Desempenho, Insights). */
export async function getTerminalStageLabels(): Promise<TerminalLabels> {
  return terminalLabels(await getPipelineStages());
}

export type PipelineData = {
  leads: PipelineLead[];
  members: MemberOption[];
  currentUserId: string;
  canManage: boolean;
  stages: StageColumn[];
};

/** Todos os leads do pipeline (ordenados por coluna e posição), as colunas e os funcionários ativos. */
export async function getPipelineData(): Promise<PipelineData> {
  const profile = await requireMember();
  const supabase = await createClient();
  const [rows, members, stages] = await Promise.all([
    fetchAllRows("pipeline", (from, to) =>
      supabase.from("leads").select("*").order("stage_id").order("position").order("created_at").order("id").range(from, to),
    ),
    getActiveMembers(),
    getPipelineStages(),
  ]);
  return {
    leads: rows.map(toPipelineLead),
    members: members.map(({ id, name, avatarUrl }) => ({ id, name, avatarUrl })),
    currentUserId: profile.id,
    canManage: isManager(profile),
    stages,
  };
}

/** Histórico de etapas de um lead, do mais recente ao mais antigo. */
export async function getLeadHistory(leadId: string): Promise<StageHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_stage_history")
    .select("id, from_stage, to_stage, from_stage_id, to_stage_id, changed_at, profiles(full_name)")
    .eq("lead_id", leadId)
    .order("changed_at", { ascending: false })
    .limit(100);
  if (error) failQuery("lead-history", error);
  return (data ?? []).map((row) => ({
    id: row.id,
    fromStage: row.from_stage,
    toStage: row.to_stage,
    fromStageId: row.from_stage_id,
    toStageId: row.to_stage_id,
    changedAt: row.changed_at,
    changedByName: row.profiles?.full_name || null,
  }));
}

/** Intervalo por data de criação do lead. Datas em ISO ou Date; `to` é exclusivo. */
export type LeadStatsRange = { from?: Date | string; to?: Date | string };

function iso(value: Date | string) {
  return typeof value === "string" ? value : value.toISOString();
}

/**
 * Leads por origem (marketing, venda, indicação, outro): total, fechados, perdidos, abertos,
 * quentes/frios, fatia e conversão (fechados ÷ total), além do detalhe por mês.
 * Usado por Insights, Marketing e Início. Sem `range`, considera todos os leads.
 */
export async function getLeadSourceStats(range?: LeadStatsRange): Promise<LeadSourceStats> {
  const supabase = await createClient();
  const rows = await fetchAllRows("lead-source-stats", (from, to) => {
    let query = supabase.from("leads").select("source, temperature, stage, created_at");
    if (range?.from) query = query.gte("created_at", iso(range.from));
    if (range?.to) query = query.lt("created_at", iso(range.to));
    return query.order("created_at").order("id").range(from, to);
  });
  return computeLeadSourceStats(
    rows.map((row) => ({ source: row.source, temperature: row.temperature, stage: row.stage, createdAt: row.created_at })),
  );
}

/** Quantidade de leads em aberto (fora de "Cliente fechado" e "Cliente perdido"). */
export async function getOpenLeadsCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .not("stage", "in", "(cliente_fechado,cliente_perdido)");
  if (error) failQuery("open-leads", error);
  return count ?? 0;
}
