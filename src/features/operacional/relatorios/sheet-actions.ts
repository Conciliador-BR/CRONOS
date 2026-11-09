"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { failure, forbidden, invalid, requireMember } from "../shared/action-utils";
import { positionAfterLast } from "../shared/position";
import type { ActionResult } from "../shared/result";
import { parseOptions } from "./queries";
import { sheetCreateSchema, sheetOnlySchema, sheetUpdateSchema } from "./schemas";

const LIST_PATH = "/operacional/relatorios";
const sheetPath = (id: string) => `${LIST_PATH}/${id}`;

export async function createSheet(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireMember();
  const parsed = sheetCreateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: last } = await supabase.from("report_sheets").select("position").order("position", { ascending: false }).limit(1);
  const { data, error } = await supabase
    .from("report_sheets")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      position: positionAfterLast((last ?? []).map((row) => row.position)),
    })
    .select("id")
    .single();
  if (error) return failure("relatorios.createSheet", error);
  revalidatePath(LIST_PATH);
  return { ok: true, id: data.id };
}

export async function updateSheet(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = sheetUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...values } = parsed.data;
  if (Object.keys(values).length === 0) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase.from("report_sheets").update(values).eq("id", id);
  if (error) return failure("relatorios.updateSheet", error);
  revalidatePath(LIST_PATH);
  revalidatePath(sheetPath(id));
  return { ok: true };
}

export async function deleteSheet(id: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase.from("report_sheets").delete().eq("id", parsed.data).select("id");
  if (error) return failure("relatorios.deleteSheet", error);
  if (!data || data.length === 0) return forbidden;
  revalidatePath(LIST_PATH);
  return { ok: true };
}

/**
 * "Resetar semana" (só admin): toda coluna Status volta para a primeira opção do grupo
 * "A fazer" (Não iniciado) em todas as linhas. Status sem essa opção fica vazio.
 */
export async function resetWeek(input: unknown): Promise<ActionResult> {
  const profile = await requireMember();
  if (profile.role !== "admin") return forbidden;
  const parsed = sheetOnlySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { sheetId } = parsed.data;
  const supabase = await createClient();
  const [propsRes, rowsRes] = await Promise.all([
    supabase.from("report_properties").select("id, options").eq("sheet_id", sheetId).eq("type", "status"),
    supabase.from("report_rows").select("id").eq("sheet_id", sheetId),
  ]);
  if (propsRes.error) return failure("relatorios.resetWeek.props", propsRes.error);
  if (rowsRes.error) return failure("relatorios.resetWeek.rows", rowsRes.error);
  const rowIds = (rowsRes.data ?? []).map((row) => row.id);

  for (const property of propsRes.data ?? []) {
    const todo = parseOptions(property.options).find((option) => option.group === "todo");
    if (todo && rowIds.length === 0) continue;
    const { error } = todo
      ? await supabase.from("report_cells").upsert(
            rowIds.map((rowId) => ({ row_id: rowId, property_id: property.id, sheet_id: sheetId, value: todo.id })),
            { onConflict: "row_id,property_id" },
          )
      : await supabase.from("report_cells").delete().eq("property_id", property.id).eq("sheet_id", sheetId);
    if (error) return failure("relatorios.resetWeek", error);
  }
  revalidatePath(sheetPath(sheetId));
  return { ok: true };
}
