"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { GENERIC_ERROR, type ActionResult } from "./action-result";
import { insertChildren, syncChildren } from "./company-children";
import { companySchema, readCompanyForm, type CompanyInput } from "./company-schemas";
import { issuesToFieldErrors } from "./form-utils";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function revalidateCompanies(id?: string) {
  revalidatePath("/empresas");
  revalidatePath("/inicio");
  revalidatePath("/configuracoes/empresas");
  if (id) revalidatePath(`/configuracoes/empresas/${id}`);
}

const companyRow = (input: CompanyInput, clientId: string | null) => ({
  cnpj: input.cnpj,
  legal_name: input.legalName,
  trade_name: input.tradeName,
  market_name: input.marketName,
  cep: input.cep,
  street: input.street,
  number: input.number,
  complement: input.complement,
  district: input.district,
  city: input.city,
  uf: input.uf,
  client_id: clientId,
});

const invalid = (fieldErrors: Record<string, string[]>): ActionResult => ({
  ok: false,
  error: "Revise os campos destacados.",
  fieldErrors,
});

/** Valida o formulário e as regras que dependem do banco (CNPJ único, cliente existente). */
async function validate(
  supabase: Supabase,
  formData: FormData,
  companyId: string | null,
): Promise<{ error: ActionResult; input?: never } | { error?: never; input: CompanyInput }> {
  const parsed = companySchema.safeParse(readCompanyForm(formData));
  if (!parsed.success) {
    return { error: invalid(issuesToFieldErrors(parsed.error)) };
  }
  const input = parsed.data;
  let duplicate = supabase.from("companies").select("id").eq("cnpj", input.cnpj);
  if (companyId) duplicate = duplicate.neq("id", companyId);
  const [dup, client] = await Promise.all([
    duplicate.maybeSingle(),
    input.clientId ? supabase.from("clients").select("id").eq("id", input.clientId).maybeSingle() : null,
  ]);
  if (dup.data) {
    return { error: invalid({ cnpj: ["Já existe uma empresa com este CNPJ."] }) };
  }
  if (client && !client.data) {
    return { error: invalid({ clientId: ["Cliente não encontrado."] }) };
  }
  return { input };
}

async function insertNewClient(supabase: Supabase, input: CompanyInput) {
  if (!input.newClient) return { id: input.clientId };
  const { data, error } = await supabase.from("clients").insert(input.newClient).select("id").single();
  if (error) {
    logger.error({ code: error.code }, "configuracoes: falha ao criar cliente");
    return { error: "Não foi possível cadastrar o novo cliente. Nada foi salvo." };
  }
  return { id: data.id, created: true };
}

async function removeClient(supabase: Supabase, id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) logger.error({ code: error.code }, "configuracoes: falha ao desfazer cliente criado");
}

function cnpjConflict(code: string | undefined): ActionResult | null {
  return code === "23505" ? invalid({ cnpj: ["Já existe uma empresa com este CNPJ."] }) : null;
}

/** Cria empresa (+ cliente novo, ECs e contas). Se algo falhar, desfaz o que já gravou. */
export async function createCompany(formData: FormData): Promise<ActionResult> {
  await requireRole(["admin", "gestor"]);
  const supabase = await createClient();
  const checked = await validate(supabase, formData, null);
  if (checked.error) return checked.error;
  const input = checked.input;

  const client = await insertNewClient(supabase, input);
  if ("error" in client && client.error) return { ok: false, error: client.error };

  const { data: company, error } = await supabase
    .from("companies")
    .insert(companyRow(input, client.id ?? null))
    .select("id")
    .single();
  if (error) {
    if (client.created && client.id) await removeClient(supabase, client.id);
    logger.error({ code: error.code }, "configuracoes: falha ao criar empresa");
    return cnpjConflict(error.code) ?? { ok: false, error: "Não foi possível salvar a empresa. Nada foi gravado." };
  }

  const failed = await insertChildren(supabase, company.id, input);
  if (failed.length) {
    // Desfaz para não deixar cadastro pela metade (ECs/contas saem em cascata).
    const { error: undoError } = await supabase.from("companies").delete().eq("id", company.id);
    if (client.created && client.id) await removeClient(supabase, client.id);
    if (undoError) {
      logger.error({ code: undoError.code }, "configuracoes: falha ao desfazer empresa");
      revalidateCompanies();
      return {
        ok: false,
        error: `A empresa foi criada, mas não foi possível salvar: ${failed.join(" e ")}. Abra a empresa na lista e complete o cadastro.`,
      };
    }
    return { ok: false, error: `Não foi possível salvar ${failed.join(" e ")}. Nada foi gravado; tente novamente.` };
  }

  revalidateCompanies(company.id);
  redirect(`/configuracoes/empresas/${company.id}?criada=1`);
}

/** Atualiza empresa e sincroniza ECs e contas; informa exatamente o que não foi salvo. */
export async function updateCompany(companyId: string, formData: FormData): Promise<ActionResult> {
  await requireRole(["admin", "gestor"]);
  if (!z.uuid().safeParse(companyId).success) return { ok: false, error: "Empresa inválida." };
  const supabase = await createClient();
  const checked = await validate(supabase, formData, companyId);
  if (checked.error) return checked.error;
  const input = checked.input;

  const client = await insertNewClient(supabase, input);
  if ("error" in client && client.error) return { ok: false, error: client.error };

  const { data: updated, error } = await supabase
    .from("companies")
    .update(companyRow(input, client.id ?? null))
    .eq("id", companyId)
    .select("id")
    .maybeSingle();
  if (error || !updated) {
    if (client.created && client.id) await removeClient(supabase, client.id);
    if (error) logger.error({ code: error.code }, "configuracoes: falha ao atualizar empresa");
    return cnpjConflict(error?.code) ?? { ok: false, error: error ? GENERIC_ERROR : "Empresa não encontrada." };
  }

  const failed = await syncChildren(supabase, companyId, input);
  revalidateCompanies(companyId);
  if (failed.length) {
    return {
      ok: false,
      error: `Os dados da empresa foram salvos, mas não foi possível atualizar: ${failed.join(" e ")}. Revise e salve de novo.`,
    };
  }
  return { ok: true, message: "Empresa salva." };
}

/** Exclui a empresa (ECs, contas e registros de PDF em cascata) e os arquivos no Storage. */
export async function deleteCompany(companyId: string): Promise<ActionResult> {
  await requireRole(["admin", "gestor"]);
  if (!z.uuid().safeParse(companyId).success) return { ok: false, error: "Empresa inválida." };
  const supabase = await createClient();
  const { data: docs } = await supabase.from("company_documents").select("storage_path").eq("company_id", companyId);
  const { error } = await supabase.from("companies").delete().eq("id", companyId);
  if (error) {
    logger.error({ code: error.code }, "configuracoes: falha ao excluir empresa");
    return { ok: false, error: "Não foi possível excluir a empresa." };
  }
  const paths = (docs ?? []).map((d) => d.storage_path);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("company-docs").remove(paths);
    if (storageError) logger.warn({ count: paths.length }, "configuracoes: PDFs órfãos após excluir empresa");
  }
  revalidateCompanies();
  return { ok: true, message: "Empresa excluída." };
}
