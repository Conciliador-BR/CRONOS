/**
 * Aceita só caminhos relativos do próprio site ("/algo"), bloqueando
 * redirecionamento aberto ("//evil.com", "/\\evil.com", "https://…").
 */
export function safeNextPath(value: unknown, fallback = "/inicio"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
