import "server-only";
import { logger } from "@/lib/logger";
import type { createClient } from "./server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Validade da URL assinada. */
const TTL_SECONDS = 24 * 60 * 60;
/** Reaproveita a mesma URL por metade da validade; quem a recebe ainda tem ao menos 12 h. */
const REUSE_MS = (TTL_SECONDS * 1000) / 2;
const MAX_ENTRIES = 5000;

const cache = new Map<string, { url: string; until: number }>();
const isPersonal = (path: string) => path.startsWith("users/");

/**
 * URLs assinadas de exibição (imagens), estáveis entre requisições.
 * Por quê: URL nova a cada render tem token novo, então nem o navegador nem o otimizador do
 * next/image acertam o cache e baixam o original do Storage de novo (gasta a cota de egress).
 * Reaproveita entre usuários só caminhos de leitura `is_member()`. Pastas pessoais (`users/<uid>/`,
 * ex.: papel de parede, legível só pelo dono) não entram no cache: outro membro que gravasse esse
 * caminho num quadro receberia a URL assinada para o dono.
 * shortcut: cache em memória por instância do servidor; se rodar em várias instâncias, cada uma assina a sua.
 */
export async function signDisplayUrls(supabase: Supabase, bucket: string, paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const now = Date.now();
  const missing: string[] = [];
  for (const path of new Set(paths)) {
    const hit = isPersonal(path) ? undefined : cache.get(`${bucket}/${path}`);
    if (hit && hit.until > now) urls.set(path, hit.url);
    else missing.push(path);
  }
  if (missing.length === 0) return urls;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(missing, TTL_SECONDS);
  if (error) logger.warn({ scope: bucket, message: error.message }, "storage: falha ao assinar URLs");
  if (cache.size > MAX_ENTRIES) cache.clear();
  for (const item of data ?? []) {
    if (!item.path || !item.signedUrl) continue;
    urls.set(item.path, item.signedUrl);
    if (!isPersonal(item.path)) cache.set(`${bucket}/${item.path}`, { url: item.signedUrl, until: now + REUSE_MS });
  }
  return urls;
}

/** Esquece a URL de um caminho sobrescrito (upsert), para a próxima leitura mostrar o arquivo novo. */
export function forgetDisplayUrl(bucket: string, path: string) {
  cache.delete(`${bucket}/${path}`);
}
