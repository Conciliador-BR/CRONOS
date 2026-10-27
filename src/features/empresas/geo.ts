import { toUf } from "./brazil-states";
import { marketLabel, type CompanySummary } from "./map-utils";
import { UF_GEO, type LngLat } from "./uf-geo";

/** Faixa geográfica aceita para um mercado (território brasileiro com folga para as ilhas). */
export const BRAZIL_LAT = [-34, 6] as const;
export const BRAZIL_LNG = [-75, -28] as const;

export function isInBrazil(lat: number, lng: number) {
  return lat >= BRAZIL_LAT[0] && lat <= BRAZIL_LAT[1] && lng >= BRAZIL_LNG[0] && lng <= BRAZIL_LNG[1];
}

/** Arredonda para 6 casas (≈ 11 cm), a precisão gravada no banco. */
export function roundCoord(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

/** Nível de zoom percebido: país, estado ou cidade (usado no efeito de nuvem ao rolar). */
export type ZoomLevel = "pais" | "estado" | "cidade";

export const ZOOM_STATE = 5;
export const ZOOM_CITY = 9.5;

export function zoomLevelOf(zoom: number): ZoomLevel {
  if (zoom < ZOOM_STATE) return "pais";
  if (zoom < ZOOM_CITY) return "estado";
  return "cidade";
}

/**
 * Posição aproximada para empresa sem coordenadas: espiral (ângulo de ouro) em volta
 * do centro da UF, para os pinos não ficarem empilhados no mesmo ponto.
 */
export function approximatePosition(center: LngLat, index: number): LngLat {
  if (index === 0) return center;
  const radius = 0.05 * Math.sqrt(index);
  const angle = index * 2.399963;
  return [roundCoord(center[0] + radius * Math.cos(angle)), roundCoord(center[1] + radius * Math.sin(angle))];
}

export type CompanyPointProps = { id: string; label: string; approximate: boolean };
export type CompanyPoint = {
  type: "Feature";
  id?: number;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: CompanyPointProps;
};
export type CompanyCollection = { type: "FeatureCollection"; features: CompanyPoint[] };

/**
 * GeoJSON de pontos para o mapa. Empresa com coordenadas válidas vai no local exato;
 * sem coordenadas, numa posição aproximada dentro da UF; UF inválida fica de fora (`unplaced`).
 */
export function companiesToGeoJson(companies: readonly CompanySummary[]) {
  const features: CompanyPoint[] = [];
  const perUf = new Map<string, number>();
  const unplaced: CompanySummary[] = [];
  let approximateCount = 0;

  for (const c of companies) {
    const label = marketLabel(c);
    if (c.latitude !== null && c.longitude !== null && isInBrazil(c.latitude, c.longitude)) {
      features.push(point([c.longitude, c.latitude], { id: c.id, label, approximate: false }));
      continue;
    }
    const uf = toUf(c.uf);
    if (!uf) {
      unplaced.push(c);
      continue;
    }
    const index = perUf.get(uf) ?? 0;
    perUf.set(uf, index + 1);
    approximateCount++;
    features.push(point(approximatePosition(UF_GEO[uf].center, index), { id: c.id, label, approximate: true }));
  }
  return { collection: { type: "FeatureCollection", features } as CompanyCollection, approximateCount, unplaced };
}

function point([lng, lat]: LngLat, properties: CompanyPointProps): CompanyPoint {
  return { type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties };
}

/** Posição de uma empresa no GeoJSON já montado (para voar até ela). */
export function positionOf(collection: CompanyCollection, id: string): LngLat | null {
  const feature = collection.features.find((f) => f.properties.id === id);
  return feature ? (feature.geometry.coordinates as unknown as LngLat) : null;
}

/** Chave estável do conteúdo do mapa: evita recriar a fonte quando os dados não mudaram. */
export function collectionKey(collection: CompanyCollection) {
  return collection.features
    .map((f) => `${f.properties.id}@${f.geometry.coordinates.join(",")}#${f.properties.label}`)
    .join("|");
}
