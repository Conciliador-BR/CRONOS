import "server-only";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

// shortcut: memória por instância do servidor (não compartilhada entre funções da Vercel); trocar por tabela se houver abuso.
/** Registra um pedido e diz se o usuário passou de 10 por minuto. */
export function overLimit(userId: string, now = Date.now()) {
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(userId, recent);
  return recent.length > MAX_PER_WINDOW;
}
