/** Resultado tipado das Server Actions do módulo (serializável). */
export type ActionResult<F extends string = string> =
  | { ok: true; message?: string; warning?: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<F, string[]>> };

export const GENERIC_ERROR = "Não foi possível concluir agora. Tente novamente em instantes.";
