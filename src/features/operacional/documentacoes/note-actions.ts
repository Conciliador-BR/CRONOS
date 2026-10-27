"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { failure, invalid, requireMember } from "../shared/action-utils";
import type { ActionResult } from "../shared/result";
import type { AcquirerNote } from "./types";
import { noteUpdateSchema } from "./schemas";

const detailPath = (id: string) => `/operacional/documentacoes/${id}`;

export async function createNote(acquirerId: unknown): Promise<ActionResult<{ note: AcquirerNote }>> {
  const profile = await requireMember();
  const parsed = z.uuid().safeParse(acquirerId);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("acquirer_notes")
    .insert({ acquirer_id: parsed.data, title: "", content: "", updated_by: profile.id })
    .select("id, title, content, updated_at")
    .single();
  if (error) return failure("documentacoes.createNote", error);
  revalidatePath(detailPath(parsed.data));
  return {
    ok: true,
    note: { id: data.id, title: data.title, content: data.content, updatedAt: data.updated_at, updatedByName: profile.full_name },
  };
}

/** Salvamento automático: sem revalidar a página para não atrapalhar quem está digitando. */
export async function updateNote(input: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  const profile = await requireMember();
  const parsed = noteUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, title, content } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("acquirer_notes")
    .update({ title, content, updated_by: profile.id })
    .eq("id", id)
    .select("updated_at")
    .maybeSingle();
  if (error) return failure("documentacoes.updateNote", error);
  if (!data) return { ok: false, error: "Esta nota foi excluída." };
  return { ok: true, updatedAt: data.updated_at };
}

export async function deleteNote(id: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase.from("acquirer_notes").delete().eq("id", parsed.data).select("acquirer_id");
  if (error) return failure("documentacoes.deleteNote", error);
  const acquirerId = data?.[0]?.acquirer_id;
  if (acquirerId) revalidatePath(detailPath(acquirerId));
  return { ok: true };
}
