import "server-only";
import { createClient } from "@/lib/supabase/server";
import { branchLabel, branchOrder } from "../relatorios/company-label";
import { PROGRESS_STATUSES, type ProgressStatus } from "./progress";
import { getAcquirers } from "./queries";
import type { AcquirerSummary } from "./types";

export type ProgressCompany = { id: string; name: string; detail: string; order: number | null };
/** Situação de uma empresa numa adquirente. Sem registro = Não iniciado, sem anotação. */
export type ProgressEntry = { status?: ProgressStatus; note: string; removed: boolean; files: number };
export type ProgressBoardData = {
  acquirers: AcquirerSummary[];
  companies: ProgressCompany[];
  /** `${acquirerId}:${companyId}` → situação. */
  entries: Record<string, ProgressEntry>;
};

const key = (acquirerId: string, companyId: string) => `${acquirerId}:${companyId}`;

const isStatus = (value: string | null): value is ProgressStatus =>
  value !== null && (PROGRESS_STATUSES as readonly string[]).includes(value);

/** Pipeline da aba Progresso: adquirentes (etapas, com logo) × empresas cadastradas. */
export async function getProgressBoard(): Promise<ProgressBoardData> {
  const supabase = await createClient();
  const [acquirers, companiesRes, progressRes, filesRes] = await Promise.all([
    getAcquirers(),
    supabase.from("companies").select("id, cnpj, legal_name, trade_name, market_name, uf, city, parent_company_id, branch_number"),
    supabase.from("acquirer_company_progress").select("acquirer_id, company_id, status, note, removed"),
    supabase.from("acquirer_progress_files").select("acquirer_id, company_id"),
  ]);
  if (companiesRes.error || progressRes.error || filesRes.error) throw new Error("Falha ao carregar o progresso");

  const companies = (companiesRes.data ?? [])
    .map((row) => {
      const order = branchOrder(row.parent_company_id, row.branch_number, row.cnpj);
      const place = row.city ? `${row.city}/${row.uf}` : row.uf;
      return { id: row.id, name: row.market_name || row.trade_name || row.legal_name, detail: `${branchLabel(order)} · ${place}`, order };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || (a.order ?? 9999) - (b.order ?? 9999));

  const entries: Record<string, ProgressEntry> = {};
  const entry = (id: string) => (entries[id] ??= { note: "", removed: false, files: 0 });
  for (const row of progressRes.data ?? []) {
    const item = entry(key(row.acquirer_id, row.company_id));
    if (isStatus(row.status)) item.status = row.status;
    item.note = row.note;
    item.removed = row.removed;
  }
  for (const row of filesRes.data ?? []) entry(key(row.acquirer_id, row.company_id)).files += 1;
  return { acquirers, companies, entries };
}
