import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";

type MapLibre = typeof import("maplibre-gl");

export const COMPANY_SOURCE = "companies";

type Handlers = {
  onOpen: (id: string) => void;
};

type Entry = { marker: Marker; el: HTMLButtonElement };

function clusterSize(count: number) {
  return count >= 50 ? "lg" : count >= 10 ? "md" : "sm";
}

/**
 * Pinos e agrupamentos como botões HTML sobre o mapa (focáveis e com rótulo), lidos da
 * fonte GeoJSON com cluster. Não dependem de fontes de texto do estilo base.
 */
export class MarkerLayer {
  private entries = new Map<string, Entry>();
  private activeId: string | null = null;
  private readonly refresh = () => this.update();

  constructor(
    private readonly ml: MapLibre,
    private readonly map: MapLibreMap,
    private readonly handlers: Handlers,
  ) {
    map.on("moveend", this.refresh);
    map.on("sourcedata", this.onSourceData);
    this.update();
  }

  private onSourceData = (event: { sourceId?: string; isSourceLoaded?: boolean }) => {
    if (event.sourceId === COMPANY_SOURCE && event.isSourceLoaded) this.update();
  };

  /** Sincroniza os marcadores com o que a fonte mostra no zoom atual. */
  update() {
    if (!this.map.getSource(COMPANY_SOURCE)) return;
    const seen = new Set<string>();
    for (const feature of this.map.querySourceFeatures(COMPANY_SOURCE)) {
      if (feature.geometry.type !== "Point") continue;
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      const props = feature.properties as Record<string, unknown>;
      const key = props.cluster ? `c${String(props.cluster_id)}` : `p${String(props.id)}`;
      if (seen.has(key)) continue; // a mesma feição aparece em mais de um tile
      seen.add(key);
      const existing = this.entries.get(key);
      if (existing) {
        existing.marker.setLngLat([lng, lat]);
        if (!props.cluster) this.label(existing.el, String(props.label), props.approximate === true);
        continue;
      }
      const el = props.cluster
        ? this.clusterButton(Number(props.cluster_id), Number(props.point_count), [lng, lat])
        : this.pinButton(String(props.id), String(props.label), props.approximate === true);
      const marker = new this.ml.Marker({ element: el }).setLngLat([lng, lat]).addTo(this.map);
      this.entries.set(key, { marker, el });
    }
    for (const [key, entry] of this.entries) {
      if (seen.has(key)) continue;
      // Não remove o botão que está com foco (ex.: gaveta aberta a partir dele).
      if (entry.el.contains(document.activeElement)) continue;
      entry.marker.remove();
      this.entries.delete(key);
    }
  }

  setActive(id: string | null) {
    this.activeId = id;
    for (const [key, { el }] of this.entries) {
      if (key.startsWith("p")) el.dataset.active = String(key === `p${id}`);
    }
  }

  /** Foca o pino da empresa, se estiver na tela (para devolver o foco ao fechar a gaveta). */
  focus(id: string) {
    this.entries.get(`p${id}`)?.el.focus({ preventScroll: true });
  }

  destroy() {
    this.map.off("moveend", this.refresh);
    this.map.off("sourcedata", this.onSourceData);
    for (const { marker } of this.entries.values()) marker.remove();
    this.entries.clear();
  }

  private pinButton(id: string, label: string, approximate: boolean) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "em-pin em-marker-in";
    el.dataset.active = String(id === this.activeId);
    this.label(el, label, approximate);
    el.innerHTML = '<span class="em-halo" aria-hidden="true"></span><span class="em-dot" aria-hidden="true"></span>';
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      this.handlers.onOpen(id);
    });
    return el;
  }

  private label(el: HTMLButtonElement, label: string, approximate: boolean) {
    el.title = label;
    el.dataset.approximate = String(approximate);
    el.setAttribute("aria-label", approximate ? `${label} (localização aproximada)` : label);
  }

  private clusterButton(clusterId: number, count: number, center: [number, number]) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "em-cluster em-marker-in";
    el.dataset.size = clusterSize(count);
    el.textContent = count >= 1000 ? `${Math.round(count / 100) / 10} mil` : String(count);
    el.setAttribute("aria-label", `${count} empresas nesta região. Aproximar`);
    el.addEventListener("click", async (event) => {
      event.stopPropagation();
      const source = this.map.getSource<GeoJSONSource>(COMPANY_SOURCE);
      if (!source) return;
      try {
        const zoom = await source.getClusterExpansionZoom(clusterId);
        this.map.easeTo({ center, zoom: Math.min(zoom + 0.5, this.map.getMaxZoom()) });
      } catch {
        this.map.easeTo({ center, zoom: this.map.getZoom() + 2 });
      }
    });
    return el;
  }
}
