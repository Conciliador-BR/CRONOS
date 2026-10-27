"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { requireMember, requireRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { COMERCIAL_PATHS } from "./constants";
import { POSITION_STEP } from "./lib/positions";
import { planStageMove } from "./lib/stage-transition";
import { getLeadHistory } from "./queries";
import {
  createLeadSchema,
  leadIdSchema,
  moveLeadSchema,
  renameStageSchema,
  salesGoalSchema,
  updateLeadSchema,
  type CreateLeadInput,
  type MoveLeadInput,
  type RenameStageInput,
  type SalesGoalInput,
  type UpdateLeadInput,
} from "./schemas";
import type { ActionError, ActionResult, DataResult, StageHistoryEntry } from "./types";
import { monthStartDate } from "./lib/months";

type DbError = { code?: string; message: string } | null;

const NO_PERMISSION = "Você não tem permissão para alterar este lead. Só o responsável, quem criou ou um gestor podem.";

function invalid(error: z.ZodError): ActionError {
  return {
    ok: false,
    error: "Revise os campos destacados.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  };
}

/** Registra o erro (sem dados pessoais) e devolve uma mensagem amigável. */
function dbFailure(scope: string, error: DbError): ActionError {
  logger.error({ scope, code: error?.code, message: error?.message }, "comercial: falha ao gravar");
  if (error?.code === "42501") return { ok: false, error: NO_PERMISSION };
  if (error?.code === "23514") return { ok: false, error: "Dados incompletos para esta etapa. Revise e tente de novo." };
  return { ok: false, error: "Não foi possível salvar agora. Tente de novo em instantes." };
}

function revalidateComercial() {
  for (const path of COMERCIAL_PATHS) revalidatePath(path);
}

async function requireManager() {
  try {
    return await requireRole(["admin", "gestor"]);
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

async function currentStage(supabase: Awaited<ReturnType<typeof createClient>>, leadId: string) {
  const { data, error } = await supabase.from("leads").select("stage").eq("id", leadId).maybeSingle();
  return { stage: data?.stage ?? null, error };
}

/** Cria um lead em "Lead recebido", no topo da coluna. */
export async function createLead(input: CreateLeadInput): Promise<ActionResult> {
  const profile = await requireMember();
  const parsed = createLeadSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();

  const { data: first } = await supabase
    .from("leads")
    .select("position")
    .eq("stage", "lead_recebido")
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
    stage: "lead_recebido",
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
 * Move o lead de etapa e/ou posição. Entrar em "Cliente fechado" exige tipo e valor; em
 * "Cliente perdido", o motivo. Sair dessas etapas limpa os campos correspondentes.
 */
export async function moveLead(input: MoveLeadInput): Promise<ActionResult> {
  await requireMember();
  const parsed = moveLeadSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();

  const move = parsed.data;
  const { stage, error: readError } = await currentStage(supabase, move.leadId);
  if (readError) return dbFailure("move-lead-read", readError);
  if (!stage) return { ok: false, error: "Lead não encontrado. Atualize a página." };

  const plan = planStageMove(stage, move.toStage, move.position, {
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

/** Renomeia uma etapa do pipeline (só admin/gestor). A etapa continua a mesma; só o nome exibido muda. */
export async function renameStage(input: RenameStageInput): Promise<ActionResult> {
  const parsed = renameStageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const profile = await requireManager();
  if (!profile) return { ok: false, error: "Só administradores e gestores renomeiam etapas." };
  const supabase = await createClient();

  const { stage, label } = parsed.data;
  const { data, error } = await supabase
    .from("pipeline_stage_labels")
    .update({ label, updated_by: profile.id })
    .eq("stage", stage)
    .select("stage");
  if (error) return dbFailure("rename-stage", error);
  if (!data?.length) return { ok: false, error: "Não foi possível renomear esta etapa. Atualize a página e tente de novo." };

  revalidateComercial();
  return { ok: true };
}
