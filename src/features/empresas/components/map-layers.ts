import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import { toUf, type Uf } from "../brazil-states";
import type { CompanyCollection } from "../geo";
import { MAP_COLORS } from "../map-style";
import { COMPANY_SOURCE } from "./map-markers";

const UF_SOURCE = "ufs";
export const UF_GEOJSON_URL = "/geo/br-uf.json";

/**
 * Estados só como contorno: linha azul fina, preenchimento quase invisível no hover
 * (e um pouco no estado escolhido). Sem estilo base, desenha o território em azul-marinho.
 */
export function addUfLayers(map: MapLibreMap, opts: { fallback: boolean; onSelect: (uf: Uf) => void }) {
  map.addSource(UF_SOURCE, { type: "geojson", data: UF_GEOJSON_URL, promoteId: "uf" });

  if (opts.fallback) {
    map.addLayer({
      id: "uf-land",
      type: "fill",
      source: UF_SOURCE,
      paint: { "fill-color": MAP_COLORS.land, "fill-opacity": 1 },
    });
  }
  map.addLayer({
    id: "uf-fill",
    type: "fill",
    source: UF_SOURCE,
    paint: {
      "fill-color": MAP_COLORS.fill,
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.1,
        ["boolean", ["feature-state", "selected"], false],
        0.05,
        0,
      ],
      "fill-opacity-transition": { duration: 200 },
    },
  });
  map.addLayer({
    id: "uf-line",
    type: "line",
    source: UF_SOURCE,
    layout: { "line-join": "round" },
    paint: {
      "line-color": MAP_COLORS.line,
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.55, 8, 0.3],
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.6, 8, 1.2],
    },
  });
  map.addLayer({
    id: "uf-line-selected",
    type: "line",
    source: UF_SOURCE,
    filter: ["==", ["get", "uf"], ""],
    layout: { "line-join": "round" },
    paint: { "line-color": MAP_COLORS.lineStrong, "line-opacity": 0.9, "line-width": 1.8, "line-blur": 0.5 },
  });

  let hovered: string | null = null;
  const setHover = (uf: string | null) => {
    if (hovered === uf) return;
    if (hovered) map.setFeatureState({ source: UF_SOURCE, id: hovered }, { hover: false });
    hovered = uf;
    if (uf) map.setFeatureState({ source: UF_SOURCE, id: uf }, { hover: true });
    map.getCanvas().style.cursor = uf ? "pointer" : "";
  };
  map.on("mousemove", "uf-fill", (e: MapLayerMouseEvent) => setHover(String(e.features?.[0]?.properties?.uf ?? "") || null));
  map.on("mouseleave", "uf-fill", () => setHover(null));
  map.on("click", "uf-fill", (e: MapLayerMouseEvent) => {
    const target = e.originalEvent.target as HTMLElement | null;
    if (target?.closest(".maplibregl-marker")) return;
    const uf = toUf(String(e.features?.[0]?.properties?.uf ?? ""));
    if (uf) opts.onSelect(uf);
  });
}

const selectedByMap = new WeakMap<MapLibreMap, string>();

/** Destaca o contorno do estado escolhido. */
export function setSelectedUf(map: MapLibreMap, uf: Uf | null) {
  if (!map.getSource(UF_SOURCE)) return;
  const previous = selectedByMap.get(map);
  if (previous) map.setFeatureState({ source: UF_SOURCE, id: previous }, { selected: false });
  if (uf) selectedByMap.set(map, uf);
  else selectedByMap.delete(map);
  if (uf) map.setFeatureState({ source: UF_SOURCE, id: uf }, { selected: true });
  map.setFilter("uf-line-selected", ["==", ["get", "uf"], uf ?? ""]);
}

/** Fonte dos mercados com agrupamento; a camada invisível só mantém os tiles carregados. */
export function addCompanySource(map: MapLibreMap, data: CompanyCollection) {
  map.addSource(COMPANY_SOURCE, {
    type: "geojson",
    data,
    cluster: true,
    clusterRadius: 60,
    clusterMaxZoom: 14,
  });
  map.addLayer({
    id: "companies-anchor",
    type: "circle",
    source: COMPANY_SOURCE,
    paint: { "circle-radius": 1, "circle-opacity": 0, "circle-stroke-width": 0 },
  });
}

export function setCompanyData(map: MapLibreMap, data: CompanyCollection) {
  map.getSource<GeoJSONSource>(COMPANY_SOURCE)?.setData(data);
}
