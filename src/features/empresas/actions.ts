"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export type SignedUrlResult = { ok: true; url: string } | { ok: false; error: string };

/** URL assinada (60 s) para baixar um PDF da empresa. Só admin/gestor (a RLS também restringe). */
export async function getCompanyDocumentUrl(documentId: string): Promise<SignedUrlResult> {
  await requireRole(["admin", "gestor"]);
  const parsed = z.uuid().safeParse(documentId);
  if (!parsed.success) return { ok: false, error: "Documento inválido." };

  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("company_documents")
    .select("storage_path, file_name")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error || !doc) return { ok: false, error: "Documento não encontrado." };

  const { data, error: signError } = await supabase.storage
    .from("company-docs")
    .createSignedUrl(doc.storage_path, 60, { download: doc.file_name });
  if (signError || !data) {
    logger.error({ code: signError?.name }, "empresas: falha ao assinar URL de documento");
    return { ok: false, error: "Não foi possível gerar o link de download." };
  }
  return { ok: true, url: data.signedUrl };
}
