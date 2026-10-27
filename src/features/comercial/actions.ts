"use server";

import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NO_PERMISSION, dbFailure, invalid, requireManager, revalidateComercial } from "./action-helpers";
import { POSITION_STEP } from "./lib/positions";
import { planStageMove } from "./lib/stage-transition";
import { toStageKind } from "./lib/stages";
import { getLeadHistory } from "./queries";
import {
  createLeadSchema,
  leadIdSchema,
  moveLeadSchema,
  salesGoalSchema,
  updateLeadSchema,
  type CreateLeadInput,
  type MoveLeadInput,
  type SalesGoalInput,
  type UpdateLeadInput,
} from "./schemas";
import type { ActionResult, DataResult, StageHistoryEntry } from "./types";
import { monthStartDate } from "./lib/months";

async function currentStage(supabase: Awaited<ReturnType<typeof createClient>>, leadId: string) {
  const { data, error } = await supabase.from("leads").select("stage").eq("id", leadId).maybeSingle();
  return { stage: data?.stage ?? null, error };
}

/** Cria um lead na primeira coluna aberta do pipeline, no topo da coluna. */
export async function createLead(input: CreateLeadInput): Promise<ActionResult> {
  const profile = await requireMember();
  const parsed = createLeadSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();

  const { data: column, error: columnError } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("kind", "aberto")
    .order("position")
    .order("id")
    .limit(1)
    .maybeSingle();
  if (columnError) return dbFailure("create-lead-stage", columnError);
  if (!column) return { ok: false, error: "O pipeline não tem etapa aberta. Peça a um gestor para criar uma." };

  const { data: first } = await supabase
    .from("leads")
    .select("position")
    .eq("stage_id", column.id)
    .order("position")
    .limit(1)
    .maybeSingle();

  const lead = parsed.data;
  const { error } = await supabase.from("leads").insert({
    name: lead.name,
    company_name: lead.companyName,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    referrer_name: lead.source === "indicacao" ? lead.referrerName : null,
    temperature: lead.temperature,
    description: lead.description,
    owner_id: lead.ownerId,
    stage_id: column.id,
    position: first ? first.position - POSITION_STEP : 0,
    created_by: profile.id,
  });
  if (error) return dbFailure("create-lead", error);

  revalidateComercial();
  return { ok: true };
}

/** Edita os dados do lead. Tipo/valor só valem em "Cliente fechado"; motivo só em "Cliente perdido". */
export async function updateLead(input: UpdateLeadInput): Promise<ActionResult> {
  await requireMember();
  const parsed = updateLeadSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();

  const lead = parsed.data;
  const { stage, error: readError } = await currentStage(supabase, lead.id);
  if (readError) return dbFailure("update-lead-read", readError);
  if (!stage) return { ok: false, error: "Lead não encontrado." };

  const extra: { deal_type?: typeof lead.dealType; deal_value_cents?: number; lost_reason?: string } = {};
  if (stage === "cliente_fechado") {
    if (!lead.dealType || !lead.dealValue) {
      return { ok: false, error: "Informe o tipo e o valor do negócio.", fieldErrors: { dealValue: ["Informe o valor."] } };
    }
    extra.deal_type = lead.dealType;
    extra.deal_value_cents = lead.dealValue;
  }
  if (stage === "cliente_perdido") {
    if (!lead.lostReason) {
      return { ok: false, error: "Informe o motivo da perda.", fieldErrors: { lostReason: ["Conte por que o cliente não fechou."] } };
    }
    extra.lost_reason = lead.lostReason;
  }

  const { data, error } = await supabase
    .from("leads")
    .update({
      name: lead.name,
      company_name: lead.companyName,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      referrer_name: lead.source === "indicacao" ? lead.referrerName : null,
      temperature: lead.temperature,
      description: lead.description,
      owner_id: lead.ownerId,
      ...extra,
    })
    .eq("id", lead.id)
    .select("id");
  if (error) return dbFailure("update-lead", error);
  if (!data?.length) return { ok: false, error: NO_PERMISSION };

  revalidateComercial();
  return { ok: true };
}

/**
 * Move o lead de coluna e/ou posição. Entrar na coluna de fechado exige tipo e valor; na de
 * perdido, o motivo (pelo tipo da coluna, lido do banco). Ir para coluna aberta limpa esses campos.
 */
export async function moveLead(input: MoveLeadInput): Promise<ActionResult> {
  await requireMember();
  const parsed = moveLeadSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();

  const move = parsed.data;
  const [{ data: lead, error: readError }, { data: target, error: targetError }] = await Promise.all([
    supabase.from("leads").select("stage_id").eq("id", move.leadId).maybeSingle(),
    supabase.from("pipeline_stages").select("id, kind").eq("id", move.toStageId).maybeSingle(),
  ]);
  if (readError || targetError) return dbFailure("move-lead-read", readError ?? targetError);
  if (!lead) return { ok: false, error: "Lead não encontrado. Atualize a página." };
  if (!target) return { ok: false, error: "Esta etapa não existe mais. Atualize a página." };

  const plan = planStageMove(lead.stage_id, { id: target.id, kind: toStageKind(target.kind) }, move.position, {
    dealType: move.dealType,
    dealValueCents: move.dealValue,
    lostReason: move.lostReason,
  });
  if (!plan.ok) return { ok: false, error: plan.error };

  const { data, error } = await supabase.from("leads").update(plan.patch).eq("id", move.leadId).select("id");
  if (error) return dbFailure("move-lead", error);
  if (!data?.length) return { ok: false, error: NO_PERMISSION };

  revalidateComercial();
  return { ok: true };
}

/** Exclui um lead (só admin/gestor). */
export async function deleteLead(leadId: string): Promise<ActionResult> {
  const parsed = leadIdSchema.safeParse(leadId);
  if (!parsed.success) return { ok: false, error: "Lead inválido." };
  if (!(await requireManager())) return { ok: false, error: "Só administradores e gestores excluem leads." };
  const supabase = await createClient();

  const { data, error } = await supabase.from("leads").delete().eq("id", parsed.data).select("id");
  if (error) return dbFailure("delete-lead", error);
  if (!data?.length) return { ok: false, error: "Lead não encontrado ou sem permissão para excluir." };

  revalidateComercial();
  return { ok: true };
}

/** Histórico de etapas para a gaveta do lead (leitura sob demanda). */
export async function loadLeadHistory(leadId: string): Promise<DataResult<StageHistoryEntry[]>> {
  const parsed = leadIdSchema.safeParse(leadId);
  if (!parsed.success) return { ok: false, error: "Lead inválido." };
  await requireMember();
  try {
    return { ok: true, data: await getLeadHistory(parsed.data) };
  } catch {
    return { ok: false, error: "Não foi possível carregar o histórico." };
  }
}

/** Define a meta mensal de um funcionário (só admin/gestor). Meta 0 remove a meta. */
export async function setSalesGoal(input: SalesGoalInput): Promise<ActionResult> {
  const parsed = salesGoalSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await requireManager())) return { ok: false, error: "Só administradores e gestores definem metas." };
  const supabase = await createClient();

  const { profileId, month, goal } = parsed.data;
  const monthDate = monthStartDate(month);
  const { error } =
    goal === 0
      ? await supabase.from("sales_goals").delete().eq("profile_id", profileId).eq("month", monthDate)
      : await supabase
          .from("sales_goals")
          .upsert({ profile_id: profileId, month: monthDate, goal_cents: goal }, { onConflict: "profile_id,month" });
  if (error) return dbFailure("set-sales-goal", error);

  revalidateComercial();
  return { ok: true };
}
