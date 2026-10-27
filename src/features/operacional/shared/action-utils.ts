import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { requireMember, requireRole, type CurrentProfile } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { FORBIDDEN_ERROR, GENERIC_ERROR, type ActionError } from "./result";

/** Erro de validação no formato das ações (primeira mensagem geral + erros por campo). */
export function invalid(error: z.ZodError): ActionError {
  const flat = z.flattenError(error);
  const first = flat.formErrors[0] ?? Object.values(flat.fieldErrors).flat()[0];
  return {
    ok: false,
    error: typeof first === "string" ? first : "Confira os campos destacados.",
    fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
  };
}

/** Registra a falha (sem dados pessoais: só escopo e código) e devolve erro genérico. */
export function failure(scope: string, error: unknown, message = GENERIC_ERROR): ActionError {
  const code =
    error && typeof error === "object" && "code" in error ? String((error as { code: unknown }).code) : undefined;
  const name = error instanceof Error ? error.name : typeof error;
  logger.error({ scope, code, name }, "operacional action failed");
  return { ok: false, error: message };
}

/** requireRole(["admin","gestor"]) que devolve null em vez de lançar (redirecionamentos seguem). */
export async function requireManagerOrNull(): Promise<CurrentProfile | null> {
  try {
    return await requireRole(["admin", "gestor"]);
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

export const forbidden: ActionError = { ok: false, error: FORBIDDEN_ERROR };

export { requireMember };
