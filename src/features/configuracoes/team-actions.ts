"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./action-result";
import { issuesToFieldErrors, text } from "./form-utils";
import { teamSchema } from "./people-schemas";

function revalidateTeams() {
  revalidatePath("/configuracoes/times");
  revalidatePath("/configuracoes/funcionarios");
}

/** Cria (teamId null) ou renomeia um time. */
export async function saveTeam(teamId: string | null, formData: FormData): Promise<ActionResult> {
  await requireRole(["admin", "gestor"]);
  if (teamId !== null && !z.uuid().safeParse(teamId).success) return { ok: false, error: "Time inválido." };
  const parsed = teamSchema.safeParse({ name: text(formData, "name") });
  if (!parsed.success) {
    return { ok: false, error: "Revise o nome do time.", fieldErrors: issuesToFieldErrors(parsed.error) };
  }
  const supabase = await createClient();
  const { data, error } = teamId
    ? await supabase.from("teams").update(parsed.data).eq("id", teamId).select("id").maybeSingle()
    : await supabase.from("teams").insert(parsed.data).select("id").single();
  if (error?.code === "23505") {
    return { ok: false, error: "Revise o nome do time.", fieldErrors: { name: ["Já existe um time com este nome."] } };
  }
  if (error || !data) {
    if (error) logger.error({ code: error.code }, "configuracoes: falha ao salvar time");
    return { ok: false, error: "Não foi possível salvar o time." };
  }
  revalidateTeams();
  return { ok: true, message: teamId ? "Time renomeado." : "Time criado." };
}

/** Exclui o time; os membros ficam sem time (on delete set null). */
export async function deleteTeam(teamId: string): Promise<ActionResult> {
  await requireRole(["admin", "gestor"]);
  if (!z.uuid().safeParse(teamId).success) return { ok: false, error: "Time inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("teams").delete().eq("id", teamId).select("id").maybeSingle();
  if (error || !data) {
    if (error) logger.error({ code: error.code }, "configuracoes: falha ao excluir time");
    return { ok: false, error: "Não foi possível excluir o time." };
  }
  revalidateTeams();
  return { ok: true, message: "Time excluído." };
}
