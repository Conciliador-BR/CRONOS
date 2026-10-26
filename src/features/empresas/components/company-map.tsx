"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "../map-theme.css";
import "./empresas-map.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LngLatBoundsLike, Map as MapLibreMap } from "maplibre-gl";
import { MapPinOff } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { Uf } from "../brazil-states";
import { collectionKey, positionOf, zoomLevelOf, type CompanyCollection, type ZoomLevel } from "../geo";
import { MAP_LOCALE_PT, UF_ATTRIBUTION, loadBaseStyle, prefersReducedMotion } from "../map-style";
import { BRAZIL_BOUNDS, MAX_BOUNDS, UF_GEO, type Bounds } from "../uf-geo";
import { CloudOverlay, type CloudBurst } from "./cloud-overlay";
import { addCompanySource, addUfLayers, setCompanyData, setSelectedUf } from "./map-layers";
import { MarkerLayer } from "./map-markers";

export type MapCommand = { key: number } & (
  | { kind: "brazil" }
  | { kind: "uf"; uf: Uf }
  | { kind: "company"; id: string }
);

export type CompanyMapProps = {
  collection: CompanyCollection;
  initialUf: Uf | null;
  selectedUf: Uf | null;
  activeCompanyId: string | null;
  command: MapCommand | null;
  onSelectUf: (uf: Uf) => void;
  onOpenCompany: (id: string) => void;
};

const LEVEL_RANK: Record<ZoomLevel, number> = { pais: 0, estado: 1, cidade: 2 };
/** Intervalo mínimo entre duas nuvens disparadas pela rolagem. */
const CLOUD_COOLDOWN_MS = 1800;

const toBounds = (b: Bounds): LngLatBoundsLike => [b[0], b[1], b[2], b[3]];

