import { PROGRESS_COLORS, PROGRESS_LABELS, PROGRESS_STATUSES, type ProgressCounts } from "../progress";

/** Barra empilhada das etapas (cinza = não iniciado) e o % de automáticos. */
export function ProgressBar({ label, counts, size = "md" }: { label: string; counts: ProgressCounts; size?: "sm" | "md" }) {
  const summary = `${counts.automatico} de ${counts.total} automáticas`;
  const detail = PROGRESS_STATUSES.map((status) => `${counts[status]} ${PROGRESS_LABELS[status].toLowerCase()}`).join(", ");
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={counts.percent}
      aria-valuetext={`${counts.percent}%: ${summary}; ${detail}; ${counts.nao_iniciado} não iniciadas`}
      className={`flex overflow-hidden rounded-full bg-surface-3 ${size === "md" ? "h-2" : "h-1.5"}`}
    >
      {counts.total > 0
        ? PROGRESS_STATUSES.map((status) =>
            counts[status] > 0 ? (
              <span
                key={status}
                className="h-full transition-[width] motion-reduce:transition-none"
                style={{ width: `${(counts[status] / counts.total) * 100}%`, backgroundColor: PROGRESS_COLORS[status] }}
              />
            ) : null,
          )
        : null}
    </div>
  );
}

/** Legenda das cores com a contagem de cada etapa. */
export function ProgressLegend({ counts }: { counts: ProgressCounts }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted" aria-hidden>
      {PROGRESS_STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: PROGRESS_COLORS[status] }} />
          {counts[status]} {PROGRESS_LABELS[status].toLowerCase()}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-surface-3" />
        {counts.nao_iniciado} não iniciadas
      </li>
    </ul>
  );
}
