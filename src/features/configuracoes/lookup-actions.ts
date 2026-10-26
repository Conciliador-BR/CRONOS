"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { isValidCnpj, onlyDigits } from "@/lib/format/document";
import { logger } from "@/lib/logger";
import {
  nominatimUrl,
  parseCepCoordinates,
  parseCnpjResponse,
  parseNominatim,
  type CnpjPrefill,
} from "./lookup-parsers";

const TIMEOUT_MS = 8000;
const MAX_BYTES = 1_000_000;
const USER_AGENT = "CRONOS-CRM/1.0 (CRM interno; cadastro de empresas)";

type Fetched = { status: number; json: unknown };

/** GET com tempo limite. Nunca lança: devolve null se a rede falhar ou o JSON vier quebrado. */
async function getJson(url: string): Promise<Fetched | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT, "Accept-Language": "pt-BR" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
      redirect: "error",
    });
    if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES) return { status: 413, json: null };
    const text = response.ok ? await response.text() : "";
    if (text.length > MAX_BYTES) return { status: 413, json: null };
    const json: unknown = text ? JSON.parse(text) : null;
    return { status: response.status, json };
  } catch (error) {
    logger.warn(
      { host: new URL(url).host, reason: error instanceof Error ? error.name : "desconhecido" },
      "configuracoes: consulta externa falhou",
    );
    return null;
  }
}

export type CnpjLookupResult = { ok: true; data: CnpjPrefill } | { ok: false; error: string };

/** Busca razão social, CNAE e endereço do CNPJ na BrasilAPI. O usuário revisa antes de salvar. */
export async function lookupCnpj(cnpj: string): Promise<CnpjLookupResult> {
  await requireRole(["admin", "gestor"]);
  const parsed = z.string().max(30).transform(onlyDigits).safeParse(cnpj);
  if (!parsed.success || parsed.data.length !== 14 || !isValidCnpj(parsed.data)) {
    return { ok: false, error: "Digite um CNPJ válido antes de buscar." };
  }
  const result = await getJson(`https://brasilapi.com.br/api/cnpj/v1/${parsed.data}`);
  if (!result) return { ok: false, error: "A consulta não respondeu a tempo. Tente de novo ou preencha manualmente." };
  if (result.status === 404) return { ok: false, error: "CNPJ não encontrado na base pública. Preencha manualmente." };
  if (result.status === 429) return { ok: false, error: "Muitas consultas seguidas. Aguarde um minuto e tente de novo." };
  const data = result.status === 200 ? parseCnpjResponse(result.json) : null;
  if (!data) return { ok: false, error: "Não foi possível ler os dados do CNPJ agora. Preencha manualmente." };
  return { ok: true, data };
}

const addressInput = z.object({
  cep: z.string().max(12).transform(onlyDigits),
  street: z.string().trim().max(200),
  number: z.string().trim().max(20),
  city: z.string().trim().max(120),
  uf: z.string().trim().max(2),
});

export type GeocodeResult =
  | { ok: true; latitude: number; longitude: number; source: "cep" | "endereco" }
  | { ok: false; error: string };

/**
 * Coordenadas a partir do endereço: primeiro o CEP (BrasilAPI v2), depois o endereço
 * completo no Nominatim (OpenStreetMap). O usuário ajusta o pino no mapa antes de salvar.
 */
export async function geocodeAddress(input: z.input<typeof addressInput>): Promise<GeocodeResult> {
  await requireRole(["admin", "gestor"]);
  const parsed = addressInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Endereço inválido." };
  const a = parsed.data;
  if (a.cep.length !== 8 && !(a.city && a.uf)) {
    return { ok: false, error: "Preencha o CEP ou a cidade e a UF para localizar." };
  }

  if (a.cep.length === 8) {
    const cep = await getJson(`https://brasilapi.com.br/api/cep/v2/${a.cep}`);
    const point = cep?.status === 200 ? parseCepCoordinates(cep.json) : null;
    if (point) return { ok: true, ...point, source: "cep" };
  }
  if (a.city && a.uf) {
    const osm = await getJson(nominatimUrl(a));
    const point = osm?.status === 200 ? parseNominatim(osm.json) : null;
    if (point) return { ok: true, latitude: point.latitude, longitude: point.longitude, source: "endereco" };
  }
  return { ok: false, error: "Não encontramos este endereço. Clique no mapa ou arraste o pino até o mercado." };
}
