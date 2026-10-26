import type { StyleSpecification } from "maplibre-gl";

/** Estilo vetorial escuro gratuito da CARTO (exige crédito OpenStreetMap + CARTO). */
export const CARTO_DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const OSM_CARTO_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';

/** Crédito da malha estadual (sempre exibido). */
export const UF_ATTRIBUTION =
  'Limites estaduais: <a href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html" target="_blank" rel="noreferrer">IBGE</a>';

/** Cores do mapa (espelham os tokens de globals.css; o MapLibre não lê variáveis CSS). */
export const MAP_COLORS = {
  bg: "#05070d",
  land: "#0b1020",
  line: "#3b82f6",
  lineStrong: "#60a5fa",
  fill: "#2563eb",
} as const;

/** Estilo mínimo usado quando a CARTO não responde: só fundo escuro (os estados entram por cima). */
export function fallbackStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [{ id: "background", type: "background", paint: { "background-color": MAP_COLORS.bg } }],
  };
}

function isStyle(value: unknown): value is StyleSpecification {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.version === 8 && Array.isArray(v.layers) && typeof v.sources === "object" && v.sources !== null;
}

/** Garante o crédito OSM/CARTO quando o estilo baixado não traz nenhum. */
export function withAttribution(style: StyleSpecification): StyleSpecification {
  const sources = Object.values(style.sources) as { attribution?: string }[];
  if (sources.some((s) => s.attribution?.includes("OpenStreetMap"))) return style;
  const first = Object.keys(style.sources)[0];
  if (!first) return style;
  return {
    ...style,
    sources: { ...style.sources, [first]: { ...style.sources[first], attribution: OSM_CARTO_ATTRIBUTION } as never },
  };
}

/** Baixa o estilo da CARTO com tempo limite; se falhar, usa o estilo mínimo. */
export async function loadBaseStyle(timeoutMs = 6000): Promise<{ style: StyleSpecification; fallback: boolean }> {
  try {
    const response = await fetch(CARTO_DARK_STYLE, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(String(response.status));
    const json: unknown = await response.json();
    if (!isStyle(json)) throw new Error("estilo inválido");
    return { style: withAttribution(json), fallback: false };
  } catch {
    return { style: fallbackStyle(), fallback: true };
  }
}

/** true quando o usuário pediu menos movimento (sem nuvem e com voos instantâneos). */
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Textos dos controles do MapLibre em português. */
export const MAP_LOCALE_PT = {
  "AttributionControl.ToggleAttribution": "Mostrar ou ocultar créditos do mapa",
  "AttributionControl.MapFeedback": "Enviar correção do mapa",
  "LogoControl.Title": "Logo do MapLibre",
  "Marker.Title": "Marcador",
  "NavigationControl.ResetBearing": "Voltar o norte para cima",
  "NavigationControl.ZoomIn": "Aproximar",
  "NavigationControl.ZoomOut": "Afastar",
  "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl + rolagem para aproximar o mapa",
  "CooperativeGesturesHandler.MacHelpText": "Use ⌘ + rolagem para aproximar o mapa",
  "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa",
} as const;
