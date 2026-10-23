"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { failure, forbidden, invalid, requireManagerOrNull } from "../shared/action-utils";
import { buildStoragePath, LOGO_MIME_TYPES, MAX_LOGO_BYTES } from "../shared/files";
import { readImageFile } from "../shared/image-upload";
import { positionAfterLast } from "../shared/position";
import type { ActionResult } from "../shared/result";
import { acquirerInputSchema, acquirerMoveSchema, acquirerUpdateSchema } from "./schemas";

const LIST_PATH = "/operacional/documentacoes";
const detailPath = (id: string) => `${LIST_PATH}/${id}`;
const DUPLICATE = "23505";

export async function createAcquirer(input: unknown): Promise<ActionResult<{ id: string }>> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = acquirerInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: last } = await supabase.from("acquirers").select("position").order("position", { ascending: false }).limit(1);
  const { data, error } = await supabase
    .from("acquirers")
    .insert({ ...parsed.data, position: positionAfterLast((last ?? []).map((row) => row.position)) })
    .select("id")
    .single();
  if (error?.code === DUPLICATE) return { ok: false, error: "Já existe uma adquirente com esse nome.", fieldErrors: { name: ["Já existe uma adquirente com esse nome."] } };
  if (error) return failure("documentacoes.createAcquirer", error);
  revalidatePath(LIST_PATH);
  return { ok: true, id: data.id };
}

export async function updateAcquirer(input: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = acquirerUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("acquirers").update(values).eq("id", id);
  if (error?.code === DUPLICATE) return { ok: false, error: "Já existe uma adquirente com esse nome.", fieldErrors: { name: ["Já existe uma adquirente com esse nome."] } };
  if (error) return failure("documentacoes.updateAcquirer", error);
  revalidatePath(LIST_PATH);
  revalidatePath(detailPath(id));
  return { ok: true };
}

export async function moveAcquirer(input: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = acquirerMoveSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("acquirers").update({ position: parsed.data.position }).eq("id", parsed.data.id);
  if (error) return failure("documentacoes.moveAcquirer", error);
  revalidatePath(LIST_PATH);
  return { ok: true };
}

/** Exclui a adquirente, seus documentos (arquivos inclusos), notas e logo. */
export async function deleteAcquirer(id: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const [{ data: acquirer }, { data: docs }] = await Promise.all([
    supabase.from("acquirers").select("logo_path").eq("id", parsed.data).maybeSingle(),
    supabase.from("acquirer_documents").select("storage_path").eq("acquirer_id", parsed.data),
  ]);
  const { error } = await supabase.from("acquirers").delete().eq("id", parsed.data);
  if (error) return failure("documentacoes.deleteAcquirer", error);
  const docPaths = (docs ?? []).map((doc) => doc.storage_path);
  if (docPaths.length) await supabase.storage.from("acquirer-docs").remove(docPaths);
  if (acquirer?.logo_path) await supabase.storage.from("acquirer-logos").remove([acquirer.logo_path]);
  revalidatePath(LIST_PATH);
  return { ok: true };
}

/** Envia ou troca a logo (PNG, JPG, WebP ou SVG até 2 MB). FormData: acquirerId, file. */
export async function uploadAcquirerLogo(formData: FormData): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsedId = z.uuid().safeParse(formData.get("acquirerId"));
  if (!parsedId.success) return invalid(parsedId.error);
  const image = await readImageFile(formData.get("file"), LOGO_MIME_TYPES, MAX_LOGO_BYTES);
  if (!image.ok) return { ok: false, error: image.error, fieldErrors: { file: [image.error] } };
  const acquirerId = parsedId.data;
  const supabase = await createClient();
  const { data: current } = await supabase.from("acquirers").select("logo_path").eq("id", acquirerId).maybeSingle();
  if (!current) return { ok: false, error: "Adquirente não encontrada." };
  const path = buildStoragePath(acquirerId, crypto.randomUUID(), image.file.name);
  const { error: uploadError } = await supabase.storage
    .from("acquirer-logos")
    .upload(path, image.bytes, { contentType: image.file.type, upsert: false });
  if (uploadError) return failure("documentacoes.uploadLogo", uploadError);
  const { error } = await supabase.from("acquirers").update({ logo_path: path }).eq("id", acquirerId);
  if (error) {
    await supabase.storage.from("acquirer-logos").remove([path]);
    return failure("documentacoes.uploadLogo.update", error);
  }
  if (current.logo_path) await supabase.storage.from("acquirer-logos").remove([current.logo_path]);
  revalidatePath(LIST_PATH);
  revalidatePath(detailPath(acquirerId));
  return { ok: true };
}

export async function removeAcquirerLogo(acquirerId: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = z.uuid().safeParse(acquirerId);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: current } = await supabase.from("acquirers").select("logo_path").eq("id", parsed.data).maybeSingle();
  const { error } = await supabase.from("acquirers").update({ logo_path: null }).eq("id", parsed.data);
  if (error) return failure("documentacoes.removeLogo", error);
  if (current?.logo_path) await supabase.storage.from("acquirer-logos").remove([current.logo_path]);
  revalidatePath(LIST_PATH);
  revalidatePath(detailPath(parsed.data));
  return { ok: true };
}
