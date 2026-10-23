import { MAP_EMPTY_FILL, legendFor } from "../map-utils";

/** Legenda da escala de cores do mapa. */
export function MapLegend({ max }: { max: number }) {
  const items = legendFor(max);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
      <span className="font-medium text-fg">Empresas por estado</span>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5" aria-label="Legenda">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-sm ring-1 ring-border" style={{ background: MAP_EMPTY_FILL }} />
          Nenhuma
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 tabular-nums">
            <span aria-hidden className="size-3 rounded-sm" style={{ background: item.color }} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
