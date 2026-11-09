"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { failure, invalid, requireMember } from "../shared/action-utils";
import { positionAfterLast } from "../shared/position";
import type { ActionResult } from "../shared/result";
import { DEFAULT_STATUS_OPTIONS } from "./options";
import { parseOptions, toPropertyType } from "./queries";
import {
  companySyncSchema,
  idWithSheetSchema,
  propertyCreateSchema,
  propertyUpdateSchema,
  reorderSchema,
} from "./schemas";
import type { ReportProperty } from "./types";

const LIST_PATH = "/operacional/relatorios";
const sheetPath = (id: string) => `${LIST_PATH}/${id}`;
const COMPANY_DUPLICATE = "Esta tabela já tem uma coluna Empresa.";
const OPTION_TYPES = ["select", "multi_select", "status"];

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Liga a adição automática e traz as empresas já cadastradas. Devolve quantas linhas entraram. */
async function enableCompanySync(
  supabase: Supabase,
  sheetId: string,
  scope: string,
): Promise<{ ok: true; added: number } | { ok: false; error: ReturnType<typeof failure> }> {
  const { error: flagError } = await supabase.from("report_sheets").update({ auto_add_companies: true }).eq("id", sheetId);
  if (flagError) return { ok: false, error: failure(scope, flagError) };
  const { data, error } = await supabase.rpc("report_sync_companies", { p_sheet_id: sheetId });
  if (error) return { ok: false, error: failure(scope, error) };
  return { ok: true, added: data ?? 0 };
}

export async function createProperty(input: unknown): Promise<ActionResult<{ property: ReportProperty; addedRows: number }>> {
  await requireMember();
  const parsed = propertyCreateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { sheetId, name, type, autoAddCompanies } = parsed.data;
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("report_properties")
    .select("position")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: false })
    .limit(1);
  const options = type === "status" ? DEFAULT_STATUS_OPTIONS : [];
  const { data, error } = await supabase
    .from("report_properties")
    .insert({
      sheet_id: sheetId,
      name,
      type,
      options: options as unknown as Json,
      position: positionAfterLast((last ?? []).map((row) => row.position)),
    })
    .select("id, name, type, options, position, width")
    .single();
  if (error) {
    if (error.code === "23505" && type === "company") return { ok: false, error: COMPANY_DUPLICATE };
    if (error.code === "23514") return { ok: false, error: "A tabela chegou ao limite de 50 colunas." };
    return failure("relatorios.createProperty", error);
  }
  let addedRows = 0;
  if (type === "company" && autoAddCompanies) {
    const sync = await enableCompanySync(supabase, sheetId, "relatorios.createProperty.sync");
    if (!sync.ok) return sync.error;
    addedRows = sync.added;
  }
  revalidatePath(sheetPath(sheetId));
  revalidatePath(LIST_PATH);
  return {
    ok: true,
    addedRows,
    property: {
      id: data.id,
      name: data.name,
      type: toPropertyType(data.type),
      options: parseOptions(data.options),
      position: data.position,
      width: data.width,
    },
  };
}

export async function updateProperty(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = propertyUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, sheetId, name, options, width } = parsed.data;
  const supabase = await createClient();
  const update: { name?: string; options?: Json; width?: number } = {};
  if (name !== undefined) update.name = name;
  if (width !== undefined) update.width = width;
  if (options !== undefined) {
    const { data: property, error } = await supabase
      .from("report_properties")
      .select("type")
      .eq("id", id)
      .eq("sheet_id", sheetId)
      .maybeSingle();
    if (error) return failure("relatorios.updateProperty", error);
    if (!property) return { ok: false, error: "Coluna não encontrada." };
    if (!OPTION_TYPES.includes(property.type)) return { ok: false, error: "Esta coluna não tem opções." };
    if (property.type === "status" && options.some((option) => !option.group)) {
      return { ok: false, error: "Cada opção de status precisa de um grupo." };
    }
    update.options = options.map((option) =>
      property.type === "status" ? option : { id: option.id, name: option.name, color: option.color },
    ) as unknown as Json;
  }
  if (Object.keys(update).length === 0) return { ok: true };
  const { error } = await supabase.from("report_properties").update(update).eq("id", id).eq("sheet_id", sheetId);
  if (error) return failure("relatorios.updateProperty", error);
  revalidatePath(sheetPath(sheetId));
  return { ok: true };
}

export async function deleteProperty(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = idWithSheetSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, sheetId } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("report_properties")
    .delete()
    .eq("id", id)
    .eq("sheet_id", sheetId)
    .select("type");
  if (error) return failure("relatorios.deleteProperty", error);
  if (data?.some((row) => row.type === "company")) {
    const { error: flagError } = await supabase.from("report_sheets").update({ auto_add_companies: false }).eq("id", sheetId);
    if (flagError) return failure("relatorios.deleteProperty.flag", flagError);
  }
  revalidatePath(sheetPath(sheetId));
  return { ok: true };
}

export async function setCompanySync(input: unknown): Promise<ActionResult<{ added: number }>> {
  await requireMember();
  const parsed = companySyncSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { sheetId, enabled } = parsed.data;
  const supabase = await createClient();
  let added = 0;
  if (enabled) {
    const sync = await enableCompanySync(supabase, sheetId, "relatorios.setCompanySync");
    if (!sync.ok) return sync.error;
    added = sync.added;
  } else {
    const { error } = await supabase.from("report_sheets").update({ auto_add_companies: false }).eq("id", sheetId);
    if (error) return failure("relatorios.setCompanySync", error);
  }
  revalidatePath(sheetPath(sheetId));
  return { ok: true, added };
}

export async function reorderProperty(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("report_properties")
    .update({ position: parsed.data.position })
    .eq("id", parsed.data.id)
    .eq("sheet_id", parsed.data.sheetId);
  if (error) return failure("relatorios.reorderProperty", error);
  return { ok: true };
}
