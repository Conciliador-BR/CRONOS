import { formatCents } from "@/lib/format/money";
import { cn } from "@/lib/utils";
import type { GoalProgress } from "../../lib/ranking";

/** Barra de meta x realizado com texto (cor nunca é o único indicador). */
export function GoalBar({ label, realizedCents, goalCents, progress }: {
  label: string;
  realizedCents: number;
  goalCents: number | null;
  progress: GoalProgress;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
        <span className="font-medium text-fg">{label}</span>
        <span className="text-xs text-muted tabular-nums">
          {formatCents(realizedCents)}
          {goalCents ? ` de ${formatCents(goalCents)}` : " · sem meta definida"}
          {progress.percent !== null ? (
            <span className={cn("ml-2 font-semibold", progress.status === "atingida" ? "text-success" : "text-fg")}>
              {progress.percent}%{progress.status === "atingida" ? " ✓" : ""}
            </span>
          ) : null}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Meta de ${label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.barPercent}
        aria-valuetext={progress.percent === null ? "Sem meta" : `${progress.percent}% da meta`}
        className="h-2 overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className={cn("h-full rounded-full", progress.status === "atingida" ? "bg-success" : "bg-primary")}
          style={{ width: `${progress.barPercent}%` }}
        />
      </div>
    </div>
  );
}
