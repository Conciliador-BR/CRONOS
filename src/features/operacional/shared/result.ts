/** Resultado tipado das Server Actions do Operacional. */
export type ActionError = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type ActionResult<T extends object = object> = ({ ok: true } & T) | ActionError;

export const GENERIC_ERROR = "Não foi possível concluir. Tente novamente.";
export const FORBIDDEN_ERROR = "Você não tem permissão para esta ação.";
