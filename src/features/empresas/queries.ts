import "server-only";
import { cache } from "react";
import { isManager, requireMember } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { marketLabel, type CompanySummary } from "./map-utils";

/** Todas as empresas, só com os campos do mapa e da busca (RLS: membros leem). */
export const getCompanySummaries = cache(async (): Promise<CompanySummary[]> => {
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, uf, city, cnpj, legal_name, trade_name, market_name, latitude, longitude, parent_company_id, client:clients(name)",
    )
    .order("legal_name");
  if (error) {
    logger.error({ code: error.code }, "empresas: falha ao listar empresas");
    throw new Error("Não foi possível carregar as empresas.");
  }
  return data.map((c) => ({
    id: c.id,
    uf: c.uf,
    city: c.city,
    cnpj: c.cnpj,
    legalName: c.legal_name,
    tradeName: c.trade_name,
    marketName: c.market_name,
    clientName: c.client?.name ?? null,
    latitude: c.latitude === null ? null : Number(c.latitude),
    longitude: c.longitude === null ? null : Number(c.longitude),
    parentId: c.parent_company_id,
  }));
});

/** Empresa relacionada (matriz ou filial) com o nome exibido e o local. */
export type RelatedCompany = { id: string; name: string; city: string | null; uf: string };

const RELATED_COLUMNS = "id, legal_name, trade_name, market_name, city, uf";

export type CompanyDetail = {
  company: {
    id: string;
    cnpj: string;
    legalName: string;
    tradeName: string | null;
    marketName: string | null;
    cep: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    district: string | null;
    city: string | null;
    uf: string;
    cnae: string | null;
    cnaeDescription: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  /** Matriz, quando a empresa é filial. */
  parent: RelatedCompany | null;
  /** Filiais, quando a empresa é matriz. */
  branches: RelatedCompany[];
  ecs: { id: string; acquirer: string; ecNumber: string }[];
  client: {
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
  } | null;
  /** null quando o usuário não é admin/gestor (dados restritos). */
  restricted: null | {
    bankAccounts: { id: string; bank: string; agency: string; account: string; accountType: string | null }[];
    documents: { id: string; fileName: string; sizeBytes: number; createdAt: string }[];
  };
};

/** Detalhe completo da empresa. Dados bancários e PDFs só para admin/gestor. */
export async function getCompanyDetail(id: string): Promise<CompanyDetail | null> {
  const profile = await requireMember();
  const manager = isManager(profile);
  const supabase = await createClient();

  const companyPromise = supabase
    .from("companies")
    .select(
      "id, cnpj, legal_name, trade_name, market_name, cep, street, number, complement, district, city, uf, " +
        "cnae, cnae_description, latitude, longitude, parent_company_id, " +
        "client:clients(name, document, email, phone, notes), ecs:company_ec_numbers(id, acquirer, ec_number)",
    )
    .eq("id", id)
    .maybeSingle();
  const banksPromise = manager
    ? supabase
        .from("company_bank_accounts")
        .select("id, bank, agency, account, account_type")
        .eq("company_id", id)
        .order("created_at")
    : null;
  const docsPromise = manager
    ? supabase
        .from("company_documents")
        .select("id, file_name, size_bytes, created_at")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
    : null;

  const branchesPromise = supabase
    .from("companies")
    .select(RELATED_COLUMNS)
    .eq("parent_company_id", id)
    .order("legal_name");

  const [companyRes, banksRes, docsRes, branchesRes] = await Promise.all([
    companyPromise,
    banksPromise,
    docsPromise,
    branchesPromise,
  ]);
  const failure = companyRes.error ?? banksRes?.error ?? docsRes?.error ?? branchesRes.error;
  if (failure) {
    logger.error({ code: failure.code }, "empresas: falha ao ler empresa");
    throw new Error("Não foi possível carregar a empresa.");
  }
  const row = companyRes.data as unknown as CompanyRow | null;
  if (!row) return null;
  const parentRes = row.parent_company_id
    ? await supabase.from("companies").select(RELATED_COLUMNS).eq("id", row.parent_company_id).maybeSingle()
    : null;
  if (parentRes?.error) logger.warn({ code: parentRes.error.code }, "empresas: falha ao ler matriz");

  return {
    company: {
      id: row.id,
      cnpj: row.cnpj,
      legalName: row.legal_name,
      tradeName: row.trade_name,
      marketName: row.market_name,
      cep: row.cep,
      street: row.street,
      number: row.number,
      complement: row.complement,
      district: row.district,
      city: row.city,
      uf: row.uf,
      cnae: row.cnae,
      cnaeDescription: row.cnae_description,
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
    },
    parent: parentRes?.data ? toRelated(parentRes.data) : null,
    branches: (branchesRes.data ?? []).map(toRelated),
    ecs: [...row.ecs]
      .sort((a, b) => a.acquirer.localeCompare(b.acquirer, "pt-BR"))
      .map((e) => ({ id: e.id, acquirer: e.acquirer, ecNumber: e.ec_number })),
    client: row.client,
    restricted: manager
      ? {
          bankAccounts: (banksRes?.data ?? []).map((b) => ({
            id: b.id,
            bank: b.bank,
            agency: b.agency,
            account: b.account,
            accountType: b.account_type,
          })),
          documents: (docsRes?.data ?? []).map((d) => ({
            id: d.id,
            fileName: d.file_name,
            sizeBytes: d.size_bytes,
            createdAt: d.created_at,
          })),
        }
      : null,
  };
}

type CompanyRow = {
  id: string;
  cnpj: string;
  legal_name: string;
  trade_name: string | null;
  market_name: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  uf: string;
  cnae: string | null;
  cnae_description: string | null;
  latitude: number | null;
  longitude: number | null;
  parent_company_id: string | null;
  client: NonNullable<CompanyDetail["client"]> | null;
  ecs: { id: string; acquirer: string; ec_number: string }[];
};

function toRelated(c: {
  id: string;
  legal_name: string;
  trade_name: string | null;
  market_name: string | null;
  city: string | null;
  uf: string;
}): RelatedCompany {
  return {
    id: c.id,
    name: marketLabel({ legalName: c.legal_name, tradeName: c.trade_name, marketName: c.market_name }),
    city: c.city,
    uf: c.uf,
  };
}
