"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "@/features/empresas/map-theme.css";
import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { Spinner } from "@/components/ui/spinner";
import { MAP_COLORS, MAP_LOCALE_PT, UF_ATTRIBUTION, loadBaseStyle } from "@/features/empresas/map-style";
import { roundCoord } from "@/features/empresas/geo";
import { MAX_BOUNDS, type LngLat } from "@/features/empresas/uf-geo";

export type PickedPoint = { latitude: number; longitude: number };

type Props = {
  point: PickedPoint | null;
  /** Para onde olhar quando ainda não há ponto (centro da UF ou do Brasil) e o zoom. */
  fallbackCenter: LngLat;
  fallbackZoom: number;
  /** Muda quando o pino deve ser enquadrado de novo (ex.: depois de "Localizar no mapa"). */
  focusKey: number;
  onPick: (point: PickedPoint) => void;
};

function pinElement() {
  const el = document.createElement("div");
  el.className =
    "grid size-9 cursor-grab place-items-center active:cursor-grabbing [&>span]:size-4 [&>span]:rounded-full [&>span]:border-2 [&>span]:border-white [&>span]:bg-primary [&>span]:shadow-[0_0_14px_4px_rgb(56_189_248/0.6)]";
  el.innerHTML = '<span aria-hidden="true"></span>';
  el.setAttribute("aria-label", "Pino do mercado: arraste até o local exato");
  return el;
}

/** Mapa pequeno com pino arrastável; clique no mapa também move o pino. */
export function LocationMap({ point, fallbackCenter, fallbackZoom, focusKey, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const latest = useRef({ point, fallbackCenter, fallbackZoom, onPick });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    latest.current = { point, fallbackCenter, fallbackZoom, onPick };
  });

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    async function init() {
      const [mod, base] = await Promise.all([import("maplibre-gl"), loadBaseStyle()]);
      const container = containerRef.current;
      if (cancelled || !container) return;
      const ml = (mod.default ?? mod) as typeof mod.default;
      const start = latest.current.point;
      map = new ml.Map({
        container,
        style: base.style,
        center: start ? [start.longitude, start.latitude] : [...latest.current.fallbackCenter],
        zoom: start ? 16 : latest.current.fallbackZoom,
        maxBounds: [...MAX_BOUNDS],
        maxZoom: 19,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        renderWorldCopies: false,
        attributionControl: { compact: true, customAttribution: UF_ATTRIBUTION },
        locale: MAP_LOCALE_PT,
      });
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();
      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      map.getCanvas().setAttribute("aria-label", "Mapa para posicionar o mercado");
      map.on("error", () => {});

      const marker = new ml.Marker({ element: pinElement(), draggable: true });
      markerRef.current = marker;
      const pick = (lng: number, lat: number) => {
        latest.current.onPick({ latitude: roundCoord(lat), longitude: roundCoord(lng) });
      };
      marker.on("dragend", () => {
        const { lng, lat } = marker.getLngLat();
        pick(lng, lat);
      });
      map.on("click", (e) => pick(e.lngLat.lng, e.lngLat.lat));
      map.on("load", () => {
        if (!map) return;
        if (base.fallback) {
          map.addSource("ufs", { type: "geojson", data: "/geo/br-uf.json" });
          map.addLayer({ id: "uf-land", type: "fill", source: "ufs", paint: { "fill-color": MAP_COLORS.land } });
          map.addLayer({
            id: "uf-line",
            type: "line",
            source: "ufs",
            paint: { "line-color": MAP_COLORS.line, "line-opacity": 0.5, "line-width": 1 },
          });
        }
        setStatus("ready");
      });
    }

    init().catch(() => {
      if (!cancelled) setStatus("error");
    });
    return () => {
      cancelled = true;
      markerRef.current?.remove();
      markerRef.current = null;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // Pino acompanha o valor (arrastar, clicar, digitar ou localizar).
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (status !== "ready" || !map || !marker) return;
    if (point) marker.setLngLat([point.longitude, point.latitude]).addTo(map);
    else marker.remove();
  }, [point, status]);

  // Enquadra o pino quando pedido.
  useEffect(() => {
    const map = mapRef.current;
    const current = latest.current.point;
    if (status !== "ready" || !map || focusKey === 0 || !current) return;
    map.flyTo({ center: [current.longitude, current.latitude], zoom: Math.max(map.getZoom(), 16) });
  }, [focusKey, status]);

  return (
    <div className="em-map relative h-72 overflow-hidden rounded-xl border border-border bg-bg sm:h-80">
      <div ref={containerRef} className="h-full w-full" />
      {status === "loading" ? (
        <div className="absolute inset-0 grid place-items-center bg-bg/70">
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            <Spinner /> Carregando mapa…
          </span>
        </div>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted">
          Não foi possível abrir o mapa neste navegador. Digite a latitude e a longitude nos campos acima.
        </p>
      ) : null}
    </div>
  );
}
