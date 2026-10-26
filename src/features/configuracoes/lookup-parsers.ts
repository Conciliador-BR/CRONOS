import { z } from "zod";
import { onlyDigits } from "@/lib/format/document";
import { UF_NAMES, toUf } from "@/features/empresas/brazil-states";
import { normalizeCnae } from "@/features/empresas/cnae";
import { isInBrazil, roundCoord } from "@/features/empresas/geo";

/*
 * Leitura defensiva das respostas da BrasilAPI e do Nominatim: tudo é opcional,
 * validado com Zod, cortado no tamanho aceito pelo formulário e nunca gravado sem revisão.
 */

const text = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) => (v === null || v === undefined ? "" : String(v).trim()));

const SMALL_WORDS = new Set(["a", "as", "o", "os", "e", "de", "da", "das", "do", "dos", "em", "na", "no"]);

/** "AVENIDA DAS NACOES" → "Avenida das Nacoes" (preposições em minúsculas). */
export function titleCasePt(value: string) {
  return value
    .toLocaleLowerCase("pt-BR")
    .split(/(\s+)/)
    .map((word, i) =>
      i > 0 && SMALL_WORDS.has(word) ? word : word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1),
    )
    .join("");
}

const cut = (value: string, max: number) => value.slice(0, max);

const cnpjResponse = z.looseObject({
  razao_social: text,
  nome_fantasia: text,
  cnae_fiscal: text,
  cnae_fiscal_descricao: text,
  descricao_situacao_cadastral: text,
  cep: text,
  descricao_tipo_de_logradouro: text,
  logradouro: text,
  numero: text,
  complemento: text,
  bairro: text,
  municipio: text,
  uf: text,
});

export type CnpjPrefill = {
  legalName: string;
  tradeName: string;
  cnae: string;
  cnaeDescription: string;
  /** Situação cadastral quando não é "ATIVA" (aviso para o usuário). */
  situation: string | null;
  address: { cep: string; street: string; number: string; complement: string; district: string; city: string; uf: string };
};

/** Resposta de /api/cnpj/v1/{cnpj} → campos do formulário; null se não tiver razão social. */
export function parseCnpjResponse(json: unknown): CnpjPrefill | null {
  const parsed = cnpjResponse.safeParse(json);
  if (!parsed.success || !parsed.data.razao_social) return null;
  const d = parsed.data;
  const streetType = d.descricao_tipo_de_logradouro;
  const street = d.logradouro && streetType && !d.logradouro.toUpperCase().startsWith(streetType.toUpperCase())
    ? `${streetType} ${d.logradouro}`
    : d.logradouro;
  const cep = onlyDigits(d.cep);
  const situation = d.descricao_situacao_cadastral.toUpperCase();
  return {
    legalName: cut(d.razao_social, 200),
    tradeName: cut(d.nome_fantasia, 200),
    cnae: normalizeCnae(d.cnae_fiscal) ?? "",
    cnaeDescription: cut(d.cnae_fiscal_descricao, 200),
    situation: situation && situation !== "ATIVA" ? situation : null,
    address: {
      cep: cep.length === 8 ? cep : "",
      street: cut(titleCasePt(street), 200),
      number: cut(d.numero, 20),
      complement: cut(titleCasePt(d.complemento), 120),
      district: cut(titleCasePt(d.bairro), 120),
      city: cut(titleCasePt(d.municipio), 120),
      uf: toUf(d.uf) ?? "",
    },
  };
}

export type GeoPoint = { latitude: number; longitude: number };

const coordinate = z.union([z.number(), z.string().trim().min(1)]).transform(Number).pipe(z.number().finite());

function toPoint(lat: unknown, lng: unknown): GeoPoint | null {
  const la = coordinate.safeParse(lat);
  const lo = coordinate.safeParse(lng);
  if (!la.success || !lo.success || !isInBrazil(la.data, lo.data)) return null;
  return { latitude: roundCoord(la.data), longitude: roundCoord(lo.data) };
}

const cepResponse = z.looseObject({
  location: z
    .looseObject({ coordinates: z.looseObject({ latitude: z.unknown(), longitude: z.unknown() }).partial().nullish() })
    .nullish(),
});

/** Resposta de /api/cep/v2/{cep}: coordenadas quando existem (muitos CEPs vêm sem). */
export function parseCepCoordinates(json: unknown): GeoPoint | null {
  const parsed = cepResponse.safeParse(json);
  const coords = parsed.success ? parsed.data.location?.coordinates : null;
  return coords ? toPoint(coords.latitude, coords.longitude) : null;
}

const nominatimResponse = z.array(z.looseObject({ lat: z.unknown(), lon: z.unknown(), display_name: text }));

/** Primeiro resultado do Nominatim (jsonv2) dentro do Brasil. */
export function parseNominatim(json: unknown): (GeoPoint & { label: string }) | null {
  const parsed = nominatimResponse.safeParse(json);
  const first = parsed.success ? parsed.data[0] : undefined;
  if (!first) return null;
  const point = toPoint(first.lat, first.lon);
  return point ? { ...point, label: cut(first.display_name, 300) } : null;
}

export type AddressQuery = { street: string; number: string; city: string; uf: string };

/** URL de busca estruturada do Nominatim (número + rua, cidade, estado), limitada ao Brasil. */
export function nominatimUrl(a: AddressQuery) {
  const params = new URLSearchParams({ format: "jsonv2", countrycodes: "br", limit: "1" });
  const street = [a.number, a.street].filter(Boolean).join(" ");
  if (street) params.set("street", street);
  if (a.city) params.set("city", a.city);
  const uf = toUf(a.uf);
  if (uf) params.set("state", UF_NAMES[uf]);
  params.set("country", "Brasil");
  return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
}
