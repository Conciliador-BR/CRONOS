"use server";

import { createClient } from "@/lib/supabase/server";
import { invalid, requireManager, revalidateComercial, stageFailure, type DbError } from "./action-helpers";
import { planStageDeletion, positionForNewStage, toStageKind } from "./lib/stages";
import {
  createStageSchema,
  deleteStageSchema,
  moveStageSchema,
  renameStageSchema,
  type CreateStageInput,
  type DeleteStageInput,
  type MoveStageInput,
  type RenameStageInput,
} from "./schemas";
import type { ActionResult, DataResult } from "./types";

const ONLY_MANAGERS = "Só administradores e gestores alteram as etapas do pipeline.";
const STALE = "Esta etapa não existe mais. Atualize a página.";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function readStages(supabase: Supabase) {
  const { data, error } = await supabase.from("pipeline_stages").select("id, kind, position");
  return { stages: (data ?? []).map((row) => ({ ...row, kind: toStageKind(row.kind) })), error };
}

/** Cria uma coluna aberta (só admin/gestor): depois de `afterId` ou antes da coluna de fechado. */
export async function createStage(input: CreateStageInput): Promise<DataResult<{ id: string }>> {
  const parsed = createStageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await requireManager())) return { ok: false, error: ONLY_MANAGERS };
  const supabase = await createClient();

  const { stages, error: readError } = await readStages(supabase);
  if (readError) return stageFailure("create-stage-read", readError);

  const { data, error } = await supabase
    .from("pipeline_stages")
    .insert({ label: parsed.data.label, kind: "aberto", position: positionForNewStage(stages, parsed.data.afterId) })
    .select("id")
    .single();
  if (error) return stageFailure("create-stage", error);

  revalidateComercial();
  return { ok: true, data: { id: data.id } };
}

/** Renomeia uma coluna (só admin/gestor). Os leads continuam nela; só o nome exibido muda. */
export async function renameStage(input: RenameStageInput): Promise<ActionResult> {
  const parsed = renameStageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await requireManager())) return { ok: false, error: ONLY_MANAGERS };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pipeline_stages")
    .update({ label: parsed.data.label })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return stageFailure("rename-stage", error);
  if (!data?.length) return { ok: false, error: STALE };

  revalidateComercial();
  return { ok: true };
}

/** Muda a coluna de lugar (só admin/gestor). A posição vem calculada entre as vizinhas. */
export async function moveStage(input: MoveStageInput): Promise<ActionResult> {
  const parsed = moveStageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await requireManager())) return { ok: false, error: ONLY_MANAGERS };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pipeline_stages")
    .update({ position: parsed.data.position })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return stageFailure("move-stage", error);
  if (!data?.length) return { ok: false, error: STALE };

  revalidateComercial();
  return { ok: true };
}

/**
 * Exclui uma coluna aberta (só admin/gestor). Se tiver leads, eles vão antes para `moveLeadsTo`
 * (outra coluna aberta) e o histórico registra a mudança. Fechado e perdido não saem.
 */
export async function deleteStage(input: DeleteStageInput): Promise<ActionResult> {
  const parsed = deleteStageSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await requireManager())) return { ok: false, error: ONLY_MANAGERS };
  const supabase = await createClient();

  const { id, moveLeadsTo } = parsed.data;
  const [{ stages, error: readError }, { count, error: countError }] = await Promise.all([
    readStages(supabase),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("stage_id", id),
  ]);
  if (readError || countError) return stageFailure("delete-stage-read", readError ?? countError);

  const plan = planStageDeletion(stages, id, moveLeadsTo, count ?? 0);
  if (!plan.ok) {
    return { ok: false, error: plan.error, fieldErrors: plan.field ? { [plan.field]: [plan.error] } : undefined };
  }

  // Move os leads e apaga a coluna numa única transação (função no banco).
  const rpc = await supabase.rpc("delete_pipeline_stage", { p_stage_id: id, p_move_to: plan.moveLeadsTo ?? undefined });
  let error: DbError = rpc.error;
  // PGRST202: função ainda não criada no banco (migration 20261027190000 pendente). Faz em duas etapas.
  if (error?.code === "PGRST202") error = await deleteStageInSteps(supabase, id, plan.moveLeadsTo);
  if (error) {
    revalidateComercial();
    return error.code === "P0002" ? { ok: false, error: STALE } : stageFailure("delete-stage", error);
  }

  revalidateComercial();
  return { ok: true };
}

/** Caminho antigo (sem transação), usado só enquanto a função do banco não existir. */
async function deleteStageInSteps(
  supabase: Supabase,
  id: string,
  moveLeadsTo: string | null,
): Promise<DbError> {
  if (moveLeadsTo) {
    const { error } = await supabase.from("leads").update({ stage_id: moveLeadsTo }).eq("stage_id", id);
    if (error) return error;
  }
  const { data, error } = await supabase.from("pipeline_stages").delete().eq("id", id).select("id");
  if (error) return error;
  return data?.length ? null : { code: "P0002", message: "Etapa não encontrada." };
}
