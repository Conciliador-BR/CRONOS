import "server-only";

const hits = new Map<string, number[]>();
/** Maior janela usada no app; acima disso uma chave já não conta. */
const MAX_WINDOW_MS = 60 * 60_000;

// shortcut: memória por instância do servidor (não compartilhada entre funções da Vercel); trocar por tabela/Redis se houver abuso.
/** Registra um pedido para `key` e diz se passou de `max` dentro de `windowMs` (padrão: 10 por minuto). */
export function overLimit(key: string, now = Date.now(), max = 10, windowMs = 60_000) {
  if (hits.size > 10_000) {
    // Poda só chaves vencidas; limpar tudo deixaria um atacante zerar o contador gerando chaves novas.
    for (const [k, times] of hits) if (now - times[times.length - 1] > MAX_WINDOW_MS) hits.delete(k);
  }
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}
