"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { failure, invalid, requireMember } from "../shared/action-utils";
import { buildStoragePath, displayFilename, isPathInFolder, MAX_DOCUMENT_BYTES } from "../shared/files";
import type { ActionResult } from "../shared/result";
import { PROGRESS_STATUSES } from "./progress";
import { documentRequestSchema } from "./schemas";

const BUCKET = "acquirer-docs";
const PATH = "/operacional/documentacoes/progresso";
const id = z.uuid({ error: "Identificador inválido." });
const pair = z.object({ acquirerId: id, companyId: id });
/** Pasta dos anexos de uma empresa numa adquirente (no bucket privado das documentações). */
const folder = (acquirerId: string, companyId: string) => `progress/${acquirerId}/${companyId}`;

const progressSchema = pair.extend({
  status: z.enum(PROGRESS_STATUSES).nullable().optional(),
  note: z.string().max(5000, { error: "Até 5.000 caracteres." }).optional(),
  removed: z.boolean().optional(),
});

/** Muda etapa (null = Não iniciado), anotação ou "removida desta adquirente". Só os campos enviados mudam. */
export async function setAcquirerProgress(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { acquirerId, companyId, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase
    .from("acquirer_company_progress")
    .upsert({ acquirer_id: acquirerId, company_id: companyId, ...fields }, { onConflict: "company_id,acquirer_id" });
  if (error) return failure("documentacoes.setAcquirerProgress", error);
  revalidatePath(PATH);
  return { ok: true };
}

const bulkSchema = z.object({
  acquirerId: id,
  companyIds: z.array(id).min(1, { error: "Selecione ao menos uma empresa." }).max(1000),
  status: z.enum(PROGRESS_STATUSES).nullable().optional(),
  removed: z.boolean().optional(),
});

/** Mesma mudança (etapa e/ou "removida") em várias empresas de uma adquirente, numa gravação só. */
export async function setAcquirerProgressBulk(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { acquirerId, companyIds, ...fields } = parsed.data;
  if (Object.keys(fields).length === 0) return { ok: true };
  const supabase = await createClient();
  const rows = [...new Set(companyIds)].map((companyId) => ({ acquirer_id: acquirerId, company_id: companyId, ...fields }));
  const { error } = await supabase.from("acquirer_company_progress").upsert(rows, { onConflict: "company_id,acquirer_id" });
  if (error) return failure("documentacoes.setAcquirerProgressBulk", error);
  revalidatePath(PATH);
  return { ok: true };
}

export type ProgressFile ={ id: string; fileName: string; sizeBytes: number; createdAt: string };

export async function listProgressFiles(input: unknown): Promise<ActionResult<{ files: ProgressFile[] }>> {
  await requireMember();
  const parsed = pair.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("acquirer_progress_files")
    .select("id, file_name, size_bytes, created_at")
    .eq("acquirer_id", parsed.data.acquirerId)
    .eq("company_id", parsed.data.companyId)
    .order("created_at", { ascending: false });
  if (error) return failure("documentacoes.listProgressFiles", error);
  const files = (data ?? []).map((row) => ({ id: row.id, fileName: row.file_name, sizeBytes: row.size_bytes, createdAt: row.created_at }));
  return { ok: true, files };
}

/** 1º passo do anexo: URL assinada de upload num caminho gerado aqui. */
export async function requestProgressUpload(input: unknown): Promise<ActionResult<{ path: string; token: string }>> {
  await requireMember();
  const parsed = pair
    .extend({ fileName: documentRequestSchema.shape.fileName, size: documentRequestSchema.shape.size })
    .safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { acquirerId, companyId, fileName } = parsed.data;
  const supabase = await createClient();
  const path = buildStoragePath(folder(acquirerId, companyId), crypto.randomUUID(), fileName);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) return failure("documentacoes.requestProgressUpload", error);
  return { ok: true, path: data.path, token: data.token };
}

/** 2º passo: confere o arquivo enviado (pasta e tamanho reais) e registra. */
export async function registerProgressFile(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = pair
    .extend({ path: z.string().min(1).max(400), fileName: documentRequestSchema.shape.fileName })
    .safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { acquirerId, companyId, path, fileName } = parsed.data;
  if (!isPathInFolder(path, folder(acquirerId, companyId))) return { ok: false, error: "Caminho de arquivo inválido." };
  const supabase = await createClient();
  const { data: info, error: infoError } = await supabase.storage.from(BUCKET).info(path);
  if (infoError || !info) return { ok: false, error: "O arquivo não chegou ao armazenamento. Envie de novo." };
  const size = Number(info.size ?? 0);
  if (!size || size > MAX_DOCUMENT_BYTES) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, error: "O arquivo pode ter até 50 MB." };
  }
  const { error } = await supabase.from("acquirer_progress_files").insert({
    acquirer_id: acquirerId,
    company_id: companyId,
    storage_path: path,
    file_name: displayFilename(fileName),
    size_bytes: size,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return failure("documentacoes.registerProgressFile", error);
  }
  revalidatePath(PATH);
  return { ok: true };
}

/** URL assinada de 60 s que baixa o anexo com o nome original. */
export async function getProgressFileUrl(fileId: unknown): Promise<ActionResult<{ url: string }>> {
  await requireMember();
  const parsed = id.safeParse(fileId);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: file } = await supabase
    .from("acquirer_progress_files")
    .select("storage_path, file_name")
    .eq("id", parsed.data)
    .maybeSingle();
  if (!file) return { ok: false, error: "Anexo não encontrado." };
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.storage_path, 60, { download: file.file_name });
  if (error) return failure("documentacoes.getProgressFileUrl", error);
  return { ok: true, url: data.signedUrl };
}

export async function deleteProgressFile(fileId: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = id.safeParse(fileId);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: file } = await supabase.from("acquirer_progress_files").select("storage_path").eq("id", parsed.data).maybeSingle();
  if (!file) return { ok: false, error: "Anexo não encontrado." };
  const { data: deleted, error } = await supabase.from("acquirer_progress_files").delete().eq("id", parsed.data).select("id");
  if (error) return failure("documentacoes.deleteProgressFile", error);
  if (!deleted?.length) return { ok: false, error: "Só quem enviou o anexo ou um gestor pode excluí-lo." };
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([file.storage_path]);
  if (storageError) failure("documentacoes.deleteProgressFile.storage", storageError);
  revalidatePath(PATH);
  return { ok: true };
}
