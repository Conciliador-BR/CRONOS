"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./action-result";
import { clientSchema, readClientForm } from "./company-schemas";
import { issuesToFieldErrors } from "./form-utils";

function revalidateClients() {
  revalidatePath("/configuracoes/empresas");
  revalidatePath("/empresas");
}

/** Cria (clientId null) ou atualiza um cliente. */
export async function saveClient(clientId: string | null, formData: FormData): Promise<ActionResult> {
  await requireRole(["admin", "gestor"]);
  if (clientId !== null && !z.uuid().safeParse(clientId).success) return { ok: false, error: "Cliente inválido." };
  const parsed = clientSchema.safeParse(readClientForm(formData));
  if (!parsed.success) {
    return { ok: false, error: "Revise os campos destacados.", fieldErrors: issuesToFieldErrors(parsed.error) };
  }
  const supabase = await createClient();
  const { data, error } = clientId
    ? await supabase.from("clients").update(parsed.data).eq("id", clientId).select("id").maybeSingle()
    : await supabase.from("clients").insert(parsed.data).select("id").single();
  if (error || !data) {
    if (error) logger.error({ code: error.code }, "configuracoes: falha ao salvar cliente");
    return { ok: false, error: data === null && !error ? "Cliente não encontrado." : "Não foi possível salvar o cliente." };
  }
  revalidateClients();
  return { ok: true, message: clientId ? "Cliente atualizado." : "Cliente cadastrado." };
}

/** Exclui o cliente; as empresas vinculadas ficam sem cliente (on delete set null). */
export async function deleteClient(clientId: string): Promise<ActionResult> {
  await requireRole(["admin", "gestor"]);
  if (!z.uuid().safeParse(clientId).success) return { ok: false, error: "Cliente inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").delete().eq("id", clientId).select("id").maybeSingle();
  if (error || !data) {
    if (error) logger.error({ code: error.code }, "configuracoes: falha ao excluir cliente");
    return { ok: false, error: "Não foi possível excluir o cliente." };
  }
  revalidateClients();
  return { ok: true, message: "Cliente excluído." };
}
