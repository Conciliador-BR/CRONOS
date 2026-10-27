"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { failure, invalid, requireMember } from "../shared/action-utils";
import { buildStoragePath, displayFilename, isPathInFolder, MAX_DOCUMENT_BYTES } from "../shared/files";
import type { ActionResult } from "../shared/result";
import { documentRegisterSchema, documentRequestSchema } from "./schemas";

const BUCKET = "acquirer-docs";
const detailPath = (id: string) => `/operacional/documentacoes/${id}`;

/**
 * 1º passo do envio: valida e devolve uma URL assinada de upload para um caminho gerado aqui
 * (<acquirerId>/<uuid>-<nome-saneado>). O navegador envia o arquivo direto ao Storage.
 */
export async function requestDocumentUpload(input: unknown): Promise<ActionResult<{ path: string; token: string }>> {
  await requireMember();
  const parsed = documentRequestSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { acquirerId, fileName } = parsed.data;
  const supabase = await createClient();
  const { data: acquirer } = await supabase.from("acquirers").select("id").eq("id", acquirerId).maybeSingle();
  if (!acquirer) return { ok: false, error: "Adquirente não encontrada." };
  const path = buildStoragePath(acquirerId, crypto.randomUUID(), fileName);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) return failure("documentacoes.requestUpload", error);
  return { ok: true, path: data.path, token: data.token };
}

/** 2º passo: confere o arquivo enviado (caminho e tamanho reais) e registra o documento. */
export async function registerDocument(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = documentRegisterSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { acquirerId, path, fileName } = parsed.data;
  if (!isPathInFolder(path, acquirerId)) return { ok: false, error: "Caminho de arquivo inválido." };
  const supabase = await createClient();
  const { data: info, error: infoError } = await supabase.storage.from(BUCKET).info(path);
  if (infoError || !info) return { ok: false, error: "O arquivo não chegou ao armazenamento. Envie de novo." };
  const size = Number(info.size ?? 0);
  if (!size || size > MAX_DOCUMENT_BYTES) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, error: "O arquivo pode ter até 50 MB." };
  }
  const { error } = await supabase
    .from("acquirer_documents")
    .insert({ acquirer_id: acquirerId, storage_path: path, file_name: displayFilename(fileName), size_bytes: size });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return failure("documentacoes.registerDocument", error);
  }
  revalidatePath(detailPath(acquirerId));
  revalidatePath("/operacional/documentacoes");
  return { ok: true };
}

/** URL assinada de 60 s que baixa o arquivo com o nome original. */
export async function getDocumentDownloadUrl(id: unknown): Promise<ActionResult<{ url: string }>> {
  await requireMember();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("acquirer_documents")
    .select("storage_path, file_name")
    .eq("id", parsed.data)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Documento não encontrado." };
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60, { download: doc.file_name });
  if (error) return failure("documentacoes.download", error);
  return { ok: true, url: data.signedUrl };
}

export async function deleteDocument(id: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("acquirer_documents")
    .select("storage_path, acquirer_id")
    .eq("id", parsed.data)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Documento não encontrado." };
  const { error } = await supabase.from("acquirer_documents").delete().eq("id", parsed.data);
  if (error) return failure("documentacoes.deleteDocument", error);
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  if (storageError) failure("documentacoes.deleteDocument.storage", storageError);
  revalidatePath(detailPath(doc.acquirer_id));
  revalidatePath("/operacional/documentacoes");
  return { ok: true };
}
