import "server-only";
import { requireRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { marketLabel } from "@/features/empresas/map-utils";
import { currentMonthStart } from "./form-utils";

const MANAGERS = ["admin", "gestor"] as const;

function fail(scope: string, code?: string): never {
  logger.error({ code }, `configuracoes: falha ao ler ${scope}`);
  throw new Error("Não foi possível carregar os dados.");
}

export type CompanyListItem = {
  id: string;
  cnpj: string;
  legalName: string;
  marketName: string | null;
  tradeName: string | null;
  city: string | null;
  uf: string;
  clientName: string | null;
  ecCount: number;
  cnae: string | null;
  parentId: string | null;
  located: boolean;
};

export async function getCompanyList(): Promise<CompanyListItem[]> {
  await requireRole([...MANAGERS]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, cnpj, legal_name, market_name, trade_name, city, uf, cnae, parent_company_id, latitude, client:clients(name), ecs:company_ec_numbers(count)",
    )
    .order("legal_name");
  if (error) fail("empresas", error.code);
  return data.map((c) => ({
    id: c.id,
    cnpj: c.cnpj,
    legalName: c.legal_name,
    marketName: c.market_name,
    tradeName: c.trade_name,
    city: c.city,
    uf: c.uf,
    clientName: c.client?.name ?? null,
    ecCount: c.ecs[0]?.count ?? 0,
    cnae: c.cnae,
    parentId: c.parent_company_id,
    located: c.latitude !== null,
  }));
}

export type MatrizOption = { id: string; label: string; city: string | null; uf: string };

/** Empresas que podem ser matriz: as que não são filiais (exceto a própria empresa). */
export async function getMatrizOptions(excludeId?: string): Promise<MatrizOption[]> {
  await requireRole([...MANAGERS]);
  const supabase = await createClient();
  let query = supabase
    .from("companies")
    .select("id, legal_name, trade_name, market_name, city, uf")
    .is("parent_company_id", null)
    .order("legal_name");
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query;
  if (error) fail("matrizes", error.code);
  return data.map((c) => ({
    id: c.id,
    label: marketLabel({ legalName: c.legal_name, tradeName: c.trade_name, marketName: c.market_name }),
    city: c.city,
    uf: c.uf,
  }));
}

export type ClientRow = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  companyCount: number;
};

export async function getClients(): Promise<ClientRow[]> {
  await requireRole([...MANAGERS]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, document, email, phone, notes, companies(count)")
    .order("name");
  if (error) fail("clientes", error.code);
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    document: c.document,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
    companyCount: c.companies[0]?.count ?? 0,
  }));
}

export type ClientOption = { id: string; name: string; document: string | null };

export async function getClientOptions(): Promise<ClientOption[]> {
  await requireRole([...MANAGERS]);
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select("id, name, document").order("name");
  if (error) fail("clientes", error.code);
  return data;
}

export type CompanyFormData = {
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
  parentCompanyId: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Quantas filiais apontam para esta empresa (se > 0, ela não pode virar filial). */
  branchCount: number;
  clientId: string | null;
  ecs: { id: string; acquirer: string; ecNumber: string }[];
  banks: { id: string; bank: string; agency: string; account: string; accountType: string | null }[];
  documents: { id: string; fileName: string; sizeBytes: number; createdAt: string }[];
};

export async function getCompanyForEdit(id: string): Promise<CompanyFormData | null> {
  await requireRole([...MANAGERS]);
  const supabase = await createClient();
  const [company, ecs, banks, docs, branches] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "id, cnpj, legal_name, trade_name, market_name, cep, street, number, complement, district, city, uf, client_id, cnae, cnae_description, parent_company_id, latitude, longitude",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("company_ec_numbers").select("id, acquirer, ec_number").eq("company_id", id).order("created_at"),
    supabase
      .from("company_bank_accounts")
      .select("id, bank, agency, account, account_type")
      .eq("company_id", id)
      .order("created_at"),
    supabase
      .from("company_documents")
      .select("id, file_name, size_bytes, created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("parent_company_id", id),
  ]);
  const error = company.error ?? ecs.error ?? banks.error ?? docs.error ?? branches.error;
  if (error) fail("empresa", error.code);
  const c = company.data;
  if (!c) return null;
  return {
    id: c.id,
    cnpj: c.cnpj,
    legalName: c.legal_name,
    tradeName: c.trade_name,
    marketName: c.market_name,
    cep: c.cep,
    street: c.street,
    number: c.number,
    complement: c.complement,
    district: c.district,
    city: c.city,
    uf: c.uf,
    cnae: c.cnae,
    cnaeDescription: c.cnae_description,
    parentCompanyId: c.parent_company_id,
    latitude: c.latitude === null ? null : Number(c.latitude),
    longitude: c.longitude === null ? null : Number(c.longitude),
    branchCount: branches.count ?? 0,
    clientId: c.client_id,
    ecs: (ecs.data ?? []).map((e) => ({ id: e.id, acquirer: e.acquirer, ecNumber: e.ec_number })),
    banks: (banks.data ?? []).map((b) => ({
      id: b.id,
      bank: b.bank,
      agency: b.agency,
      account: b.account,
      accountType: b.account_type,
    })),
    documents: (docs.data ?? []).map((d) => ({
      id: d.id,
      fileName: d.file_name,
      sizeBytes: d.size_bytes,
      createdAt: d.created_at,
    })),
  };
}

export type TeamRow = { id: string; name: string; memberCount: number };

export async function getTeams(): Promise<TeamRow[]> {
  await requireRole([...MANAGERS]);
  const supabase = await createClient();
  const { data, error } = await supabase.from("teams").select("id, name, profiles(count)").order("name");
  if (error) fail("times", error.code);
  return data.map((t) => ({ id: t.id, name: t.name, memberCount: t.profiles[0]?.count ?? 0 }));
}

export type EmployeeRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  role: "admin" | "gestor" | "funcionario";
  active: boolean;
  teamId: string | null;
  teamName: string | null;
  commissionRate: number;
  avatarUrl: string | null;
  goalCents: number | null;
};

/** Funcionários com foto (URL assinada de 1 h) e meta do mês corrente. */
export async function getEmployees(): Promise<{ month: string; employees: EmployeeRow[] }> {
  await requireRole([...MANAGERS]);
  const supabase = await createClient();
  const month = currentMonthStart();
  const [profiles, goals] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, job_title, role, active, team_id, commission_rate, avatar_path, team:teams(name)")
      .order("full_name"),
    supabase.from("sales_goals").select("profile_id, goal_cents").eq("month", month),
  ]);
  const error = profiles.error ?? goals.error;
  if (error) fail("funcionários", error.code);

  const paths = (profiles.data ?? []).flatMap((p) => (p.avatar_path ? [p.avatar_path] : []));
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed, error: signError } = await supabase.storage.from("avatars").createSignedUrls(paths, 3600);
    if (signError) logger.warn({ code: signError.name }, "configuracoes: falha ao assinar fotos");
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  const goalByProfile = new Map((goals.data ?? []).map((g) => [g.profile_id, g.goal_cents]));

  return {
    month,
    employees: (profiles.data ?? []).map((p) => ({
      id: p.id,
      fullName: p.full_name || "Sem nome",
      email: p.email,
      phone: p.phone,
      jobTitle: p.job_title,
      role: p.role,
      active: p.active,
      teamId: p.team_id,
      teamName: p.team?.name ?? null,
      commissionRate: Number(p.commission_rate),
      avatarUrl: p.avatar_path ? (urls.get(p.avatar_path) ?? null) : null,
      goalCents: goalByProfile.get(p.id) ?? null,
    })),
  };
}
