import "server-only";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { COMERCIAL_PATHS } from "./constants";
import type { ActionError } from "./types";

export type DbError = { code?: string; message: string } | null;

export const NO_PERMISSION =
  "Você não tem permissão para alterar este lead. Só o responsável, quem criou ou um gestor podem.";

export function invalid(error: z.ZodError): ActionError {
  return {
    ok: false,
    error: "Revise os campos destacados.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  };
}

/** Registra o erro (sem dados pessoais) e devolve uma mensagem amigável. */
export function dbFailure(scope: string, error: DbError): ActionError {
  logger.error({ scope, code: error?.code, message: error?.message }, "comercial: falha ao gravar");
  if (error?.code === "42501") return { ok: false, error: NO_PERMISSION };
  if (error?.code === "23514") return { ok: false, error: "Dados incompletos para esta etapa. Revise e tente de novo." };
  return { ok: false, error: "Não foi possível salvar agora. Tente de novo em instantes." };
}

/** Mensagens que os triggers de `pipeline_stages` levantam com o código 23514. */
const STAGE_GUARD_MESSAGES = [
  "As etapas de fechado e perdido não podem ser excluídas.",
  "O pipeline precisa de pelo menos uma etapa aberta.",
  "O tipo da etapa não pode ser alterado.",
];

/** Igual a `dbFailure`, com as mensagens das regras de colunas do pipeline. */
export function stageFailure(scope: string, error: DbError): ActionError {
  logger.error({ scope, code: error?.code, message: error?.message }, "comercial: falha ao alterar etapa");
  if (error?.code === "42501") return { ok: false, error: "Só administradores e gestores alteram as etapas." };
  if (error?.code === "23514") {
    const known = STAGE_GUARD_MESSAGES.find((message) => error.message.includes(message));
    return { ok: false, error: known ?? "Esta alteração não é permitida para esta etapa." };
  }
  if (error?.code === "23503") {
    return { ok: false, error: "Ainda há leads nesta etapa. Atualize a página e escolha para onde eles vão." };
  }
  return { ok: false, error: "Não foi possível salvar agora. Tente de novo em instantes." };
}

export function revalidateComercial() {
  for (const path of COMERCIAL_PATHS) revalidatePath(path);
}

/** Perfil de admin/gestor, ou null para quem não é (sem redirecionar). */
export async function requireManager() {
  try {
    return await requireRole(["admin", "gestor"]);
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
