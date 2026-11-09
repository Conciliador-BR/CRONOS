import "server-only";
import { z } from "zod";
import { getCurrentProfile, isManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActiveMembers } from "../shared/members";
import { STATUS_GROUPS, PROPERTY_TYPES, type CompanyOption, type PropertyOption, type PropertyType, type ReportProperty, type ReportRow, type ReportSheetData, type ReportSheetSummary, type StatusGroup } from "./types";
import { branchLabel, branchOrder } from "./company-label";
import { readCellValue } from "./values";

/** Lê o jsonb de opções com cuidado: item malformado é descartado. */
export function parseOptions(raw: unknown): PropertyOption[] {
  if (!Array.isArray(raw)) return [];
  const result: PropertyOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { id, name, color, group } = item as Record<string, unknown>;
    if (typeof id !== "string" || typeof name !== "string" || typeof color !== "string") continue;
    const option: PropertyOption = { id, name, color };
    if (typeof group === "string" && (STATUS_GROUPS as readonly string[]).includes(group)) option.group = group as StatusGroup;
    result.push(option);
  }
  return result;
}

export function toPropertyType(value: string): PropertyType {
  return (PROPERTY_TYPES as readonly string[]).includes(value) ? (value as PropertyType) : "text";
}

export async function getReportSheets(): Promise<ReportSheetSummary[]> {
  const supabase = await createClient();
  const [profile, { data, error }] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from("report_sheets")
      .select("id, name, description, created_by, position, created_at, report_rows(count)")
      .order("position")
      .order("created_at"),
  ]);
  if (error) throw new Error("Falha ao carregar tabelas de relatório");
  const manager = profile ? isManager(profile) : false;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    rowCount: row.report_rows[0]?.count ?? 0,
    canDelete: manager || (profile !== null && row.created_by === profile.id),
  }));
}

export async function getReportSheet(id: string): Promise<ReportSheetData | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const [profile, sheetRes, propsRes, rowsRes, cellsRes, companiesRes, members] = await Promise.all([
    getCurrentProfile(),
    supabase.from("report_sheets").select("id, name, description, auto_add_companies, created_by").eq("id", id).maybeSingle(),
    supabase.from("report_properties").select("id, name, type, options, position, width").eq("sheet_id", id).order("position"),
    supabase
      .from("report_rows")
      .select("id, seq, position, company_id, created_at, updated_at, created_by, updated_by")
      .eq("sheet_id", id)
      .order("position")
      .order("created_at"),
    supabase.from("report_cells").select("row_id, property_id, value").eq("sheet_id", id),
    supabase.from("companies").select("id, cnpj, legal_name, trade_name, market_name, uf, city, parent_company_id, branch_number"),
    getActiveMembers(),
  ]);
  if (sheetRes.error) throw new Error("Falha ao carregar a tabela");
  if (!sheetRes.data) return null;
  if (propsRes.error) throw new Error("Falha ao carregar as colunas");
  if (rowsRes.error) throw new Error("Falha ao carregar as linhas");
  if (cellsRes.error) throw new Error("Falha ao carregar as células");
  if (companiesRes.error) throw new Error("Falha ao carregar as empresas");

  const sheet = sheetRes.data;
  const properties: ReportProperty[] = (propsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: toPropertyType(row.type),
    options: parseOptions(row.options),
    position: row.position,
    width: row.width,
  }));
  const byId = new Map(properties.map((property) => [property.id, property]));
  const valuesByRow = new Map<string, ReportRow["values"]>();
  for (const cell of cellsRes.data ?? []) {
    const property = byId.get(cell.property_id);
    if (!property) continue;
    const value = readCellValue(property.type, cell.value, property.options);
    if (value === null) continue;
    const values = valuesByRow.get(cell.row_id) ?? {};
    values[property.id] = value;
    valuesByRow.set(cell.row_id, values);
  }
  const rows: ReportRow[] = (rowsRes.data ?? []).map((row) => ({
    id: row.id,
    seq: Number(row.seq),
    position: row.position,
    companyId: row.company_id,
    values: valuesByRow.get(row.id) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  }));
  const companies: CompanyOption[] = (companiesRes.data ?? [])
    .map((row) => ({
      id: row.id,
      name: row.market_name || row.trade_name || row.legal_name,
      uf: row.uf,
      city: row.city,
      order: branchOrder(row.parent_company_id, row.branch_number, row.cnpj),
    }))
    .map((company) => ({ ...company, kind: branchLabel(company.order) }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || (a.order ?? 9999) - (b.order ?? 9999));

  return {
    sheet: {
      id: sheet.id,
      name: sheet.name,
      description: sheet.description,
      autoAddCompanies: sheet.auto_add_companies,
      canDelete: (profile ? isManager(profile) : false) || (profile !== null && sheet.created_by === profile.id),
      canReset: profile?.role === "admin",
    },
    properties,
    rows,
    members,
    companies,
  };
}
