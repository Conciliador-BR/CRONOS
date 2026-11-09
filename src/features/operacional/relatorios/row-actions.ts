"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { failure, invalid, requireMember } from "../shared/action-utils";
import { positionAfterLast } from "../shared/position";
import type { ActionResult } from "../shared/result";
import { parseOptions, toPropertyType } from "./queries";
import { cellFillSchema, cellSetSchema, idWithSheetSchema, reorderSchema, rowCompanySchema, sheetOnlySchema } from "./schemas";
import type { CellValue, ReportRow } from "./types";
import { cellValueSchema } from "./values";

const sheetPath = (id: string) => `/operacional/relatorios/${id}`;

export async function createRow(input: unknown): Promise<ActionResult<{ row: ReportRow }>> {
  await requireMember();
  const parsed = sheetOnlySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { sheetId } = parsed.data;
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("report_rows")
    .select("position")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: false })
    .limit(1);
  const { data, error } = await supabase
    .from("report_rows")
    .insert({ sheet_id: sheetId, position: positionAfterLast((last ?? []).map((row) => row.position)) })
    .select("id, seq, position, company_id, created_at, updated_at, created_by, updated_by")
    .single();
  if (error?.code === "23514") return { ok: false, error: "A tabela chegou ao limite de 2000 linhas." };
  if (error) return failure("relatorios.createRow", error);
  revalidatePath(sheetPath(sheetId));
  return {
    ok: true,
    row: {
      id: data.id,
      seq: Number(data.seq),
      position: data.position,
      companyId: data.company_id,
      values: {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    },
  };
}

export async function deleteRow(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = idWithSheetSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("report_rows")
    .delete()
    .eq("id", parsed.data.id)
    .eq("sheet_id", parsed.data.sheetId);
  if (error) return failure("relatorios.deleteRow", error);
  revalidatePath(sheetPath(parsed.data.sheetId));
  return { ok: true };
}

export async function setCell(input: unknown): Promise<ActionResult<{ value: CellValue | null }>> {
  await requireMember();
  const parsed = cellSetSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { rowId, ...rest } = parsed.data;
  return writeCells({ ...rest, rowIds: [rowId] });
}

/** Alça de preencher (como no Excel): o mesmo valor em várias linhas da coluna. */
export async function fillCells(input: unknown): Promise<ActionResult<{ value: CellValue | null }>> {
  await requireMember();
  const parsed = cellFillSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  return writeCells({ ...parsed.data, rowIds: [...new Set(parsed.data.rowIds)] });
}

/** Valida o valor pelo tipo da coluna; as FKs compostas garantem que as linhas são da mesma tabela. */
async function writeCells({
  sheetId,
  rowIds,
  propertyId,
  value: raw,
}: {
  sheetId: string;
  rowIds: string[];
  propertyId: string;
  value: unknown;
}): Promise<ActionResult<{ value: CellValue | null }>> {
  const supabase = await createClient();
  const { data: property, error: propertyError } = await supabase
    .from("report_properties")
    .select("type, options")
    .eq("id", propertyId)
    .eq("sheet_id", sheetId)
    .maybeSingle();
  if (propertyError) return failure("relatorios.setCell", propertyError);
  if (!property) return { ok: false, error: "Coluna não encontrada." };
  const type = toPropertyType(property.type);
  const value = cellValueSchema(type, parseOptions(property.options)).safeParse(raw);
  if (!value.success) return invalid(value.error);

  if (type === "person" && Array.isArray(value.data) && value.data.length > 0) {
    const { data: people, error } = await supabase.from("profiles").select("id").in("id", value.data).eq("active", true);
    if (error) return failure("relatorios.setCell.people", error);
    if ((people ?? []).length !== value.data.length) return { ok: false, error: "Pessoa inválida." };
  }

  if (value.data === null) {
    const { error } = await supabase
      .from("report_cells")
      .delete()
      .in("row_id", rowIds)
      .eq("property_id", propertyId)
      .eq("sheet_id", sheetId);
    if (error) return failure("relatorios.setCell", error);
  } else {
    const { error } = await supabase
      .from("report_cells")
      .upsert(
        rowIds.map((rowId) => ({ row_id: rowId, property_id: propertyId, sheet_id: sheetId, value: value.data as Json })),
        { onConflict: "row_id,property_id" },
      );
    if (error) return failure("relatorios.setCell", error);
  }
  revalidatePath(sheetPath(sheetId));
  return { ok: true, value: value.data };
}

export async function setRowCompany(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = rowCompanySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { sheetId, rowId, companyId } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("report_rows")
    .update({ company_id: companyId })
    .eq("id", rowId)
    .eq("sheet_id", sheetId);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Esta empresa já está na tabela." };
    return failure("relatorios.setRowCompany", error);
  }
  revalidatePath(sheetPath(sheetId));
  return { ok: true };
}

export async function reorderRow(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("report_rows")
    .update({ position: parsed.data.position })
    .eq("id", parsed.data.id)
    .eq("sheet_id", parsed.data.sheetId);
  if (error) return failure("relatorios.reorderRow", error);
  return { ok: true };
}
