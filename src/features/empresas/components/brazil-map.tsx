"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import brazil from "@svg-maps/brazil";
import { cn } from "@/lib/utils";
import { UF_NAMES, toUf, type Uf } from "../brazil-states";
import { companiesLabel, fillFor } from "../map-utils";

type SvgMap = { viewBox: string; locations: { id: string; name: string; path: string }[] };
const MAP = brazil as unknown as SvgMap;
// Só os estados reconhecidos (ids do pacote são UFs em minúsculas).
const STATES = MAP.locations.flatMap((l) => {
  const uf = toUf(l.id);
  return uf ? [{ uf, path: l.path }] : [];
});

type Tooltip = { uf: Uf; x: number; y: number };

export type BrazilMapProps = {
  counts: Partial<Record<Uf, number>>;
  max: number;
  selectedUf: Uf | null;
  onSelect: (uf: Uf) => void;
};

/** Mapa do Brasil clicável e navegável por teclado (Tab entre estados, Enter/Espaço seleciona). */
export function BrazilMap({ counts, max, selectedUf, onSelect }: BrazilMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  function placeFromElement(uf: Uf, el: Element) {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    const rect = el.getBoundingClientRect();
    setTooltip({ uf, x: rect.left + rect.width / 2 - box.left, y: rect.top - box.top });
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const uf = toUf((event.target as Element).getAttribute("data-uf"));
    const box = containerRef.current?.getBoundingClientRect();
    if (!uf || !box) {
      setTooltip(null);
      return;
    }
    setTooltip({ uf, x: event.clientX - box.left, y: event.clientY - box.top - 8 });
  }

  function onKeyDown(event: KeyboardEvent<SVGPathElement>, uf: Uf) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(uf);
    }
  }

  const selected = selectedUf ? STATES.find((s) => s.uf === selectedUf) : undefined;

  return (
    <div ref={containerRef} className="relative">
      <svg
        viewBox={MAP.viewBox}
        role="group"
        aria-label="Mapa do Brasil: escolha um estado"
        className="mx-auto block h-auto w-full max-w-[560px] touch-manipulation"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setTooltip(null)}
      >
        {STATES.map(({ uf, path }) => {
          const count = counts[uf] ?? 0;
          const isSelected = uf === selectedUf;
          return (
            <path
              key={uf}
              d={path}
              data-uf={uf}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${UF_NAMES[uf]}: ${companiesLabel(count)}`}
              fill={fillFor(count, max)}
              onClick={() => onSelect(uf)}
              onKeyDown={(event) => onKeyDown(event, uf)}
              onFocus={(event) => placeFromElement(uf, event.currentTarget)}
              onBlur={() => setTooltip(null)}
              className={cn(
                "cursor-pointer stroke-bg stroke-[1.2] outline-none transition-[filter] hover:brightness-125",
                "focus-visible:stroke-ring focus-visible:stroke-[2.5]",
              )}
            />
          );
        })}
        {selected ? (
          <path
            d={selected.path}
            aria-hidden
            fill="none"
            className="pointer-events-none stroke-fg stroke-[2.5]"
          />
        ) : null}
      </svg>

      {tooltip ? (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-surface-3 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg shadow-black/40"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className="font-semibold text-fg">{UF_NAMES[tooltip.uf]}</span>
          <span className="text-muted"> · {companiesLabel(counts[tooltip.uf] ?? 0)}</span>
        </div>
      ) : null}
    </div>
  );
}
