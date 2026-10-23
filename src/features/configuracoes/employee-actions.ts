"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { hasServiceRoleKey } from "@/lib/env";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./action-result";
import { issuesToFieldErrors, text } from "./form-utils";
import { readAvatar, saveAvatar, saveGoal } from "./people-helpers";
import { employeeCreateSchema, employeeUpdateSchema, goalField, passwordField, readEmployeeForm } from "./people-schemas";

const NO_KEY = "Configure SUPABASE_SERVICE_ROLE_KEY no servidor para gerenciar logins.";

function revalidatePeople() {
  revalidatePath("/configuracoes/funcionarios");
  revalidatePath("/configuracoes/times");
  revalidatePath("/comercial", "layout");
}

const invalid = (fieldErrors: Record<string, string[]>): ActionResult => ({
  ok: false,
  error: "Revise os campos destacados.",
  fieldErrors,
});

function warningFor(failed: string[]) {
  return failed.length ? `Não foi possível salvar: ${failed.join(" e ")}. Tente de novo pela edição.` : undefined;
}

/** Admin cria o login (service role) e completa o perfil, a meta e a foto. */
export async function createEmployee(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);
  if (!hasServiceRoleKey()) return { ok: false, error: NO_KEY };
  const parsed = employeeCreateSchema.safeParse(readEmployeeForm(formData));
  const avatar = readAvatar(formData);
  if (!parsed.success || typeof avatar === "string") {
    const errors = parsed.success ? {} : issuesToFieldErrors(parsed.error);
    if (typeof avatar === "string") errors.avatar = [avatar];
    return invalid(errors);
  }
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
    app_metadata: { cronos_invited: true, cronos_role: input.role },
  });
  if (error || !created.user) {
    if (error?.code === "weak_password") return invalid({ password: ["Senha fraca. Use letras e números."] });
    if (error?.code === "email_exists" || error?.code === "user_already_exists") {
      return invalid({ email: ["Já existe um login com este e-mail."] });
    }
    logger.error({ code: error?.code }, "configuracoes: falha ao criar login");
    return { ok: false, error: "Não foi possível criar o login. Tente novamente." };
  }
  const userId = created.user.id;

  // O perfil nasce pelo trigger handle_new_user (ativo, com o papel); completamos os demais campos.
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      job_title: input.jobTitle,
      team_id: input.teamId,
      commission_rate: input.commissionRate,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();
  if (profileError || !profile) {
    logger.error({ code: profileError?.code }, "configuracoes: falha ao completar perfil; desfazendo login");
    const { error: undoError } = await admin.auth.admin.deleteUser(userId);
    if (undoError) logger.error({ code: undoError.code }, "configuracoes: falha ao desfazer login");
    return { ok: false, error: "Não foi possível salvar o perfil. O login não foi criado." };
  }

  const failed: string[] = [];
  if (input.goal !== null && !(await saveGoal(supabase, userId, input.goal))) failed.push("a meta do mês");
  if (avatar && !(await saveAvatar(supabase, userId, avatar))) failed.push("a foto");
  logger.info({ role: input.role }, "configuracoes: funcionário criado");
  revalidatePeople();
  return { ok: true, message: "Funcionário cadastrado. Ele já pode entrar com o e-mail e a senha inicial.", warning: warningFor(failed) };
}

/** Admin edita perfil, papel, time, comissão, meta e foto. Não pode tirar o próprio papel de admin. */
export async function updateEmployee(profileId: string, formData: FormData): Promise<ActionResult> {
  const me = await requireRole(["admin"]);
  if (!z.uuid().safeParse(profileId).success) return { ok: false, error: "Funcionário inválido." };
  const parsed = employeeUpdateSchema.safeParse(readEmployeeForm(formData));
  const avatar = readAvatar(formData);
  if (!parsed.success || typeof avatar === "string") {
    const errors = parsed.success ? {} : issuesToFieldErrors(parsed.error);
    if (typeof avatar === "string") errors.avatar = [avatar];
    return invalid(errors);
  }
  const input = parsed.data;
  if (profileId === me.id && input.role !== "admin") {
    return invalid({ role: ["Você não pode remover o seu próprio papel de administrador."] });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      job_title: input.jobTitle,
      team_id: input.teamId,
      role: input.role,
      commission_rate: input.commissionRate,
    })
    .eq("id", profileId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    if (error) logger.error({ code: error.code }, "configuracoes: falha ao atualizar funcionário");
    return { ok: false, error: data === null && !error ? "Funcionário não encontrado." : "Não foi possível salvar." };
  }

  const failed: string[] = [];
  if (!(await saveGoal(supabase, profileId, input.goal))) failed.push("a meta do mês");
  if (avatar && !(await saveAvatar(supabase, profileId, avatar))) failed.push("a foto");
  revalidatePeople();
  return { ok: true, message: "Funcionário atualizado.", warning: warningFor(failed) };
}

/** Admin ativa ou desativa o acesso. Ninguém desativa a si mesmo. */
export async function setEmployeeActive(profileId: string, active: boolean): Promise<ActionResult> {
  const me = await requireRole(["admin"]);
  if (!z.uuid().safeParse(profileId).success) return { ok: false, error: "Funcionário inválido." };
  if (profileId === me.id) return { ok: false, error: "Você não pode desativar o seu próprio acesso." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ active: Boolean(active) })
    .eq("id", profileId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    if (error) logger.error({ code: error.code }, "configuracoes: falha ao alterar acesso");
    return { ok: false, error: "Não foi possível alterar o acesso." };
  }
  revalidatePeople();
  return { ok: true, message: active ? "Acesso ativado." : "Acesso desativado." };
}

/** Admin define uma nova senha (service role). */
export async function resetEmployeePassword(profileId: string, formData: FormData): Promise<ActionResult> {
  await requireRole(["admin"]);
  if (!hasServiceRoleKey()) return { ok: false, error: NO_KEY };
  if (!z.uuid().safeParse(profileId).success) return { ok: false, error: "Funcionário inválido." };
  const parsed = passwordField.safeParse(formData.get("password") ?? "");
  if (!parsed.success) return invalid({ password: parsed.error.issues.map((i) => i.message) });
  const { error } = await createAdminClient().auth.admin.updateUserById(profileId, { password: parsed.data });
  if (error) {
    logger.error({ code: error.code }, "configuracoes: falha ao redefinir senha");
    if (error.code === "weak_password") return invalid({ password: ["Senha fraca. Use letras e números."] });
    return { ok: false, error: "Não foi possível redefinir a senha." };
  }
  return { ok: true, message: "Senha redefinida. Informe a nova senha ao funcionário." };
}

/** Admin ou gestor define a meta do mês corrente (vazio remove). */
export async function setEmployeeGoal(profileId: string, formData: FormData): Promise<ActionResult> {
  await requireRole(["admin", "gestor"]);
  if (!z.uuid().safeParse(profileId).success) return { ok: false, error: "Funcionário inválido." };
  const parsed = goalField.safeParse(text(formData, "goal"));
  if (!parsed.success) return invalid({ goal: parsed.error.issues.map((i) => i.message) });
  const supabase = await createClient();
  if (!(await saveGoal(supabase, profileId, parsed.data))) return { ok: false, error: "Não foi possível salvar a meta." };
  revalidatePeople();
  return { ok: true, message: parsed.data === null ? "Meta removida." : "Meta salva." };
}
