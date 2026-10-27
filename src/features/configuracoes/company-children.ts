import "server-only";
import { logger } from "@/lib/logger";
import type { createClient } from "@/lib/supabase/server";
import type { CompanyInput } from "./company-schemas";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const ecRow = (companyId: string, e: CompanyInput["ecs"][number]) => ({
  company_id: companyId,
  acquirer: e.acquirer,
  ec_number: e.ecNumber,
});
const bankRow = (companyId: string, b: CompanyInput["banks"][number]) => ({
  company_id: companyId,
  bank: b.bank,
  agency: b.agency,
  account: b.account,
  account_type: b.accountType,
});

/** Insere ECs e contas de uma empresa nova. Devolve os nomes das partes que falharam. */
export async function insertChildren(supabase: Supabase, companyId: string, input: CompanyInput) {
  const failed: string[] = [];
  if (input.ecs.length) {
    const { error } = await supabase.from("company_ec_numbers").insert(input.ecs.map((e) => ecRow(companyId, e)));
    if (error) {
      logger.error({ code: error.code }, "configuracoes: falha ao inserir ECs");
      failed.push("ECs");
    }
  }
  if (input.banks.length) {
    const { error } = await supabase
      .from("company_bank_accounts")
      .insert(input.banks.map((b) => bankRow(companyId, b)));
    if (error) {
      logger.error({ code: error.code }, "configuracoes: falha ao inserir contas");
      failed.push("contas bancárias");
    }
  }
  return failed;
}

/**
 * Sincroniza ECs e contas na edição: atualiza as linhas que já pertencem à empresa,
 * insere as novas e só então remove as que saíram (assim uma falha não apaga dados).
 */
export async function syncChildren(supabase: Supabase, companyId: string, input: CompanyInput) {
  const [ecs, banks] = await Promise.all([
    syncTable(supabase, "company_ec_numbers", companyId, input.ecs, (e) => ecRow(companyId, e)),
    syncTable(supabase, "company_bank_accounts", companyId, input.banks, (b) => bankRow(companyId, b)),
  ]);
  return [ecs ? null : "ECs", banks ? null : "contas bancárias"].filter((v): v is string => v !== null);
}

async function syncTable<T extends { id?: string }>(
  supabase: Supabase,
  table: "company_ec_numbers" | "company_bank_accounts",
  companyId: string,
  rows: T[],
  toRow: (row: T) => Record<string, unknown>,
) {
  const { data: current, error: readError } = await supabase.from(table).select("id").eq("company_id", companyId);
  if (readError) {
    logger.error({ code: readError.code, table }, "configuracoes: falha ao ler linhas filhas");
    return false;
  }
  const currentIds = new Set(current.map((r) => r.id));
  // Ids enviados pelo navegador só valem se já forem desta empresa.
  const existing = rows.filter((r) => r.id && currentIds.has(r.id));
  const fresh = rows.filter((r) => !r.id || !currentIds.has(r.id));
  const keep = new Set(existing.map((r) => r.id as string));
  const removed = [...currentIds].filter((id) => !keep.has(id));

  for (const row of existing) {
    const { error } = await supabase
      .from(table)
      .update(toRow(row) as never)
      .eq("id", row.id as string)
      .eq("company_id", companyId);
    if (error) {
      logger.error({ code: error.code, table }, "configuracoes: falha ao atualizar linha filha");
      return false;
    }
  }
  if (fresh.length) {
    const { error } = await supabase.from(table).insert(fresh.map(toRow) as never);
    if (error) {
      logger.error({ code: error.code, table }, "configuracoes: falha ao inserir linhas filhas");
      return false;
    }
  }
  if (removed.length) {
    const { error } = await supabase.from(table).delete().eq("company_id", companyId).in("id", removed);
    if (error) {
      logger.error({ code: error.code, table }, "configuracoes: falha ao remover linhas filhas");
      return false;
    }
  }
  return true;
}
