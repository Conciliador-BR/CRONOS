"use client";

import { useRef, useState, useTransition } from "react";
import { LocateFixed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toUf } from "@/features/empresas/brazil-states";
import { isInBrazil, roundCoord } from "@/features/empresas/geo";
import { BRAZIL_BOUNDS, UF_GEO } from "@/features/empresas/uf-geo";
import { geocodeAddress } from "../lookup-actions";
import { LocationMap, type PickedPoint } from "./location-map";

type Status = { kind: "idle" } | { kind: "ok" | "error"; message: string };

const show = (n: number | null) => (n === null ? "" : n.toFixed(6));

function parse(value: string) {
  const n = Number(value.trim().replace(",", "."));
  return value.trim() !== "" && Number.isFinite(n) ? n : null;
}

const BRAZIL_CENTER = [(BRAZIL_BOUNDS[0] + BRAZIL_BOUNDS[2]) / 2, (BRAZIL_BOUNDS[1] + BRAZIL_BOUNDS[3]) / 2] as const;

/**
 * Latitude/longitude do mercado: "Localizar no mapa" busca pelo endereço do formulário
 * (CEP, depois rua e número) e o pino arrastável ajusta até a porta do mercado.
 */
export function LocationFields({
  initial,
  initialUf,
  errors,
}: {
  initial: { latitude: number | null; longitude: number | null };
  initialUf: string | null;
  errors?: Partial<Record<string, string[]>>;
}) {
  const [lat, setLat] = useState(show(initial.latitude));
  const [lng, setLng] = useState(show(initial.longitude));
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [focusKey, setFocusKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const la = parse(lat);
  const lo = parse(lng);
  const point: PickedPoint | null = la !== null && lo !== null && isInBrazil(la, lo) ? { latitude: la, longitude: lo } : null;
  const uf = toUf(initialUf);

  function pick(p: PickedPoint) {
    setLat(show(roundCoord(p.latitude)));
    setLng(show(roundCoord(p.longitude)));
    setStatus({ kind: "ok", message: "Pino ajustado. Salve para gravar a localização." });
  }

  function locate() {
    const form = buttonRef.current?.form;
    if (!form) return;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "");
    setStatus({ kind: "idle" });
    startTransition(async () => {
      const result = await geocodeAddress({
        cep: field("cep"),
        street: field("street"),
        number: field("number"),
        city: field("city"),
        uf: field("uf"),
      });
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error });
        return;
      }
      setLat(show(result.latitude));
      setLng(show(result.longitude));
      setFocusKey((k) => k + 1);
      setStatus({
        kind: "ok",
        message:
          result.source === "cep"
            ? "Posição aproximada pelo CEP. Arraste o pino até a entrada do mercado."
            : "Posição encontrada pelo endereço (OpenStreetMap). Confira e ajuste o pino se precisar.",
      });
    });
  }

  function clear() {
    setLat("");
    setLng("");
    setStatus({ kind: "idle" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button ref={buttonRef} variant="secondary" onClick={locate} loading={pending}>
          {pending ? "Localizando…" : (
            <>
              <LocateFixed aria-hidden />
              Localizar no mapa
            </>
          )}
        </Button>
        {lat || lng ? (
          <Button variant="ghost" onClick={clear}>
            <X aria-hidden />
            Remover localização
          </Button>
        ) : null}
      </div>
      <p
        aria-live="polite"
        className={status.kind === "error" ? "text-xs font-medium text-danger" : "text-xs text-muted"}
      >
        {status.kind === "idle"
          ? "Usa o CEP e o endereço acima. Você também pode clicar no mapa ou digitar as coordenadas."
          : status.message}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="company-lat" label="Latitude" error={errors?.latitude}>
          <Input name="latitude" value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" autoComplete="off" placeholder="-23.561414" className="tabular-nums" />
        </Field>
        <Field id="company-lng" label="Longitude" error={errors?.longitude}>
          <Input name="longitude" value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" autoComplete="off" placeholder="-46.655881" className="tabular-nums" />
        </Field>
      </div>
      <LocationMap
        point={point}
        fallbackCenter={uf ? UF_GEO[uf].center : BRAZIL_CENTER}
        fallbackZoom={uf ? 6 : 3.3}
        focusKey={focusKey}
        onPick={pick}
      />
    </div>
  );
}