/** Mapa MapLibre com contornos das UFs, pinos agrupados e efeito de nuvem. Só roda no navegador. */
export function CompanyMap(props: CompanyMapProps) {
  const { collection, selectedUf, activeCompanyId, command } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MarkerLayer | null>(null);
  const latest = useRef(props);
  const flying = useRef(false);
  const lastCloud = useRef(0);
  const handledCommand = useRef<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [fallback, setFallback] = useState(false);
  const [burst, setBurst] = useState<CloudBurst | null>(null);

  useEffect(() => {
    latest.current = props;
  });

  const playCloud = useCallback((kind: CloudBurst["kind"]) => {
    if (prefersReducedMotion()) return;
    lastCloud.current = Date.now();
    setBurst({ key: lastCloud.current, kind });
  }, []);

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    async function init() {
      const [mod, base] = await Promise.all([import("maplibre-gl"), loadBaseStyle()]);
      const container = containerRef.current;
      if (cancelled || !container) return;
      // Pacote UMD: o bundler expõe o objeto em `default` (com fallback para o namespace).
      const ml = (mod.default ?? mod) as typeof mod.default;
      const initialUf = latest.current.initialUf;
      map = new ml.Map({
        container,
        style: base.style,
        bounds: toBounds(initialUf ? UF_GEO[initialUf].bounds : BRAZIL_BOUNDS),
        fitBoundsOptions: { padding: 24 },
        maxBounds: toBounds(MAX_BOUNDS),
        minZoom: 2.5,
        maxZoom: 18,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        renderWorldCopies: false,
        attributionControl: { compact: true, customAttribution: UF_ATTRIBUTION },
        locale: MAP_LOCALE_PT,
      });
      mapRef.current = map;
      setFallback(base.fallback);
      map.touchZoomRotate.disableRotation();
      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      map.getCanvas().setAttribute("aria-label", "Mapa das empresas: setas movem, + e - aproximam ou afastam");
      // Falhas de tiles (rede) não devem poluir o console nem quebrar a tela.
      map.on("error", () => {});

      let level = zoomLevelOf(map.getZoom());
      map.on("zoom", () => {
        const next = zoomLevelOf(map!.getZoom());
        if (next === level) return;
        const deeper = LEVEL_RANK[next] > LEVEL_RANK[level];
        level = next;
        if (deeper && !flying.current && Date.now() - lastCloud.current > CLOUD_COOLDOWN_MS) playCloud("light");
      });
      map.on("moveend", () => {
        flying.current = false;
      });

      map.on("load", () => {
        if (!map) return;
        addUfLayers(map, { fallback: base.fallback, onSelect: (uf) => latest.current.onSelectUf(uf) });
        addCompanySource(map, latest.current.collection);
        markersRef.current = new MarkerLayer(ml, map, { onOpen: (id) => latest.current.onOpenCompany(id) });
        setSelectedUf(map, latest.current.selectedUf);
        markersRef.current.setActive(latest.current.activeCompanyId);
        setStatus("ready");
      });
    }

    init().catch(() => {
      if (!cancelled) setStatus("error");
    });
    return () => {
      cancelled = true;
      markersRef.current?.destroy();
      markersRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, [playCloud]);

  const dataKey = useMemo(() => collectionKey(collection), [collection]);
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) return;
    setCompanyData(map, latest.current.collection);
  }, [dataKey, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (status === "ready" && map) setSelectedUf(map, selectedUf);
  }, [selectedUf, status]);

  useEffect(() => {
    if (status === "ready") markersRef.current?.setActive(activeCompanyId);
  }, [activeCompanyId, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map || !command || handledCommand.current === command.key) return;
    handledCommand.current = command.key;
    const reduced = prefersReducedMotion();

    if (command.kind === "uf") {
      flying.current = true;
      playCloud("full");
      map.fitBounds(toBounds(UF_GEO[command.uf].bounds), { padding: 40, maxZoom: 9, duration: reduced ? 0 : 1700 });
    } else if (command.kind === "company") {
      const position = positionOf(latest.current.collection, command.id);
      if (!position) return;
      const far = map.getZoom() < 10;
      flying.current = true;
      if (far) playCloud("full");
      map.flyTo({ center: [position[0], position[1]], zoom: 15.5, duration: reduced ? 0 : far ? 1800 : 900 });
    } else {
      flying.current = true;
      map.fitBounds(toBounds(BRAZIL_BOUNDS), { padding: 24, duration: reduced ? 0 : 1200 });
    }
  }, [command, status, playCloud]);

  return (
    <div className="em-map relative h-[420px] overflow-hidden rounded-xl border border-border bg-bg sm:h-[520px] lg:h-[600px]">
      <div
        ref={containerRef}
        role="region"
        aria-label="Mapa das empresas"
        className="h-full w-full [&_.maplibregl-canvas:focus-visible]:outline-2 [&_.maplibregl-canvas:focus-visible]:outline-ring [&_.maplibregl-canvas:focus-visible]:-outline-offset-2"
      />
      {status === "loading" ? (
        <div className="absolute inset-0 z-[4] grid place-items-center bg-bg/70">
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            <Spinner /> Carregando mapa…
          </span>
        </div>
      ) : null}
      {status === "error" ? (
        <div role="alert" className="absolute inset-0 z-[4] grid place-items-center bg-bg p-6 text-center">
          <div className="flex max-w-xs flex-col items-center gap-2 text-sm text-muted">
            <MapPinOff aria-hidden className="size-6 text-ring" />
            Não foi possível abrir o mapa neste navegador. Use a busca e a lista de estados ao lado.
          </div>
        </div>
      ) : null}
      <CloudOverlay burst={burst} onDone={() => setBurst(null)} />
      {fallback && status === "ready" ? (
        <p className="pointer-events-none absolute top-2 left-2 z-[2] rounded-md bg-surface/90 px-2 py-1 text-[11px] text-muted">
          Mapa de ruas indisponível agora; mostrando os estados.
        </p>
      ) : null}
    </div>
  );
}
