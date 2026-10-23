"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./action-result";
import { sanitizeFileName } from "./form-utils";
import { MAX_PDF_BYTES } from "./limits";

const BUCKET = "company-docs";

const metaSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(MAX_PDF_BYTES, { error: "O PDF pode ter até 20 MB." }),
  type: z.literal("application/pdf", { error: "Envie apenas arquivos PDF." }),
});

const PATH_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}-[a-z0-9_-]{1,80}\.pdf$/;

function revalidateCompany(companyId: string) {
  revalidatePath(`/configuracoes/empresas/${companyId}`);
  revalidatePath("/empresas");
}

export type UploadTicket = { ok: true; path: string; token: string } | { ok: false; error: string };

/**
 * Passo 1 do envio: valida tipo e tamanho declarados e gera, no servidor, o caminho
 * `<empresa>/<uuid>-<nome>.pdf` e um token de envio direto ao Storage (evita limite de corpo do proxy).
 */
export async function prepareCompanyDocumentUpload(
  companyId: string,
  meta: { fileName: string; size: number; type: string },
): Promise<UploadTicket> {
  await requireRole(["admin", "gestor"]);
  if (!z.uuid().safeParse(companyId).success) return { ok: false, error: "Empresa inválida." };
  const parsed = metaSchema.safeParse(meta);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Arquivo inválido." };

  const supabase = await createClient();
  const { data: company } = await supabase.from("companies").select("id").eq("id", companyId).maybeSingle();
  if (!company) return { ok: false, error: "Empresa não encontrada." };

  const path = `${companyId}/${randomUUID()}-${sanitizeFileName(parsed.data.fileName)}.pdf`;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    logger.error({ code: error?.name }, "configuracoes: falha ao preparar envio de PDF");
    return { ok: false, error: "Não foi possível iniciar o envio. Tente novamente." };
  }
  return { ok: true, path: data.path, token: data.token };
}

/** Passo 2: confere no Storage o arquivo enviado (PDF, até 20 MB) e registra o documento. */
export async function registerCompanyDocument(
  companyId: string,
  upload: { path: string; fileName: string },
): Promise<ActionResult> {
  await requireRole(["admin", "gestor"]);
  const fileName = z.string().trim().min(1).max(255).safeParse(upload.fileName);
  if (
    !z.uuid().safeParse(companyId).success ||
    !fileName.success ||
    !upload.path.startsWith(`${companyId}/`) ||
    !PATH_PATTERN.test(upload.path)
  ) {
    return { ok: false, error: "Envio inválido." };
  }

  const supabase = await createClient();
  const storage = supabase.storage.from(BUCKET);
  const { data: info, error: infoError } = await storage.info(upload.path);
  const size = info?.size ?? 0;
  const contentType = info?.contentType ?? (info as { metadata?: { mimetype?: string } } | null)?.metadata?.mimetype;
  if (infoError || !info || size <= 0 || size > MAX_PDF_BYTES || contentType !== "application/pdf") {
    await storage.remove([upload.path]);
    return { ok: false, error: infoError ? "O arquivo não chegou ao armazenamento." : "Envie um PDF de até 20 MB." };
  }

  const { error } = await supabase.from("company_documents").insert({
    company_id: companyId,
    storage_path: upload.path,
    file_name: fileName.data,
    size_bytes: size,
  });
  if (error) {
    logger.error({ code: error.code }, "configuracoes: falha ao registrar PDF");
    await storage.remove([upload.path]);
    return { ok: false, error: "Não foi possível registrar o PDF. Tente novamente." };
  }
  revalidateCompany(companyId);
  return { ok: true, message: "PDF anexado." };
}

export async function deleteCompanyDocument(documentId: string): Promise<ActionResult> {
  await requireRole(["admin", "gestor"]);
  if (!z.uuid().safeParse(documentId).success) return { ok: false, error: "Documento inválido." };
  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("company_documents")
    .delete()
    .eq("id", documentId)
    .select("company_id, storage_path")
    .maybeSingle();
  if (error || !doc) {
    if (error) logger.error({ code: error.code }, "configuracoes: falha ao excluir PDF");
    return { ok: false, error: "Não foi possível excluir o PDF." };
  }
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  if (storageError) logger.warn({ code: storageError.name }, "configuracoes: PDF órfão no Storage");
  revalidateCompany(doc.company_id);
  return { ok: true, message: "PDF excluído." };
}
